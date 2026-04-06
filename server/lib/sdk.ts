import { COOKIE_NAME } from "@shared/const";
import { authLogger } from "./logger";
import { ForbiddenError, UnauthorizedError } from "@shared/lib/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify, createRemoteJWKSet } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";
import { cache } from "./redis";
import { invalidateUserCaches } from "./cacheKeys";

export type SessionPayload = {
  userId: number;
};

class SDKServer {
  private getSessionSecret(): Uint8Array {
    const secret = ENV.cookieSecret;
    if (!secret) {
      throw new Error("CRITICAL: JWT_SECRET environment variable is not set.");
    }
    return new TextEncoder().encode(secret);
  }

  private parseCookies(cookieHeader: string | undefined): Map<string, string> {
    const cookies = new Map<string, string>();
    if (!cookieHeader) return cookies;
    try {
      const parsed = parseCookieHeader(cookieHeader);
      for (const [key, value] of Object.entries(parsed)) {
        cookies.set(key, value);
      }
    } catch (e) {
      authLogger.warn({ err: e }, "[Auth] Failed to parse cookies");
    }
    return cookies;
  }

  async createSessionToken(userId: number): Promise<string> {
    const secretKey = this.getSessionSecret();
    const payload: SessionPayload = { userId };

    return await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<SessionPayload | null> {
    if (!cookieValue) {
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { userId } = payload as Record<string, unknown>;

      if (typeof userId !== "number") {
        authLogger.warn("[Auth] Session payload missing userId");
        return null;
      }

      return { userId };
    } catch (error) {
      authLogger.warn({ err: error }, "[Auth] Session verification failed");
      return null;
    }
  }

  private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

  private getJWKS() {
    if (!this.jwks && ENV.auth0Domain) {
      this.jwks = createRemoteJWKSet(new URL(`https://${ENV.auth0Domain}/.well-known/jwks.json`));
    }
    return this.jwks;
  }

  async verifyAuth0Token(token: string): Promise<{ user: User; permissions: string[] } | null> {
    const JWKS = this.getJWKS();
    if (!JWKS) {
      authLogger.warn("[Auth] Auth0 JWKS not initialized. Check AUTH0_DOMAIN.");
      return null;
    }

    try {
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: ENV.auth0Issuer || `https://${ENV.auth0Domain}/`,
        audience: ENV.auth0Audience,
      });

      const permissions = (payload.permissions as string[]) || [];

      const sub = payload.sub;
      if (!sub) return null;

      // Extract user info from decoded token
      const email = payload.email as string | undefined;
      const name = (payload.name || payload.nickname || email?.split('@')[0] || 'User') as string;
      const username = (payload.nickname || sub.split('|').pop() || 'user_' + Math.random().toString(36).slice(2, 7)) as string;

      // Check if user exists in DB by openId (Auth0 'sub')
      let user = await db.getUserByOpenId(sub);

      if (!user) {
        // Try finding by email to link accounts
        if (email) {
          user = await db.getUserByEmail(email);
        }

        if (user) {
          // Link existing user to Auth0 openId
          authLogger.info(`[Auth] Linking existing user ${user.id} to Auth0 sub: ${sub}`);
          await db.updateUser(user.id, { openId: sub, loginMethod: "auth0" as any });
          await invalidateUserCaches(user.id);
        } else {
          // Auto-provision new user
          authLogger.info(`[Auth] Provisioning new user from Auth0 sub: ${sub}`);
          const [newUser] = await db.createUser({
            openId: sub,
            username,
            name,
            email: email || null,
            role: "user" as any,
            loginMethod: "auth0" as any,
          });
          user = newUser;
        }
      } else {
        // Optional: Update last login or metadata
        await db.updateUser(user.id, { lastSignedIn: new Date() });
        await invalidateUserCaches(user.id);
      }

      return user ? { user, permissions } : null;
    } catch (error) {
      authLogger.error({ err: error }, "[Auth] Auth0 token verification failed");
      return null;
    }
  }

  async authenticateRequest(req: Request): Promise<{ user: User; permissions: string[] }> {
    // 1. Try Authorization header first (Auth0)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const result = await this.verifyAuth0Token(token);
      if (result) return result;
    }

    // 2. Fallback to session cookie (Legacy/Developer)
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      authLogger.warn(`[Auth] Authentication failed: Missing or invalid session cookie/token for path ${req.path}`);
      throw UnauthorizedError("Invalid session cookie or token");
    }

    // Attempt to get user from cache
    const cacheKey = `user_session:${session.userId}`;
    const cachedUser = await cache.get<User>(cacheKey);
    let user: User | null = cachedUser || null;

    if (!user) {
      user = (await db.getUserById(session.userId)) || null;

      if (!user) {
        authLogger.warn(`[Auth] Authentication failed: User ID ${session.userId} not found in database`);
        throw UnauthorizedError("User not found");
      }

      // Cache user object for 30 minutes
      await cache.set(cacheKey, user, 1800);
    }

    // For session-based auth, we use an empty permissions array, 
    // relying on DB role for internal checks for now.
    return { user, permissions: [] };
  }
}

export const sdk = new SDKServer();

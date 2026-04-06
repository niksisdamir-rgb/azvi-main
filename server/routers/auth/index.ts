import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../../lib/cookies";
import { publicProcedure, protectedProcedure, router, authRateLimitProcedure } from "../../lib/trpc";
import { hashPassword, verifyPassword } from "../../lib/password";
import { sdk } from "../../lib/sdk";
import * as db from "../../db";
import { invalidateUserCaches } from "../../lib/cacheKeys";
import { logger } from "../../lib/logger";

export const authRouter = router({
  me: publicProcedure
    .query(opts => {
      const user = opts.ctx.user;
      // Log request details even for public procedures if context creation is suspect
      logger.info({ userId: user?.id, userPresent: !!user, reqMethod: opts.ctx.req.method, reqUrl: opts.ctx.req.url }, "Executing auth.me procedure");
      return user;
    }),

  register: authRateLimitProcedure
    .input(z.object({
      username: z.string().min(3),
      password: z.string().min(6),
      name: z.string().optional(),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const existing = await db.getUserByUsername(input.username);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username already exists",
        });
      }

      const passwordHash = hashPassword(input.password);
      const [result] = await db.createUser({
        username: input.username,
        passwordHash,
        name: input.name || null,
        email: input.email || null,
        role: "user",
      });

      const userId = result.id;
      const sessionToken = await sdk.createSessionToken(userId);
      const cookieOptions = getSessionCookieOptions(ctx.req);

      ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

      return { success: true };
    }),

  login: authRateLimitProcedure
    .input(z.object({
      username: z.string(),
      password: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Developer bypass is strictly restricted to local development only.
      // NODE_ENV must be "development" — test/staging are explicitly excluded.
      const isLocalDev = process.env.NODE_ENV === "development";
      const isBypassEnabled = process.env.SERVER_ENABLE_DEV_BYPASS === "true";
      const devBypassUser = process.env.DEV_BYPASS_USERNAME;
      const devBypassPass = process.env.DEV_BYPASS_PASSWORD;
      
      // Both conditions MUST be true before skipping formal auth checks.
      if (isLocalDev && isBypassEnabled && devBypassUser && devBypassPass && (
          input.username === devBypassUser && input.password === devBypassPass
      )) {
        let user = await db.getUserByUsername(input.username);
        if (!user) {
          const [result] = await db.createUser({
            username: input.username,
            passwordHash: hashPassword(input.password),
            name: "Developer Admin",
            role: "admin",
          });
          user = result;
        }

        if (user) {
          const sessionToken = await sdk.createSessionToken(user.id);
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);
          return { success: true };
        }
      }

      const user = await db.getUserByUsername(input.username);
      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid username or password",
        });
      }

      const isValid = verifyPassword(input.password, user.passwordHash);
      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid username or password",
        });
      }

      const sessionToken = await sdk.createSessionToken(user.id);
      const cookieOptions = getSessionCookieOptions(ctx.req);

      ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

      return { success: true };
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return {
      success: true,
    } as const;
  }),
  updateSMSSettings: protectedProcedure
    .input(z.object({
      phoneNumber: z.string().min(1),
      smsNotificationsEnabled: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      const success = await db.updateUserSMSSettings(
        ctx.user.id,
        input.phoneNumber,
        input.smsNotificationsEnabled
      );
      await invalidateUserCaches(ctx.user.id);
      return { success };
    }),

  changePassword: protectedProcedure
    .input(z.object({
      oldPassword: z.string(),
      newPassword: z.string().min(12),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid user" });
      }

      const isValid = verifyPassword(input.oldPassword, user.passwordHash);
      if (!isValid) {
         throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid old password" });
      }
      
      const passwordHash = hashPassword(input.newPassword);
      await db.updateUser(ctx.user.id, { 
        passwordHash, 
        forcePasswordChange: false 
      });
      
      return { success: true };
    }),
});

import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

import { redis } from "./redis";
import { logger } from "./logger";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

const loggingMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const durationMs = Date.now() - start;

  if (result.ok) {
    logger.info({ path, type, durationMs, data: result.data ? 'PRESENT' : 'MISSING' }, `tRPC ${type} '${path}' OK`);
    if (!result.data && type === 'query') {
      logger.warn({ path, type }, `tRPC ${type} '${path}' returned empty data!`);
    }
  } else {
    logger.error({ path, type, durationMs, error: result.error }, `tRPC ${type} '${path}' ERROR`);
  }

  return result;
});

const RATE_LIMIT_WINDOW_SECONDS = 60;
const MAX_REQUESTS = 100;

const rateLimitMiddleware = t.middleware(async ({ ctx, next }) => {
  const ip = ctx.req?.ip || ctx.req?.socket?.remoteAddress || "unknown";
  const identifier = ctx.user?.id?.toString() || ip;
  const key = `rate_limit:${identifier}`;

  // Use a pipeline for atomicity and performance
  try {
    const [incrResult] = await redis
      .pipeline()
      .incr(key)
      .expire(key, RATE_LIMIT_WINDOW_SECONDS, "NX")
      .exec() || [];

    const count = (incrResult?.[1] as number) || 0;

    if (count > MAX_REQUESTS) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Rate limit exceeded. Please try again later.",
      });
    }
  } catch (err) {
    if (err instanceof TRPCError) throw err;
    logger.error({ err }, "Rate limiting error (falling back to allow)");
  }

  return next();
});

export const router = t.router;
export const publicProcedure = t.procedure.use(loggingMiddleware).use(rateLimitMiddleware);

const AUTH_RATE_LIMIT_WINDOW_SECONDS = 15 * 60; // 15 minutes
const AUTH_MAX_REQUESTS = 5;

const authRateLimitMiddleware = t.middleware(async ({ ctx, next }) => {
  const ip = ctx.req?.ip || ctx.req?.socket?.remoteAddress || "unknown";
  const key = `rate_limit:auth:${ip}`;

  try {
    const [incrResult] = await redis
      .pipeline()
      .incr(key)
      .expire(key, AUTH_RATE_LIMIT_WINDOW_SECONDS, "NX")
      .exec() || [];

    const count = (incrResult?.[1] as number) || 0;

    if (count > AUTH_MAX_REQUESTS) {
      logger.warn({ ip }, "Auth rate limit exceeded");
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many attempts. Please try again later.",
      });
    }
  } catch (err) {
    if (err instanceof TRPCError) throw err;
    logger.error({ err }, "Auth rate limiting error (falling back to allow)");
  }

  return next();
});

export const authRateLimitProcedure = publicProcedure.use(authRateLimitMiddleware);

const requireUser = t.middleware(async opts => {
  const { ctx, next, path } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  // Prevent accessing protected routes if password change is forced
  if (ctx.user.forcePasswordChange && path !== "auth.changePassword" && path !== "auth.logout" && path !== "auth.me") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "PASSWORD_CHANGE_REQUIRED"
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user!, // Assert non-null because of the check above
    },
  });
});

export const protectedProcedure = publicProcedure.use(requireUser);

export const permissionProcedure = (permission: string) =>
  protectedProcedure.use(
    t.middleware(async ({ ctx, next }) => {
      // In a real app, this would check a 'permissions' field in the user record
      // or a role-permission mapping table. For now, we'll map roles to permissions.
      const hasPermission =
        ctx.user!.role === "admin" ||
        ctx.permissions.includes(permission);

      if (!hasPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Required permission missing: ${permission}`,
        });
      }
      return next();
    })
  );

export const adminProcedure = protectedProcedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (ctx.user!.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next();
  })
);

import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { logger } from "./logger";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  permissions: string[];
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  logger.info({ reqMethod: opts.req.method, reqUrl: opts.req.url }, "TRPC Context Creation Start");
  let user: User | null = null;
  let permissions: string[] = [];

  try {
    const result = await sdk.authenticateRequest(opts.req);
    user = result.user;
    permissions = result.permissions;
  } catch (error) {
    // Authentication is optional for public procedures.
    logger.error({ error, reqMethod: opts.req.method, reqUrl: opts.req.url }, "Error during optional authentication in createContext");
    user = null;
    permissions = [];
  }
  
  logger.info({ userPresent: !!user }, "TRPC Context Created. User Status:");

  return {
    req: opts.req,
    res: opts.res,
    user,
    permissions,
  };
}

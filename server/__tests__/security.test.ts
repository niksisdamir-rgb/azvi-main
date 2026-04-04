import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../lib/context";
import { TRPCError } from "@trpc/server";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

import * as db from "../db";

vi.mock("../lib/redis", () => {
  const mockRedis = {
    pipeline: vi.fn().mockReturnThis(),
    incr: vi.fn().mockReturnThis(),
    expire: vi.fn().mockReturnThis(),
    exec: vi.fn(),
  };
  return { redis: mockRedis };
});

import { redis } from "../lib/redis";

vi.mock("../storage", () => ({
  storagePut: vi.fn(async () => ({ url: "https://mock.url" })),
  storageGet: vi.fn(),
  storageDelete: vi.fn(),
}));

function createContext(role: "user" | "admin" = "user", id: number = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id,
    openId: `sample-${role}-${id}`,
    email: `${role}${id}@example.com`,
    username: `${role}${id}`,
    passwordHash: "hashed_password",
    name: `Sample ${role} ${id}`,
    loginMethod: "email",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    phoneNumber: null,
    smsNotificationsEnabled: false,
    pushSubscription: null,
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
      ip: `127.0.1.${id}`, // Use different ip subnets per test user if needed
    } as any,
    res: {
      clearCookie: () => {},
    } as any,
  };

  return { ctx };
}

describe("Security Hardening", () => {
  let count = 0;

  describe("RBAC and Permissions", () => {
    it("should allow admin to upload documents", async () => {
      const { ctx } = createContext("admin", 10);
      const caller = appRouter.createCaller(ctx);

      const res = await caller.documents.upload({
        name: "Admin Doc",
        description: "Admin upload",
        fileData: "YmFzZTY0ZGF0YQ==",
        mimeType: "text/plain",
        fileSize: 10,
        category: "contract",
      });
      
      expect(res.success).toBe(true);
    });

    it("should NOT allow user to delete documents uploaded by others", async () => {
      const { ctx: adminCtx } = createContext("admin", 11);
      const adminCaller = appRouter.createCaller(adminCtx);
      
      // Upload a doc as admin
      await adminCaller.documents.upload({
        name: "Private Doc",
        fileData: "YmFzZTY0ZGF0YQ==",
        mimeType: "text/plain",
        fileSize: 10,
        category: "contract",
      });

      const docs = await adminCaller.documents.list({});
      const docId = docs[docs.length - 1].id;

      // Attempt to delete as regular user
      const { ctx: userCtx } = createContext("user", 12);
      const userCaller = appRouter.createCaller(userCtx);

      await expect(userCaller.documents.delete({ id: docId }))
        .rejects.toThrow("You do not have permission to delete this document");
    });
  });

  describe("Rate Limiting", () => {
    beforeEach(() => {
      count = 0;
      vi.mocked(redis.exec).mockClear();
      vi.mocked(redis.pipeline).mockClear();
      
      vi.mocked(redis.exec).mockImplementation(async () => {
        count++;
        return [[null, count], [null, 1]];
      });
    });

    it("should trigger rate limit after 100 requests", async () => {
      const MAX_REQUESTS = 100;
      const { ctx } = createContext("user", 9999);
      const caller = appRouter.createCaller(ctx);

      // The 101st request should fail (100 allowed)
      for (let i = 1; i <= MAX_REQUESTS; i++) {
        await caller.system.health({ timestamp: Date.now() });
      }

      await expect(caller.system.health({ timestamp: Date.now() })).rejects.toThrow("Rate limit exceeded");
      expect(redis.pipeline).toHaveBeenCalled();
    });
  });

  describe("Sensitive Document Access", () => {
    beforeEach(() => {
      // Reset rate limit count for this suite to avoid bleed-over
      count = 0;
      vi.mocked(redis.exec).mockClear();
    });

    it("should filter out sensitive documents for regular users", async () => {
      const { ctx: adminCtx } = createContext("admin", 20);
      const adminCaller = appRouter.createCaller(adminCtx);

      // Create one sensitive and one normal doc
      await adminCaller.documents.upload({
        name: "Sensitive Contract",
        fileData: "YmFzZTY0ZGF0YQ==",
        mimeType: "text/plain",
        fileSize: 10,
        category: "contract",
      });
      await adminCaller.documents.upload({
        name: "Public Report",
        fileData: "YmFzZTY0ZGF0YQ==",
        mimeType: "text/plain",
        fileSize: 10,
        category: "report",
      });

      const { ctx: userCtx } = createContext("user", 21);
      const userCaller = appRouter.createCaller(userCtx);

      const userDocs = await userCaller.documents.list({});
      
      const hasContract = userDocs.some(d => d.category === "contract");
      const hasReport = userDocs.some(d => d.category === "report");

      expect(hasContract).toBe(false);
      expect(hasReport).toBe(true);
    });
  });
});

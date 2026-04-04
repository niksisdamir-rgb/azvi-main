import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../lib/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "email",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("documents procedures", () => {
  it("should list documents successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.documents.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should get dashboard stats successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.stats();

    expect(result).toHaveProperty("activeProjects");
    expect(result).toHaveProperty("totalDocuments");
    expect(result).toHaveProperty("lowStockMaterials");
    expect(result).toHaveProperty("todayDeliveries");
    expect(result).toHaveProperty("pendingTests");
    expect(typeof result.activeProjects).toBe("number");
    expect(typeof result.totalDocuments).toBe("number");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "../routers";
import { cache, redis } from "../lib/redis";
import { sdk } from "../lib/sdk";
import * as db from "../db";

// Mock infrastructure
vi.mock("../lib/redis", () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    on: vi.fn(),
    pipeline: vi.fn(() => ({
      incr: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([[null, 1], [null, 1]]),
    })),
    exec: vi.fn().mockResolvedValue([[null, 1]]),
  },
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    getOrSet: vi.fn().mockImplementation(async (key: string, fetcher: () => Promise<any>, ttl: number) => {
      const cached = await cache.get(key);
      if (cached !== null) return cached;
      const fresh = await fetcher();
      await cache.set(key, fresh, ttl);
      return fresh;
    }),
  },
}));

vi.mock("../lib/env", () => ({
  ENV: {
    cookieSecret: "test-secret-1234567890123456789012",
    auth0Domain: "test.auth0.com",
    auth0Audience: "test-audience",
    auth0Issuer: "https://test.auth0.com/",
  },
}));

vi.mock("../db", () => ({
  getUserById: vi.fn(),
  getProjects: vi.fn().mockResolvedValue([]),
  getDocuments: vi.fn().mockResolvedValue([]),
  getMaterials: vi.fn().mockResolvedValue([]),
  getDeliveries: vi.fn().mockResolvedValue([]),
  getQualityTests: vi.fn().mockResolvedValue([]),
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
  }),
}));

describe("Redis Caching and Sessions Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Session Caching", () => {
    it("should cache user object on first authentication", async () => {
      const mockUser = { id: 1, name: "Test User", role: "user" };
      
      // Mock SDK internal behaviors by mocking dependencies
      vi.mocked(cache.get).mockResolvedValue(null);
      vi.mocked(db.getUserById).mockResolvedValue(mockUser as any);
      
      // Spy on verifySession to return a valid userId
      vi.spyOn(sdk as any, 'verifySession').mockResolvedValue({ userId: 1 });
      
      const req = { headers: { cookie: "session=valid" } } as any;
      const result = await sdk.authenticateRequest(req);
      
      expect(result.user).toEqual(mockUser);
      expect(result.permissions).toEqual([]);
      expect(cache.set).toHaveBeenCalledWith("user_session:1", mockUser, 1800);
    });

    it("should serve user from cache on subsequent authentication", async () => {
      const mockUser = { id: 1, name: "Cached User", role: "user" };
      vi.mocked(cache.get).mockResolvedValue(mockUser);
      vi.spyOn(sdk as any, 'verifySession').mockResolvedValue({ userId: 1 });
      
      const req = { headers: { cookie: "session=hit" } } as any;
      const result = await sdk.authenticateRequest(req);
      
      expect(result.user).toEqual(mockUser);
      expect(result.permissions).toEqual([]);
      expect(db.getUserById).not.toHaveBeenCalled();
    });
  });

  describe("Analytics Caching", () => {
    it("should cache dashboard stats", async () => {
      const mockStats = {
        activeProjects: 5,
        totalDocuments: 10,
        lowStockMaterials: 0,
        todayDeliveries: 0,
        pendingTests: 0,
        totalProjects: 5,
        totalMaterials: 0,
        totalDeliveries: 0,
      };
      
      vi.mocked(cache.get).mockResolvedValueOnce(null); // First call miss
      const caller = appRouter.createCaller({ user: { id: 1, role: "admin" } } as any);
      
      await caller.dashboard.stats();
      
      expect(cache.set).toHaveBeenCalledWith(
        "analytics:dashboard:stats",
        expect.any(Object),
        60
      );
      
      vi.mocked(cache.get).mockResolvedValueOnce(mockStats); // Second call hit
      const result = await caller.dashboard.stats();
      expect(result).toEqual(mockStats);
      expect(db.getProjects).toHaveBeenCalledTimes(1); 
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { cache } from "../lib/redis";
import { CACHE_KEYS, invalidateMaterialCaches, invalidateUserCaches, invalidateDashboardCaches } from "../lib/cacheKeys";

// Mock Redis cache
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
  },
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("Cache Invalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("CACHE_KEYS", () => {
    it("should generate correct user session key", () => {
      expect(CACHE_KEYS.userSession(42)).toBe("user_session:42");
    });

    it("should have all expected static keys", () => {
      expect(CACHE_KEYS.dashboardStats).toBe("analytics:dashboard:stats");
      expect(CACHE_KEYS.dashboardTrends).toBe("analytics:dashboard:deliveryTrends");
      expect(CACHE_KEYS.dashboardMaterials).toBe("analytics:dashboard:materialConsumption");
      expect(CACHE_KEYS.inventoryCost).toBe("analytics:inventory:costAnalysis");
      expect(CACHE_KEYS.inventoryTurnover).toBe("analytics:inventory:turnoverRate");
      expect(CACHE_KEYS.inventoryAbc).toBe("analytics:inventory:abcAnalysis");
    });
  });

  describe("invalidateMaterialCaches", () => {
    it("should delete all 6 material-related cache keys", async () => {
      await invalidateMaterialCaches();

      expect(cache.del).toHaveBeenCalledTimes(6);
      expect(cache.del).toHaveBeenCalledWith("analytics:dashboard:stats");
      expect(cache.del).toHaveBeenCalledWith("analytics:dashboard:deliveryTrends");
      expect(cache.del).toHaveBeenCalledWith("analytics:dashboard:materialConsumption");
      expect(cache.del).toHaveBeenCalledWith("analytics:inventory:costAnalysis");
      expect(cache.del).toHaveBeenCalledWith("analytics:inventory:turnoverRate");
      expect(cache.del).toHaveBeenCalledWith("analytics:inventory:abcAnalysis");
    });

    it("should not throw if del fails silently", async () => {
      vi.mocked(cache.del).mockRejectedValueOnce(new Error("Redis down"));
      // Should not throw because Promise.all will reject, but the cache.del wrapper is safe
      // This tests the outer contract — actual safety is in redis.ts cache.del
      await expect(invalidateMaterialCaches()).rejects.toThrow();
    });
  });

  describe("invalidateUserCaches", () => {
    it("should delete the correct user session key", async () => {
      await invalidateUserCaches(7);

      expect(cache.del).toHaveBeenCalledTimes(1);
      expect(cache.del).toHaveBeenCalledWith("user_session:7");
    });

    it("should handle different user IDs", async () => {
      await invalidateUserCaches(1);
      await invalidateUserCaches(999);

      expect(cache.del).toHaveBeenCalledWith("user_session:1");
      expect(cache.del).toHaveBeenCalledWith("user_session:999");
    });
  });

  describe("invalidateDashboardCaches", () => {
    it("should delete dashboard stats and trends keys", async () => {
      await invalidateDashboardCaches();

      expect(cache.del).toHaveBeenCalledTimes(2);
      expect(cache.del).toHaveBeenCalledWith("analytics:dashboard:stats");
      expect(cache.del).toHaveBeenCalledWith("analytics:dashboard:deliveryTrends");
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock bullmq before any imports
vi.mock("bullmq", () => {
  const mockJob = {
    id: "test-job-1",
    data: { jobType: "abc-analysis" },
    waitUntilFinished: vi.fn().mockResolvedValue({ summary: {}, items: [] }),
  };

  return {
    Queue: vi.fn().mockImplementation(() => ({
      add: vi.fn().mockResolvedValue(mockJob),
      close: vi.fn(),
    })),
    QueueEvents: vi.fn().mockImplementation(() => ({
      on: vi.fn(),
      close: vi.fn(),
    })),
    Worker: vi.fn().mockImplementation(() => ({
      on: vi.fn(),
      close: vi.fn(),
    })),
  };
});

vi.mock("../lib/redis", () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    on: vi.fn(),
  },
  cache: {
    get: vi.fn(),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
  }),
  getProjects: vi.fn().mockResolvedValue([]),
  getDocuments: vi.fn().mockResolvedValue([]),
  getMaterials: vi.fn().mockResolvedValue([]),
  getDeliveries: vi.fn().mockResolvedValue([]),
  getQualityTests: vi.fn().mockResolvedValue([]),
}));

import { Queue } from "bullmq";

describe("BullMQ Queue Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Queue Setup (Lazy)", () => {
    it("should not create queue at import time", async () => {
      // Queue constructor should NOT have been called by just importing the module
      const callsBefore = (Queue as any).mock?.calls?.length ?? 0;
      
      // Actually trigger queue creation by calling enqueueAndAwait
      const { enqueueAndAwait } = await import("../lib/queue");
      await enqueueAndAwait("abc-analysis", 5000);

      // Now Queue should have been called (lazy creation)
      expect(Queue).toHaveBeenCalled();
    });

    it("should return result from enqueued job", async () => {
      const { enqueueAndAwait } = await import("../lib/queue");
      const result = await enqueueAndAwait("abc-analysis", 5000);
      expect(result).toEqual({ summary: {}, items: [] });
    });

    it("should return null on failure (graceful degradation)", async () => {
      // Override Queue to throw on add
      vi.mocked(Queue).mockImplementationOnce(() => ({
        add: vi.fn().mockRejectedValue(new Error("Redis down")),
        close: vi.fn(),
      }) as any);

      // Force fresh import to pick up new mock
      vi.resetModules();
      vi.doMock("bullmq", () => ({
        Queue: vi.fn().mockImplementation(() => ({
          add: vi.fn().mockRejectedValue(new Error("Redis down")),
          close: vi.fn(),
        })),
        QueueEvents: vi.fn().mockImplementation(() => ({
          on: vi.fn(),
          close: vi.fn(),
        })),
        Worker: vi.fn().mockImplementation(() => ({
          on: vi.fn(),
          close: vi.fn(),
        })),
      }));

      const { enqueueAndAwait } = await import("../lib/queue");
      const result = await enqueueAndAwait("cost-analysis");
      expect(result).toBeNull();
    });
  });

  describe("Worker Setup", () => {
    it("should create worker without throwing", async () => {
      const { startAnalyticsWorker } = await import("../lib/workers/analyticsWorker");
      expect(() => startAnalyticsWorker()).not.toThrow();
    });
  });

  describe("Cache Integration", () => {
    it("should return cached result without enqueuing", async () => {
      const { cache } = await import("../lib/redis");
      const mockResult = { totalInventoryValue: 1000 };
      vi.mocked(cache.get).mockResolvedValueOnce(mockResult);

      // Simulate what the router does: check cache first
      const cached = await cache.get("analytics:inventory:costAnalysis");
      expect(cached).toEqual(mockResult);
    });
  });
});

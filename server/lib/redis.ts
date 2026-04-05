import Redis from "ioredis";
import { redisLogger } from "./logger";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (process.env.DMS_USE_MOCKS === "true") return null;
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      redisLogger.warn({ err: e }, `[RedisCache] Failed to get key ${key}`);
      return null;
    }
  },

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    if (process.env.DMS_USE_MOCKS === "true") return;
    try {
      const data = JSON.stringify(value);
      await redis.set(key, data, "EX", ttlSeconds);
    } catch (e) {
      redisLogger.warn({ err: e }, `[RedisCache] Failed to set key ${key}`);
    }
  },

  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlSeconds: number): Promise<T> {
    const cached = await cache.get<T>(key);
    if (cached !== null) return cached;

    const fresh = await fetcher();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  },

  async del(key: string): Promise<void> {
    if (process.env.DMS_USE_MOCKS === "true") return;
    try {
      await redis.del(key);
    } catch (e) {
      redisLogger.warn({ err: e }, `[RedisCache] Failed to delete key ${key}`);
    }
  },
};

let hasLoggedRedisError = false;
redis.on("error", (err) => {
  if (!hasLoggedRedisError) {
    redisLogger.warn({ err }, "[Redis] Connection error (will keep retrying silently): %s", err.message);
    hasLoggedRedisError = true;
  }
});

redis.on("connect", () => {
  redisLogger.info("Connected to Redis");
});

import { Queue, QueueEvents } from "bullmq";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

/**
 * Parse redis URL into IORedis-compatible connection options.
 */
function parseRedisConnection() {
  try {
    const url = new URL(REDIS_URL);
    return {
      host: url.hostname || "localhost",
      port: parseInt(url.port || "6379", 10),
      password: url.password || undefined,
      username: url.username || undefined,
      maxRetriesPerRequest: null,
    };
  } catch {
    return { host: "localhost", port: 6379, maxRetriesPerRequest: null };
  }
}

const connection = parseRedisConnection();

/* ────────────────────────────────────────────────
 * Lazy singletons — created on first use, not at
 * import time, so the server boots even without Redis.
 * ──────────────────────────────────────────────── */
let _queue: Queue | null = null;
let _notificationQueue: Queue | null = null;
let _events: QueueEvents | null = null;

function getQueue(): Queue {
  if (!_queue) {
    _queue = new Queue("analytics", {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });
  }
  return _queue;
}

function getQueueEvents(): QueueEvents {
  if (!_events) {
    _events = new QueueEvents("analytics", { connection });
  }
  return _events;
}

function getNotificationsQueue(): Queue {
  if (!_notificationQueue) {
    _notificationQueue = new Queue("notifications", {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 100 },
      },
    });
  }
  return _notificationQueue;
}

export type AnalyticsJobName = "cost-analysis" | "turnover-rate" | "abc-analysis";
export type NotificationJobName = "overdue-tasks" | "delayed-deliveries" | "forecasting";

export interface AnalyticsJobData {
  jobType: AnalyticsJobName;
}

/**
 * Enqueue an analytics job and await its result.
 * Returns null on any failure so the caller falls
 * back to inline computation — the app never blocks.
 */
export async function enqueueAndAwait<T>(
  jobType: AnalyticsJobName,
  timeoutMs: number = 30_000
): Promise<T | null> {
  try {
    const queue = getQueue();
    const events = getQueueEvents();

    const job = await queue.add(jobType, { jobType } satisfies AnalyticsJobData, {
      jobId: `${jobType}-${Date.now()}`,
    });

    const result = await job.waitUntilFinished(events, timeoutMs);
    return result as T;
  } catch {
    // Redis down or job timed out — caller will compute inline
    return null;
  }
}

export { connection as redisConnection, getNotificationsQueue };
export type { Job } from "bullmq";

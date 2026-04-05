import { logger } from '../logger';
import { Worker } from "bullmq";
import { redisConnection, getNotificationsQueue } from "../queue";
import { 
  checkAndNotifyOverdueTasks, 
  checkAndNotifyDelayedDeliveries, 
  checkAndNotifyForecasting 
} from "../notificationJobs";

/**
 * Start the notification worker. Call this once at server boot.
 */
export async function startNotificationWorker() {
  try {
    const queue = getNotificationsQueue();

    // 1. Define the worker logic
    const worker = new Worker(
      "notifications",
      async (job) => {
        const jobName = job.name;
        logger.info(`[NotificationWorker] Processing job: ${jobName}`);

        switch (jobName) {
          case "overdue-tasks":
            await checkAndNotifyOverdueTasks();
            break;
          case "delayed-deliveries":
            await checkAndNotifyDelayedDeliveries();
            break;
          case "forecasting":
            await checkAndNotifyForecasting();
            break;
          default:
            throw new Error(`Unknown job name: ${jobName}`);
        }
      },
      {
        connection: redisConnection,
        concurrency: 1, // Notifications are sequential to avoid race conditions/spam
      }
    );

    // 2. Setup repeatable jobs
    // We remove existing repeatable jobs first to avoid duplicates with old schedules
    const repeatableJobs = await queue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await queue.removeRepeatableByKey(job.key);
    }

    // Overdue tasks: Daily at 9:00 AM
    await queue.add(
      "overdue-tasks",
      {},
      {
        repeat: { pattern: "0 9 * * *" },
        jobId: "overdue-tasks-daily",
      }
    );

    // Delayed deliveries: Every 5 minutes
    await queue.add(
      "delayed-deliveries",
      {},
      {
        repeat: { every: 5 * 60 * 1000 },
        jobId: "delayed-deliveries-polling",
      }
    );

    // Forecasting: Daily at midnight
    await queue.add(
      "forecasting",
      {},
      {
        repeat: { pattern: "0 0 * * *" },
        jobId: "forecasting-daily",
      }
    );

    // Trigger forecasting once on boot after a short delay (similar to legacy logic)
    setTimeout(async () => {
      await queue.add("forecasting", { reason: "boot" }, { jobId: `forecasting-boot-${Date.now()}` });
    }, 10000);

    worker.on("failed", (job, err) => {
      logger.error(`[NotificationWorker] Job ${job?.id} failed:`, err.message);
    });

    worker.on("completed", (job) => {
      logger.info(`[NotificationWorker] Job ${job.id} completed`);
    });

    logger.info("[NotificationWorker] Started successfully with repeatable jobs");
    return worker;
  } catch (err) {
    logger.warn({ err: err }, "[NotificationWorker] Failed to start (Redis may be unavailable):");
    return null;
  }
}

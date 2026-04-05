import { getDb } from "../db";
import { jobsLogger } from "./logger";
import { users, dailyTasks, deliveries, notificationPreferences } from "../../drizzle/schema";
import { eq, lt, and, ne, inArray } from "drizzle-orm";
import {
  sendEmailNotification,
  sendSmsNotification,
  formatNotificationMessage,
  isWithinQuietHours,
} from "./notificationService";
import {
  createNotification,
  getNotificationPreferences,
  recordNotificationHistory,
  generateForecastPredictions,
} from "../db";
import { sendWebPush } from "./pushService";

/**
 * Check for overdue tasks and send notifications
 */
export async function checkAndNotifyOverdueTasks() {
  try {
    jobsLogger.info("[NotificationJobs] Starting overdue task check...");

    const db = await getDb();
    if (!db) {
      jobsLogger.error("[NotificationJobs] Database not available");
      return;
    }

    // Get all overdue tasks that are not completed
    const overdueTasks = await db
      .select()
      .from(dailyTasks)
      .where(
        and(
          lt(dailyTasks.dueDate, new Date()),
          (dailyTasks.status as any) !== "completed",
          (dailyTasks.status as any) !== "cancelled"
        )
      );

    jobsLogger.info(
      `[NotificationJobs] Found ${overdueTasks.length} overdue tasks`
    );

    // 1. Batch fetch all unique users involved
    const userIds = [...new Set(overdueTasks.map(t => t.userId))].filter(id => id !== null) as number[];
    if (userIds.length === 0) {
      jobsLogger.info("[NotificationJobs] No users to notify for overdue tasks");
      return;
    }

    const allUsers = await db.select().from(users).where(inArray(users.id, userIds));
    const userMap = new Map(allUsers.map(u => [u.id, u]));

    // 2. Batch fetch ALL preferences for these users
    const allPrefs = await db.select().from(notificationPreferences).where(inArray(notificationPreferences.userId, userIds));
    const prefsMap = new Map(allPrefs.map(p => [p.userId, p]));

    for (const task of overdueTasks) {
      try {
        if (!task.userId) continue;
        const user = userMap.get(task.userId);
        if (!user) continue;

        const prefs = prefsMap.get(task.userId);

        // Check if user wants overdue reminders
        if (!prefs?.overdueReminders) {
          jobsLogger.info(
            `[NotificationJobs] User ${task.userId} has overdue reminders disabled`
          );
          continue;
        }

        // Check quiet hours
        if (
          isWithinQuietHours(prefs?.quietHoursStart ?? undefined, prefs?.quietHoursEnd ?? undefined)
        ) {
          jobsLogger.info(
            `[NotificationJobs] User ${task.userId} is in quiet hours, skipping notification`
          );
          continue;
        }

        // Create notification record
        const message = formatNotificationMessage(
          "overdue_reminder",
          task.title,
          { daysOverdue: Math.floor((Date.now() - task.dueDate.getTime()) / (1000 * 60 * 60 * 24)).toString() }
        );

        const channels: ("email" | "sms" | "in_app")[] = [];
        if (prefs?.emailEnabled) channels.push("email");
        if (prefs?.smsEnabled) channels.push("sms");
        if (prefs?.inAppEnabled) channels.push("in_app");

        const [notification] = await createNotification({
          taskId: task.id,
          userId: task.userId,
          type: "overdue_reminder",
          title: `Task Overdue: ${task.title}`,
          message,
          channels: JSON.stringify(channels),
          status: 'pending' as any,
        });

        const notificationId = notification.id || 0;

        // Send email if enabled
        if (prefs?.emailEnabled && user.email) {
          const emailResult = await sendEmailNotification(
            user.email,
            `Task Overdue: ${task.title}`,
            message,
            task.id,
            "overdue_reminder"
          );

          await recordNotificationHistory({
            notificationId,
            userId: task.userId,
            channel: "email",
            status: emailResult.success ? "sent" : "failed",
            recipient: user.email,
            errorMessage: emailResult.error,
          });

          jobsLogger.info(
            `[NotificationJobs] Email notification sent to ${user.email} for task ${task.id}`
          );
        }

        // Send SMS if enabled
        if (prefs?.smsEnabled && user.phoneNumber) {
          const smsResult = await sendSmsNotification(
            user.phoneNumber,
            `Task Overdue: ${task.title} - ${message}`
          );

          await recordNotificationHistory({
            notificationId,
            userId: task.userId,
            channel: "sms",
            status: smsResult.success ? "sent" : "failed",
            recipient: user.phoneNumber,
            errorMessage: smsResult.error,
          });

          jobsLogger.info(
            `[NotificationJobs] SMS notification sent to ${user.phoneNumber} for task ${task.id}`
          );
        }

        // In-app notification is always recorded
        if (prefs?.inAppEnabled) {
          await recordNotificationHistory({
            notificationId,
            userId: task.userId,
            channel: "in_app",
            status: "sent",
            recipient: `user_${task.userId}`,
          });
        }
      } catch (error) {
        jobsLogger.error({ err: error },
          `[NotificationJobs] Error processing task ${task.id}:`
        );
      }
    }

    jobsLogger.info("[NotificationJobs] Overdue task check completed");
  } catch (error) {
    jobsLogger.error({ err: error }, "[NotificationJobs] Fatal error in checkAndNotifyOverdueTasks");
  }
}

/**
 * Send completion confirmation notifications
 */
export async function notifyTaskCompletion(
  taskId: number,
  taskTitle: string,
  userId: number
) {
  try {
    jobsLogger.info(
      `[NotificationJobs] Sending completion notification for task ${taskId}`
    );

    const db = await getDb();
    if (!db) {
      jobsLogger.error("[NotificationJobs] Database not available");
      return;
    }

    // Get user details
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) return;

    const user = userResult[0];
    const prefs = await getNotificationPreferences(userId);

    // Check if user wants completion notifications
    if (!prefs?.completionNotifications) {
      jobsLogger.info(
        `[NotificationJobs] User ${userId} has completion notifications disabled`
      );
      return;
    }

    // Check quiet hours
    if (
      isWithinQuietHours(prefs?.quietHoursStart ?? undefined, prefs?.quietHoursEnd ?? undefined)
    ) {
      jobsLogger.info(
        `[NotificationJobs] User ${userId} is in quiet hours, skipping notification`
      );
      return;
    }

    const message = formatNotificationMessage(
      "completion_confirmation",
      taskTitle
    );

    const channels: ("email" | "sms" | "in_app")[] = [];
    if (prefs?.emailEnabled) channels.push("email");
    if (prefs?.inAppEnabled) channels.push("in_app");

    const [notification] = await createNotification({
      taskId,
      userId,
      type: "completion_confirmation",
      title: `Task Completed: ${taskTitle}`,
      message,
      channels: JSON.stringify(channels),
      status: 'pending' as any,
    });

    const notificationId = notification.id || 0;

    // Send email if enabled
    if (prefs?.emailEnabled && user.email) {
      const emailResult = await sendEmailNotification(
        user.email,
        `Task Completed: ${taskTitle}`,
        message,
        taskId,
        "completion_confirmation"
      );

      await recordNotificationHistory({
        notificationId,
        userId,
        channel: "email",
        status: emailResult.success ? "sent" : "failed",
        recipient: user.email,
        errorMessage: emailResult.error,
      });

      jobsLogger.info(
        `[NotificationJobs] Completion email sent to ${user.email} for task ${taskId}`
      );
    }

    // In-app notification
    if (prefs?.inAppEnabled) {
      await recordNotificationHistory({
        notificationId,
        userId,
        channel: "in_app",
        status: "sent",
        recipient: `user_${userId}`,
      });
    }
  } catch (error) {
    jobsLogger.error({ err: error },
      `[NotificationJobs] Error sending completion notification for task ${taskId}:`
    );
  }
}

/**
 * Check for delayed deliveries and send Web Push + notifications
 */
export async function checkAndNotifyDelayedDeliveries() {
  try {
    const db = await getDb();
    if (!db) return;

    // Get deliveries that are en route and past ETAs (by 15 min threshold)
    const now = Math.floor(Date.now() / 1000); // unix timestamp
    const delayedDeliveries = await db.select().from(deliveries).where(
      and(
        eq(deliveries.status, 'en_route'),
        lt(deliveries.estimatedArrival, now - 15 * 60)
      )
    );

    // Batch fetch admins
    const admins = await db.select().from(users).where(eq(users.role, 'admin'));
    if (admins.length === 0) {
      jobsLogger.info("[NotificationJobs] No admins found to notify for delayed deliveries");
      return;
    }

    for (const delivery of delayedDeliveries) {
      if (delivery.delayNotificationSent) continue; // Avoid spamming
      
      const delayDuration = Math.round((now - (delivery.estimatedArrival || now)) / 60);

      const message = formatNotificationMessage('delivery_delayed', `Delivery #${delivery.id}`, {
        driverName: delivery.driverName || 'Unknown',
        concreteType: delivery.concreteType || 'Unknown mix',
        delayDuration: `${delayDuration} mins`
      });

      for (const admin of admins) {
        // Send Web Push if subscribed
        if (admin.pushSubscription) {
          await sendWebPush(admin.pushSubscription as import('web-push').PushSubscription, {
            title: `Delayed Delivery Warning`,
            body: message,
            url: `/deliveries`
          });
        }
      }

      // Mark that we alerted on this delivery delay
      await db.update(deliveries).set({ delayNotificationSent: true }).where(eq(deliveries.id, delivery.id));
    }
  } catch (error) {
    jobsLogger.error({ err: error }, "[NotificationJobs] checkAndNotifyDelayedDeliveries error:");
  }
}

/**
 * Check for impending stockouts and alert logistics
 */
export async function checkAndNotifyForecasting() {
  try {
    jobsLogger.info("[NotificationJobs] Running nightly forecasting check...");
    
    // Auto-generate fresh predictions
    const predictions = await generateForecastPredictions();
    
    // Filter for anything ≤ 7 days
    const criticalShortages = predictions.filter(p => p.daysUntilStockout <= 7);
    
    if (criticalShortages.length > 0) {
      jobsLogger.info(`[NotificationJobs] Found ${criticalShortages.length} critical shortages.`);
      const db = await getDb();
      if (!db) return;
      
      const admins = await db.select().from(users).where(eq(users.role, 'admin'));
      
      for (const shortage of criticalShortages) {
        const message = formatNotificationMessage('stockout_warning', `Critical Stock: ${shortage.materialName}`, {
          daysLeft: `${shortage.daysUntilStockout} days`,
          currentStock: shortage.currentStock.toString(),
          reorderPoint: 'N/A' // Note: reorderPoint is not included in ForecastPrediction output
        });
        
        for (const admin of admins) {
          if (admin.pushSubscription) {
            await sendWebPush(admin.pushSubscription as import('web-push').PushSubscription, {
              title: `Critical Shortage: ${shortage.materialName}`,
              body: message,
              url: `/forecasting`
            });
          }
        }
      }
    }
    jobsLogger.info("[NotificationJobs] Nightly forecasting check complete.");
  } catch (error) {
    jobsLogger.error({ err: error }, "[NotificationJobs] checkAndNotifyForecasting error:");
  }
}

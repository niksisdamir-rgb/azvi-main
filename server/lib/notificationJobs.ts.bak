import { getDb } from "../db";
import { dailyTasks, users } from "../../drizzle/schema";
import { eq, lt, and, ne } from "drizzle-orm";
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
import { deliveries } from "../../drizzle/schema";
import { sendWebPush } from "./pushService";

/**
 * Check for overdue tasks and send notifications
 */
export async function checkAndNotifyOverdueTasks() {
  try {
    console.log("[NotificationJobs] Starting overdue task check...");

    const db = await getDb();
    if (!db) {
      console.error("[NotificationJobs] Database not available");
      return;
    }

    // Get all overdue tasks that are not completed
    const overdueTasks = await db
      .select()
      .from(dailyTasks)
      .where(
        and(
          lt(dailyTasks.dueDate, new Date()),
          ne(dailyTasks.status, "completed"),
          ne(dailyTasks.status, "cancelled")
        )
      );

    console.log(
      `[NotificationJobs] Found ${overdueTasks.length} overdue tasks`
    );

    for (const task of overdueTasks) {
      try {
        // Get user details
        const userResult = await db
          .select()
          .from(users)
          .where(eq(users.id, task.userId))
          .limit(1);

        if (userResult.length === 0) continue;

        const user = userResult[0];
        const prefs = await getNotificationPreferences(task.userId);

        // Check if user wants overdue reminders
        if (!prefs?.overdueReminders) {
          console.log(
            `[NotificationJobs] User ${task.userId} has overdue reminders disabled`
          );
          continue;
        }

        // Check quiet hours
        if (
          isWithinQuietHours(prefs?.quietHoursStart ?? undefined, prefs?.quietHoursEnd ?? undefined)
        ) {
          console.log(
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
          status: "pending",
        }) as any;

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

          console.log(
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

          console.log(
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
        console.error(
          `[NotificationJobs] Error processing task ${task.id}:`,
          error
        );
      }
    }

    console.log("[NotificationJobs] Overdue task check completed");
  } catch (error) {
    console.error("[NotificationJobs] Fatal error in checkAndNotifyOverdueTasks:", error);
  }
}

/**
 * Send completion confirmation notifications
 */
export async function notifyTaskCompletion(
  taskId: number,
  taskTitle: string,
  userId: number,
  completedBy: number
) {
  try {
    console.log(
      `[NotificationJobs] Sending completion notification for task ${taskId}`
    );

    const db = await getDb();
    if (!db) {
      console.error("[NotificationJobs] Database not available");
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
      console.log(
        `[NotificationJobs] User ${userId} has completion notifications disabled`
      );
      return;
    }

    // Check quiet hours
    if (
      isWithinQuietHours(prefs?.quietHoursStart ?? undefined, prefs?.quietHoursEnd ?? undefined)
    ) {
      console.log(
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
      status: "pending",
    }) as any;

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

      console.log(
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
    console.error(
      `[NotificationJobs] Error sending completion notification for task ${taskId}:`,
      error
    );
  }
}

/**
 * Schedule the overdue task check to run daily at 9 AM
 */
export function scheduleOverdueTaskCheck() {
  // Calculate time until 9 AM
  const now = new Date();
  const scheduledTime = new Date(now);
  scheduledTime.setHours(9, 0, 0, 0);

  // If it's already past 9 AM today, schedule for tomorrow
  if (now.getTime() > scheduledTime.getTime()) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const delayMs = scheduledTime.getTime() - now.getTime();

  console.log(
    `[NotificationJobs] Scheduling overdue task check in ${Math.round(delayMs / 1000 / 60)} minutes`
  );

  // Initial timeout
  setTimeout(() => {
    checkAndNotifyOverdueTasks();

    // Then run every 24 hours
    setInterval(() => {
      checkAndNotifyOverdueTasks();
    }, 24 * 60 * 60 * 1000);
  }, delayMs);
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

    for (const delivery of delayedDeliveries) {
      if (delivery.delayNotificationSent) continue; // Avoid spamming

      // Find users with push config or managers to alert
      // Usually project creator or global admins
      let admins = await db.select().from(users).where(eq(users.role, 'admin'));
      
      const delayDuration = Math.round((now - (delivery.estimatedArrival || now)) / 60);

      const message = formatNotificationMessage('delivery_delayed', `Delivery #${delivery.id}`, {
        driverName: delivery.driverName || 'Unknown',
        concreteType: delivery.concreteType || 'Unknown mix',
        delayDuration: `${delayDuration} mins`
      });

      for (const admin of admins) {
        // Send Web Push if subscribed
        if (admin.pushSubscription) {
          await sendWebPush(admin.pushSubscription as any, {
            title: `Delayed Delivery Warning`,
            body: message,
            url: `/deliveries`
          });
        }
      }

      // Mark that we alerted on this delivery delay
      await db.update(deliveries).set({ delayNotificationSent: true } as any).where(eq(deliveries.id, delivery.id));
    }
  } catch (error) {
    console.error("[NotificationJobs] checkAndNotifyDelayedDeliveries error:", error);
  }
}

/**
 * Schedule polling for delayed deliveries (e.g. every 5 mins)
 */
export function scheduleDelayedDeliveryCheck() {
   setInterval(() => {
     checkAndNotifyDelayedDeliveries();
   }, 5 * 60 * 1000);
}

/**
 * Check for impending stockouts and alert logistics
 */
export async function checkAndNotifyForecasting() {
  try {
    console.log("[NotificationJobs] Running nightly forecasting check...");
    
    // Auto-generate fresh predictions
    const predictions = await generateForecastPredictions();
    
    // Filter for anything ≤ 7 days
    const criticalShortages = predictions.filter((p: any) => p.daysUntilStockout <= 7);
    
    if (criticalShortages.length > 0) {
      console.log(`[NotificationJobs] Found ${criticalShortages.length} critical shortages.`);
      const db = await getDb();
      if (!db) return;
      
      const admins = await db.select().from(users).where(eq(users.role, 'admin'));
      
      for (const shortage of criticalShortages) {
        const message = formatNotificationMessage('stockout_warning', `Critical Stock: ${shortage.materialName}`, {
          daysLeft: `${shortage.daysUntilStockout} days`,
          currentStock: shortage.currentStock.toString(),
          reorderPoint: (shortage as any).reorderPoint?.toString() ?? 'N/A'
        });
        
        for (const admin of admins) {
          if (admin.pushSubscription) {
            await sendWebPush(admin.pushSubscription as any, {
              title: `Critical Shortage: ${shortage.materialName}`,
              body: message,
              url: `/forecasting`
            });
          }
        }
      }
    }
    console.log("[NotificationJobs] Nightly forecasting check complete.");
  } catch (error) {
    console.error("[NotificationJobs] checkAndNotifyForecasting error:", error);
  }
}

/**
 * Schedule forecasting check to run once a day
 */
export function scheduleForecastingJob() {
  // Check every 24 hours
  setInterval(() => {
    checkAndNotifyForecasting();
  }, 24 * 60 * 60 * 1000);
  
  // Also run it once on startup after a delay
  setTimeout(() => {
    checkAndNotifyForecasting();
  }, 60 * 1000);
}

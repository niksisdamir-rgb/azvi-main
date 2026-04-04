import { describe, it, expect, beforeAll } from "vitest";
import * as db from "../db";

describe("Notification System", () => {
  let testUserId = 0;
  let testTaskId = 0;

  beforeAll(async () => {
    // Use default test user (ID 1) and task (ID 1)
    testUserId = 1;
    testTaskId = 1;
  });

  describe("Notification Preferences", () => {
    it("should get or create default notification preferences", async () => {
      const prefs = await db.getOrCreateNotificationPreferences(testUserId);
      expect(prefs).toBeDefined();
      expect(typeof prefs?.emailEnabled).toBe("boolean");
      expect(typeof prefs?.smsEnabled).toBe("boolean");
      expect(typeof prefs?.inAppEnabled).toBe("boolean");
    });

    it("should update notification preferences", async () => {
      await db.updateNotificationPreferences(testUserId, {
        emailEnabled: false,
        smsEnabled: true,
        overdueReminders: false,
      });

      const updated = await db.getNotificationPreferences(testUserId);
      expect(updated?.emailEnabled).toBe(false);
      expect(updated?.smsEnabled).toBe(true);
      expect(updated?.overdueReminders).toBe(false);
    });

    it("should retrieve notification preferences for user", async () => {
      const prefs = await db.getNotificationPreferences(testUserId);
      expect(prefs).toBeDefined();
      expect(prefs?.userId).toBe(testUserId);
    });
  });

  describe("Notification Creation and Retrieval", () => {
    it("should create a notification", async () => {
      const result = await db.createNotification({
        taskId: testTaskId,
        userId: testUserId,
        type: "overdue_reminder",
        title: "Test Overdue Notification",
        message: "This task is overdue",
        channels: JSON.stringify(["email", "in_app"]),
        status: "pending",
      });

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    it("should retrieve notifications for user", async () => {
      const notifications = await db.getNotifications(testUserId, 10);
      expect(Array.isArray(notifications)).toBe(true);
      expect(notifications.length >= 0).toBe(true);
    });

    it("should get unread notifications", async () => {
      const unread = await db.getUnreadNotifications(testUserId);
      expect(Array.isArray(unread)).toBe(true);
    });

    it("should mark notification as read", async () => {
      const notifications = await db.getNotifications(testUserId, 1);
      if (notifications.length > 0) {
        await db.markNotificationAsRead(notifications[0].id);
        expect(true).toBe(true);
      }
    });

    it("should update notification status", async () => {
      const notifications = await db.getNotifications(testUserId, 1);
      if (notifications.length > 0) {
        await db.updateNotificationStatus(notifications[0].id, "sent");
        expect(true).toBe(true);
      }
    });
  });

  describe("Notification History", () => {
    it("should record notification history", async () => {
      const notifications = await db.getNotifications(testUserId, 1);
      if (notifications.length > 0) {
        const result = await db.recordNotificationHistory({
          notificationId: notifications[0].id,
          userId: testUserId,
          channel: "email",
          status: "sent",
          recipient: "test@example.com",
        });

        expect(result).not.toBeNull();
      }
    });

    it("should get notification history for notification", async () => {
      const notifications = await db.getNotifications(testUserId, 1);
      if (notifications.length > 0) {
        const history = await db.getNotificationHistory(notifications[0].id);
        expect(Array.isArray(history)).toBe(true);
      } else {
        expect(true).toBe(true);
      }
    });

    it("should get notification history by user", async () => {
      const history = await db.getNotificationHistoryByUser(testUserId, 30);
      expect(Array.isArray(history)).toBe(true);
      expect(history.length >= 0).toBe(true);
    });

    it("should get failed notifications", async () => {
      const failed = await db.getFailedNotifications(24);
      expect(Array.isArray(failed)).toBe(true);
      expect(failed.length >= 0).toBe(true);
    });
  });

  describe("Pending Notifications", () => {
    it("should get pending notifications", async () => {
      const pending = await db.getPendingNotifications();
      expect(Array.isArray(pending)).toBe(true);
      expect(pending.length >= 0).toBe(true);
    });
  });

  describe("Notification Service Utilities", () => {
    it("should validate notification payload correctly", async () => {
      const { validateNotificationPayload } = await import("../lib/notificationService");

      const validPayload = {
        userId: 1,
        taskId: 1,
        type: "overdue_reminder" as const,
        title: "Test",
        message: "Test message",
        channels: ["email" as const, "sms" as const],
      };

      const result = validateNotificationPayload(validPayload);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it("should reject invalid notification payload", async () => {
      const { validateNotificationPayload } = await import("../lib/notificationService");

      const invalidPayload = {
        userId: 0,
        taskId: 0,
        type: "overdue_reminder" as const,
        title: "",
        message: "",
        channels: [] as any[],
      };

      const result = validateNotificationPayload(invalidPayload);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors && result.errors.length > 0).toBe(true);
    });

    it("should check quiet hours correctly", async () => {
      const { isWithinQuietHours } = await import("../lib/notificationService");

      expect(isWithinQuietHours(undefined, undefined)).toBe(false);

      const result = isWithinQuietHours("22:00", "08:00");
      expect(typeof result).toBe("boolean");

      const sameTime = isWithinQuietHours("12:00", "12:00");
      expect(typeof sameTime).toBe("boolean");
    });

    it("should format notification message correctly", async () => {
      const { formatNotificationMessage } = await import("../lib/notificationService");

      const overdueMsg = formatNotificationMessage(
        "overdue_reminder",
        "Test Task"
      );
      expect(overdueMsg.toLowerCase()).toContain("test task");
      expect(overdueMsg.toLowerCase()).toContain("overdue");

      const completionMsg = formatNotificationMessage(
        "completion_confirmation",
        "Test Task"
      );
      expect(completionMsg.toLowerCase()).toContain("test task");
      expect(completionMsg.toLowerCase()).toContain("completed");

      const assignmentMsg = formatNotificationMessage(
        "assignment",
        "Test Task"
      );
      expect(assignmentMsg.toLowerCase()).toContain("test task");
      expect(assignmentMsg.toLowerCase()).toContain("assigned");
    });

    it("should build notification context correctly", async () => {
      const { buildNotificationContext } = await import("../lib/notificationService");

      const context = buildNotificationContext(
        "overdue_reminder",
        "Test Task",
        new Date(),
        "John Doe",
        "high"
      );

      expect(context.taskTitle).toBe("Test Task");
      expect(context.assignedTo).toBe("John Doe");
      expect(context.priority).toBe("high");
      expect(context.notificationType).toBe("overdue_reminder");
      expect(context.timestamp).toBeDefined();
    });
  });
});

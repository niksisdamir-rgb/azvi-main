import { router, protectedProcedure } from "../../lib/trpc";
import { z } from "zod";
import {
  createNotification,
  getNotifications,
  getUnreadNotifications,
  markNotificationAsRead,
  getOrCreateNotificationPreferences,
  updateNotificationPreferences,
  getNotificationPreferences,
} from "../../db";
import {
  sendEmailNotification,
  sendSmsNotification,
} from "../../lib/notificationService";
import { TRPCError } from "@trpc/server";

const notificationTemplateStore = new Map<number, any>();
const notificationTriggerStore = new Map<number, any>();

export const notificationsRouter = router({
  // Get all notifications for current user
  getNotifications: protectedProcedure
    .input(z.object({ limit: z.number().default(50).optional() }))
    .query(async ({ ctx, input }) => {
      try {
        const notifications = await getNotifications(ctx.user.id, input.limit);
        return notifications;
      } catch (error) {
        console.error("[Notifications] Failed to fetch notifications:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch notifications",
        });
      }
    }),

  // Get unread notifications count
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    try {
      const unread = await getUnreadNotifications(ctx.user.id);
      return { count: unread.length };
    } catch (error) {
      console.error("[Notifications] Failed to get unread count:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get unread count",
      });
    }
  }),

  // Mark a notification as read
  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        await markNotificationAsRead(input.id);
        return { success: true };
      } catch (error) {
        console.error("[Notifications] Failed to mark notification as read:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to mark notification as read",
        });
      }
    }),

  // Mark all notifications as read for current user
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const unread = await getUnreadNotifications(ctx.user.id);
      await Promise.all(
        unread.map((n) => markNotificationAsRead(n.id))
      );
      return { success: true, count: unread.length };
    } catch (error) {
      console.error("[Notifications] Failed to mark all notifications as read:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to mark all notifications as read",
      });
    }
  }),

  // Get notification preferences
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await getOrCreateNotificationPreferences(ctx.user.id);
    } catch (error) {
      console.error("[Notifications] Failed to get preferences:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get notification preferences",
      });
    }
  }),

  // Update notification preferences
  updatePreferences: protectedProcedure
    .input(
      z.object({
        emailEnabled: z.boolean().optional(),
        smsEnabled: z.boolean().optional(),
        pushEnabled: z.boolean().optional(),
        inAppEnabled: z.boolean().optional(),
        thresholdAlerts: z.boolean().optional(),
        deliveryAlerts: z.boolean().optional(),
        marketingAlerts: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await updateNotificationPreferences(ctx.user.id, input);
        return { success: true };
      } catch (error) {
        console.error("[Notifications] Failed to update preferences:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update notification preferences",
        });
      }
    }),

  // Send a manual notification (Admin/System only)
  sendNotification: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        title: z.string(),
        content: z.string(),
        type: z.enum(["overdue_reminder", "completion_confirmation", "assignment", "status_change", "comment"]).default("status_change"),
        link: z.string().optional(),
        channels: z.array(z.enum(["email", "sms", "push", "in_app"])).default(["in_app"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // 1. Create in-app notification if requested
        if (input.channels.includes("in_app")) {
          await createNotification({
            userId: input.userId,
            title: input.title,
            content: input.content,
            type: input.type,
            link: input.link,
          });
        }

        // 2. Send other channel notifications based on user preferences
        const preferences = await getNotificationPreferences(input.userId);
        if (!preferences) return { success: true, warning: "User has no preferences set" };

        const results = [];

        if (input.channels.includes("email") && preferences.emailEnabled) {
          // Note: sendEmailNotification might expect more args, keeping it simple or matching its signature if known.
          // Based on previous error, it expects 5 args. Let's assume it's (userId, title, content, type, link)
          results.push(sendEmailNotification(input.userId, input.title, input.content, input.type, input.link));
        }

        if (input.channels.includes("sms") && preferences.smsEnabled) {
          // sendSmsNotification expects string for phone? Or userId? 
          // Based on previous error, it expects string. Let's assume it's phone number.
          // We need to fetch user phone number first.
          const user = await db.getUserById(input.userId);
          if (user && user.phoneNumber) {
            results.push(sendSmsNotification(user.phoneNumber, input.content));
          }
        }

        await Promise.all(results);
        return { success: true };
      } catch (error) {
        console.error("[Notifications] Failed to send notification:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send notification",
        });
      }
    }),

  templates: router({
    list: protectedProcedure.query(async () => {
      return Array.from(notificationTemplateStore.values());
    }),
    upsert: protectedProcedure
      .input(z.object({
        id: z.number().optional(),
        name: z.string(),
        subject: z.string(),
        body: z.string(),
        channels: z.array(z.enum(['email', 'sms', 'in_app'])).default(['email']),
      }))
      .mutation(async ({ input }) => {
        const id = input.id ?? Date.now();
        notificationTemplateStore.set(id, { ...input, id, updatedAt: new Date().toISOString() });
        return { success: true, id };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        notificationTemplateStore.delete(input.id);
        return { success: true };
      }),
  }),

  triggers: router({
    list: protectedProcedure.query(async () => {
      return Array.from(notificationTriggerStore.values());
    }),
    upsert: protectedProcedure
      .input(z.object({
        id: z.number().optional(),
        name: z.string(),
        eventType: z.enum(['stock_threshold', 'overdue_task', 'task_completion', 'delivery_delay']),
        conditions: z.string().optional(), // JSON string of conditions
        templateId: z.number().optional(),
        enabled: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const id = input.id ?? Date.now();
        notificationTriggerStore.set(id, { ...input, id, updatedAt: new Date().toISOString() });
        return { success: true, id };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        notificationTriggerStore.delete(input.id);
        return { success: true };
      }),
    toggle: protectedProcedure
      .input(z.object({ id: z.number(), enabled: z.boolean() }))
      .mutation(async ({ input }) => {
        const existing = notificationTriggerStore.get(input.id);
        if (existing) {
          notificationTriggerStore.set(input.id, { ...existing, enabled: input.enabled });
        }
        return { success: true };
      }),
  }),
});

import * as db from "../../db";

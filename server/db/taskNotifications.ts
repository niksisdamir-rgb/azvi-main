import { eq, desc, like, and, or, gte, lt, sql, ne } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./setup";

// ==================== TASK NOTIFICATIONS ====================

export async function createNotification(notification: schema.InsertTaskNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(schema.taskNotifications).values(notification).returning();
  return result;
}

export async function getNotifications(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(schema.taskNotifications)
    .where(eq(schema.taskNotifications.userId, userId))
    .orderBy(desc(schema.taskNotifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(schema.taskNotifications)
    .where(and(
      eq(schema.taskNotifications.userId, userId),
      ne(schema.taskNotifications.status, 'read')
    ))
    .orderBy(desc(schema.taskNotifications.createdAt));
}

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(schema.taskNotifications)
    .set({ status: 'read', readAt: new Date() })
    .where(eq(schema.taskNotifications.id, notificationId));
}

export async function updateNotificationStatus(notificationId: number, status: schema.TaskNotification["status"], sentAt?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(schema.taskNotifications)
    .set({ status, sentAt: sentAt || new Date() })
    .where(eq(schema.taskNotifications.id, notificationId));
}

export async function getPendingNotifications() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(schema.taskNotifications)
    .where(eq(schema.taskNotifications.status, 'pending'))
    .orderBy(schema.taskNotifications.scheduledFor);
}

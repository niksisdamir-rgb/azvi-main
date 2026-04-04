import { eq, desc, like, and, or, gte, lt, sql } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./setup";

// ==================== NOTIFICATION HISTORY ====================

export async function recordNotificationHistory(history: schema.InsertNotificationHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(schema.notificationHistory).values(history).returning();
}

export async function getNotificationHistory(notificationId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(schema.notificationHistory)
    .where(eq(schema.notificationHistory.notificationId, notificationId))
    .orderBy(desc(schema.notificationHistory.sentAt));
}

export async function getNotificationHistoryByUser(userId: number, days: number = 30) {
  const db = await getDb();
  if (!db) return [];

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return db.select().from(schema.notificationHistory)
    .where(and(
      eq(schema.notificationHistory.userId, userId),
      gte(schema.notificationHistory.sentAt, cutoffDate)
    ))
    .orderBy(desc(schema.notificationHistory.sentAt));
}

export async function getFailedNotifications(hours: number = 24) {
  const db = await getDb();
  if (!db) return [];

  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - hours);

  return db.select().from(schema.notificationHistory)
    .where(and(
      eq(schema.notificationHistory.status, 'failed'),
      gte(schema.notificationHistory.sentAt, cutoffDate)
    ))
    .orderBy(desc(schema.notificationHistory.sentAt));
}


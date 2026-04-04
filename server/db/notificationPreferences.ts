import { eq, desc, like, and, or, gte, lt, sql } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./setup";

// ==================== NOTIFICATION PREFERENCES ====================

export async function getOrCreateNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(schema.notificationPreferences)
    .where(eq(schema.notificationPreferences.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create default preferences
  const result = await db.insert(schema.notificationPreferences).values({
    userId,
    emailEnabled: true,
    smsEnabled: false,
    inAppEnabled: true,
    overdueReminders: true,
    completionNotifications: true,
    assignmentNotifications: true,
    statusChangeNotifications: true,
    timezone: 'UTC',
  }).returning();

  return result[0];
}

export async function updateNotificationPreferences(userId: number, preferences: Partial<schema.InsertNotificationPreference>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(schema.notificationPreferences)
    .set(preferences)
    .where(eq(schema.notificationPreferences.userId, userId));
}

export async function getNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(schema.notificationPreferences)
    .where(eq(schema.notificationPreferences.userId, userId))
    .limit(1);

  return result[0] || null;
}

import { eq, desc, like, and, or, gte, lt, sql } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./setup";

// ==================== NOTIFICATION TRIGGERS ====================
export async function getNotificationTriggers(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(schema.notificationTriggers).limit(limit).offset(offset).orderBy(desc(schema.notificationTriggers.createdAt));
}

export async function getNotificationTrigger(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(schema.notificationTriggers).where(eq(schema.notificationTriggers.id, id)).limit(1);
  return result[0];
}

export async function getTriggersByTemplate(templateId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(schema.notificationTriggers).where(eq(schema.notificationTriggers.templateId, templateId)).orderBy(desc(schema.notificationTriggers.createdAt));
}

export async function getTriggersByEventType(eventType: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(schema.notificationTriggers).where(eq(schema.notificationTriggers.eventType, eventType)).orderBy(desc(schema.notificationTriggers.createdAt));
}

export async function getActiveTriggers() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(schema.notificationTriggers).where(eq(schema.notificationTriggers.isActive, true)).orderBy(desc(schema.notificationTriggers.createdAt));
}

export async function createNotificationTrigger(data: {
  createdBy: number;
  templateId: number;
  name: string;
  description?: string;
  eventType: string;
  triggerCondition: any;
  actions: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(schema.notificationTriggers).values({
    createdBy: data.createdBy,
    templateId: data.templateId,
    name: data.name,
    description: data.description || null,
    eventType: data.eventType,
    triggerCondition: JSON.stringify(data.triggerCondition) as any,
    actions: JSON.stringify(data.actions) as any,
  } as any).returning();
}

export async function updateNotificationTrigger(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(schema.notificationTriggers).set(data).where(eq(schema.notificationTriggers.id, id));
}

export async function deleteNotificationTrigger(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(schema.notificationTriggers).where(eq(schema.notificationTriggers.id, id));
}

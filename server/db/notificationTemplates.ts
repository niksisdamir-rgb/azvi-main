import { eq, desc, like, and, or, gte, lt, sql } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./setup";

// ==================== NOTIFICATION TEMPLATES ====================
export async function getNotificationTemplates(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(schema.notificationTemplates).limit(limit).offset(offset).orderBy(desc(schema.notificationTemplates.createdAt));
}

export async function getNotificationTemplate(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(schema.notificationTemplates).where(eq(schema.notificationTemplates.id, id)).limit(1);
  return result[0];
}

export async function createNotificationTemplate(data: {
  createdBy: number;
  name: string;
  description?: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  channels: ("email" | "sms" | "in_app")[];
  variables?: string[];
  tags?: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(schema.notificationTemplates).values({
    createdBy: data.createdBy,
    name: data.name,
    description: data.description || null,
    subject: data.subject,
    bodyText: data.bodyText,
    bodyHtml: data.bodyHtml || null,
    channels: JSON.stringify(data.channels) as any,
    variables: data.variables ? JSON.stringify(data.variables) : null,
    tags: data.tags ? JSON.stringify(data.tags) : null,
  } as any).returning();
}

export async function updateNotificationTemplate(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(schema.notificationTemplates).set(data).where(eq(schema.notificationTemplates.id, id));
}

export async function deleteNotificationTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(schema.notificationTemplates).where(eq(schema.notificationTemplates.id, id));
}

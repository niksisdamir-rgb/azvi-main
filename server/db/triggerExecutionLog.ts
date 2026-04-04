import { eq, desc, like, and, or, gte, lt, sql } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./setup";

// ==================== TRIGGER EXECUTION LOG ====================
export async function recordTriggerExecution(data: {
  triggerId: number;
  entityType: string;
  entityId: number;
  conditionsMet: boolean;
  notificationsSent: number;
  error?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(schema.triggerExecutionLog).values(data).returning();
}

export async function getTriggerExecutionLog(triggerId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(schema.triggerExecutionLog).where(eq(schema.triggerExecutionLog.triggerId, triggerId)).limit(limit).orderBy(desc(schema.triggerExecutionLog.executedAt));
}


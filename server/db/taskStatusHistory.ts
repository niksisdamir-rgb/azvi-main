import { eq, desc, like, and, or, gte, lt, sql } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./setup";

// ==================== TASK STATUS HISTORY ====================

export async function recordTaskStatusChange(history: schema.InsertTaskStatusHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(schema.taskStatusHistory).values(history).returning();
}

export async function getTaskHistory(taskId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(schema.taskStatusHistory).where(eq(schema.taskStatusHistory.taskId, taskId)).orderBy(desc(schema.taskStatusHistory.createdAt));
}


import { eq, desc, like, and, or, gte, lt, sql } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./setup";

// ==================== TASK ASSIGNMENTS ====================

export async function assignTask(assignment: schema.InsertTaskAssignment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(schema.taskAssignments).values(assignment).returning();
}

export async function getTaskAssignments(taskId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(schema.taskAssignments).where(eq(schema.taskAssignments.taskId, taskId));
}

export async function updateTaskAssignment(assignmentId: number, updates: Partial<schema.InsertTaskAssignment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(schema.taskAssignments).set(updates).where(eq(schema.taskAssignments.id, assignmentId));
}

export async function getAssignmentsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(schema.taskAssignments).where(eq(schema.taskAssignments.assignedTo, userId)).orderBy(desc(schema.taskAssignments.assignedAt));
}

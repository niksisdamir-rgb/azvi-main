import { eq, desc, like, and, or, gte, lt, sql } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./setup";

// ==================== DAILY TASKS ====================
import { ne } from "drizzle-orm";

export async function createTask(task: schema.InsertDailyTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(schema.dailyTasks).values(task);
  return result;
}

export async function getTasks(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(schema.dailyTasks).where(eq(schema.dailyTasks.userId, userId)).orderBy(desc(schema.dailyTasks.dueDate));
}

export async function getTaskById(taskId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(schema.dailyTasks).where(eq(schema.dailyTasks.id, taskId)).limit(1);
  return result[0];
}

export async function updateTask(taskId: number, updates: Partial<schema.InsertDailyTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(schema.dailyTasks).set(updates).where(eq(schema.dailyTasks.id, taskId));
}

export async function deleteTask(taskId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(schema.dailyTasks).where(eq(schema.dailyTasks.id, taskId));
}

export async function getTasksByStatus(userId: number, status: schema.DailyTask["status"]) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(schema.dailyTasks)
    .where(and(eq(schema.dailyTasks.userId, userId), eq(schema.dailyTasks.status, status)))
    .orderBy(desc(schema.dailyTasks.dueDate));
}

export async function getTasksByPriority(userId: number, priority: schema.DailyTask["priority"]) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(schema.dailyTasks)
    .where(and(eq(schema.dailyTasks.userId, userId), eq(schema.dailyTasks.priority, priority)))
    .orderBy(desc(schema.dailyTasks.dueDate));
}

export async function getOverdueTasks(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(schema.dailyTasks)
    .where(and(
      eq(schema.dailyTasks.userId, userId),
      lt(schema.dailyTasks.dueDate, new Date()),
      ne(schema.dailyTasks.status, 'completed')
    ))
    .orderBy(schema.dailyTasks.dueDate);
}

export async function getTodaysTasks(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return db.select().from(schema.dailyTasks)
    .where(and(
      eq(schema.dailyTasks.userId, userId),
      gte(schema.dailyTasks.dueDate, today),
      lt(schema.dailyTasks.dueDate, tomorrow)
    ))
    .orderBy(schema.dailyTasks.dueDate);
}

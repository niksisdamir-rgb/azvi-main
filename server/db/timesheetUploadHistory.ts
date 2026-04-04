import { eq, desc, like, and, or, gte, lt, sql } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./setup";

// ============ Timesheet Upload History ============
export async function createUploadHistory(record: schema.InsertTimesheetUploadHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(schema.timesheetUploadHistory).values(record).returning();
  return result[0];
}

export async function getUploadHistory(limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(schema.timesheetUploadHistory)
    .orderBy(desc(schema.timesheetUploadHistory.createdAt))
    .limit(limit);
}

import { eq, desc, like, and, or, gte, lt, sql } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./setup";

// ============ Work Hours ============
export async function createWorkHour(workHour: schema.InsertWorkHour) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(schema.workHours).values(workHour).returning();
  return result;
}

export async function getWorkHours(filters?: { employeeId?: number; projectId?: number; status?: schema.WorkHour["status"] }) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.employeeId) {
    conditions.push(eq(schema.workHours.employeeId, filters.employeeId));
  }
  if (filters?.projectId) {
    conditions.push(eq(schema.workHours.projectId, filters.projectId));
  }
  if (filters?.status) {
    conditions.push(eq(schema.workHours.status, filters.status));
  }

  const result = conditions.length > 0
    ? await db.select().from(schema.workHours).where(and(...conditions)).orderBy(desc(schema.workHours.date))
    : await db.select().from(schema.workHours).orderBy(desc(schema.workHours.date));

  return result;
}

export async function updateWorkHour(id: number, data: Partial<schema.InsertWorkHour>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(schema.workHours).set(data).where(eq(schema.workHours.id, id));
}

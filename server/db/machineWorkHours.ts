import { eq, desc, like, and, or, gte, lt, sql } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./setup";

// ============ Machine Work Hours ============
export async function createMachineWorkHour(workHour: schema.InsertMachineWorkHour) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(schema.machineWorkHours).values(workHour).returning();
  return result;
}

export async function getMachineWorkHours(filters?: { machineId?: number; projectId?: number }) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.machineId) {
    conditions.push(eq(schema.machineWorkHours.machineId, filters.machineId));
  }
  if (filters?.projectId) {
    conditions.push(eq(schema.machineWorkHours.projectId, filters.projectId));
  }

  const result = conditions.length > 0
    ? await db.select().from(schema.machineWorkHours).where(and(...conditions)).orderBy(desc(schema.machineWorkHours.date))
    : await db.select().from(schema.machineWorkHours).orderBy(desc(schema.machineWorkHours.date));

  return result;
}

import { eq, desc, like, and, or, gte, lt, sql } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./setup";

// ============ Machine Maintenance ============
export async function createMachineMaintenance(maintenance: schema.InsertMachineMaintenance) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(schema.machineMaintenance).values(maintenance).returning();
  return result;
}

export async function getMachineMaintenance(filters?: { machineId?: number; maintenanceType?: string }) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.machineId) {
    conditions.push(eq(schema.machineMaintenance.machineId, filters.machineId));
  }
  if (filters?.maintenanceType) {
    conditions.push(eq(schema.machineMaintenance.maintenanceType, filters.maintenanceType as any));
  }

  const result = conditions.length > 0
    ? await db.select().from(schema.machineMaintenance).where(and(...conditions)).orderBy(desc(schema.machineMaintenance.date))
    : await db.select().from(schema.machineMaintenance).orderBy(desc(schema.machineMaintenance.date));

  return result;
}

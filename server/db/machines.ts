import { eq, desc, like, and, or, gte, lt, sql } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./setup";

// ============ Machines ============
export async function createMachine(machine: schema.InsertMachine) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(schema.machines).values(machine).returning();
  return result;
}

export async function getMachines(filters?: { concreteBaseId?: number; type?: schema.Machine["type"]; status?: schema.Machine["status"] }) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.concreteBaseId) {
    conditions.push(eq(schema.machines.concreteBaseId, filters.concreteBaseId));
  }
  if (filters?.type) {
    conditions.push(eq(schema.machines.type, filters.type));
  }
  if (filters?.status) {
    conditions.push(eq(schema.machines.status, filters.status));
  }

  const result = conditions.length > 0
    ? await db.select().from(schema.machines).where(and(...conditions)).orderBy(desc(schema.machines.createdAt))
    : await db.select().from(schema.machines).orderBy(desc(schema.machines.createdAt));

  return result;
}

export async function getMachineById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(schema.machines).where(eq(schema.machines.id, id)).limit(1);
  return result[0];
}

export async function updateMachine(id: number, data: Partial<schema.InsertMachine>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(schema.machines).set(data).where(eq(schema.machines.id, id));
}

export async function deleteMachine(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(schema.machines).where(eq(schema.machines.id, id));
}

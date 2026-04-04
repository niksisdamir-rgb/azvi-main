import { eq, desc, like, and, or, gte, lt, sql } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./setup";

// ==================== SUPPLIERS ====================

export async function createSupplier(supplier: schema.InsertSupplier) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(schema.suppliers).values(supplier).returning();
}

export async function getSuppliers() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(schema.suppliers).orderBy(schema.suppliers.name);
}

export async function getSupplierById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(schema.suppliers).where(eq(schema.suppliers.id, id)).limit(1);
  return result[0];
}

export async function updateSupplier(id: number, data: Partial<schema.InsertSupplier>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(schema.suppliers).set(data).where(eq(schema.suppliers.id, id));
}

export async function deleteSupplier(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(schema.suppliers).where(eq(schema.suppliers.id, id));
}

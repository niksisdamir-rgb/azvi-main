import { eq, desc, like, and, or, gte, lt, sql } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./setup";

// Materials
export async function createMaterial(material: schema.InsertMaterial) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(schema.materials).values(material).returning();
  return result;
}

export async function getMaterials() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(schema.materials).orderBy(schema.materials.name);
  return result;
}

export async function updateMaterial(id: number, data: Partial<schema.InsertMaterial>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(schema.materials).set(data).where(eq(schema.materials.id, id));
}

export async function deleteMaterial(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(schema.materials).where(eq(schema.materials.id, id));
}

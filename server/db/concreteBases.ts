import { eq, desc, like, and, or, gte, lt, sql } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./setup";

// ============ Concrete Bases ============
export async function createConcreteBase(base: schema.InsertConcreteBase) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(schema.concreteBases).values(base).returning();
  return result;
}

export async function getConcreteBases() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(schema.concreteBases).orderBy(desc(schema.concreteBases.createdAt));
}

export async function getConcreteBaseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(schema.concreteBases).where(eq(schema.concreteBases.id, id)).limit(1);
  return result[0];
}

export async function updateConcreteBase(id: number, data: Partial<schema.InsertConcreteBase>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(schema.concreteBases).set(data).where(eq(schema.concreteBases.id, id));
}

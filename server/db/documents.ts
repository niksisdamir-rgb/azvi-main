import { eq, desc, like, and, or, gte, lt, sql } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./setup";

// Documents
export async function createDocument(doc: schema.InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(schema.documents).values(doc).returning();
  return result;
}

export async function getDocuments(filters?: { projectId?: number; category?: schema.Document["category"]; search?: string }) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];

  if (filters?.projectId) {
    conditions.push(eq(schema.documents.projectId, filters.projectId));
  }

  if (filters?.category) {
    conditions.push(eq(schema.documents.category, filters.category));
  }

  if (filters?.search) {
    conditions.push(
      or(
        like(schema.documents.name, `%${filters.search}%`),
        like(schema.documents.description, `%${filters.search}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db
    .select()
    .from(schema.documents)
    .where(whereClause)
    .orderBy(desc(schema.documents.createdAt));

  return result;
}

export async function getDocumentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(schema.documents).where(eq(schema.documents.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(schema.documents).where(eq(schema.documents.id, id));
}

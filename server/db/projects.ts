import { eq, desc, like, and, or, gte, lt, sql } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./setup";

// Projects
export async function createProject(project: schema.InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(schema.projects).values(project).returning();
  return result;
}

export async function getProjects() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(schema.projects).orderBy(desc(schema.projects.createdAt));
  return result;
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(schema.projects).where(eq(schema.projects.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateProject(id: number, data: Partial<schema.InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(schema.projects).set(data).where(eq(schema.projects.id, id));
}

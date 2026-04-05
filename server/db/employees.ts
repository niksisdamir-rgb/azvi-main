import { eq, desc, like, and, or, gte, lt, sql } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./setup";

// ============ Employees ============
export async function createEmployee(employee: schema.InsertEmployee) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(schema.employees).values(employee).returning();
  return result;
}

export async function getEmployees(filters?: { department?: schema.Employee["department"]; status?: schema.Employee["status"] }) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.department) {
    conditions.push(eq(schema.employees.department, filters.department));
  }
  if (filters?.status) {
    conditions.push(eq(schema.employees.status, filters.status));
  }

  const result = conditions.length > 0
    ? await db.select().from(schema.employees).where(and(...conditions)).orderBy(desc(schema.employees.createdAt))
    : await db.select().from(schema.employees).orderBy(desc(schema.employees.createdAt));

  return result;
}

export async function getEmployeeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(schema.employees).where(eq(schema.employees.id, id)).limit(1);
  return result[0];
}

export async function updateEmployee(id: number, data: Partial<schema.InsertEmployee>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(schema.employees).set(data).where(eq(schema.employees.id, id));
}

export async function deleteEmployee(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(schema.employees).where(eq(schema.employees.id, id));
}

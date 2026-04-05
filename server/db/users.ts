import { eq, desc, like, and, or, gte, lt, sql } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./setup";
import { ENV } from '../lib/env';
import { dbLogger } from '../lib/logger';

export async function upsertUser(user: schema.InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    dbLogger.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: schema.InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(schema.users).values(values).onConflictDoUpdate({
      target: schema.users.openId,
      set: updateSet,
    });
  } catch (error) {
    dbLogger.error({ err: error }, "[Database] Failed to upsert user:");
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    dbLogger.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(schema.users).where(eq(schema.users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByUsername(username: string) {
  const useMocks = process.env.DMS_USE_MOCKS === "true";
  if (useMocks) {
    return {
      id: 1,
      username,
      name: username === "admin" ? "System Admin" : "Developer Admin",
      role: "admin" as const,
      createdAt: new Date(),
      passwordHash: null,
      openId: null,
      email: null,
      loginMethod: null,
      forcePasswordChange: false,
      phoneNumber: null,
      smsNotificationsEnabled: false,
      pushSubscription: null,
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } satisfies schema.User;
  }

  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}
export async function getUserById(id: number) {
  const useMocks = process.env.DMS_USE_MOCKS === "true";
  if (useMocks) {
    return {
      id,
      username: "developer",
      name: "Developer Admin",
      role: "admin" as const,
      createdAt: new Date(),
      passwordHash: null,
      openId: null,
      email: null,
      loginMethod: null,
      forcePasswordChange: false,
      phoneNumber: null,
      smsNotificationsEnabled: false,
      pushSubscription: null,
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } satisfies schema.User;
  }
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(user: schema.InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(schema.users).values(user).returning();
  return result;
}

export async function updateUser(userId: number, data: Partial<schema.InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(schema.users).set(data).where(eq(schema.users.id, userId));
}


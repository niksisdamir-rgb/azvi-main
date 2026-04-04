import { eq, desc, like, and, or, gte, lt, sql } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./setup";

// ============ AI Conversations ============
export async function createConversation(userId: number, title: string, modelName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(schema.aiConversations).values({
    userId,
    title,
    modelName,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return result;
}

export async function getConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(schema.aiConversations)
    .where(eq(schema.aiConversations.userId, userId))
    .orderBy(desc(schema.aiConversations.updatedAt));
}

export async function getConversation(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const results = await db.select().from(schema.aiConversations)
    .where(eq(schema.aiConversations.id, id));
  return results[0];
}

export async function updateConversationTitle(id: number, title: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(schema.aiConversations)
    .set({ title, updatedAt: new Date() })
    .where(eq(schema.aiConversations.id, id));
}

export async function addMessage(
  conversationId: number,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata?: any
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(schema.aiMessages).values({
    conversationId,
    role,
    content,
    metadata: metadata ? JSON.stringify(metadata) : null,
    createdAt: new Date(),
  });

  // Update conversation timestamp
  await db.update(schema.aiConversations)
    .set({ updatedAt: new Date() })
    .where(eq(schema.aiConversations.id, conversationId));

  return result;
}

// ============ Equipment Health Fusion ============
export async function getMachineHealthProfile(machineId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [machine] = await db.select().from(schema.machines).where(eq(schema.machines.id, machineId)).limit(1);
  if (!machine) return null;

  const maintenance = await db.select().from(schema.machineMaintenance)
    .where(eq(schema.machineMaintenance.machineId, machineId))
    .orderBy(desc(schema.machineMaintenance.date));

  const workHoursRecords = await db.select().from(schema.machineWorkHours)
    .where(eq(schema.machineWorkHours.machineId, machineId))
    .orderBy(desc(schema.machineWorkHours.date));

  const totalHours = workHoursRecords.reduce((sum, record) => sum + Number(record.hoursUsed), 0);
  const lastMaintenance = maintenance[0];

  // Calculate health score (0-100)
  let score = 100;

  // Penalty based on total hours vs service interval (default 500)
  const serviceInterval = 500;
  const hoursSinceLastService = lastMaintenance ? totalHours - (lastMaintenance.hoursAtService || 0) : totalHours;
  score -= Math.min(40, (hoursSinceLastService / serviceInterval) * 20);

  // Penalty based on status
  if (machine.status === 'maintenance') score -= 30;
  if (machine.status === 'repair') score -= 50;

  // Penalty for urgent maintenance
  const urgentMaintenance = maintenance.filter(m => m.maintenanceType === 'repair' || m.maintenanceType === 'breakdown').length;
  score -= Math.min(30, urgentMaintenance * 5);

  return {
    machineId: machine.id,
    name: machine.name,
    healthScore: Math.max(0, Math.round(score)),
    totalHours,
    hoursSinceLastService,
    status: machine.status,
    recentMaintenance: maintenance.slice(0, 5),
    workHoursHistory: workHoursRecords.slice(0, 10),
  };
}

export async function getMachineHealthTrend(machineId: number, months: number = 6) {
  const db = await getDb();
  if (!db) return [];

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);

  const stats = await db.select({
    month: sql<string>`DATE_FORMAT(${schema.machineWorkHours.date}, '%Y-%m')`,
    avgHours: sql<number>`AVG(${schema.machineWorkHours.hoursUsed})`,
    totalHours: sql<number>`SUM(${schema.machineWorkHours.hoursUsed})`,
  })
    .from(schema.machineWorkHours)
    .where(and(eq(schema.machineWorkHours.machineId, machineId), gte(schema.machineWorkHours.date, cutoff)))
    .groupBy(sql`month`)
    .orderBy(sql`month`);

  return stats;
}

export async function getMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(schema.aiMessages)
    .where(eq(schema.aiMessages.conversationId, conversationId))
    .orderBy(schema.aiMessages.createdAt);
}

export async function getAvailableModels() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(schema.aiModels)
    .where(eq(schema.aiModels.isAvailable, true))
    .orderBy(schema.aiModels.name);
}

export async function upsertModel(name: string, displayName: string, type: "text" | "vision" | "code", size?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(schema.aiModels)
    .where(eq(schema.aiModels.name, name));

  if (existing.length > 0) {
    await db.update(schema.aiModels)
      .set({ isAvailable: true, lastUsed: new Date() })
      .where(eq(schema.aiModels.name, name));
  } else {
    await db.insert(schema.aiModels).values({
      name,
      displayName,
      type,
      size: size || undefined,
      isAvailable: true,
      lastUsed: new Date(),
    });
  }
}

export async function createAiConversation(data: { userId: number; title?: string; modelName?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(schema.aiConversations).values({
    userId: data.userId,
    title: data.title || "New Conversation",
    modelName: data.modelName,
  }).returning();

  return result[0].id;
}

export async function getAiConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(schema.aiConversations)
    .where(eq(schema.aiConversations.userId, userId))
    .orderBy(schema.aiConversations.updatedAt);
}

export async function deleteAiConversation(conversationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete all messages first
  await db.delete(schema.aiMessages).where(eq(schema.aiMessages.conversationId, conversationId));

  // Delete conversation
  await db.delete(schema.aiConversations).where(eq(schema.aiConversations.id, conversationId));
}

export async function createAiMessage(data: {
  conversationId: number;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  model?: string;
  audioUrl?: string;
  imageUrl?: string;
  thinkingProcess?: string;
  toolCalls?: string;
  metadata?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(schema.aiMessages).values({
    conversationId: data.conversationId,
    role: data.role,
    content: data.content,
    model: data.model,
    audioUrl: data.audioUrl,
    imageUrl: data.imageUrl,
    thinkingProcess: data.thinkingProcess,
    toolCalls: data.toolCalls,
    metadata: data.metadata,
  }).returning();

  // Update conversation timestamp
  await db.update(schema.aiConversations)
    .set({ updatedAt: new Date() })
    .where(eq(schema.aiConversations.id, data.conversationId));

  return result[0].id;
}

export async function getAiMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(schema.aiMessages)
    .where(eq(schema.aiMessages.conversationId, conversationId))
    .orderBy(schema.aiMessages.createdAt);
}


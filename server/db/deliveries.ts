import { eq, desc, like, and, or, gte, lt, sql } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./setup";

// Deliveries
export async function createDelivery(delivery: schema.InsertDelivery) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(schema.deliveries).values(delivery).returning();
  return result;
}

export async function getDeliveries(filters?: { 
  projectId?: number; 
  status?: schema.Delivery["status"];
  statusGroup?: 'active' | 'completed';
  startDate?: Date; 
  endDate?: Date 
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];

  if (filters?.projectId) {
    conditions.push(eq(schema.deliveries.projectId, filters.projectId));
  }

  if (filters?.status) {
    conditions.push(eq(schema.deliveries.status, filters.status));
  }

  if (filters?.statusGroup === 'active') {
    conditions.push(or(
      eq(schema.deliveries.status, 'scheduled'),
      eq(schema.deliveries.status, 'loaded'),
      eq(schema.deliveries.status, 'en_route'),
      eq(schema.deliveries.status, 'arrived')
    ));
  } else if (filters?.statusGroup === 'completed') {
    conditions.push(or(
      eq(schema.deliveries.status, 'delivered'),
      eq(schema.deliveries.status, 'completed'),
      eq(schema.deliveries.status, 'returning')
    ));
  }

  if (filters?.startDate) {
    conditions.push(gte(schema.deliveries.actualDeliveryTime, Math.floor(filters.startDate.getTime() / 1000)));
  }

  if (filters?.endDate) {
    conditions.push(lt(schema.deliveries.actualDeliveryTime, Math.floor(filters.endDate.getTime() / 1000)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db
    .select()
    .from(schema.deliveries)
    .where(whereClause)
    .orderBy(desc(schema.deliveries.scheduledTime));

  return result;
}

export async function getDeliveryAnalytics() {
  const db = await getDb();
  if (!db) return null;

  const now = Math.floor(Date.now() / 1000);
  const fifteenMinutes = 15 * 60;

  // Total count
  const [totalRes] = await db.select({ count: sql<number>`count(*)` }).from(schema.deliveries);
  const totalCount = Number(totalRes?.count || 0);

  // Active count
  const [activeRes] = await db.select({ count: sql<number>`count(*)` })
    .from(schema.deliveries)
    .where(or(
      eq(schema.deliveries.status, 'scheduled'),
      eq(schema.deliveries.status, 'loaded'),
      eq(schema.deliveries.status, 'en_route'),
      eq(schema.deliveries.status, 'arrived')
    ));
  const activeCount = Number(activeRes?.count || 0);

  // Completed count
  const [completedRes] = await db.select({ count: sql<number>`count(*)` })
    .from(schema.deliveries)
    .where(or(
      eq(schema.deliveries.status, 'delivered'),
      eq(schema.deliveries.status, 'completed'),
      eq(schema.deliveries.status, 'returning')
    ));
  const completedCount = Number(completedRes?.count || 0);

  // Delayed count
  const [delayedRes] = await db.select({ count: sql<number>`count(*)` })
    .from(schema.deliveries)
    .where(and(
      sql`${schema.deliveries.estimatedArrival} IS NOT NULL`,
      or(
        and(
          or(
            eq(schema.deliveries.status, 'scheduled'),
            eq(schema.deliveries.status, 'loaded'),
            eq(schema.deliveries.status, 'en_route')
          ),
          sql`${now} > ${schema.deliveries.estimatedArrival} + ${fifteenMinutes}`
        ),
        and(
          sql`${schema.deliveries.actualArrivalTime} IS NOT NULL`,
          sql`${schema.deliveries.actualArrivalTime} > ${schema.deliveries.estimatedArrival} + ${fifteenMinutes}`
        )
      )
    ));
  const delayedCount = Number(delayedRes?.count || 0);

  // Average delivery time (in minutes)
  const [avgTimeRes] = await db.select({ 
    avgSeconds: sql<number>`avg(EXTRACT(EPOCH FROM ${schema.deliveries.actualDeliveryTime}) - EXTRACT(EPOCH FROM ${schema.deliveries.scheduledTime}))` 
  })
    .from(schema.deliveries)
    .where(and(
      or(
        eq(schema.deliveries.status, 'delivered'),
        eq(schema.deliveries.status, 'completed'),
        eq(schema.deliveries.status, 'returning')
      ),
      sql`${schema.deliveries.actualDeliveryTime} IS NOT NULL`,
      sql`${schema.deliveries.scheduledTime} IS NOT NULL`
    ));
  const averageDeliveryTimeMinutes = Math.round(Number(avgTimeRes?.avgSeconds || 0) / 60);

  // On-time percentage
  const [onTimeRes] = await db.select({ 
    total: sql<number>`count(*)`,
    onTime: sql<number>`sum(case when ${schema.deliveries.actualArrivalTime} <= ${schema.deliveries.estimatedArrival} + ${fifteenMinutes} then 1 else 0 end)`
  })
    .from(schema.deliveries)
    .where(and(
      or(
        eq(schema.deliveries.status, 'delivered'),
        eq(schema.deliveries.status, 'completed'),
        eq(schema.deliveries.status, 'returning')
      ),
      sql`${schema.deliveries.estimatedArrival} IS NOT NULL`,
      sql`${schema.deliveries.actualArrivalTime} IS NOT NULL`
    ));
  
  const onTimePercentage = onTimeRes?.total ? Math.round((Number(onTimeRes.onTime) / Number(onTimeRes.total)) * 100) : 100;

  return {
    activeCount,
    completedCount,
    delayedCount,
    onTimePercentage,
    averageDeliveryTimeMinutes,
    totalCount
  };
}

export async function getDeliveryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(schema.deliveries).where(eq(schema.deliveries.id, id)).limit(1);
  return result[0] ?? undefined;
}

export async function updateDelivery(id: number, data: Partial<schema.InsertDelivery>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(schema.deliveries).set(data).where(eq(schema.deliveries.id, id));

  // If status is being updated, log it to history
  if (data.status) {
    await logDeliveryStatus(id, data.status, data.gpsLocation ?? undefined, (data.notes || data.driverNotes) ?? undefined);
  }
}

export async function calculateETA(deliveryId: number, startLocation: string, endLocation: string) {
  // In a real application, we would use the Google Maps Distance Matrix API
  // For this prototype, we'll simulate it with a fixed duration based on a mock distance
  const durationMinutes = 45; // Simulated 45 mins
  const eta = Math.floor((Date.now() + durationMinutes * 60 * 1000) / 1000);

  await updateDelivery(deliveryId, { estimatedArrival: eta });
  return eta;
}

export async function logDeliveryStatus(deliveryId: number, status: string, gpsLocation?: string, notes?: string) {
  const db = await getDb();
  if (!db) return;

  await db.insert(schema.deliveryStatusHistory).values({
    deliveryId,
    status,
    gpsLocation,
    notes,
    timestamp: new Date(),
  });
}

export async function getDeliveryStatusHistory(deliveryId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(schema.deliveryStatusHistory)
    .where(eq(schema.deliveryStatusHistory.deliveryId, deliveryId))
    .orderBy(desc(schema.deliveryStatusHistory.timestamp));
}

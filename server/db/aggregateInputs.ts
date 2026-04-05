import { logger } from '../lib/logger';
import { eq, desc, like, and, or, gte, lt, sql, inArray } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./setup";
import { updateMaterial } from "./materials";

// ============ Aggregate Inputs ============
export async function createAggregateInput(input: schema.InsertAggregateInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(schema.aggregateInputs).values(input).returning();
  return result;
}

export async function getAggregateInputs(filters?: { concreteBaseId?: number; materialType?: schema.AggregateInput["materialType"] }) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.concreteBaseId) {
    conditions.push(eq(schema.aggregateInputs.concreteBaseId, filters.concreteBaseId));
  }
  if (filters?.materialType) {
    conditions.push(eq(schema.aggregateInputs.materialType, filters.materialType));
  }

  const result = conditions.length > 0
    ? await db.select().from(schema.aggregateInputs).where(and(...conditions)).orderBy(desc(schema.aggregateInputs.date))
    : await db.select().from(schema.aggregateInputs).orderBy(desc(schema.aggregateInputs.date));

  return result;
}

export async function getWeeklyTimesheetSummary(employeeId: number | undefined, weekStart: Date) {
  const db = await getDb();
  if (!db) return [];

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  let query = db
    .select({
      employeeId: schema.workHours.employeeId,
      employeeName: sql<string>`CONCAT(${schema.employees.firstName}, ' ', ${schema.employees.lastName})`,
      employeeNumber: schema.employees.employeeNumber,
      totalHours: sql<number>`SUM(${schema.workHours.hoursWorked})`,
      regularHours: sql<number>`SUM(CASE WHEN ${schema.workHours.workType} = 'regular' THEN ${schema.workHours.hoursWorked} ELSE 0 END)`,
      overtimeHours: sql<number>`SUM(${schema.workHours.overtimeHours})`,
      weekendHours: sql<number>`SUM(CASE WHEN ${schema.workHours.workType} = 'weekend' THEN ${schema.workHours.hoursWorked} ELSE 0 END)`,
      holidayHours: sql<number>`SUM(CASE WHEN ${schema.workHours.workType} = 'holiday' THEN ${schema.workHours.hoursWorked} ELSE 0 END)`,
      daysWorked: sql<number>`COUNT(DISTINCT DATE(${schema.workHours.date}))`,
    })
    .from(schema.workHours)
    .innerJoin(schema.employees, eq(schema.workHours.employeeId, schema.employees.id))
    .where(
      and(
        gte(schema.workHours.date, weekStart),
        lt(schema.workHours.date, weekEnd),
        eq(schema.workHours.status, "approved"),
        employeeId ? eq(schema.workHours.employeeId, employeeId) : undefined
      )
    )
    .groupBy(schema.workHours.employeeId, schema.employees.firstName, schema.employees.lastName, schema.employees.employeeNumber);

  return await query;
}

export async function getMonthlyTimesheetSummary(employeeId: number | undefined, year: number, month: number) {
  const db = await getDb();
  if (!db) return [];

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);

  let query = db
    .select({
      employeeId: schema.workHours.employeeId,
      employeeName: sql<string>`CONCAT(${schema.employees.firstName}, ' ', ${schema.employees.lastName})`,
      employeeNumber: schema.employees.employeeNumber,
      department: schema.employees.department,
      hourlyRate: schema.employees.hourlyRate,
      totalHours: sql<number>`SUM(${schema.workHours.hoursWorked})`,
      regularHours: sql<number>`SUM(CASE WHEN ${schema.workHours.workType} = 'regular' THEN ${schema.workHours.hoursWorked} ELSE 0 END)`,
      overtimeHours: sql<number>`SUM(${schema.workHours.overtimeHours})`,
      weekendHours: sql<number>`SUM(CASE WHEN ${schema.workHours.workType} = 'weekend' THEN ${schema.workHours.hoursWorked} ELSE 0 END)`,
      holidayHours: sql<number>`SUM(CASE WHEN ${schema.workHours.workType} = 'holiday' THEN ${schema.workHours.hoursWorked} ELSE 0 END)`,
      daysWorked: sql<number>`COUNT(DISTINCT DATE(${schema.workHours.date}))`,
    })
    .from(schema.workHours)
    .innerJoin(schema.employees, eq(schema.workHours.employeeId, schema.employees.id))
    .where(
      and(
        gte(schema.workHours.date, monthStart),
        lt(schema.workHours.date, monthEnd),
        eq(schema.workHours.status, "approved"),
        employeeId ? eq(schema.workHours.employeeId, employeeId) : undefined
      )
    )
    .groupBy(schema.workHours.employeeId, schema.employees.firstName, schema.employees.lastName, schema.employees.employeeNumber, schema.employees.department, schema.employees.hourlyRate);

  return await query;
}

export async function getLowStockMaterials() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(schema.materials)
    .where(sql`${schema.materials.quantity} <= ${schema.materials.minStock}`);
}


export async function getCriticalStockMaterials() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(schema.materials)
    .where(sql`${schema.materials.quantity} <= ${schema.materials.criticalThreshold} AND ${schema.materials.criticalThreshold} > 0`);
}

export async function getAdminUsersWithSMS() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(schema.users)
    .where(and(
      eq(schema.users.role, 'admin'),
      eq(schema.users.smsNotificationsEnabled, true),
      sql`${schema.users.phoneNumber} IS NOT NULL`
    ));
}

export async function updateUserSMSSettings(userId: number, phoneNumber: string, enabled: boolean) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .update(schema.users)
      .set({
        phoneNumber,
        smsNotificationsEnabled: enabled,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, userId));
    return true;
  } catch (error) {
    logger.error({ err: error }, "Failed to update SMS settings:");
    return false;
  }
}


// Material Consumption Tracking
export async function recordConsumption(consumption: schema.InsertMaterialConsumptionHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(schema.materialConsumptionHistory).values(consumption);

  // Update material quantity efficiently using direct SQL
  if (consumption.materialId) {
    await db.update(schema.materials)
      .set({
        quantity: sql`GREATEST(0, ${schema.materials.quantity} - ${consumption.quantityUsed})`
      })
      .where(eq(schema.materials.id, consumption.materialId));
  }
}

export async function getConsumptionHistory(materialId?: number, days: number = 30, exactStartDate?: Date, exactEndDate?: Date) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(schema.materialConsumptionHistory);
  let conditions: any[] = [];

  if (materialId) {
    conditions.push(eq(schema.materialConsumptionHistory.materialId, materialId));
  }

  if (exactStartDate) {
    conditions.push(gte(schema.materialConsumptionHistory.date, exactStartDate));
  } else {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    conditions.push(gte(schema.materialConsumptionHistory.date, cutoffDate));
  }

  if (exactEndDate) {
    conditions.push(lt(schema.materialConsumptionHistory.date, exactEndDate));
  }

  if (conditions.length > 0) {
    const result = await query.where(and(...conditions)).orderBy(desc(schema.materialConsumptionHistory.date));
    return result;
  }

  const result = await query.orderBy(desc(schema.materialConsumptionHistory.date));
  return result;
}

export async function calculateDailyConsumptionRate(materialId: number, days: number = 30) {
  const db = await getDb();
  if (!db) return 0;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const [res] = await db
    .select({
      total: sql<number>`SUM(${schema.materialConsumptionHistory.quantityUsed})`,
      uniqueDays: sql<number>`COUNT(DISTINCT DATE(${schema.materialConsumptionHistory.date}))`,
    })
    .from(schema.materialConsumptionHistory)
    .where(and(
      eq(schema.materialConsumptionHistory.materialId, materialId),
      gte(schema.materialConsumptionHistory.date, cutoffDate)
    ));

  if (!res || !res.total || !res.uniqueDays) return 0;

  const rawAvg = res.total / res.uniqueDays;

  // Recent vs Older for trend
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const [trendRes] = await db
    .select({
      recent: sql<number>`SUM(CASE WHEN ${schema.materialConsumptionHistory.date} >= ${twoWeeksAgo} THEN ${schema.materialConsumptionHistory.quantityUsed} ELSE 0 END)`,
      older: sql<number>`SUM(CASE WHEN ${schema.materialConsumptionHistory.date} >= ${fourWeeksAgo} AND ${schema.materialConsumptionHistory.date} < ${twoWeeksAgo} THEN ${schema.materialConsumptionHistory.quantityUsed} ELSE 0 END)`,
    })
    .from(schema.materialConsumptionHistory)
    .where(eq(schema.materialConsumptionHistory.materialId, materialId));

  const recentTotal = trendRes?.recent || 0;
  const olderTotal = trendRes?.older || 0;

  const trendFactor = olderTotal > 0 ? (recentTotal / olderTotal) : 1;
  const adjustedRate = rawAvg * Math.min(2, Math.max(0.5, trendFactor));

  return adjustedRate;
}

export async function calculateEOQ(annualDemand: number, orderCost: number, holdingCost: number) {
  if (holdingCost <= 0) return 0;
  return Math.sqrt((2 * annualDemand * orderCost) / holdingCost);
}

// Forecasting & Predictions
export async function generateForecastPredictions() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  const cutoff30d = new Date();
  cutoff30d.setDate(cutoff30d.getDate() - 30);
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  // Batch fetch all material stats in a single query to avoid N+1
  const stats = await db
    .select({
      id: schema.materials.id,
      name: schema.materials.name,
      quantity: schema.materials.quantity,
      leadTimeDays: schema.materials.leadTimeDays,
      reorderPoint: schema.materials.reorderPoint,
      totalConsumed: sql<number>`SUM(CASE WHEN ${schema.materialConsumptionHistory.date} >= ${cutoff30d} THEN ${schema.materialConsumptionHistory.quantityUsed} ELSE 0 END)`,
      uniqueDays: sql<number>`COUNT(DISTINCT CASE WHEN ${schema.materialConsumptionHistory.date} >= ${cutoff30d} THEN DATE(${schema.materialConsumptionHistory.date}) END)`,
      recentTotal: sql<number>`SUM(CASE WHEN ${schema.materialConsumptionHistory.date} >= ${twoWeeksAgo} THEN ${schema.materialConsumptionHistory.quantityUsed} ELSE 0 END)`,
      olderTotal: sql<number>`SUM(CASE WHEN ${schema.materialConsumptionHistory.date} >= ${fourWeeksAgo} AND ${schema.materialConsumptionHistory.date} < ${twoWeeksAgo} THEN ${schema.materialConsumptionHistory.quantityUsed} ELSE 0 END)`,
      dataPoints: sql<number>`COUNT(${schema.materialConsumptionHistory.id})`,
    })
    .from(schema.materials)
    .leftJoin(schema.materialConsumptionHistory, eq(schema.materials.id, schema.materialConsumptionHistory.materialId))
    .groupBy(schema.materials.id);

  const predictions: schema.InsertForecastPrediction[] = [];

  for (const s of stats) {
    if (!s.totalConsumed || !s.uniqueDays) continue;

    const rawAvg = s.totalConsumed / s.uniqueDays;
    const trendFactor = s.olderTotal > 0 ? (s.recentTotal / s.olderTotal) : 1;
    const dailyRate = rawAvg * Math.min(2, Math.max(0.5, trendFactor));

    if (dailyRate > 0) {
      const daysUntilStockout = Math.floor(s.quantity / dailyRate);
      const predictedRunoutDate = new Date();
      predictedRunoutDate.setDate(predictedRunoutDate.getDate() + daysUntilStockout);

      const leadTime = s.leadTimeDays || 7;
      const safetyStock = dailyRate * leadTime * 0.5;
      const reorderPoint = (dailyRate * leadTime) + safetyStock;

      const annualDemand = dailyRate * 365;
      const eoq = await calculateEOQ(annualDemand, 50, 2);
      const recommendedOrderQty = Math.max(Math.ceil(eoq), Math.ceil(dailyRate * 14 * 1.2));

      // Update material with auto-calculated reorder point if significantly different
      if (!s.reorderPoint || Math.abs(s.reorderPoint - reorderPoint) > reorderPoint * 0.2) {
        await updateMaterial(s.id, { reorderPoint: Math.round(reorderPoint) });
      }

      const confidence = Math.min(95, (s.dataPoints || 0) * 3);

      predictions.push({
        materialId: s.id,
        materialName: s.name,
        currentStock: s.quantity,
        dailyConsumptionRate: Math.round(dailyRate),
        predictedRunoutDate,
        daysUntilStockout,
        recommendedOrderQty,
        confidence,
        calculatedAt: new Date(),
      });
    }
  }

  // Clear old predictions and insert new ones
  await db.delete(schema.forecastPredictions);
  if (predictions.length > 0) {
    await db.insert(schema.forecastPredictions).values(predictions);
  }

  return predictions;
}

export async function getForecastPredictions() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(schema.forecastPredictions).orderBy(schema.forecastPredictions.daysUntilStockout);
}

// Purchase Orders
export async function createPurchaseOrder(order: schema.InsertPurchaseOrder, items: { materialId: number; quantity: number; unitPrice?: number }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.transaction(async (tx) => {
    const result = await tx.insert(schema.purchaseOrders).values(order).returning();
    const po = result[0];
    
    if (po && items.length > 0) {
      const dbItems = items.map(item => ({
        purchaseOrderId: po.id,
        materialId: item.materialId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }));
      await tx.insert(schema.purchaseOrderItems).values(dbItems);
    }
    
    return po;
  });
}

export async function getPurchaseOrders(filters?: { status?: schema.PurchaseOrder["status"]; supplierId?: number }) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];

  if (filters?.status) {
    conditions.push(eq(schema.purchaseOrders.status, filters.status));
  }

  if (filters?.supplierId) {
    conditions.push(eq(schema.purchaseOrders.supplierId, filters.supplierId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const orders = await db
    .select()
    .from(schema.purchaseOrders)
    .where(whereClause)
    .orderBy(desc(schema.purchaseOrders.createdAt));
    
  // Fetch items for these orders
  if (orders.length > 0) {
    const orderIds = orders.map(o => o.id);
    const items = await db
      .select()
      .from(schema.purchaseOrderItems)
      .where(inArray(schema.purchaseOrderItems.purchaseOrderId, orderIds));
      
    return orders.map(order => ({
      ...order,
      items: items.filter(i => i.purchaseOrderId === order.id)
    }));
  }
  
  return [];
}

export async function getPurchaseOrderItems(purchaseOrderId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(schema.purchaseOrderItems)
    .where(eq(schema.purchaseOrderItems.purchaseOrderId, purchaseOrderId));
}

export async function updatePurchaseOrder(id: number, data: Partial<schema.InsertPurchaseOrder>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(schema.purchaseOrders).set(data).where(eq(schema.purchaseOrders.id, id));
}


// Report Settings
export async function getReportSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const results = await db.select().from(schema.reportSettings).where(eq(schema.reportSettings.userId, userId)).limit(1);
  return results[0] || null;
}

export async function upsertReportSettings(data: {
  userId: number;
  includeProduction?: boolean;
  includeDeliveries?: boolean;
  includeMaterials?: boolean;
  includeQualityControl?: boolean;
  reportTime?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getReportSettings(data.userId);

  if (existing) {
    const result = await db.update(schema.reportSettings)
      .set({
        includeProduction: data.includeProduction ?? existing.includeProduction,
        includeDeliveries: data.includeDeliveries ?? existing.includeDeliveries,
        includeMaterials: data.includeMaterials ?? existing.includeMaterials,
        includeQualityControl: data.includeQualityControl ?? existing.includeQualityControl,
        reportTime: data.reportTime ?? existing.reportTime,
        updatedAt: new Date(),
      })
      .where(eq(schema.reportSettings.id, existing.id))
      .returning();
    return result[0]?.id || existing.id;
  } else {
    const result = await db.insert(schema.reportSettings).values({
      userId: data.userId,
      includeProduction: data.includeProduction ?? true,
      includeDeliveries: data.includeDeliveries ?? true,
      includeMaterials: data.includeMaterials ?? true,
      includeQualityControl: data.includeQualityControl ?? true,
      reportTime: data.reportTime ?? '18:00',
    }).returning();
    return result[0]?.id || 0;
  }
}

// Report Recipients
export async function getReportRecipients() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(schema.reportRecipients).where(eq(schema.reportRecipients.active, true));
}

export async function getAllReportRecipients() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(schema.reportRecipients).orderBy(desc(schema.reportRecipients.createdAt));
}

export async function addReportRecipient(email: string, name?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(schema.reportRecipients).values({
    email,
    name: name || null,
    active: true,
  }).returning();
  return result[0]?.id || 0;
}

export async function removeReportRecipient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(schema.reportRecipients)
    .set({ active: false })
    .where(eq(schema.reportRecipients.id, id));
}


// Email Templates
export async function getEmailTemplates() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(schema.emailTemplates).where(eq(schema.emailTemplates.isActive, true));
}

export async function getEmailTemplateByType(type: string) {
  const db = await getDb();
  if (!db) return null;

  const results = await db.select().from(schema.emailTemplates).where(eq(schema.emailTemplates.type, type)).limit(1);
  return results[0] || null;
}

export async function upsertEmailTemplate(data: {
  name: string;
  type: string;
  subject: string;
  htmlTemplate: string;
  variables?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getEmailTemplateByType(data.type);

  if (existing) {
    await db.update(schema.emailTemplates)
      .set({
        name: data.name,
        subject: data.subject,
        htmlTemplate: data.htmlTemplate,
        variables: data.variables,
        updatedAt: new Date(),
      })
      .where(eq(schema.emailTemplates.id, existing.id));
    return existing.id;
  } else {
    await db.insert(schema.emailTemplates).values({
      name: data.name,
      type: data.type,
      subject: data.subject,
      htmlTemplate: data.htmlTemplate,
      variables: data.variables,
      isActive: true,
    });
    return 0;
  }
}

// Email Branding
export async function getEmailBranding() {
  const db = await getDb();
  if (!db) return null;

  const results = await db.select().from(schema.emailBranding).limit(1);
  return results[0] || null;
}

export async function upsertEmailBranding(data: {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  companyName?: string;
  footerText?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getEmailBranding();

  if (existing) {
    await db.update(schema.emailBranding)
      .set({
        logoUrl: data.logoUrl ?? existing.logoUrl,
        primaryColor: data.primaryColor ?? existing.primaryColor,
        secondaryColor: data.secondaryColor ?? existing.secondaryColor,
        companyName: data.companyName ?? existing.companyName,
        footerText: data.footerText ?? existing.footerText,
        updatedAt: new Date(),
      })
      .where(eq(schema.emailBranding.id, existing.id));
    return existing.id;
  } else {
    await db.insert(schema.emailBranding).values({
      logoUrl: data.logoUrl || null,
      primaryColor: data.primaryColor || "#f97316",
      secondaryColor: data.secondaryColor || "#ea580c",
      companyName: data.companyName || "AzVirt",
      footerText: data.footerText || null,
    });
    return 0;
  }
}


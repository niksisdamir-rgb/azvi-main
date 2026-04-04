import { z } from "zod";
import { protectedProcedure, router } from "../../lib/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { materials, materialConsumptionHistory, purchaseOrders, purchaseOrderItems } from "../../../drizzle/schema";
import { eq, and, gte, lte, inArray, desc } from "drizzle-orm";

// Helper function to calculate daily consumption rate over a period
async function calculateRate(materialId: number, days: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const consumptions = await db
    .select()
    .from(materialConsumptionHistory)
    .where(
      and(
        eq(materialConsumptionHistory.materialId, materialId),
        gte(materialConsumptionHistory.date, cutoffDate)
      )
    );

  if (consumptions.length === 0) return 0;

  const totalConsumed = consumptions.reduce((sum, c) => sum + c.quantityUsed, 0);
  return totalConsumed / days;
}

/**
 * Simple linear regression helper
 * y = mx + b
 */
function calculateLinearRegression(data: { x: number, y: number }[]) {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (const p of data) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

export const forecastingRouter = router({
  calculateConsumptionRate: protectedProcedure
    .input(z.object({
      materialId: z.number(),
    }))
    .query(async ({ input }) => {
      const [rate30, rate60, rate90] = await Promise.all([
        calculateRate(input.materialId, 30),
        calculateRate(input.materialId, 60),
        calculateRate(input.materialId, 90),
      ]);
      return { 
        materialId: input.materialId, 
        rate30, 
        rate60, 
        rate90,
        averageRate: (rate30 + rate60 + rate90) / 3
      };
    }),

  predictStockoutDate: protectedProcedure
    .input(z.object({
      materialId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const materialRecords = await db.select().from(materials).where(eq(materials.id, input.materialId)).limit(1);
      if (materialRecords.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Material not found" });
      }
      const material = materialRecords[0];

      // Fetch last 30 days of consumption for linear regression
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);

      const consumptions = await db
        .select()
        .from(materialConsumptionHistory)
        .where(
          and(
            eq(materialConsumptionHistory.materialId, input.materialId),
            gte(materialConsumptionHistory.date, cutoffDate)
          )
        )
        .orderBy(desc(materialConsumptionHistory.date));

      if (consumptions.length < 3) {
        // Fallback to simple rate if not enough data
        const rate = await calculateRate(input.materialId, 30);
        if (rate <= 0 || material.quantity <= 0) {
          return { materialId: input.materialId, stockoutDate: null, daysUntilStockout: null, method: "fallback" };
        }
        const days = Math.floor(material.quantity / rate);
        const date = new Date();
        date.setDate(date.getDate() + days);
        return { materialId: input.materialId, stockoutDate: date, daysUntilStockout: days, method: "simple_rate" };
      }

      // Prepare data for linear regression of stock levels
      // We start from current stock and go backwards
      let currentStock = material.quantity;
      const data = [{ x: 0, y: currentStock }];
      
      // Group consumptions by day
      const dailyConsumptions: Record<string, number> = {};
      for (const c of consumptions) {
        const dateKey = c.date.toISOString().split('T')[0];
        dailyConsumptions[dateKey] = (dailyConsumptions[dateKey] || 0) + c.quantityUsed;
      }

      const sortedDates = Object.keys(dailyConsumptions).sort().reverse();
      let cumulativeX = 0;
      for (const dateKey of sortedDates) {
        cumulativeX -= 1; // days ago
        currentStock += dailyConsumptions[dateKey];
        data.push({ x: cumulativeX, y: currentStock });
      }

      const { slope, intercept } = calculateLinearRegression(data);
      
      // We want to find x where y = 0
      // 0 = slope * x + intercept  =>  x = -intercept / slope
      // Note: slope should be positive because we went backwards (stock increases as we go back in time)
      // Actually, if we use x as "days from now", slope will be negative (consumption)
      // and intercept will be current stock (x=0).
      
      // Let's re-calculate regression with x as days from now
      // x=0 is today, x=-1 is yesterday...
      // but we want to predict x > 0.
      
      if (slope >= 0) { // Should be positive because we are going backwards in time
         // If slope is positive, it means stock was lower in the past, so it's increasing? 
         // That's wrong for consumption. 
         // If stock was HIGHER in the past, slope is negative.
      }

      // Let's simplify: slope = consumption rate (negative)
      // intercept = current stock
      // 0 = slope * x + currentStock => x = -currentStock / slope
      
      const rate = -slope; // rate of consumption
      if (rate <= 0) {
        return { materialId: input.materialId, stockoutDate: null, daysUntilStockout: null, method: "linear_regression_no_consumption" };
      }

      const daysUntilStockout = Math.floor(material.quantity / rate);
      const stockoutDate = new Date();
      stockoutDate.setDate(stockoutDate.getDate() + daysUntilStockout);

      return {
        materialId: input.materialId,
        daysUntilStockout,
        stockoutDate,
        method: "linear_regression",
        confidence: 80, // placeholder
      };
    }),

  calculateOptimalReorderPoint: protectedProcedure
    .input(z.object({
      materialId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const materialRecords = await db.select().from(materials).where(eq(materials.id, input.materialId)).limit(1);
      if (materialRecords.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Material not found" });
      }
      const material = materialRecords[0];

      const dailyRate = await calculateRate(input.materialId, 30);
      const leadTime = material.leadTimeDays || 7;
      
      // Safety stock = (Max Daily Consumption * Max Lead Time) - (Avg Daily Consumption * Avg Lead Time)
      // Simple version: 50% of Lead Time Demand
      const safetyStock = dailyRate * leadTime * 0.5;
      
      const optimalReorderPoint = Math.round((dailyRate * leadTime) + safetyStock);

      return {
        materialId: input.materialId,
        optimalReorderPoint,
        leadTimeDays: leadTime,
        safetyStock: Math.round(safetyStock),
      };
    }),

  calculateOptimalOrderQuantity: protectedProcedure
    .input(z.object({
      materialId: z.number(),
      orderCost: z.number().default(50), // S
      holdingCost: z.number().default(2), // H
    }))
    .query(async ({ input }) => {
      const dailyRate = await calculateRate(input.materialId, 30);
      const annualDemand = dailyRate * 365; // D
      
      // EOQ = sqrt( (2 * D * S) / H )
      let eoq = 0;
      if (annualDemand > 0 && input.holdingCost > 0) {
        eoq = Math.sqrt((2 * annualDemand * input.orderCost) / input.holdingCost);
      }

      return {
        materialId: input.materialId,
        optimalOrderQuantity: Math.ceil(eoq),
        annualDemand: Math.round(annualDemand),
      };
    }),

  getMaterialForecast: protectedProcedure
    .input(z.object({
      materialId: z.number(),
      daysToProject: z.number().default(30),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const materialRecords = await db.select().from(materials).where(eq(materials.id, input.materialId)).limit(1);
      if (materialRecords.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Material not found" });
      }
      const material = materialRecords[0];

      const dailyRate = await calculateRate(input.materialId, 30);
      let projectedStock = material.quantity;
      const projection = [];
      
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + input.daysToProject);

      // Get incoming deliveries
      const incomingOrders = await db
        .select({
           expectedDelivery: purchaseOrders.expectedDelivery,
           quantity: purchaseOrderItems.quantity
        })
        .from(purchaseOrders)
        .innerJoin(purchaseOrderItems, eq(purchaseOrders.id, purchaseOrderItems.purchaseOrderId))
        .where(
          and(
            eq(purchaseOrderItems.materialId, input.materialId),
            inArray(purchaseOrders.status, ["approved", "ordered"]),
            gte(purchaseOrders.expectedDelivery, now),
            lte(purchaseOrders.expectedDelivery, futureDate)
          )
        );

      for (let i = 1; i <= input.daysToProject; i++) {
        projectedStock -= dailyRate;
        const date = new Date();
        date.setDate(date.getDate() + i);
        
        const currentDayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        const incomingStockForDay = incomingOrders.reduce((sum, order) => {
          if (order.expectedDelivery) {
            const deliveryDayStart = new Date(order.expectedDelivery.getFullYear(), order.expectedDelivery.getMonth(), order.expectedDelivery.getDate()).getTime();
            if (currentDayStart === deliveryDayStart) {
              return sum + order.quantity;
            }
          }
          return sum;
        }, 0);

        projectedStock += incomingStockForDay;

        projection.push({
          date,
          expectedStock: Math.max(0, Math.round(projectedStock)),
          incomingDelivery: incomingStockForDay > 0 ? incomingStockForDay : null
        });
      }

      return {
        materialId: input.materialId,
        dailyRate,
        projection,
      };
    }),

  identifyReorderNeeds: protectedProcedure
    .input(z.object({}).optional())
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      const allMaterials = await db.select().from(materials);
      const needsReorder = [];
      
      for (const m of allMaterials) {
         let rPoint = m.reorderPoint;
         if (rPoint === null || rPoint === undefined) {
           const dailyRate = await calculateRate(m.id, 30);
           const leadTime = m.leadTimeDays || 7;
           const safetyStock = dailyRate * leadTime * 0.5;
           rPoint = Math.round((dailyRate * leadTime) + safetyStock);
         }
         
         if (m.quantity <= rPoint) {
           needsReorder.push({
             ...m,
             calculatedReorderPoint: rPoint
           });
         }
      }

      return {
        needsReorder,
        count: needsReorder.length,
      };
    }),
});

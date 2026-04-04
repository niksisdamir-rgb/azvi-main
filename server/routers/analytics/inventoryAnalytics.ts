import { z } from "zod";
import { protectedProcedure, router } from "../../lib/trpc";
import { cache } from "../../lib/redis";
import { TRPCError } from "@trpc/server";
import { CACHE_KEYS } from "../../lib/cacheKeys";
import { enqueueAndAwait } from "../../lib/queue";
import { getDb } from "../../db";
import { materials, materialConsumptionHistory, purchaseOrders } from "../../../drizzle/schema";
import { gte } from "drizzle-orm";

/**
 * Inline fallback computation — used when BullMQ job times out or fails.
 * Keeps the endpoint resilient even if Redis/worker is down.
 */
async function computeCostAnalysisInline() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

  const allMaterials = await db.select().from(materials);
  let totalInventoryValue = 0;
  const holdingCostRate = 0.20;
  let totalHoldingCost = 0;

  const materialsCost = allMaterials.map(m => {
    const price = m.unitPrice || 0;
    const value = m.quantity * price;
    const holdingCost = value * holdingCostRate;
    totalInventoryValue += value;
    totalHoldingCost += holdingCost;
    return { id: m.id, name: m.name, category: m.category, quantity: m.quantity, value, holdingCost };
  }).sort((a, b) => b.value - a.value);

  const allOrders = await db.select().from(purchaseOrders);
  const costPerOrder = 150;
  const totalOrderCost = allOrders.length * costPerOrder;
  let totalSpend = 0;
  allOrders.filter(o => o.status === "received").forEach(po => { if (po.totalCost) totalSpend += po.totalCost; });

  return { totalInventoryValue, totalHoldingCost, totalOrderCost, totalSpend, materialsCost: materialsCost.slice(0, 10) };
}

async function computeTurnoverRateInline() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

  const days = 30;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const consumptions = await db.select().from(materialConsumptionHistory).where(gte(materialConsumptionHistory.date, cutoffDate));
  const allMaterials = await db.select().from(materials);
  const priceMap = new Map<number, number>();
  allMaterials.forEach(m => priceMap.set(m.id, m.unitPrice || 0));

  let cogs = 0;
  consumptions.forEach(c => { cogs += c.quantityUsed * (priceMap.get(c.materialId) || 0); });

  let currentInventoryValue = 0;
  allMaterials.forEach(m => { currentInventoryValue += m.quantity * (m.unitPrice || 0); });

  const turnoverRate = currentInventoryValue > 0 ? cogs / currentInventoryValue : 0;
  const annualizedTurnover = turnoverRate * (365 / days);

  const materialTurnover = allMaterials.map(m => {
    const mConsumptions = consumptions.filter(c => c.materialId === m.id);
    const usedQty = mConsumptions.reduce((sum, c) => sum + c.quantityUsed, 0);
    const avgInventory = m.quantity;
    const rate = avgInventory > 0 ? usedQty / avgInventory : (usedQty > 0 ? usedQty : 0);
    return { id: m.id, name: m.name, usedQuantity: usedQty, currentStock: m.quantity, turnoverRate: rate, annualizedRate: rate * (365 / days) };
  }).sort((a, b) => b.turnoverRate - a.turnoverRate).slice(0, 10);

  return { periodDays: days, cogs, averageInventoryValue: currentInventoryValue, turnoverRate, annualizedTurnover, materialTurnover };
}

async function computeAbcAnalysisInline() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

  const days = 90;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const consumptions = await db.select().from(materialConsumptionHistory).where(gte(materialConsumptionHistory.date, cutoffDate));
  const allMaterials = await db.select().from(materials);

  const items = allMaterials.map(m => {
    const mConsumptions = consumptions.filter(c => c.materialId === m.id);
    const usedQty = mConsumptions.reduce((sum, c) => sum + c.quantityUsed, 0);
    const annualUsage = usedQty * (365 / days);
    const unitPrice = m.unitPrice || 0;
    const annualValue = annualUsage * unitPrice;
    const fallbackValue = m.quantity * unitPrice;
    return { id: m.id, name: m.name, category: m.category, annualUsage, annualValue: annualValue > 0 ? annualValue : fallbackValue, unitPrice, currentStock: m.quantity };
  });

  items.sort((a, b) => b.annualValue - a.annualValue);
  const totalValue = items.reduce((sum, item) => sum + item.annualValue, 0);
  let cumulativeValue = 0;

  const classifiedItems = items.map(item => {
    cumulativeValue += item.annualValue;
    const cumulativePercentage = totalValue > 0 ? (cumulativeValue / totalValue) * 100 : 0;
    let classification = 'C';
    if (cumulativePercentage <= 80) classification = 'A';
    else if (cumulativePercentage <= 95) classification = 'B';
    return { ...item, percentageOfTotal: totalValue > 0 ? (item.annualValue / totalValue) * 100 : 0, cumulativePercentage, classification };
  });

  const summary = { A: { count: 0, value: 0 }, B: { count: 0, value: 0 }, C: { count: 0, value: 0 }, totalValue };
  classifiedItems.forEach(item => {
    const cls = item.classification as 'A' | 'B' | 'C';
    summary[cls].count += 1;
    summary[cls].value += item.annualValue;
  });

  return { summary, items: classifiedItems };
}

export const inventoryAnalyticsRouter = router({
  getCostAnalysis: protectedProcedure.query(async () => {
    return cache.getOrSet(CACHE_KEYS.inventoryCost, async () => {
      // Try BullMQ worker first, fall back to inline
      return await enqueueAndAwait<any>("cost-analysis", 15_000)
        ?? await computeCostAnalysisInline();
    }, 300);
  }),

  getTurnoverRate: protectedProcedure.query(async () => {
    return cache.getOrSet(CACHE_KEYS.inventoryTurnover, async () => {
      return await enqueueAndAwait<any>("turnover-rate", 15_000)
        ?? await computeTurnoverRateInline();
    }, 3600);
  }),

  getAbcAnalysis: protectedProcedure.query(async () => {
    return cache.getOrSet(CACHE_KEYS.inventoryAbc, async () => {
      return await enqueueAndAwait<any>("abc-analysis", 30_000)
        ?? await computeAbcAnalysisInline();
    }, 86400);
  }),
});

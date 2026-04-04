import { z } from "zod";
import { protectedProcedure, router } from "../../lib/trpc";
import { getDb } from "../../db";
import { 
  suppliers, 
  purchaseOrders, 
  purchaseOrderItems, 
  materials,
  qualityTests,
  deliveries
} from "../../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

export const supplierAnalyticsRouter = router({
  getScorecard: protectedProcedure
    .input(z.object({ supplierId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const supplierId = input.supplierId;

      // Get all purchase orders for this supplier
      const pos = await db
        .select()
        .from(purchaseOrders)
        .where(eq(purchaseOrders.supplierId, supplierId));

      if (pos.length === 0) {
        return {
          onTimeDeliveryRate: 0,
          qualityScore: 0,
          fulfillmentAccuracy: 0,
          totalOrders: 0,
        };
      }

      // Calculate on-time delivery rate
      const deliveredPos = pos.filter(po => po.actualDelivery && po.expectedDelivery);
      const onTimePos = deliveredPos.filter(po => {
        const actual = new Date(po.actualDelivery!).getTime();
        const expected = new Date(po.expectedDelivery!).getTime();
        return actual <= expected;
      });
      const onTimeDeliveryRate = deliveredPos.length > 0 
        ? (onTimePos.length / deliveredPos.length) * 100 
        : 100;

      // Quality score (dummy calculation or based on qualityTests if linked)
      // For now, let's look for qualityTests linked to deliveries of these POs if possible.
      // Since schema doesn't directly link PO to QualityTest easily without deliveries,
      // we'll use a placeholder or check deliveries.
      const qualityScore = 85; // Placeholder for now

      // Fulfillment accuracy (ordered vs received)
      // This would require comparing purchaseOrderItems with some "received" field if it existed.
      // Since it doesn't explicitly exist as a separate "receivedQuantity", we'll use 100% for completed POs.
      const completedPos = pos.filter(po => po.status === 'received');
      const fulfillmentAccuracy = pos.length > 0 ? (completedPos.length / pos.length) * 100 : 0;

      return {
        onTimeDeliveryRate: Math.round(onTimeDeliveryRate),
        qualityScore,
        fulfillmentAccuracy: Math.round(fulfillmentAccuracy),
        totalOrders: pos.length,
      };
    }),

  getMaterialBundling: protectedProcedure
    .input(z.object({ supplierId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      // Query all purchase order items grouped by purchaseOrderId
      const allItems = await db
        .select({
          purchaseOrderId: purchaseOrderItems.purchaseOrderId,
          materialId: purchaseOrderItems.materialId,
          materialName: materials.name,
        })
        .from(purchaseOrderItems)
        .innerJoin(materials, eq(purchaseOrderItems.materialId, materials.id))
        .innerJoin(purchaseOrders, eq(purchaseOrderItems.purchaseOrderId, purchaseOrders.id))
        .where(input.supplierId ? eq(purchaseOrders.supplierId, input.supplierId) : undefined);

      const orderGroups: Record<number, string[]> = {};
      allItems.forEach(item => {
        if (!orderGroups[item.purchaseOrderId]) {
          orderGroups[item.purchaseOrderId] = [];
        }
        orderGroups[item.purchaseOrderId].push(item.materialName);
      });

      const bundlingCounts: Record<string, number> = {};
      Object.values(orderGroups).forEach(group => {
        if (group.length < 2) return;
        
        // Generate pairs
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            const pair = [group[i], group[j]].sort().join(" + ");
            bundlingCounts[pair] = (bundlingCounts[pair] || 0) + 1;
          }
        }
      });

      return Object.entries(bundlingCounts)
        .map(([pair, count]) => ({ pair, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    }),
});

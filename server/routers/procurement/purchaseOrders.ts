import { logger } from '../../lib/logger';
import { z } from "zod";
import { router, protectedProcedure } from "../../lib/trpc";
import { TRPCError } from "@trpc/server";
import { eq, desc, and } from "drizzle-orm";
import { getDb } from "../../db";
import { purchaseOrders, purchaseOrderItems, materials, suppliers } from "../../../drizzle/schema";
import { sendEmail } from "../../lib/email";
import { sendSMS } from "../../lib/sms";
import * as db from "../../db";
import { invalidateMaterialCaches } from "../../lib/cacheKeys";

export const purchaseOrdersRouter = router({
  // From server/routers.ts
  getPurchaseOrderHistory: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      materialId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      return await db.getPurchaseOrders(input);
    }),

  updatePurchaseOrderStatus: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      status: z.enum(['pending', 'approved', 'ordered', 'received', 'cancelled']).optional(),
      expectedDelivery: z.date().optional(),
      actualDelivery: z.date().optional(),
      totalCost: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { orderId, ...data } = input;
      await db.updatePurchaseOrder(orderId, data);
      return { success: true };
    }),

  sendPurchaseOrderToSupplier: protectedProcedure
    .input(z.object({
      orderId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const orders = await db.getPurchaseOrders();
      const order = orders.find(o => o.id === input.orderId);

      if (!order) {
        return { success: false, message: 'Order not found' };
      }
      
      const suppliersData = await db.getSuppliers();
      const supplier = suppliersData.find(s => s.id === order.supplierId);
      
      if (!supplier || !supplier.email) {
        return { success: false, message: 'No supplier email found' };
      }

      const materialsData = await db.getMaterials();
      
      const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
      let materialName = 'Multiple Items';
      let quantity = 0;
      let unit = 'mixed';
      
      if (firstItem && order.items?.length === 1) {
        const material = materialsData.find(m => m.id === firstItem.materialId);
        materialName = material?.name || 'Unknown Item';
        quantity = firstItem.quantity;
        unit = material?.unit || 'units';
      } else if (order.items) {
        quantity = order.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      }

      const { generatePurchaseOrderEmailHTML } = await import('../../lib/email');
      const emailHTML = generatePurchaseOrderEmailHTML({
        id: order.id,
        materialName: materialName,
        quantity: quantity,
        unit: unit,
        supplier: supplier.name,
        orderDate: order.orderDate ? new Date(order.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        expectedDelivery: order.expectedDelivery ? new Date(order.expectedDelivery).toISOString().split('T')[0] : null,
        notes: order.notes || null,
      });

      const sent = await sendEmail({
        to: supplier.email,
        subject: `Purchase Order #${order.id} from AzVirt`,
        html: emailHTML,
      });

      if (supplier.phone) {
        try {
          await sendSMS({
            phoneNumber: supplier.phone,
            message: `AzVirt PO #${order.id}: ${quantity} ${unit} ${materialName}. Expected by: ${order.expectedDelivery ? new Date(order.expectedDelivery).toISOString().split('T')[0] : 'TBD'}`
          });
        } catch (e) {
          logger.warn({ err: e }, '[SMS] Failed to send SMS to supplier:');
        }
      }

      if (sent) {
        await db.updatePurchaseOrder(input.orderId, { status: 'ordered' });
      }

      return { success: sent };
    }),

  receivePurchaseOrder: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      actualDelivery: z.date().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const orders = await db.getPurchaseOrders();
      const order = orders.find(o => o.id === input.orderId);

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Purchase order not found" });
      }

      if (order.status === "received") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Order is already received." });
      }

      await db.updatePurchaseOrder(input.orderId, { 
        status: "received", 
        actualDelivery: input.actualDelivery || new Date(),
        notes: input.notes,
      });

      const materialsData = await db.getMaterials();
      for (const item of order.items) {
        const material = materialsData.find(m => m.id === item.materialId);
        if (material) {
          await db.updateMaterial(item.materialId, {
            quantity: material.quantity + item.quantity,
          });
        }
      }

      await invalidateMaterialCaches();

      return { success: true, itemsUpdated: order.items.length };
    }),

  getSupplierPerformance: protectedProcedure
    .input(z.object({
      supplierId: z.number(),
    }))
    .query(async ({ input }) => {
      const allOrders = await db.getPurchaseOrders({ supplierId: input.supplierId });
      const completedOrders = allOrders.filter(o => o.status === "received");

      if (completedOrders.length === 0) {
        return { supplierId: input.supplierId, onTimePercentage: null, totalOrders: allOrders.length };
      }

      let onTimeCount = 0;
      for (const order of completedOrders) {
        if (order.expectedDelivery && order.actualDelivery) {
          if (order.actualDelivery <= order.expectedDelivery) {
            onTimeCount++;
          }
        } else {
          onTimeCount++;
        }
      }

      const onTimePercentage = Math.round((onTimeCount / completedOrders.length) * 100);

      return {
        supplierId: input.supplierId,
        onTimePercentage,
        totalCompletedOrders: completedOrders.length,
        totalOrders: allOrders.length,
      };
    }),

  // Original from purchaseOrders.ts
  generatePurchaseOrder: protectedProcedure
    .input(z.object({
      supplierId: z.number(),
      notes: z.string().optional(),
      items: z.array(z.object({
        materialId: z.number(),
        quantity: z.number(),
        unitPrice: z.number().optional(),
      })),
      expectedDelivery: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const dbConn = await getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const userId = ctx.user.id;

      const totalCost = input.items.reduce((acc, item) => acc + (item.quantity * (item.unitPrice || 0)), 0);

      const [po] = await dbConn.insert(purchaseOrders).values({
        supplierId: input.supplierId,
        status: "pending",
        orderDate: new Date(),
        expectedDelivery: input.expectedDelivery,
        totalCost,
        notes: input.notes,
        createdBy: userId,
      }).returning();

      if (!po) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create purchase order",
        });
      }

      const itemsToInsert = input.items.map(item => ({
        purchaseOrderId: po.id,
        materialId: item.materialId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }));

      await dbConn.insert(purchaseOrderItems).values(itemsToInsert);

      return { success: true, id: po.id };
    }),

  getOrders: protectedProcedure
    .input(z.object({
      status: z.enum(['pending', 'approved', 'ordered', 'received', 'cancelled']).optional(),
      supplierId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const dbConn = await getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const query = dbConn.select({
        id: purchaseOrders.id,
        supplierId: purchaseOrders.supplierId,
        supplierName: suppliers.name,
        orderDate: purchaseOrders.orderDate,
        expectedDelivery: purchaseOrders.expectedDelivery,
        actualDelivery: purchaseOrders.actualDelivery,
        status: purchaseOrders.status,
        totalCost: purchaseOrders.totalCost,
        notes: purchaseOrders.notes,
      })
      .from(purchaseOrders)
      .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .orderBy(desc(purchaseOrders.orderDate));

      // Filtering would go here if needed, but for now we return all and filter in app or via db helper
      return await query;
    }),
});

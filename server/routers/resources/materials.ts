import { z } from "zod";
import { router, protectedProcedure } from "../../lib/trpc";
import * as db from "../../db";
import { invalidateMaterialCaches } from "../../lib/cacheKeys";

export const materialsRouter = router({
  list: protectedProcedure.query(async () => {
    return await db.getMaterials();
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      category: z.enum(["cement", "aggregate", "admixture", "water", "other"]),
      unit: z.string(),
      quantity: z.number().default(0),
      minStock: z.number().default(0),
      criticalThreshold: z.number().default(0),
      supplier: z.string().optional(),
      unitPrice: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.createMaterial(input);
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      category: z.enum(["cement", "aggregate", "admixture", "water", "other"]).optional(),
      unit: z.string().optional(),
      quantity: z.number().optional(),
      minStock: z.number().optional(),
      criticalThreshold: z.number().optional(),
      supplier: z.string().optional(),
      unitPrice: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateMaterial(id, data);
      await invalidateMaterialCaches();
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteMaterial(input.id);
      await invalidateMaterialCaches();
      return { success: true };
    }),

  checkLowStock: protectedProcedure
    .query(async () => {
      return await db.getLowStockMaterials();
    }),

  recordConsumption: protectedProcedure
    .input(z.object({
      materialId: z.number(),
      quantityUsed: z.number(),
      date: z.date(),
      projectId: z.number().optional(),
      deliveryId: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.recordConsumption(input);
      await invalidateMaterialCaches();
      return { success: true };
    }),

  getConsumptionHistory: protectedProcedure
    .input(z.object({
      materialId: z.number().optional(),
      days: z.number().default(30),
    }))
    .query(async ({ input }) => {
      return await db.getConsumptionHistory(input.materialId, input.days);
    }),

  generateForecasts: protectedProcedure
    .mutation(async () => {
      const predictions = await db.generateForecastPredictions();
      return { success: true, predictions };
    }),

  getForecasts: protectedProcedure
    .query(async () => {
      return await db.getForecastPredictions();
    }),

  sendLowStockAlert: protectedProcedure
    .mutation(async () => {
      const lowStockMaterials = await db.getLowStockMaterials();

      if (lowStockMaterials.length === 0) {
        return { success: true, message: "All materials are adequately stocked" };
      }

      const materialsList = lowStockMaterials
        .map(m => `- ${m.name}: ${m.quantity} ${m.unit} (minimum: ${m.minStock} ${m.unit})`)
        .join("\n");

      const content = `Low Stock Alert\n\nThe following materials have fallen below minimum stock levels:\n\n${materialsList}\n\nPlease reorder these materials to avoid project delays.`;

      const { notifyOwner } = await import("../../lib/notification");
      const notified = await notifyOwner({
        title: `⚠️ Low Stock Alert: ${lowStockMaterials.length} Material(s)`,
        content,
      });

      return {
        success: notified,
        materialsCount: lowStockMaterials.length,
        message: notified
          ? `Alert sent for ${lowStockMaterials.length} low-stock material(s)`
          : "Failed to send notification"
      };
    }),

  checkCriticalStock: protectedProcedure
    .query(async () => {
      return await db.getCriticalStockMaterials();
    }),

  sendCriticalStockSMS: protectedProcedure
    .mutation(async () => {
      const criticalMaterials = await db.getCriticalStockMaterials();

      if (criticalMaterials.length === 0) {
        return { success: true, message: "No critical stock alerts needed", smsCount: 0 };
      }

      const adminUsers = await db.getAdminUsersWithSMS();

      if (adminUsers.length === 0) {
        return { success: false, message: "No managers with SMS notifications enabled", smsCount: 0 };
      }

      const materialsList = criticalMaterials
        .map((m: any) => `${m.name}: ${m.quantity}/${m.criticalThreshold} ${m.unit}`)
        .join(", ");

      const smsMessage = `CRITICAL STOCK ALERT: ${criticalMaterials.length} material(s) below critical level. ${materialsList}. Immediate reorder required.`;

      const { sendSMS } = await import("../../lib/sms");
      const smsResults = await Promise.all(
        adminUsers.map((user: any) =>
          sendSMS({
            phoneNumber: user.phoneNumber!,
            message: smsMessage,
          }).catch((err: any) => {
            console.error(`Failed to send SMS to ${user.phoneNumber}:`, err);
            return { success: false };
          })
        )
      );

      const successCount = smsResults.filter((r: any) => r.success).length;

      return {
        success: successCount > 0,
        materialsCount: criticalMaterials.length,
        smsCount: successCount,
        message: `SMS alerts sent to ${successCount} manager(s) for ${criticalMaterials.length} critical material(s)`
      };
    }),
});

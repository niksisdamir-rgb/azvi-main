import { z } from "zod";
import { router, protectedProcedure } from "../../lib/trpc";
import * as db from "../../db";

export const suppliersRouter = router({
  list: protectedProcedure.query(async () => {
    return await db.getSuppliers();
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getSupplierById(input.id);
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      contactPerson: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      leadTimeDays: z.number().default(7),
      onTimeDeliveryRate: z.number().min(0).max(100).default(100),
    }))
    .mutation(async ({ input }) => {
      await db.createSupplier(input);
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        name: z.string().optional(),
        contactPerson: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        leadTimeDays: z.number().optional(),
        onTimeDeliveryRate: z.number().min(0).max(100).optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      await db.updateSupplier(input.id, input.data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteSupplier(input.id);
      return { success: true };
    }),
});

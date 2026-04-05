import { z } from "zod";
import { router, protectedProcedure } from "../../lib/trpc";
import * as db from "../../db";
import { aggregateTypeEnum } from "../../../drizzle/schema";

export const aggregateInputsRouter = router({
  list: protectedProcedure
    .input(z.object({
      concreteBaseId: z.number().optional(),
      materialType: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      return await db.getAggregateInputs(input);
    }),

  create: protectedProcedure
    .input(z.object({
      concreteBaseId: z.number(),
      date: z.date(),
      materialType: z.enum(aggregateTypeEnum.enumValues),
      materialName: z.string(),
      quantity: z.number(),
      unit: z.string(),
      supplier: z.string().optional(),
      batchNumber: z.string().optional(),
      receivedBy: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await db.createAggregateInput(input);
    }),
});

import { z } from "zod";
import { router, protectedProcedure } from "../../lib/trpc";
import * as db from "../../db";

export const concreteBasesRouter = router({
  list: protectedProcedure.query(async () => {
    return await db.getConcreteBases();
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      location: z.string(),
      capacity: z.number(),
      status: z.enum(["operational", "maintenance", "inactive"]).default("operational"),
      managerName: z.string().optional(),
      phoneNumber: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await db.createConcreteBase(input);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        name: z.string().optional(),
        location: z.string().optional(),
        capacity: z.number().optional(),
        status: z.enum(["operational", "maintenance", "inactive"]).optional(),
        managerName: z.string().optional(),
        phoneNumber: z.string().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      await db.updateConcreteBase(input.id, input.data);
      return { success: true };
    }),
});

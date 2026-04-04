import { z } from "zod";
import { router, protectedProcedure } from "../../lib/trpc";
import * as db from "../../db";

export const projectsRouter = router({
  list: protectedProcedure.query(async () => {
    return await db.getProjects();
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      location: z.string().optional(),
      status: z.enum(["planning", "active", "completed", "on_hold"]).default("planning"),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await db.createProject({
        ...input,
        createdBy: ctx.user.id,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      location: z.string().optional(),
      status: z.enum(["planning", "active", "completed", "on_hold"]).optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateProject(id, data);
      return { success: true };
    }),
});

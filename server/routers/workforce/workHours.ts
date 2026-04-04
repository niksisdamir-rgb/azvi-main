import { z } from "zod";
import { router, protectedProcedure } from "../../lib/trpc";
import * as db from "../../db";

export const workHoursRouter = router({
  list: protectedProcedure
    .input(z.object({
      employeeId: z.number().optional(),
      projectId: z.number().optional(),
      status: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      return await db.getWorkHours(input);
    }),

  create: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
      projectId: z.number().optional(),
      date: z.date(),
      startTime: z.date(),
      endTime: z.date().optional(),
      hoursWorked: z.number().optional(),
      overtimeHours: z.number().optional(),
      workType: z.enum(["regular", "overtime", "weekend", "holiday"]).default("regular"),
      notes: z.string().optional(),
      status: z.enum(["pending", "approved", "rejected"]).default("pending"),
    }))
    .mutation(async ({ input }) => {
      return await db.createWorkHour(input);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        endTime: z.date().optional(),
        hoursWorked: z.number().optional(),
        overtimeHours: z.number().optional(),
        notes: z.string().optional(),
        status: z.enum(["pending", "approved", "rejected"]).optional(),
        approvedBy: z.number().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      await db.updateWorkHour(input.id, input.data);
      return { success: true };
    }),
});

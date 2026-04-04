import { z } from "zod";
import { router, protectedProcedure } from "../../lib/trpc";
import * as db from "../../db";

export const timesheetsRouter = router({
  list: protectedProcedure
    .input(z.object({
      employeeId: z.number().optional(),
      status: z.enum(["pending", "approved", "rejected"]).optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }).optional())
    .query(async ({ input }) => {
      return await db.getWorkHours(input);
    }),

  clockIn: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
      projectId: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await db.createWorkHour({
        employeeId: input.employeeId,
        date: new Date(),
        startTime: new Date(),
        projectId: input.projectId,
        notes: input.notes,
        status: "pending",
      });
    }),

  clockOut: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const endTime = new Date();
      await db.updateWorkHour(input.id, { endTime });
      return { success: true };
    }),

  create: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
      date: z.date(),
      startTime: z.date(),
      endTime: z.date().optional(),
      hoursWorked: z.number().optional(),
      overtimeHours: z.number().optional(),
      workType: z.enum(["regular", "overtime", "weekend", "holiday"]).optional(),
      projectId: z.number().optional(),
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
        startTime: z.date().optional(),
        endTime: z.date().optional(),
        hoursWorked: z.number().optional(),
        overtimeHours: z.number().optional(),
        workType: z.enum(["regular", "overtime", "weekend", "holiday"]).optional(),
        projectId: z.number().optional(),
        notes: z.string().optional(),
        status: z.enum(["pending", "approved", "rejected"]).optional(),
        approvedBy: z.number().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      await db.updateWorkHour(input.id, input.data);
      return { success: true };
    }),

  approve: protectedProcedure
    .input(z.object({
      id: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await db.updateWorkHour(input.id, {
        status: "approved",
        approvedBy: ctx.user.id,
        notes: input.notes,
      });
      return { success: true };
    }),

  reject: protectedProcedure
    .input(z.object({
      id: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await db.updateWorkHour(input.id, {
        status: "rejected",
        approvedBy: ctx.user.id,
        notes: input.notes,
      });
      return { success: true };
    }),

  weeklySummary: protectedProcedure
    .input(z.object({
      employeeId: z.number().optional(),
      weekStart: z.date(),
    }))
    .query(async ({ input }) => {
      return await db.getWeeklyTimesheetSummary(input.employeeId, input.weekStart);
    }),

  monthlySummary: protectedProcedure
    .input(z.object({
      employeeId: z.number().optional(),
      year: z.number(),
      month: z.number(),
    }))
    .query(async ({ input }) => {
      return await db.getMonthlyTimesheetSummary(input.employeeId, input.year, input.month);
    }),

  bulkUpload: protectedProcedure
    .input(z.object({
      fileName: z.string().default("upload"),
      fileType: z.string().default("xlsx"),
      rows: z.array(z.object({
        employeeId: z.number(),
        date: z.date(),
        startTime: z.date().optional(),
        endTime: z.date().optional(),
        hoursWorked: z.number().optional(),
        overtimeHours: z.number().optional(),
        workType: z.enum(["regular", "overtime", "weekend", "holiday"]).default("regular"),
        projectId: z.number().optional(),
        notes: z.string().optional(),
        status: z.enum(["pending", "approved"]).default("pending"),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const errors: Array<{ rowIndex: number; error: string }> = [];
      let inserted = 0;

      for (let i = 0; i < input.rows.length; i++) {
        const row = input.rows[i];
        try {
          // Build a startTime from the date if not supplied
          const startTime = row.startTime ?? new Date(row.date.toISOString().split("T")[0] + "T08:00:00.000Z");
          await db.createWorkHour({
            employeeId: row.employeeId,
            date: row.date,
            startTime,
            endTime: row.endTime,
            hoursWorked: row.hoursWorked,
            overtimeHours: row.overtimeHours,
            workType: row.workType,
            projectId: row.projectId,
            notes: row.notes,
            status: row.status,
          });
          inserted++;
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          errors.push({ rowIndex: i, error: message });
        }
      }

      // Persist audit record
      const total = input.rows.length;
      const failed = errors.length;
      const historyStatus = inserted === 0 ? "failed" : failed > 0 ? "partial" : "completed";
      try {
        await db.createUploadHistory({
          uploadedBy: ctx.user.id,
          fileName: input.fileName,
          fileType: input.fileType,
          totalRows: total,
          insertedRows: inserted,
          failedRows: failed,
          errors: errors as any,
          status: historyStatus,
        });
      } catch {
        // Non-fatal: don't abort if audit insert fails
      }

      return { inserted, failed, errors };
    }),

  uploadHistory: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(200).default(50) }).optional())
    .query(async ({ input }) => {
      return await db.getUploadHistory(input?.limit ?? 50);
    }),
});

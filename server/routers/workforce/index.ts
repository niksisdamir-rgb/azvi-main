import { z } from "zod";
import { router, protectedProcedure } from "../../lib/trpc";
import * as db from "../../db";

export const employeesRouter = router({
  list: protectedProcedure
    .input(z.object({
      department: z.string().optional(),
      status: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      return await db.getEmployees(input);
    }),

  create: protectedProcedure
    .input(z.object({
      firstName: z.string(),
      lastName: z.string(),
      employeeNumber: z.string(),
      position: z.string(),
      department: z.enum(["construction", "maintenance", "quality", "administration", "logistics"]),
      phoneNumber: z.string().optional(),
      email: z.string().optional(),
      hourlyRate: z.number().optional(),
      status: z.enum(["active", "inactive", "on_leave"]).default("active"),
      hireDate: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      return await db.createEmployee(input);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        position: z.string().optional(),
        department: z.enum(["construction", "maintenance", "quality", "administration", "logistics"]).optional(),
        phoneNumber: z.string().optional(),
        email: z.string().optional(),
        hourlyRate: z.number().optional(),
        status: z.enum(["active", "inactive", "on_leave"]).optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      await db.updateEmployee(input.id, input.data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteEmployee(input.id);
      return { success: true };
    }),
});

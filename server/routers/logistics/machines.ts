import { logger } from '../../lib/logger';
import { z } from "zod";
import { router, protectedProcedure } from "../../lib/trpc";
import * as db from "../../db";
import { machineTypeEnum, machineStatusEnum, maintenanceTypeEnum } from "../../../drizzle/schema";
import { ollamaService } from "../../lib/ollama";

export const machinesRouter = router({
  list: protectedProcedure
    .input(z.object({
      concreteBaseId: z.number().optional(),
      type: z.string().optional(),
      status: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      return await db.getMachines(input);
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      machineNumber: z.string(),
      type: z.enum(machineTypeEnum.enumValues),
      manufacturer: z.string().optional(),
      model: z.string().optional(),
      year: z.number().optional(),
      concreteBaseId: z.number().optional(),
      status: z.enum(machineStatusEnum.enumValues).default("operational"),
    }))
    .mutation(async ({ input }) => {
      return await db.createMachine(input);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        name: z.string().optional(),
        type: z.enum(machineTypeEnum.enumValues).optional(),
        status: z.enum(machineStatusEnum.enumValues).optional(),
        totalWorkingHours: z.number().optional(),
        lastMaintenanceDate: z.date().optional(),
        nextMaintenanceDate: z.date().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      await db.updateMachine(input.id, input.data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteMachine(input.id);
      return { success: true };
    }),

  maintenance: router({
    list: protectedProcedure
      .input(z.object({
        machineId: z.number().optional(),
        maintenanceType: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getMachineMaintenance(input);
      }),

    create: protectedProcedure
      .input(z.object({
        machineId: z.number(),
        date: z.date(),
        maintenanceType: z.enum(maintenanceTypeEnum.enumValues),
        description: z.string().optional(),
        lubricationType: z.string().optional(),
        lubricationAmount: z.number().optional(),
        fuelType: z.string().optional(),
        fuelAmount: z.number().optional(),
        cost: z.number().optional(),
        performedBy: z.string().optional(),
        hoursAtMaintenance: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createMachineMaintenance(input);
      }),
  }),

  workHours: router({
    list: protectedProcedure
      .input(z.object({
        machineId: z.number().optional(),
        projectId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getMachineWorkHours(input);
      }),

    create: protectedProcedure
      .input(z.object({
        machineId: z.number(),
        projectId: z.number().optional(),
        date: z.date(),
        startTime: z.date(),
        endTime: z.date().optional(),
        hoursWorked: z.number().optional(),
        operatorId: z.number().optional(),
        operatorName: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createMachineWorkHour(input);
      }),
  }),

  healthProfile: protectedProcedure
    .input(z.object({ machineId: z.number() }))
    .query(async ({ input }) => {
      const profile = await db.getMachineHealthProfile(input.machineId);
      if (!profile) return null;

      // Add AI Recommendations for low health
      if (profile.healthScore < 70) {
        try {
          const prompt = `Analyze this machine's health data and provide 3 specific maintenance recommendations.
            Machine: ${profile.name}
            Health Score: ${profile.healthScore}/100
            Status: ${profile.status}
            Total Hours: ${profile.totalHours}
            Hours Since Last Service: ${profile.hoursSinceLastService}
            
            Recent Maintenance:
            ${profile.recentMaintenance.map(m => `- ${m.date}: ${m.maintenanceType} - ${m.description}`).join('\n')}
            
            Recent Work Hours:
            ${profile.workHoursHistory.map(w => `- ${w.date}: ${w.hoursUsed} hours`).join('\n')}
            
            Format response as a concise "Reasoning & Recommendation" block. Max 150 words.`;

          const response = await ollamaService.chat("llama3.2", [
            { role: "system", content: "You are a maintenance expert for construction machinery." },
            { role: "user", content: prompt }
          ], { temperature: 0.3 }) as any;

          if (response && response.message && response.message.content) {
            (profile as any).aiRecommendation = response.message.content;
          }
        } catch (error) {
          logger.error({ err: error }, "AI Recommendation Error:");
          (profile as any).aiRecommendation = "AI recommendations temporarily unavailable. Please perform manual check.";
        }
      }

      return profile;
    }),

  healthTrend: protectedProcedure
    .input(z.object({ 
      machineId: z.number(),
      months: z.number().optional()
    }))
    .query(async ({ input }) => {
      return await db.getMachineHealthTrend(input.machineId, input.months);
    }),
});

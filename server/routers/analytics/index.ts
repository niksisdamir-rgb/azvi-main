import { z } from "zod";
import { router, protectedProcedure } from "../../lib/trpc";
import * as db from "../../db";

export const reportsRouter = router({
  dailyProduction: protectedProcedure
    .input(z.object({
      date: z.string(), // YYYY-MM-DD format
    }))
    .query(async ({ input }) => {
      const targetDate = new Date(input.date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // Get deliveries completed on this date
      const completedDeliveries = await db.getDeliveries({
        startDate: targetDate,
        endDate: nextDay,
      });

      // Calculate total concrete produced
      const totalConcreteProduced = completedDeliveries.reduce((sum, d) => sum + (d.volume || 0), 0);

      // Get material consumption for the day
      const dayConsumptions = await db.getConsumptionHistory(undefined, 1, targetDate, nextDay);

      const materialsData = await db.getMaterials();
      const materialConsumption = dayConsumptions.map(c => {
        const material = materialsData.find(m => m.id === c.materialId);
        return {
          name: material?.name || 'Unknown',
          quantity: c.quantityUsed,
          unit: material?.unit || 'units',
        };
      });

      // Get quality tests for the day
      const dayTests = await db.getQualityTests({
        startDate: targetDate,
        endDate: nextDay,
      });

      const qualityTests = {
        total: dayTests.length,
        passed: dayTests.filter(t => t.status === 'pass').length,
        failed: dayTests.filter(t => t.status === 'fail').length,
      };

      return {
        date: input.date,
        totalConcreteProduced,
        deliveriesCompleted: completedDeliveries.length,
        materialConsumption,
        qualityTests,
      };
    }),

  generateCompliancePDF: protectedProcedure
    .input(z.object({
      testId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const test = await db.getQualityTestById(input.testId);
      if (!test) throw new Error('Test not found');

      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.text('CERTIFICATE OF COMPLIANCE', 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.text('Quality Control Department - AzVirt DMS', 105, 30, { align: 'center' });

      // Certificate Details
      doc.line(20, 35, 190, 35);
      doc.text(`Certificate No: QC-${test.id.toString().padStart(6, '0')}`, 20, 45);
      doc.text(`Date: ${new Date(test.createdAt).toLocaleDateString('en-GB')}`, 20, 52);

      // Test Information
      doc.setFontSize(16);
      doc.text('Test Results', 20, 70);
      doc.setFontSize(12);
      
      const testData = [
        ['Field', 'Value'],
        ['Test Type', test.testType.toUpperCase()],
        ['Value / Result', test.result || 'N/A'],
        ['Status', test.status.toUpperCase()],
        ['Inspector', test.testedBy || 'N/A'],
      ];

      let cursorY = 80;
      testData.forEach(([field, value]) => {
        doc.text(field, 25, cursorY);
        doc.text(value, 100, cursorY);
        cursorY += 10;
      });

      // Branding and Footer
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text('This document is electronically generated and valid without signature.', 105, 280, { align: 'center' });
      
      const pdfBase64 = doc.output('datauristring');
      return { pdf: pdfBase64 };
    }),

  sendDailyProductionEmail: protectedProcedure
    .input(z.object({
      date: z.string(),
      recipientEmail: z.string(),
    }))
    .mutation(async ({ input }) => {
      const targetDate = new Date(input.date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const completedDeliveries = await db.getDeliveries({
        startDate: targetDate,
        endDate: nextDay,
      });

      const totalConcreteProduced = completedDeliveries.reduce((sum, d) => sum + (d.volume || 0), 0);

      const dayConsumptions = await db.getConsumptionHistory(undefined, 1, targetDate, nextDay);

      const materialsData = await db.getMaterials();
      const materialConsumption = dayConsumptions.map(c => {
        const material = materialsData.find(m => m.id === c.materialId);
        return {
          name: material?.name || 'Unknown',
          quantity: c.quantityUsed,
          unit: material?.unit || 'units',
        };
      });

      const dayTests = await db.getQualityTests({
        startDate: targetDate,
        endDate: nextDay,
      });

      const qualityTests = {
        total: dayTests.length,
        passed: dayTests.filter(t => t.status === 'pass').length,
        failed: dayTests.filter(t => t.status === 'fail').length,
      };

      // Get user's report settings
      const settings = await db.getReportSettings(1); // Default to user ID 1 for now

      const { sendEmail, generateDailyProductionReportHTML } = await import('../../lib/email');
      const emailHTML = generateDailyProductionReportHTML({
        date: input.date,
        totalConcreteProduced,
        deliveriesCompleted: completedDeliveries.length,
        materialConsumption,
        qualityTests,
      }, settings ? {
        includeProduction: settings.includeProduction,
        includeDeliveries: settings.includeDeliveries,
        includeMaterials: settings.includeMaterials,
        includeQualityControl: settings.includeQualityControl,
      } : undefined);

      const sent = await sendEmail({
        to: input.recipientEmail,
        subject: `Daily Production Report - ${input.date}`,
        html: emailHTML,
      });

      return { success: sent };
    }),
});

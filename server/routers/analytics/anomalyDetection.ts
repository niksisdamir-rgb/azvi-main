import { z } from "zod";
import { router, protectedProcedure } from "../../lib/trpc";
import * as db from "../../db";
import axios from "axios";
import {
  detectQualityAnomalies,
  detectDeliveryAnomalies,
  detectConsumptionAnomalies,
  aggregateScanResults,
  type QualityTestData,
  type DeliveryData,
  type ConsumptionData,
} from "../../lib/anomalyDetection";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

export const anomalyDetectionRouter = router({
  /**
   * Detect quality test anomalies (failure rate spikes, per-test-type anomalies)
   */
  detectQualityAnomalies: protectedProcedure
    .input(
      z.object({
        windowDays: z.number().min(7).max(365).default(30),
        testType: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const allTests = await db.getQualityTests();

      // Map to detector interface
      const testData: QualityTestData[] = allTests.map((t) => ({
        id: t.id,
        testType: t.type || "other",
        status: t.status,
        result: t.value || null,
        createdAt: t.createdAt,
        deliveryId: t.deliveryId || null,
      }));

      // Optional test type filter
      const filtered = input.testType
        ? testData.filter((t) => t.testType === input.testType)
        : testData;

      const anomalies = detectQualityAnomalies(filtered, input.windowDays);

      return {
        anomalies,
        totalTestsScanned: filtered.length,
        windowDays: input.windowDays,
      };
    }),

  /**
   * Detect delivery delay anomalies (IQR outliers, delay trends)
   */
  detectDeliveryAnomalies: protectedProcedure
    .input(
      z.object({
        windowDays: z.number().min(7).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - input.windowDays);

      const allDeliveries = await db.getDeliveries();

      // Filter to window and completed deliveries
      const windowDeliveries = allDeliveries.filter((d) => {
        const created = new Date(d.createdAt);
        return created >= cutoff && (d.status === "delivered" || d.status === "completed");
      });

      // Map to detector interface
      const deliveryData: DeliveryData[] = windowDeliveries.map((d) => ({
        id: d.id,
        scheduledTime: d.scheduledTime,
        estimatedArrival: d.estimatedArrival || null,
        actualDeliveryTime: d.actualDeliveryTime || null,
        driverName: d.driverName || null,
        vehicleNumber: d.vehicleNumber || null,
        projectName: d.projectName || null,
        status: d.status,
      }));

      const anomalies = detectDeliveryAnomalies(deliveryData);

      return {
        anomalies,
        totalDeliveriesScanned: deliveryData.length,
        windowDays: input.windowDays,
      };
    }),

  /**
   * Detect material consumption spikes (Z-score rolling window)
   */
  detectConsumptionAnomalies: protectedProcedure
    .input(
      z.object({
        materialId: z.number().optional(),
        windowSize: z.number().min(3).max(30).default(7),
        dayRange: z.number().min(7).max(365).default(60),
      })
    )
    .query(async ({ input }) => {
      const consumptions = await db.getConsumptionHistory(
        input.materialId,
        input.dayRange
      );

      // Get material names
      const materials = await db.getMaterials();
      const materialMap = new Map(materials.map((m) => [m.id, m.name]));

      // Map to detector interface
      const consumptionData: ConsumptionData[] = consumptions.map((c) => ({
        materialId: c.materialId,
        materialName: materialMap.get(c.materialId) || `Material #${c.materialId}`,
        quantityUsed: c.quantityUsed,
        date: c.date,
      }));

      const anomalies = detectConsumptionAnomalies(consumptionData, input.windowSize);

      return {
        anomalies,
        totalRecordsScanned: consumptionData.length,
        windowSize: input.windowSize,
        dayRange: input.dayRange,
      };
    }),

  /**
   * Run full anomaly scan across all detectors
   */
  runFullScan: protectedProcedure
    .input(
      z.object({
        windowDays: z.number().min(7).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      // Fetch all data in parallel
      const [allTests, allDeliveries, consumptions, materialsList] =
        await Promise.all([
          db.getQualityTests(),
          db.getDeliveries(),
          db.getConsumptionHistory(undefined, input.windowDays * 2),
          db.getMaterials(),
        ]);

      const materialMap = new Map(materialsList.map((m) => [m.id, m.name]));
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - input.windowDays);

      // Quality
      const testData: QualityTestData[] = allTests.map((t) => ({
        id: t.id,
        testType: t.type || "other",
        status: t.status,
        result: t.value || null,
        createdAt: t.createdAt,
        deliveryId: t.deliveryId || null,
      }));
      const qualityAnomalies = detectQualityAnomalies(testData, input.windowDays);

      // Delivery
      const windowDeliveries = allDeliveries.filter((d) => {
        const created = new Date(d.createdAt);
        return created >= cutoff && (d.status === "delivered" || d.status === "completed");
      });
      const deliveryData: DeliveryData[] = windowDeliveries.map((d) => ({
        id: d.id,
        scheduledTime: d.scheduledTime,
        estimatedArrival: d.estimatedArrival || null,
        actualDeliveryTime: d.actualDeliveryTime || null,
        driverName: d.driverName || null,
        vehicleNumber: d.vehicleNumber || null,
        projectName: d.projectName || null,
        status: d.status,
      }));
      const deliveryAnomalies = detectDeliveryAnomalies(deliveryData);

      // Consumption
      const consumptionData: ConsumptionData[] = consumptions.map((c) => ({
        materialId: c.materialId,
        materialName: materialMap.get(c.materialId) || `Material #${c.materialId}`,
        quantityUsed: c.quantityUsed,
        date: c.date,
      }));
      const consumptionAnomalies = detectConsumptionAnomalies(consumptionData, 7);

      return aggregateScanResults(
        qualityAnomalies,
        deliveryAnomalies,
        consumptionAnomalies
      );
    }),

  /**
   * Detect sensor data anomalies using ML service
   */
  detectSensorAnomalies: protectedProcedure
    .input(
      z.object({
        sensorId: z.string(),
        contamination: z.number().min(0.01).max(0.5).default(0.1),
      })
    )
    .query(async ({ input }) => {
      try {
        const response = await axios.post(`${ML_SERVICE_URL}/api/anomalies/detect`, {
          sensor_id: input.sensorId,
          contamination: input.contamination,
        });

        return {
          status: "success",
          anomalies: response.data.anomalies,
          message: response.data.message,
        };
      } catch (error) {
        console.error("ML Service error:", error);
        return {
          status: "error",
          anomalies: [],
          message: "Failed to detect anomalies from ML service",
        };
      }
    }),
});

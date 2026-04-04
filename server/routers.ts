import { router } from "./lib/trpc";
import { systemRouter } from "./lib/systemRouter";
import { authRouter } from "./routers/auth/index";
import { aiAssistantRouter } from "./routers/ai/aiAssistant";
import { bulkImportRouter } from "./routers/logistics/bulkImport";
import { notificationsRouter } from "./routers/communication/notifications";
import { deliveriesRouter } from "./routers/logistics/deliveries";
import { pushRouter } from "./routers/logistics/push";
import { forecastingRouter } from "./routers/analytics/forecasting";
import { inventoryAnalyticsRouter } from "./routers/analytics/inventoryAnalytics";
import { supplierAnalyticsRouter } from "./routers/analytics/supplierAnalytics";
import { purchaseOrdersRouter } from "./routers/procurement/purchaseOrders";
import { documentsRouter } from "./routers/resources/index";
import { projectsRouter } from "./routers/resources/projects";
import { materialsRouter } from "./routers/resources/materials";
import { qualityTestsRouter } from "./routers/quality/index";
import { dashboardRouter } from "./routers/analytics/dashboard";
import { employeesRouter } from "./routers/workforce/index";
import { workHoursRouter } from "./routers/workforce/workHours";
import { timesheetsRouter } from "./routers/workforce/timesheets";
import { concreteBasesRouter } from "./routers/logistics/concreteBases";
import { machinesRouter } from "./routers/logistics/machines";
import { aggregateInputsRouter } from "./routers/logistics/aggregateInputs";
import { reportsRouter } from "./routers/analytics/index";
import { brandingRouter } from "./routers/communication/branding";
import { emailTemplatesRouter } from "./routers/communication/emailTemplates";
import { suppliersRouter } from "./routers/procurement/suppliers";
import { anomalyDetectionRouter } from "./routers/analytics/anomalyDetection";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  ai: aiAssistantRouter,
  bulkImport: bulkImportRouter,
  notifications: notificationsRouter,
  tracking: deliveriesRouter,
  deliveries: deliveriesRouter, // Backward compatibility or alias
  push: pushRouter,
  forecasting: forecastingRouter,
  inventoryAnalytics: inventoryAnalyticsRouter,
  supplierAnalytics: supplierAnalyticsRouter,
  purchaseOrders: purchaseOrdersRouter,
  documents: documentsRouter,
  projects: projectsRouter,
  materials: materialsRouter,
  qualityTests: qualityTestsRouter,
  dashboard: dashboardRouter,
  employees: employeesRouter,
  workHours: workHoursRouter,
  timesheets: timesheetsRouter,
  concreteBases: concreteBasesRouter,
  machines: machinesRouter,
  machineMaintenance: machinesRouter.maintenance, // Alias if needed
  machineWorkHours: machinesRouter.workHours, // Alias if needed
  aggregateInputs: aggregateInputsRouter,
  reports: reportsRouter,
  branding: brandingRouter,
  emailTemplates: emailTemplatesRouter,
  suppliers: suppliersRouter,
  anomalyDetection: anomalyDetectionRouter,
});

export type AppRouter = typeof appRouter;

import { pgEnum, pgTable, serial, text, timestamp, varchar, boolean, integer, jsonb, doublePrecision, index } from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const projectStatusEnum = pgEnum("project_status", ["planning", "active", "completed", "on_hold"]);
export const documentCategoryEnum = pgEnum("document_category", ["contract", "blueprint", "report", "certificate", "invoice", "other"]);
export const materialCategoryEnum = pgEnum("material_category", ["cement", "aggregate", "admixture", "water", "other"]);
export const deliveryStatusEnum = pgEnum("delivery_status", ["scheduled", "loaded", "en_route", "arrived", "delivered", "returning", "completed", "cancelled"]);
export const testTypeEnum = pgEnum("test_type", ["slump", "strength", "air_content", "temperature", "other"]);
export const testStatusEnum = pgEnum("test_status", ["pass", "fail", "pending"]);
export const offlineSyncStatusEnum = pgEnum("offline_sync_status", ["synced", "pending", "failed"]);
export const departmentEnum = pgEnum("department", ["construction", "maintenance", "quality", "administration", "logistics"]);
export const employeeStatusEnum = pgEnum("employee_status", ["active", "inactive", "on_leave"]);
export const workTypeEnum = pgEnum("work_type", ["regular", "overtime", "weekend", "holiday"]);
export const workStatusEnum = pgEnum("work_status", ["pending", "approved", "rejected"]);
export const baseStatusEnum = pgEnum("base_status", ["operational", "maintenance", "inactive"]);
export const machineTypeEnum = pgEnum("machine_type", ["mixer", "pump", "truck", "excavator", "crane", "other"]);
export const machineStatusEnum = pgEnum("machine_status", ["operational", "maintenance", "repair", "inactive"]);
export const maintenanceTypeEnum = pgEnum("maintenance_type", ["lubrication", "fuel", "oil_change", "repair", "inspection", "other"]);
export const aggregateTypeEnum = pgEnum("aggregate_type", ["cement", "sand", "gravel", "water", "admixture", "other"]);
export const poStatusEnum = pgEnum("po_status", ["pending", "approved", "ordered", "received", "cancelled"]);
export const aiRoleEnum = pgEnum("ai_role", ["user", "assistant", "system", "tool"]);
export const aiModelTypeEnum = pgEnum("ai_model_type", ["text", "vision", "code"]);
export const taskPriorityEnum = pgEnum("task_priority", ["low", "medium", "high", "urgent"]);
export const taskStatusEnum = pgEnum("task_status", ["pending", "in_progress", "completed", "cancelled"]);
export const notificationTypeEnum = pgEnum("notification_type", ["overdue_reminder", "completion_confirmation", "assignment", "status_change", "comment"]);
export const notificationStatusEnum = pgEnum("notification_status", ["pending", "sent", "failed", "read"]);
export const channelEnum = pgEnum("channel", ["email", "sms", "in_app"]);
export const historyStatusEnum = pgEnum("history_status", ["sent", "failed", "bounced", "opened"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 64 }).unique(),
  passwordHash: text("password_hash"),
  openId: varchar("open_id", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  forcePasswordChange: boolean("force_password_change").default(false).notNull(),
  phoneNumber: varchar("phone_number", { length: 50 }),
  smsNotificationsEnabled: boolean("sms_notifications_enabled").default(false).notNull(),
  pushSubscription: jsonb("push_subscription"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
}, (table) => {
  return {
    emailIdx: index("user_email_idx").on(table.email),
    roleIdx: index("user_role_idx").on(table.role),
  };
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Projects table for construction projects
 */
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 500 }),
  status: projectStatusEnum("status").default("planning").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  notifyOnEnRoute: boolean("notify_on_en_route").default(true).notNull(),
  notifyOnDelay: boolean("notify_on_delay").default(true).notNull(),
  notifyOnCompletion: boolean("notify_on_completion").default(false).notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    statusIdx: index("project_status_idx").on(table.status),
  };
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Documents table for file management
 */
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  fileKey: varchar("file_key", { length: 500 }).notNull(),
  fileUrl: varchar("file_url", { length: 1000 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  fileSize: integer("file_size"),
  category: documentCategoryEnum("category").default("other").notNull(),
  projectId: integer("project_id").references(() => projects.id),
  uploadedBy: integer("uploaded_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    projectIdIdx: index("document_project_id_idx").on(table.projectId),
    categoryIdx: index("document_category_idx").on(table.category),
    createdAtIdx: index("document_created_at_idx").on(table.createdAt),
  };
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Materials table for inventory management
 */
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: materialCategoryEnum("category").default("other").notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  quantity: integer("quantity").notNull().default(0),
  minStock: integer("min_stock").notNull().default(0),
  criticalThreshold: integer("critical_threshold").notNull().default(0),
  supplier: varchar("supplier", { length: 255 }),
  unitPrice: integer("unit_price"),
  lowStockEmailSent: boolean("low_stock_email_sent").default(false),
  lastEmailSentAt: timestamp("last_email_sent_at"),
  supplierEmail: varchar("supplier_email", { length: 255 }),
  leadTimeDays: integer("lead_time_days").default(7),
  reorderPoint: integer("reorder_point"),
  optimalOrderQuantity: integer("optimal_order_quantity"),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  lastOrderDate: timestamp("last_order_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = typeof materials.$inferInsert;

/**
 * Deliveries table for concrete delivery tracking
 */
export const deliveries = pgTable("deliveries", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").references(() => projects.id),
  projectName: varchar("projectName", { length: 255 }).notNull(),
  concreteType: varchar("concreteType", { length: 100 }).notNull(),
  volume: integer("volume").notNull(),
  scheduledTime: timestamp("scheduledTime").notNull(),
  actualTime: timestamp("actualTime"),
  status: deliveryStatusEnum("status").default("scheduled").notNull(),
  driverName: varchar("driverName", { length: 255 }),
  vehicleNumber: varchar("vehicleNumber", { length: 100 }),
  notes: text("notes"),
  gpsLocation: varchar("gpsLocation", { length: 100 }), // "lat,lng"
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  deliveryPhotos: jsonb("deliveryPhotos"), // JSON array of photo URLs
  estimatedArrival: integer("estimatedArrival"), // Unix timestamp (seconds)
  etaUpdatedAt: timestamp("etaUpdatedAt"),
  actualArrivalTime: integer("actualArrivalTime"),
  actualDeliveryTime: integer("actualDeliveryTime"),
  driverNotes: text("driverNotes"),
  customerName: varchar("customerName", { length: 255 }),
  customerPhone: varchar("customerPhone", { length: 50 }),
  smsNotificationSent: boolean("smsNotificationSent").default(false),
  delayNotificationSent: boolean("delayNotificationSent").default(false),
  createdBy: integer("createdBy").references(() => users.id).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => {
  return {
    statusScheduledTimeIdx: index("delivery_status_scheduled_time_idx").on(table.status, table.scheduledTime),
    projectIdIdx: index("delivery_project_id_idx").on(table.projectId),
    concreteTypeIdx: index("delivery_concrete_type_idx").on(table.concreteType),
    statusIdx: index("delivery_status_idx").on(table.status),
  };
});

export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = typeof deliveries.$inferInsert;

/**
 * Delivery status history for tracking the timeline of a delivery
 */
export const deliveryStatusHistory = pgTable("delivery_status_history", {
  id: serial("id").primaryKey(),
  deliveryId: integer("deliveryId").references(() => deliveries.id).notNull(),
  userId: integer("userId"),    // who made the status change (null = driver app)
  status: varchar("status", { length: 50 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  gpsLocation: varchar("gpsLocation", { length: 100 }),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  notes: text("notes"),
});

export type DeliveryStatusHistory = typeof deliveryStatusHistory.$inferSelect;
export type InsertDeliveryStatusHistory = typeof deliveryStatusHistory.$inferInsert;

/**
 * Quality tests table for QC records
 */
export const qualityTests = pgTable("qualityTests", {
  id: serial("id").primaryKey(),
  testName: varchar("testName", { length: 255 }).notNull(),
  testType: testTypeEnum("testType").default("other").notNull(),
  result: varchar("result", { length: 255 }).notNull(),
  unit: varchar("unit", { length: 50 }),
  status: testStatusEnum("status").default("pending").notNull(),
  deliveryId: integer("deliveryId").references(() => deliveries.id),
  projectId: integer("projectId").references(() => projects.id),
  testedBy: varchar("testedBy", { length: 255 }),
  notes: text("notes"),
  photoUrls: text("photoUrls"), // JSON array of S3 photo URLs
  inspectorSignature: text("inspectorSignature"), // Base64 signature image
  supervisorSignature: text("supervisorSignature"), // Base64 signature image
  testLocation: varchar("testLocation", { length: 100 }), // GPS coordinates "lat,lng"
  complianceStandard: varchar("complianceStandard", { length: 50 }), // EN 206, ASTM C94, etc.
  offlineSyncStatus: offlineSyncStatusEnum("offlineSyncStatus").default("synced"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => {
  return {
    projectIdIdx: index("quality_test_project_id_idx").on(table.projectId),
    deliveryIdIdx: index("quality_test_delivery_id_idx").on(table.deliveryId),
    testTypeIdx: index("quality_test_type_idx").on(table.testType),
    statusIdx: index("quality_test_status_idx").on(table.status),
  };
});

export type QualityTest = typeof qualityTests.$inferSelect;
export type InsertQualityTest = typeof qualityTests.$inferInsert;

/**
 * Employees table for workforce management
 */
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  employeeNumber: varchar("employeeNumber", { length: 50 }).notNull().unique(),
  position: varchar("position", { length: 100 }).notNull(),
  department: departmentEnum("department").default("construction").notNull(),
  phoneNumber: varchar("phoneNumber", { length: 50 }),
  email: varchar("email", { length: 320 }),
  hourlyRate: integer("hourlyRate"),
  status: employeeStatusEnum("status").default("active").notNull(),
  hireDate: timestamp("hireDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => {
  return {
    departmentIdx: index("employee_department_idx").on(table.department),
    statusIdx: index("employee_status_idx").on(table.status),
  };
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

/**
 * Work hours table for tracking employee working hours
 */
export const workHours = pgTable("workHours", {
  id: serial("id").primaryKey(),
  employeeId: integer("employeeId").references(() => employees.id).notNull(),
  projectId: integer("projectId").references(() => projects.id),
  date: timestamp("date").notNull(),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime"),
  hoursWorked: integer("hoursWorked"),
  overtimeHours: integer("overtimeHours").default(0),
  workType: workTypeEnum("workType").default("regular").notNull(),
  notes: text("notes"),
  approvedBy: integer("approvedBy").references(() => users.id),
  status: workStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => {
  return {
    employeeIdIdx: index("work_hour_employee_id_idx").on(table.employeeId),
    projectIdIdx: index("work_hour_project_id_idx").on(table.projectId),
    dateIdx: index("work_hour_date_idx").on(table.date),
  };
});

export type WorkHour = typeof workHours.$inferSelect;
export type InsertWorkHour = typeof workHours.$inferInsert;

/**
 * Concrete bases table for concrete mixing plant management
 */
export const concreteBases = pgTable("concreteBases", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  location: varchar("location", { length: 500 }).notNull(),
  capacity: integer("capacity").notNull(),
  status: baseStatusEnum("status").default("operational").notNull(),
  managerName: varchar("managerName", { length: 255 }),
  phoneNumber: varchar("phoneNumber", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ConcreteBase = typeof concreteBases.$inferSelect;
export type InsertConcreteBase = typeof concreteBases.$inferInsert;

/**
 * Machines table for equipment tracking
 */
export const machines = pgTable("machines", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  machineNumber: varchar("machineNumber", { length: 100 }).notNull().unique(),
  type: machineTypeEnum("type").default("other").notNull(),
  manufacturer: varchar("manufacturer", { length: 255 }),
  model: varchar("model", { length: 255 }),
  year: integer("year"),
  concreteBaseId: integer("concreteBaseId").references(() => concreteBases.id),
  status: machineStatusEnum("status").default("operational").notNull(),
  totalWorkingHours: integer("totalWorkingHours").default(0),
  lastMaintenanceDate: timestamp("lastMaintenanceDate"),
  nextMaintenanceDate: timestamp("nextMaintenanceDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Machine = typeof machines.$inferSelect;
export type InsertMachine = typeof machines.$inferInsert;

/**
 * Machine maintenance table for tracking lubrication, fuel, and maintenance
 */
export const machineMaintenance = pgTable("machineMaintenance", {
  id: serial("id").primaryKey(),
  machineId: integer("machineId").references(() => machines.id).notNull(),
  date: timestamp("date").notNull(),
  maintenanceType: maintenanceTypeEnum("maintenanceType").default("other").notNull(),
  description: text("description"),
  lubricationType: varchar("lubricationType", { length: 100 }),
  lubricationAmount: integer("lubricationAmount"),
  fuelType: varchar("fuelType", { length: 100 }),
  fuelAmount: integer("fuelAmount"),
  cost: integer("cost"),
  performedBy: varchar("performedBy", { length: 255 }),
  hoursAtMaintenance: integer("hoursAtMaintenance"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type MachineMaintenance = typeof machineMaintenance.$inferSelect;
export type InsertMachineMaintenance = typeof machineMaintenance.$inferInsert;

/**
 * Machine working hours table for tracking equipment usage
 */
export const machineWorkHours = pgTable("machineWorkHours", {
  id: serial("id").primaryKey(),
  machineId: integer("machineId").references(() => machines.id).notNull(),
  projectId: integer("projectId").references(() => projects.id),
  date: timestamp("date").notNull(),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime"),
  hoursWorked: integer("hoursWorked"),
  operatorId: integer("operatorId").references(() => employees.id),
  operatorName: varchar("operatorName", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type MachineWorkHour = typeof machineWorkHours.$inferSelect;
export type InsertMachineWorkHour = typeof machineWorkHours.$inferInsert;

/**
 * Aggregate input table for tracking raw material input at concrete bases
 */
export const aggregateInputs = pgTable("aggregateInputs", {
  id: serial("id").primaryKey(),
  concreteBaseId: integer("concreteBaseId").references(() => concreteBases.id).notNull(),
  date: timestamp("date").notNull(),
  materialType: aggregateTypeEnum("materialType").default("other").notNull(),
  materialName: varchar("materialName", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  supplier: varchar("supplier", { length: 255 }),
  batchNumber: varchar("batchNumber", { length: 100 }),
  receivedBy: varchar("receivedBy", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AggregateInput = typeof aggregateInputs.$inferSelect;
export type InsertAggregateInput = typeof aggregateInputs.$inferInsert;

/**
 * Material consumption history for tracking usage over time
 */
export const materialConsumptionHistory = pgTable("material_consumption_history", {
  id: serial("id").primaryKey(),
  materialId: integer("materialId").references(() => materials.id).notNull(),
  quantityUsed: integer("quantityUsed").notNull(),
  date: timestamp("date").notNull(),
  projectId: integer("projectId"),
  deliveryId: integer("deliveryId").references(() => deliveries.id),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MaterialConsumptionHistory = typeof materialConsumptionHistory.$inferSelect;
export type InsertMaterialConsumptionHistory = typeof materialConsumptionHistory.$inferInsert;

/**
 * Purchase orders table for automated ordering
 */
export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplierId").references(() => suppliers.id).notNull(),
  status: poStatusEnum("status").default("pending").notNull(),
  orderDate: timestamp("orderDate").defaultNow().notNull(),
  expectedDelivery: timestamp("expectedDelivery"),
  actualDelivery: timestamp("actualDelivery"),
  totalCost: integer("totalCost"),
  notes: text("notes"),
  createdBy: integer("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;

/**
 * Purchase order items for multi-item orders
 */
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  purchaseOrderId: integer("purchaseOrderId").references(() => purchaseOrders.id).notNull(),
  materialId: integer("materialId").references(() => materials.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unitPrice"),
});

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InsertPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;

/**
 * Forecast predictions table for AI-powered stock predictions
 */
export const forecastPredictions = pgTable("forecast_predictions", {
  id: serial("id").primaryKey(),
  materialId: integer("materialId").notNull(),
  materialName: varchar("materialName", { length: 255 }).notNull(),
  currentStock: integer("currentStock").notNull(),
  dailyConsumptionRate: integer("dailyConsumptionRate").notNull(),
  predictedRunoutDate: timestamp("predictedRunoutDate"),
  daysUntilStockout: integer("daysUntilStockout"),
  recommendedOrderQty: integer("recommendedOrderQty"),
  confidence: integer("confidence"),
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
});

export type ForecastPrediction = typeof forecastPredictions.$inferSelect;
export type InsertForecastPrediction = typeof forecastPredictions.$inferInsert;

/**
 * Report settings table for daily production report customization
 */
export const reportSettings = pgTable("report_settings", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id).notNull().unique(),
  includeProduction: boolean("includeProduction").default(true).notNull(),
  includeDeliveries: boolean("includeDeliveries").default(true).notNull(),
  includeMaterials: boolean("includeMaterials").default(true).notNull(),
  includeQualityControl: boolean("includeQualityControl").default(true).notNull(),
  reportTime: varchar("reportTime", { length: 10 }).default("18:00").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ReportSettings = typeof reportSettings.$inferSelect;
export type InsertReportSettings = typeof reportSettings.$inferInsert;

/**
 * Report recipients table for managing email recipients
 */
export const reportRecipients = pgTable("report_recipients", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 255 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReportRecipient = typeof reportRecipients.$inferSelect;
export type InsertReportRecipient = typeof reportRecipients.$inferInsert;

/**
 * Email templates table for customizable email designs
 */
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull().unique(),
  subject: varchar("subject", { length: 500 }).notNull(),
  htmlTemplate: text("htmlTemplate").notNull(),
  variables: text("variables"), // JSON string of available variables
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

/**
 * Email branding table for company branding customization
 */
export const emailBranding = pgTable("email_branding", {
  id: serial("id").primaryKey(),
  logoUrl: varchar("logoUrl", { length: 500 }),
  primaryColor: varchar("primaryColor", { length: 20 }).default("#f97316").notNull(),
  secondaryColor: varchar("secondaryColor", { length: 20 }).default("#ea580c").notNull(),
  companyName: varchar("companyName", { length: 255 }).default("AzVirt").notNull(),
  footerText: text("footerText"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type EmailBranding = typeof emailBranding.$inferSelect;
export type InsertEmailBranding = typeof emailBranding.$inferInsert;


// AI Assistant Tables
export const aiConversations = pgTable("ai_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }),
  modelName: varchar("modelName", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = typeof aiConversations.$inferInsert;

export const aiMessages = pgTable("ai_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversationId").references(() => aiConversations.id).notNull(),
  role: aiRoleEnum("role").notNull(),
  content: text("content").notNull(),
  model: varchar("model", { length: 100 }),
  audioUrl: text("audioUrl"),
  imageUrl: text("imageUrl"),
  thinkingProcess: text("thinkingProcess"), // JSON string
  toolCalls: text("toolCalls"), // JSON string
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiMessage = typeof aiMessages.$inferSelect;
export type InsertAiMessage = typeof aiMessages.$inferInsert;

export const aiModels = pgTable("ai_models", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  type: aiModelTypeEnum("type").notNull(),
  size: varchar("size", { length: 20 }),
  isAvailable: boolean("isAvailable").default(false),
  lastUsed: timestamp("lastUsed"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiModel = typeof aiModels.$inferSelect;
export type InsertAiModel = typeof aiModels.$inferInsert;


/**
 * Daily Tasks table for task management
 */
export const dailyTasks = pgTable("daily_tasks", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: timestamp("dueDate").notNull(),
  priority: taskPriorityEnum("priority").default("medium").notNull(),
  status: taskStatusEnum("status").default("pending").notNull(),
  assignedTo: integer("assignedTo").references(() => users.id),
  category: varchar("category", { length: 100 }),
  tags: jsonb("tags"),
  attachments: jsonb("attachments"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type DailyTask = typeof dailyTasks.$inferSelect;
export type InsertDailyTask = typeof dailyTasks.$inferInsert;

/**
 * Task Assignments table for responsibility tracking
 */
export const taskAssignments = pgTable("task_assignments", {
  id: serial("id").primaryKey(),
  taskId: integer("taskId").references(() => dailyTasks.id).notNull(),
  assignedTo: integer("assignedTo").references(() => users.id).notNull(),
  assignedBy: integer("assignedBy").references(() => users.id).notNull(),
  responsibility: varchar("responsibility", { length: 255 }).notNull(),
  completionPercentage: integer("completionPercentage").default(0).notNull(),
  notes: text("notes"),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type TaskAssignment = typeof taskAssignments.$inferSelect;
export type InsertTaskAssignment = typeof taskAssignments.$inferInsert;

/**
 * Task Status History table for audit trail
 */
export const taskStatusHistory = pgTable("task_status_history", {
  id: serial("id").primaryKey(),
  taskId: integer("taskId").references(() => dailyTasks.id).notNull(),
  previousStatus: varchar("previousStatus", { length: 50 }),
  newStatus: varchar("newStatus", { length: 50 }).notNull(),
  changedBy: integer("changedBy").references(() => users.id).notNull(),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskStatusHistory = typeof taskStatusHistory.$inferSelect;
export type InsertTaskStatusHistory = typeof taskStatusHistory.$inferInsert;


/**
 * Task Notifications table for tracking task-related notifications
 */
export const taskNotifications = pgTable("task_notifications", {
  id: serial("id").primaryKey(),
  taskId: integer("taskId").references(() => dailyTasks.id).notNull(),
  userId: integer("userId").references(() => users.id).notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  status: notificationStatusEnum("status").default("pending").notNull(),
  channels: jsonb("channels"), // Array of 'email', 'sms', 'in_app'
  scheduledFor: timestamp("scheduledFor"),
  sentAt: timestamp("sentAt"),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type TaskNotification = typeof taskNotifications.$inferSelect;
export type InsertTaskNotification = typeof taskNotifications.$inferInsert;

/**
 * Notification Preferences table for user notification settings
 */
export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id).notNull().unique(),
  emailEnabled: boolean("emailEnabled").default(true).notNull(),
  smsEnabled: boolean("smsEnabled").default(false).notNull(),
  inAppEnabled: boolean("inAppEnabled").default(true).notNull(),
  overdueReminders: boolean("overdueReminders").default(true).notNull(),
  completionNotifications: boolean("completionNotifications").default(true).notNull(),
  assignmentNotifications: boolean("assignmentNotifications").default(true).notNull(),
  statusChangeNotifications: boolean("statusChangeNotifications").default(true).notNull(),
  quietHoursStart: varchar("quietHoursStart", { length: 5 }), // HH:MM format
  quietHoursEnd: varchar("quietHoursEnd", { length: 5 }), // HH:MM format
  timezone: varchar("timezone", { length: 50 }).default("UTC").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

/**
 * Notification History table for audit trail and analytics
 */
export const notificationHistory = pgTable("notification_history", {
  id: serial("id").primaryKey(),
  notificationId: integer("notificationId").references(() => taskNotifications.id).notNull(),
  userId: integer("userId").references(() => users.id).notNull(),
  channel: channelEnum("channel").notNull(),
  status: historyStatusEnum("status").notNull(),
  recipient: varchar("recipient", { length: 255 }).notNull(),
  errorMessage: text("errorMessage"),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  openedAt: timestamp("openedAt"),
  metadata: jsonb("metadata"), // Additional tracking data
});

export type NotificationHistoryRecord = typeof notificationHistory.$inferSelect;
export type InsertNotificationHistory = typeof notificationHistory.$inferInsert;


/**
 * Notification Templates table for customizable notification messages
 */
export const notificationTemplates = pgTable("notification_templates", {
  id: serial("id").primaryKey(),
  createdBy: integer("createdBy").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  subject: varchar("subject", { length: 255 }).notNull(),
  bodyText: text("bodyText").notNull(),
  bodyHtml: text("bodyHtml"),
  channels: jsonb("channels").$type<("email" | "sms" | "in_app")[]>().notNull(),
  variables: jsonb("variables").$type<string[]>(),
  tags: jsonb("tags").$type<string[]>(),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type InsertNotificationTemplate = typeof notificationTemplates.$inferInsert;

/**
 * Notification Triggers table for rule-based notification automation
 */
export const notificationTriggers = pgTable("notification_triggers", {
  id: serial("id").primaryKey(),
  createdBy: integer("createdBy").references(() => users.id).notNull(),
  templateId: integer("templateId").references(() => notificationTemplates.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  triggerCondition: jsonb("triggerCondition").$type<{
    operator: "and" | "or";
    conditions: Array<{
      field: string;
      operator: "equals" | "not_equals" | "greater_than" | "less_than" | "contains" | "in";
      value: unknown;
    }>;
  }>().notNull(),
  actions: jsonb("actions").$type<{
    notifyUsers: "assignee" | "manager" | "all" | string[];
    sendImmediately: boolean;
    delayMinutes?: number;
    maxNotificationsPerDay?: number;
  }>().notNull(),
  isActive: boolean("isActive").notNull().default(true),
  lastTriggeredAt: timestamp("lastTriggeredAt"),
  triggerCount: integer("triggerCount").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type NotificationTrigger = typeof notificationTriggers.$inferSelect;
export type InsertNotificationTrigger = typeof notificationTriggers.$inferInsert;

/**
 * Trigger Execution Log table for tracking trigger evaluations
 */
export const triggerExecutionLog = pgTable("trigger_execution_log", {
  id: serial("id").primaryKey(),
  triggerId: integer("triggerId").references(() => notificationTriggers.id).notNull(),
  entityType: varchar("entityType", { length: 100 }).notNull(),
  entityId: integer("entityId").notNull(),
  conditionsMet: boolean("conditionsMet").notNull(),
  notificationsSent: integer("notificationsSent").notNull().default(0),
  error: text("error"),
  executedAt: timestamp("executedAt").defaultNow().notNull(),
});

export type TriggerExecutionLog = typeof triggerExecutionLog.$inferSelect;
export type InsertTriggerExecutionLog = typeof triggerExecutionLog.$inferInsert;

/**
 * Suppliers table for material procurement management
 */
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  contactPerson: varchar("contact", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  leadTimeDays: integer("leadTimeDays").default(7),
  onTimeDeliveryRate: integer("onTimeDeliveryRate").default(100), // Percent 0-100
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

/**
 * Timesheet upload history — audit log for every bulk import.
 * Tracks file name, row counts, errors, and who triggered the import.
 */
export const timesheetUploadHistory = pgTable("timesheetUploadHistory", {
  id: serial("id").primaryKey(),
  uploadedBy: integer("uploadedBy").references(() => users.id).notNull(),
  fileName: varchar("fileName", { length: 512 }).notNull(),
  fileType: varchar("fileType", { length: 32 }).notNull(), // xlsx | csv | pdf
  totalRows: integer("totalRows").notNull().default(0),
  insertedRows: integer("insertedRows").notNull().default(0),
  failedRows: integer("failedRows").notNull().default(0),
  errors: jsonb("errors").default([]),                 // UploadError[]
  status: varchar("status", { length: 32 }).notNull().default("completed"), // completed | partial | failed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TimesheetUploadHistory = typeof timesheetUploadHistory.$inferSelect;
export type InsertTimesheetUploadHistory = typeof timesheetUploadHistory.$inferInsert;


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
  projectId: integer("project_id").references(() => projects.id),
  projectName: varchar("project_name", { length: 255 }).notNull(),
  concreteType: varchar("concrete_type", { length: 100 }).notNull(),
  volume: integer("volume").notNull(),
  scheduledTime: timestamp("scheduled_time").notNull(),
  actualTime: timestamp("actual_time"),
  status: deliveryStatusEnum("status").default("scheduled").notNull(),
  driverName: varchar("driver_name", { length: 255 }),
  vehicleNumber: varchar("vehicle_number", { length: 100 }),
  notes: text("notes"),
  gpsLocation: varchar("gps_location", { length: 100 }), // "lat,lng"
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  deliveryPhotos: jsonb("delivery_photos"), // JSON array of photo URLs
  estimatedArrival: integer("estimated_arrival"), // Unix timestamp (seconds)
  etaUpdatedAt: timestamp("eta_updated_at"),
  actualArrivalTime: integer("actual_arrival_time"),
  actualDeliveryTime: integer("actual_delivery_time"),
  driverNotes: text("driver_notes"),
  customerName: varchar("customer_name", { length: 255 }),
  customerPhone: varchar("customer_phone", { length: 50 }),
  smsNotificationSent: boolean("sms_notification_sent").default(false),
  delayNotificationSent: boolean("delay_notification_sent").default(false),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  deliveryId: integer("delivery_id").references(() => deliveries.id).notNull(),
  userId: integer("user_id"),    // who made the status change (null = driver app)
  status: varchar("status", { length: 50 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  gpsLocation: varchar("gps_location", { length: 100 }),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  notes: text("notes"),
});

export type DeliveryStatusHistory = typeof deliveryStatusHistory.$inferSelect;
export type InsertDeliveryStatusHistory = typeof deliveryStatusHistory.$inferInsert;

/**
 * Quality tests table for QC records
 */
export const qualityTests = pgTable("quality_tests", {
  id: serial("id").primaryKey(),
  testName: varchar("test_name", { length: 255 }).notNull(),
  testType: testTypeEnum("test_type").default("other").notNull(),
  result: varchar("result", { length: 255 }).notNull(),
  unit: varchar("unit", { length: 50 }),
  status: testStatusEnum("status").default("pending").notNull(),
  deliveryId: integer("delivery_id").references(() => deliveries.id),
  projectId: integer("project_id").references(() => projects.id),
  testedBy: varchar("tested_by", { length: 255 }),
  notes: text("notes"),
  photoUrls: text("photo_urls"), // JSON array of S3 photo URLs
  inspectorSignature: text("inspector_signature"), // Base64 signature image
  supervisorSignature: text("supervisor_signature"), // Base64 signature image
  testLocation: varchar("test_location", { length: 100 }), // GPS coordinates "lat,lng"
  complianceStandard: varchar("compliance_standard", { length: 50 }), // EN 206, ASTM C94, etc.
  offlineSyncStatus: offlineSyncStatusEnum("offline_sync_status").default("synced"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  employeeNumber: varchar("employee_number", { length: 50 }).notNull().unique(),
  position: varchar("position", { length: 100 }).notNull(),
  department: departmentEnum("department").default("construction").notNull(),
  phoneNumber: varchar("phone_number", { length: 50 }),
  email: varchar("email", { length: 320 }),
  hourlyRate: integer("hourly_rate"),
  status: employeeStatusEnum("status").default("active").notNull(),
  hireDate: timestamp("hire_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
export const workHours = pgTable("work_hours", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  projectId: integer("project_id").references(() => projects.id),
  date: timestamp("date").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  hoursWorked: integer("hours_worked"),
  overtimeHours: integer("overtime_hours").default(0),
  workType: workTypeEnum("work_type").default("regular").notNull(),
  notes: text("notes"),
  approvedBy: integer("approved_by").references(() => users.id),
  status: workStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
export const concreteBases = pgTable("concrete_bases", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  location: varchar("location", { length: 500 }).notNull(),
  capacity: integer("capacity").notNull(),
  status: baseStatusEnum("status").default("operational").notNull(),
  managerName: varchar("manager_name", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ConcreteBase = typeof concreteBases.$inferSelect;
export type InsertConcreteBase = typeof concreteBases.$inferInsert;

/**
 * Machines table for equipment tracking
 */
export const machines = pgTable("machines", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  machineNumber: varchar("machine_number", { length: 100 }).notNull().unique(),
  type: machineTypeEnum("type").default("other").notNull(),
  manufacturer: varchar("manufacturer", { length: 255 }),
  model: varchar("model", { length: 255 }),
  year: integer("year"),
  concreteBaseId: integer("concrete_base_id").references(() => concreteBases.id),
  status: machineStatusEnum("status").default("operational").notNull(),
  totalWorkingHours: integer("total_working_hours").default(0),
  lastMaintenanceDate: timestamp("last_maintenance_date"),
  nextMaintenanceDate: timestamp("next_maintenance_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Machine = typeof machines.$inferSelect;
export type InsertMachine = typeof machines.$inferInsert;

/**
 * Machine maintenance table for tracking lubrication, fuel, and maintenance
 */
export const machineMaintenance = pgTable("machine_maintenance", {
  id: serial("id").primaryKey(),
  machineId: integer("machine_id").references(() => machines.id).notNull(),
  date: timestamp("date").notNull(),
  maintenanceType: maintenanceTypeEnum("maintenance_type").default("other").notNull(),
  description: text("description"),
  lubricationType: varchar("lubrication_type", { length: 100 }),
  lubricationAmount: integer("lubrication_amount"),
  fuelType: varchar("fuel_type", { length: 100 }),
  fuelAmount: integer("fuel_amount"),
  cost: integer("cost"),
  performedBy: varchar("performed_by", { length: 255 }),
  hoursAtMaintenance: integer("hours_at_maintenance"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type MachineMaintenance = typeof machineMaintenance.$inferSelect;
export type InsertMachineMaintenance = typeof machineMaintenance.$inferInsert;

/**
 * Machine working hours table for tracking equipment usage
 */
export const machineWorkHours = pgTable("machine_work_hours", {
  id: serial("id").primaryKey(),
  machineId: integer("machine_id").references(() => machines.id).notNull(),
  projectId: integer("project_id").references(() => projects.id),
  date: timestamp("date").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  hoursWorked: integer("hours_worked"),
  operatorId: integer("operator_id").references(() => employees.id),
  operatorName: varchar("operator_name", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type MachineWorkHour = typeof machineWorkHours.$inferSelect;
export type InsertMachineWorkHour = typeof machineWorkHours.$inferInsert;

/**
 * Aggregate input table for tracking raw material input at concrete bases
 */
export const aggregateInputs = pgTable("aggregate_inputs", {
  id: serial("id").primaryKey(),
  concreteBaseId: integer("concrete_base_id").references(() => concreteBases.id).notNull(),
  date: timestamp("date").notNull(),
  materialType: aggregateTypeEnum("material_type").default("other").notNull(),
  materialName: varchar("material_name", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  supplier: varchar("supplier", { length: 255 }),
  batchNumber: varchar("batch_number", { length: 100 }),
  receivedBy: varchar("received_by", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AggregateInput = typeof aggregateInputs.$inferSelect;
export type InsertAggregateInput = typeof aggregateInputs.$inferInsert;

/**
 * Material consumption history for tracking usage over time
 */
export const materialConsumptionHistory = pgTable("material_consumption_history", {
  id: serial("id").primaryKey(),
  materialId: integer("material_id").references(() => materials.id).notNull(),
  quantityUsed: integer("quantity_used").notNull(),
  date: timestamp("date").notNull(),
  projectId: integer("project_id"),
  deliveryId: integer("delivery_id").references(() => deliveries.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type MaterialConsumptionHistory = typeof materialConsumptionHistory.$inferSelect;
export type InsertMaterialConsumptionHistory = typeof materialConsumptionHistory.$inferInsert;

/**
 * Purchase orders table for automated ordering
 */
export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  status: poStatusEnum("status").default("pending").notNull(),
  orderDate: timestamp("order_date").defaultNow().notNull(),
  expectedDelivery: timestamp("expected_delivery"),
  actualDelivery: timestamp("actual_delivery"),
  totalCost: integer("total_cost"),
  notes: text("notes"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;

/**
 * Purchase order items for multi-item orders
 */
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  purchaseOrderId: integer("purchase_order_id").references(() => purchaseOrders.id).notNull(),
  materialId: integer("material_id").references(() => materials.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price"),
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
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  includeProduction: boolean("include_production").default(true).notNull(),
  includeDeliveries: boolean("include_deliveries").default(true).notNull(),
  includeMaterials: boolean("include_materials").default(true).notNull(),
  includeQualityControl: boolean("include_quality_control").default(true).notNull(),
  reportTime: varchar("report_time", { length: 10 }).default("18:00").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
  htmlTemplate: text("html_template").notNull(),
  variables: text("variables"), // JSON string of available variables
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

/**
 * Email branding table for company branding customization
 */
export const emailBranding = pgTable("email_branding", {
  id: serial("id").primaryKey(),
  logoUrl: varchar("logo_url", { length: 500 }),
  primaryColor: varchar("primary_color", { length: 20 }).default("#f97316").notNull(),
  secondaryColor: varchar("secondary_color", { length: 20 }).default("#ea580c").notNull(),
  companyName: varchar("company_name", { length: 255 }).default("AzVirt").notNull(),
  footerText: text("footer_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type EmailBranding = typeof emailBranding.$inferSelect;
export type InsertEmailBranding = typeof emailBranding.$inferInsert;


// AI Assistant Tables
export const aiConversations = pgTable("ai_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }),
  modelName: varchar("model_name", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = typeof aiConversations.$inferInsert;

export const aiMessages = pgTable("ai_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => aiConversations.id).notNull(),
  role: aiRoleEnum("role").notNull(),
  content: text("content").notNull(),
  model: varchar("model", { length: 100 }),
  audioUrl: text("audio_url"),
  imageUrl: text("image_url"),
  thinkingProcess: text("thinking_process"), // JSON string
  toolCalls: text("tool_calls"), // JSON string
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AiMessage = typeof aiMessages.$inferSelect;
export type InsertAiMessage = typeof aiMessages.$inferInsert;

export const aiModels = pgTable("ai_models", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  type: aiModelTypeEnum("type").notNull(),
  size: varchar("size", { length: 20 }),
  isAvailable: boolean("is_available").default(false),
  lastUsed: timestamp("last_used"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AiModel = typeof aiModels.$inferSelect;
export type InsertAiModel = typeof aiModels.$inferInsert;


/**
 * Daily Tasks table for task management
 */
export const dailyTasks = pgTable("daily_tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: timestamp("due_date").notNull(),
  priority: taskPriorityEnum("priority").default("medium").notNull(),
  status: taskStatusEnum("status").default("pending").notNull(),
  assignedTo: integer("assigned_to").references(() => users.id),
  category: varchar("category", { length: 100 }),
  tags: jsonb("tags"),
  attachments: jsonb("attachments"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type DailyTask = typeof dailyTasks.$inferSelect;
export type InsertDailyTask = typeof dailyTasks.$inferInsert;

/**
 * Task Assignments table for responsibility tracking
 */
export const taskAssignments = pgTable("task_assignments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => dailyTasks.id).notNull(),
  assignedTo: integer("assigned_to").references(() => users.id).notNull(),
  assignedBy: integer("assigned_by").references(() => users.id).notNull(),
  responsibility: varchar("responsibility", { length: 255 }).notNull(),
  completionPercentage: integer("completion_percentage").default(0).notNull(),
  notes: text("notes"),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type TaskAssignment = typeof taskAssignments.$inferSelect;
export type InsertTaskAssignment = typeof taskAssignments.$inferInsert;

/**
 * Task Status History table for audit trail
 */
export const taskStatusHistory = pgTable("task_status_history", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => dailyTasks.id).notNull(),
  previousStatus: varchar("previous_status", { length: 50 }),
  newStatus: varchar("new_status", { length: 50 }).notNull(),
  changedBy: integer("changed_by").references(() => users.id).notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TaskStatusHistory = typeof taskStatusHistory.$inferSelect;
export type InsertTaskStatusHistory = typeof taskStatusHistory.$inferInsert;


/**
 * Task Notifications table for tracking task-related notifications
 */
export const taskNotifications = pgTable("task_notifications", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => dailyTasks.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  status: notificationStatusEnum("status").default("pending").notNull(),
  channels: jsonb("channels"), // Array of 'email', 'sms', 'in_app'
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type TaskNotification = typeof taskNotifications.$inferSelect;
export type InsertTaskNotification = typeof taskNotifications.$inferInsert;

/**
 * Notification Preferences table for user notification settings
 */
export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  emailEnabled: boolean("email_enabled").default(true).notNull(),
  smsEnabled: boolean("sms_enabled").default(false).notNull(),
  inAppEnabled: boolean("in_app_enabled").default(true).notNull(),
  overdueReminders: boolean("overdue_reminders").default(true).notNull(),
  completionNotifications: boolean("completion_notifications").default(true).notNull(),
  assignmentNotifications: boolean("assignment_notifications").default(true).notNull(),
  statusChangeNotifications: boolean("status_change_notifications").default(true).notNull(),
  quietHoursStart: varchar("quiet_hours_start", { length: 5 }), // HH:MM format
  quietHoursEnd: varchar("quiet_hours_end", { length: 5 }), // HH:MM format
  timezone: varchar("timezone", { length: 50 }).default("UTC").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

/**
 * Notification History table for audit trail and analytics
 */
export const notificationHistory = pgTable("notification_history", {
  id: serial("id").primaryKey(),
  notificationId: integer("notification_id").references(() => taskNotifications.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  channel: channelEnum("channel").notNull(),
  status: historyStatusEnum("status").notNull(),
  recipient: varchar("recipient", { length: 255 }).notNull(),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  openedAt: timestamp("opened_at"),
  metadata: jsonb("metadata"), // Additional tracking data
});

export type NotificationHistoryRecord = typeof notificationHistory.$inferSelect;
export type InsertNotificationHistory = typeof notificationHistory.$inferInsert;


/**
 * Notification Templates table for customizable notification messages
 */
export const notificationTemplates = pgTable("notification_templates", {
  id: serial("id").primaryKey(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  subject: varchar("subject", { length: 255 }).notNull(),
  bodyText: text("body_text").notNull(),
  bodyHtml: text("body_html"),
  channels: jsonb("channels").$type<("email" | "sms" | "in_app")[]>().notNull(),
  variables: jsonb("variables").$type<string[]>(),
  tags: jsonb("tags").$type<string[]>(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type InsertNotificationTemplate = typeof notificationTemplates.$inferInsert;

/**
 * Notification Triggers table for rule-based notification automation
 */
export const notificationTriggers = pgTable("notification_triggers", {
  id: serial("id").primaryKey(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  templateId: integer("template_id").references(() => notificationTemplates.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  triggerCondition: jsonb("trigger_condition").$type<{
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
  isActive: boolean("is_active").notNull().default(true),
  lastTriggeredAt: timestamp("last_triggered_at"),
  triggerCount: integer("trigger_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type NotificationTrigger = typeof notificationTriggers.$inferSelect;
export type InsertNotificationTrigger = typeof notificationTriggers.$inferInsert;

/**
 * Trigger Execution Log table for tracking trigger evaluations
 */
export const triggerExecutionLog = pgTable("trigger_execution_log", {
  id: serial("id").primaryKey(),
  triggerId: integer("trigger_id").references(() => notificationTriggers.id).notNull(),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  entityId: integer("entity_id").notNull(),
  conditionsMet: boolean("conditions_met").notNull(),
  notificationsSent: integer("notifications_sent").notNull().default(0),
  error: text("error"),
  executedAt: timestamp("executed_at").defaultNow().notNull(),
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
  leadTimeDays: integer("lead_time_days").default(7),
  onTimeDeliveryRate: integer("on_time_delivery_rate").default(100), // Percent 0-100
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

/**
 * Timesheet upload history — audit log for every bulk import.
 * Tracks file name, row counts, errors, and who triggered the import.
 */
export const timesheetUploadHistory = pgTable("timesheet_upload_history", {
  id: serial("id").primaryKey(),
  uploadedBy: integer("uploaded_by").references(() => users.id).notNull(),
  fileName: varchar("file_name", { length: 512 }).notNull(),
  fileType: varchar("file_type", { length: 32 }).notNull(), // xlsx | csv | pdf
  totalRows: integer("total_rows").notNull().default(0),
  insertedRows: integer("inserted_rows").notNull().default(0),
  failedRows: integer("failed_rows").notNull().default(0),
  errors: jsonb("errors").default([]),                 // UploadError[]
  status: varchar("status", { length: 32 }).notNull().default("completed"), // completed | partial | failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TimesheetUploadHistory = typeof timesheetUploadHistory.$inferSelect;
export type InsertTimesheetUploadHistory = typeof timesheetUploadHistory.$inferInsert;


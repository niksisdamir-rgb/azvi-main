CREATE TYPE "public"."aggregate_type" AS ENUM('cement', 'sand', 'gravel', 'water', 'admixture', 'other');--> statement-breakpoint
CREATE TYPE "public"."ai_model_type" AS ENUM('text', 'vision', 'code');--> statement-breakpoint
CREATE TYPE "public"."ai_role" AS ENUM('user', 'assistant', 'system', 'tool');--> statement-breakpoint
CREATE TYPE "public"."base_status" AS ENUM('operational', 'maintenance', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."channel" AS ENUM('email', 'sms', 'in_app');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('scheduled', 'loaded', 'en_route', 'arrived', 'delivered', 'returning', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."department" AS ENUM('construction', 'maintenance', 'quality', 'administration', 'logistics');--> statement-breakpoint
CREATE TYPE "public"."document_category" AS ENUM('contract', 'blueprint', 'report', 'certificate', 'invoice', 'other');--> statement-breakpoint
CREATE TYPE "public"."employee_status" AS ENUM('active', 'inactive', 'on_leave');--> statement-breakpoint
CREATE TYPE "public"."history_status" AS ENUM('sent', 'failed', 'bounced', 'opened');--> statement-breakpoint
CREATE TYPE "public"."machine_status" AS ENUM('operational', 'maintenance', 'repair', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."machine_type" AS ENUM('mixer', 'pump', 'truck', 'excavator', 'crane', 'other');--> statement-breakpoint
CREATE TYPE "public"."maintenance_type" AS ENUM('lubrication', 'fuel', 'oil_change', 'repair', 'inspection', 'other');--> statement-breakpoint
CREATE TYPE "public"."material_category" AS ENUM('cement', 'aggregate', 'admixture', 'water', 'other');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('pending', 'sent', 'failed', 'read');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('overdue_reminder', 'completion_confirmation', 'assignment', 'status_change', 'comment');--> statement-breakpoint
CREATE TYPE "public"."offline_sync_status" AS ENUM('synced', 'pending', 'failed');--> statement-breakpoint
CREATE TYPE "public"."po_status" AS ENUM('pending', 'approved', 'ordered', 'received', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('planning', 'active', 'completed', 'on_hold');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('pending', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."test_status" AS ENUM('pass', 'fail', 'pending');--> statement-breakpoint
CREATE TYPE "public"."test_type" AS ENUM('slump', 'strength', 'air_content', 'temperature', 'other');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."work_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."work_type" AS ENUM('regular', 'overtime', 'weekend', 'holiday');--> statement-breakpoint
CREATE TABLE "aggregateInputs" (
	"id" serial PRIMARY KEY NOT NULL,
	"concreteBaseId" integer NOT NULL,
	"date" timestamp NOT NULL,
	"materialType" "aggregate_type" DEFAULT 'other' NOT NULL,
	"materialName" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"unit" varchar(50) NOT NULL,
	"supplier" varchar(255),
	"batchNumber" varchar(100),
	"receivedBy" varchar(255),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"title" varchar(255),
	"modelName" varchar(100),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversationId" integer NOT NULL,
	"role" "ai_role" NOT NULL,
	"content" text NOT NULL,
	"model" varchar(100),
	"audioUrl" text,
	"imageUrl" text,
	"thinkingProcess" text,
	"toolCalls" text,
	"metadata" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"displayName" varchar(255) NOT NULL,
	"type" "ai_model_type" NOT NULL,
	"size" varchar(20),
	"isAvailable" boolean DEFAULT false,
	"lastUsed" timestamp,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_models_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "concreteBases" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"location" varchar(500) NOT NULL,
	"capacity" integer NOT NULL,
	"status" "base_status" DEFAULT 'operational' NOT NULL,
	"managerName" varchar(255),
	"phoneNumber" varchar(50),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"dueDate" timestamp NOT NULL,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"status" "task_status" DEFAULT 'pending' NOT NULL,
	"assignedTo" integer,
	"category" varchar(100),
	"tags" jsonb,
	"attachments" jsonb,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectId" integer,
	"projectName" varchar(255) NOT NULL,
	"concreteType" varchar(100) NOT NULL,
	"volume" integer NOT NULL,
	"scheduledTime" timestamp NOT NULL,
	"actualTime" timestamp,
	"status" "delivery_status" DEFAULT 'scheduled' NOT NULL,
	"driverName" varchar(255),
	"vehicleNumber" varchar(100),
	"notes" text,
	"gpsLocation" varchar(100),
	"deliveryPhotos" text,
	"estimatedArrival" integer,
	"actualArrivalTime" integer,
	"actualDeliveryTime" integer,
	"driverNotes" text,
	"customerName" varchar(255),
	"customerPhone" varchar(50),
	"smsNotificationSent" boolean DEFAULT false,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_status_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"deliveryId" integer NOT NULL,
	"status" varchar(50) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"gpsLocation" varchar(100),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"fileKey" varchar(500) NOT NULL,
	"fileUrl" varchar(1000) NOT NULL,
	"mimeType" varchar(100),
	"fileSize" integer,
	"category" "document_category" DEFAULT 'other' NOT NULL,
	"projectId" integer,
	"uploadedBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_branding" (
	"id" serial PRIMARY KEY NOT NULL,
	"logoUrl" varchar(500),
	"primaryColor" varchar(20) DEFAULT '#f97316' NOT NULL,
	"secondaryColor" varchar(20) DEFAULT '#ea580c' NOT NULL,
	"companyName" varchar(255) DEFAULT 'AzVirt' NOT NULL,
	"footerText" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(100) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"htmlTemplate" text NOT NULL,
	"variables" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_templates_type_unique" UNIQUE("type")
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"firstName" varchar(100) NOT NULL,
	"lastName" varchar(100) NOT NULL,
	"employeeNumber" varchar(50) NOT NULL,
	"position" varchar(100) NOT NULL,
	"department" "department" DEFAULT 'construction' NOT NULL,
	"phoneNumber" varchar(50),
	"email" varchar(320),
	"hourlyRate" integer,
	"status" "employee_status" DEFAULT 'active' NOT NULL,
	"hireDate" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employees_employeeNumber_unique" UNIQUE("employeeNumber")
);
--> statement-breakpoint
CREATE TABLE "forecast_predictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"materialId" integer NOT NULL,
	"materialName" varchar(255) NOT NULL,
	"currentStock" integer NOT NULL,
	"dailyConsumptionRate" integer NOT NULL,
	"predictedRunoutDate" timestamp,
	"daysUntilStockout" integer,
	"recommendedOrderQty" integer,
	"confidence" integer,
	"calculatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "machineMaintenance" (
	"id" serial PRIMARY KEY NOT NULL,
	"machineId" integer NOT NULL,
	"date" timestamp NOT NULL,
	"maintenanceType" "maintenance_type" DEFAULT 'other' NOT NULL,
	"description" text,
	"lubricationType" varchar(100),
	"lubricationAmount" integer,
	"fuelType" varchar(100),
	"fuelAmount" integer,
	"cost" integer,
	"performedBy" varchar(255),
	"hoursAtMaintenance" integer,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "machineWorkHours" (
	"id" serial PRIMARY KEY NOT NULL,
	"machineId" integer NOT NULL,
	"projectId" integer,
	"date" timestamp NOT NULL,
	"startTime" timestamp NOT NULL,
	"endTime" timestamp,
	"hoursWorked" integer,
	"operatorId" integer,
	"operatorName" varchar(255),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "machines" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"machineNumber" varchar(100) NOT NULL,
	"type" "machine_type" DEFAULT 'other' NOT NULL,
	"manufacturer" varchar(255),
	"model" varchar(255),
	"year" integer,
	"concreteBaseId" integer,
	"status" "machine_status" DEFAULT 'operational' NOT NULL,
	"totalWorkingHours" integer DEFAULT 0,
	"lastMaintenanceDate" timestamp,
	"nextMaintenanceDate" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "machines_machineNumber_unique" UNIQUE("machineNumber")
);
--> statement-breakpoint
CREATE TABLE "material_consumption_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"materialId" integer NOT NULL,
	"quantity" integer NOT NULL,
	"consumptionDate" timestamp NOT NULL,
	"projectId" integer,
	"deliveryId" integer,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" "material_category" DEFAULT 'other' NOT NULL,
	"unit" varchar(50) NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"minStock" integer DEFAULT 0 NOT NULL,
	"criticalThreshold" integer DEFAULT 0 NOT NULL,
	"supplier" varchar(255),
	"unitPrice" integer,
	"lowStockEmailSent" boolean DEFAULT false,
	"lastEmailSentAt" timestamp,
	"supplierEmail" varchar(255),
	"leadTimeDays" integer DEFAULT 7,
	"reorderPoint" integer,
	"optimalOrderQuantity" integer,
	"supplierId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"notificationId" integer NOT NULL,
	"userId" integer NOT NULL,
	"channel" "channel" NOT NULL,
	"status" "history_status" NOT NULL,
	"recipient" varchar(255) NOT NULL,
	"errorMessage" text,
	"sentAt" timestamp DEFAULT now() NOT NULL,
	"openedAt" timestamp,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"emailEnabled" boolean DEFAULT true NOT NULL,
	"smsEnabled" boolean DEFAULT false NOT NULL,
	"inAppEnabled" boolean DEFAULT true NOT NULL,
	"overdueReminders" boolean DEFAULT true NOT NULL,
	"completionNotifications" boolean DEFAULT true NOT NULL,
	"assignmentNotifications" boolean DEFAULT true NOT NULL,
	"statusChangeNotifications" boolean DEFAULT true NOT NULL,
	"quietHoursStart" varchar(5),
	"quietHoursEnd" varchar(5),
	"timezone" varchar(50) DEFAULT 'UTC' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "notification_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdBy" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"subject" varchar(255) NOT NULL,
	"bodyText" text NOT NULL,
	"bodyHtml" text,
	"channels" jsonb NOT NULL,
	"variables" jsonb,
	"tags" jsonb,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_triggers" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdBy" integer NOT NULL,
	"templateId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"eventType" varchar(100) NOT NULL,
	"triggerCondition" jsonb NOT NULL,
	"actions" jsonb NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"lastTriggeredAt" timestamp,
	"triggerCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"location" varchar(500),
	"status" "project_status" DEFAULT 'planning' NOT NULL,
	"startDate" timestamp,
	"endDate" timestamp,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"materialId" integer NOT NULL,
	"materialName" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"supplier" varchar(255),
	"supplierEmail" varchar(255),
	"status" "po_status" DEFAULT 'pending' NOT NULL,
	"orderDate" timestamp DEFAULT now() NOT NULL,
	"expectedDelivery" timestamp,
	"actualDelivery" timestamp,
	"totalCost" integer,
	"notes" text,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qualityTests" (
	"id" serial PRIMARY KEY NOT NULL,
	"testName" varchar(255) NOT NULL,
	"testType" "test_type" DEFAULT 'other' NOT NULL,
	"result" varchar(255) NOT NULL,
	"unit" varchar(50),
	"status" "test_status" DEFAULT 'pending' NOT NULL,
	"deliveryId" integer,
	"projectId" integer,
	"testedBy" varchar(255),
	"notes" text,
	"photoUrls" text,
	"inspectorSignature" text,
	"supervisorSignature" text,
	"testLocation" varchar(100),
	"complianceStandard" varchar(50),
	"offlineSyncStatus" "offline_sync_status" DEFAULT 'synced',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_recipients" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"name" varchar(255),
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"includeProduction" boolean DEFAULT true NOT NULL,
	"includeDeliveries" boolean DEFAULT true NOT NULL,
	"includeMaterials" boolean DEFAULT true NOT NULL,
	"includeQualityControl" boolean DEFAULT true NOT NULL,
	"reportTime" varchar(10) DEFAULT '18:00' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "report_settings_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"contactPerson" varchar(255),
	"email" varchar(320),
	"phone" varchar(50),
	"averageLeadTimeDays" integer DEFAULT 7,
	"onTimeDeliveryRate" integer DEFAULT 100,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"taskId" integer NOT NULL,
	"assignedTo" integer NOT NULL,
	"assignedBy" integer NOT NULL,
	"responsibility" varchar(255) NOT NULL,
	"completionPercentage" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"assignedAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"taskId" integer NOT NULL,
	"userId" integer NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"status" "notification_status" DEFAULT 'pending' NOT NULL,
	"channels" jsonb,
	"scheduledFor" timestamp,
	"sentAt" timestamp,
	"readAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_status_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"taskId" integer NOT NULL,
	"previousStatus" varchar(50),
	"newStatus" varchar(50) NOT NULL,
	"changedBy" integer NOT NULL,
	"reason" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trigger_execution_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"triggerId" integer NOT NULL,
	"entityType" varchar(100) NOT NULL,
	"entityId" integer NOT NULL,
	"conditionsMet" boolean NOT NULL,
	"notificationsSent" integer DEFAULT 0 NOT NULL,
	"error" text,
	"executedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(64),
	"passwordHash" text,
	"openId" varchar(64),
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"phoneNumber" varchar(50),
	"smsNotificationsEnabled" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "workHours" (
	"id" serial PRIMARY KEY NOT NULL,
	"employeeId" integer NOT NULL,
	"projectId" integer,
	"date" timestamp NOT NULL,
	"startTime" timestamp NOT NULL,
	"endTime" timestamp,
	"hoursWorked" integer,
	"overtimeHours" integer DEFAULT 0,
	"workType" "work_type" DEFAULT 'regular' NOT NULL,
	"notes" text,
	"approvedBy" integer,
	"status" "work_status" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

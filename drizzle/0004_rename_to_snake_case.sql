-- Migration: 0004_rename_to_snake_case
-- Standardize all table and column names to snake_case

-- ─────────────────────────────────────────────────────────────────
-- Rename Tables
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "aggregateInputs" RENAME TO "aggregate_inputs";
ALTER TABLE "concreteBases" RENAME TO "concrete_bases";
ALTER TABLE "machineMaintenance" RENAME TO "machine_maintenance";
ALTER TABLE "machineWorkHours" RENAME TO "machine_work_hours";
ALTER TABLE "qualityTests" RENAME TO "quality_tests";
ALTER TABLE "workHours" RENAME TO "work_hours";
ALTER TABLE "timesheetUploadHistory" RENAME TO "timesheet_upload_history";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: users
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "users" RENAME COLUMN "passwordHash" TO "password_hash";
ALTER TABLE "users" RENAME COLUMN "openId" TO "open_id";
ALTER TABLE "users" RENAME COLUMN "loginMethod" TO "login_method";
ALTER TABLE "users" RENAME COLUMN "phoneNumber" TO "phone_number";
ALTER TABLE "users" RENAME COLUMN "smsNotificationsEnabled" TO "sms_notifications_enabled";
ALTER TABLE "users" RENAME COLUMN "lastSignedIn" TO "last_signed_in";
ALTER TABLE "users" RENAME COLUMN "forcePasswordChange" TO "force_password_change";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: projects
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "projects" RENAME COLUMN "startDate" TO "start_date";
ALTER TABLE "projects" RENAME COLUMN "endDate" TO "end_date";
ALTER TABLE "projects" RENAME COLUMN "createdBy" TO "created_by";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: documents
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "documents" RENAME COLUMN "fileKey" TO "file_key";
ALTER TABLE "documents" RENAME COLUMN "fileUrl" TO "file_url";
ALTER TABLE "documents" RENAME COLUMN "mimeType" TO "mime_type";
ALTER TABLE "documents" RENAME COLUMN "fileSize" TO "file_size";
ALTER TABLE "documents" RENAME COLUMN "projectId" TO "project_id";
ALTER TABLE "documents" RENAME COLUMN "uploadedBy" TO "uploaded_by";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: deliveries
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "deliveries" RENAME COLUMN "projectId" TO "project_id";
ALTER TABLE "deliveries" RENAME COLUMN "projectName" TO "project_name";
ALTER TABLE "deliveries" RENAME COLUMN "concreteType" TO "concrete_type";
ALTER TABLE "deliveries" RENAME COLUMN "scheduledTime" TO "scheduled_time";
ALTER TABLE "deliveries" RENAME COLUMN "actualTime" TO "actual_time";
ALTER TABLE "deliveries" RENAME COLUMN "driverName" TO "driver_name";
ALTER TABLE "deliveries" RENAME COLUMN "vehicleNumber" TO "vehicle_number";
ALTER TABLE "deliveries" RENAME COLUMN "gpsLocation" TO "gps_location";
ALTER TABLE "deliveries" RENAME COLUMN "deliveryPhotos" TO "delivery_photos";
ALTER TABLE "deliveries" RENAME COLUMN "estimatedArrival" TO "estimated_arrival";
ALTER TABLE "deliveries" RENAME COLUMN "actualArrivalTime" TO "actual_arrival_time";
ALTER TABLE "deliveries" RENAME COLUMN "actualDeliveryTime" TO "actual_delivery_time";
ALTER TABLE "deliveries" RENAME COLUMN "driverNotes" TO "driver_notes";
ALTER TABLE "deliveries" RENAME COLUMN "customerName" TO "customer_name";
ALTER TABLE "deliveries" RENAME COLUMN "customerPhone" TO "customer_phone";
ALTER TABLE "deliveries" RENAME COLUMN "smsNotificationSent" TO "sms_notification_sent";
ALTER TABLE "deliveries" RENAME COLUMN "createdBy" TO "created_by";
ALTER TABLE "deliveries" RENAME COLUMN "etaUpdatedAt" TO "eta_updated_at";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: delivery_status_history
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "delivery_status_history" RENAME COLUMN "deliveryId" TO "delivery_id";
ALTER TABLE "delivery_status_history" RENAME COLUMN "gpsLocation" TO "gps_location";
ALTER TABLE "delivery_status_history" RENAME COLUMN "userId" TO "user_id";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: quality_tests (renamed from qualityTests)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "quality_tests" RENAME COLUMN "testName" TO "test_name";
ALTER TABLE "quality_tests" RENAME COLUMN "testType" TO "test_type";
ALTER TABLE "quality_tests" RENAME COLUMN "deliveryId" TO "delivery_id";
ALTER TABLE "quality_tests" RENAME COLUMN "projectId" TO "project_id";
ALTER TABLE "quality_tests" RENAME COLUMN "testedBy" TO "tested_by";
ALTER TABLE "quality_tests" RENAME COLUMN "photoUrls" TO "photo_urls";
ALTER TABLE "quality_tests" RENAME COLUMN "inspectorSignature" TO "inspector_signature";
ALTER TABLE "quality_tests" RENAME COLUMN "supervisorSignature" TO "supervisor_signature";
ALTER TABLE "quality_tests" RENAME COLUMN "testLocation" TO "test_location";
ALTER TABLE "quality_tests" RENAME COLUMN "complianceStandard" TO "compliance_standard";
ALTER TABLE "quality_tests" RENAME COLUMN "offlineSyncStatus" TO "offline_sync_status";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: employees
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "employees" RENAME COLUMN "firstName" TO "first_name";
ALTER TABLE "employees" RENAME COLUMN "lastName" TO "last_name";
ALTER TABLE "employees" RENAME COLUMN "employeeNumber" TO "employee_number";
ALTER TABLE "employees" RENAME COLUMN "hourlyRate" TO "hourly_rate";
ALTER TABLE "employees" RENAME COLUMN "hireDate" TO "hire_date";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: work_hours (renamed from workHours)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "work_hours" RENAME COLUMN "employeeId" TO "employee_id";
ALTER TABLE "work_hours" RENAME COLUMN "projectId" TO "project_id";
ALTER TABLE "work_hours" RENAME COLUMN "startTime" TO "start_time";
ALTER TABLE "work_hours" RENAME COLUMN "endTime" TO "end_time";
ALTER TABLE "work_hours" RENAME COLUMN "hoursWorked" TO "hours_worked";
ALTER TABLE "work_hours" RENAME COLUMN "overtimeHours" TO "overtime_hours";
ALTER TABLE "work_hours" RENAME COLUMN "approvedBy" TO "approved_by";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: concrete_bases (renamed from concreteBases)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "concrete_bases" RENAME COLUMN "managerName" TO "manager_name";
ALTER TABLE "concrete_bases" RENAME COLUMN "phoneNumber" TO "phone_number";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: machines
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "machines" RENAME COLUMN "machineNumber" TO "machine_number";
ALTER TABLE "machines" RENAME COLUMN "concreteBaseId" TO "concrete_base_id";
ALTER TABLE "machines" RENAME COLUMN "totalWorkingHours" TO "total_working_hours";
ALTER TABLE "machines" RENAME COLUMN "lastMaintenanceDate" TO "last_maintenance_date";
ALTER TABLE "machines" RENAME COLUMN "nextMaintenanceDate" TO "next_maintenance_date";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: machine_maintenance (renamed from machineMaintenance)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "machine_maintenance" RENAME COLUMN "machineId" TO "machine_id";
ALTER TABLE "machine_maintenance" RENAME COLUMN "maintenanceType" TO "maintenance_type";
ALTER TABLE "machine_maintenance" RENAME COLUMN "lubricationType" TO "lubrication_type";
ALTER TABLE "machine_maintenance" RENAME COLUMN "lubricationAmount" TO "lubrication_amount";
ALTER TABLE "machine_maintenance" RENAME COLUMN "fuelType" TO "fuel_type";
ALTER TABLE "machine_maintenance" RENAME COLUMN "fuelAmount" TO "fuel_amount";
ALTER TABLE "machine_maintenance" RENAME COLUMN "performedBy" TO "performed_by";
ALTER TABLE "machine_maintenance" RENAME COLUMN "hoursAtMaintenance" TO "hours_at_maintenance";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: machine_work_hours (renamed from machineWorkHours)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "machine_work_hours" RENAME COLUMN "machineId" TO "machine_id";
ALTER TABLE "machine_work_hours" RENAME COLUMN "projectId" TO "project_id";
ALTER TABLE "machine_work_hours" RENAME COLUMN "startTime" TO "start_time";
ALTER TABLE "machine_work_hours" RENAME COLUMN "endTime" TO "end_time";
ALTER TABLE "machine_work_hours" RENAME COLUMN "hoursWorked" TO "hours_worked";
ALTER TABLE "machine_work_hours" RENAME COLUMN "operatorId" TO "operator_id";
ALTER TABLE "machine_work_hours" RENAME COLUMN "operatorName" TO "operator_name";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: aggregate_inputs (renamed from aggregateInputs)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "aggregate_inputs" RENAME COLUMN "concreteBaseId" TO "concrete_base_id";
ALTER TABLE "aggregate_inputs" RENAME COLUMN "materialType" TO "material_type";
ALTER TABLE "aggregate_inputs" RENAME COLUMN "materialName" TO "material_name";
ALTER TABLE "aggregate_inputs" RENAME COLUMN "batchNumber" TO "batch_number";
ALTER TABLE "aggregate_inputs" RENAME COLUMN "receivedBy" TO "received_by";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: material_consumption_log (retained table name or renamed to history?)
-- ─────────────────────────────────────────────────────────────────
-- Note: In schema.ts it is pgTable("material_consumption_history")
ALTER TABLE "material_consumption_log" RENAME TO "material_consumption_history";
ALTER TABLE "material_consumption_history" RENAME COLUMN "consumptionDate" TO "consumption_date";
ALTER TABLE "material_consumption_history" RENAME COLUMN "projectId" TO "project_id";
ALTER TABLE "material_consumption_history" RENAME COLUMN "deliveryId" TO "delivery_id";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: materials
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "materials" RENAME COLUMN "minStock" TO "min_stock";
ALTER TABLE "materials" RENAME COLUMN "criticalThreshold" TO "critical_threshold";
ALTER TABLE "materials" RENAME COLUMN "unitPrice" TO "unit_price";
ALTER TABLE "materials" RENAME COLUMN "lowStockEmailSent" TO "low_stock_email_sent";
ALTER TABLE "materials" RENAME COLUMN "lastEmailSentAt" TO "last_email_sent_at";
ALTER TABLE "materials" RENAME COLUMN "supplierEmail" TO "supplier_email";
ALTER TABLE "materials" RENAME COLUMN "leadTimeDays" TO "lead_time_days";
ALTER TABLE "materials" RENAME COLUMN "reorderPoint" TO "reorder_point";
ALTER TABLE "materials" RENAME COLUMN "optimalOrderQuantity" TO "optimal_order_quantity";
ALTER TABLE "materials" RENAME COLUMN "supplierId" TO "supplier_id";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: ai_conversations
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "ai_conversations" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "ai_conversations" RENAME COLUMN "modelName" TO "model_name";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: ai_messages
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "ai_messages" RENAME COLUMN "conversationId" TO "conversation_id";
ALTER TABLE "ai_messages" RENAME COLUMN "audioUrl" TO "audio_url";
ALTER TABLE "ai_messages" RENAME COLUMN "imageUrl" TO "image_url";
ALTER TABLE "ai_messages" RENAME COLUMN "thinkingProcess" TO "thinking_process";
ALTER TABLE "ai_messages" RENAME COLUMN "toolCalls" TO "tool_calls";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: ai_models
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "ai_models" RENAME COLUMN "displayName" TO "display_name";
ALTER TABLE "ai_models" RENAME COLUMN "isAvailable" TO "is_available";
ALTER TABLE "ai_models" RENAME COLUMN "lastUsed" TO "last_used";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: daily_tasks
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "daily_tasks" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "daily_tasks" RENAME COLUMN "dueDate" TO "due_date";
ALTER TABLE "daily_tasks" RENAME COLUMN "assignedTo" TO "assigned_to";
ALTER TABLE "daily_tasks" RENAME COLUMN "completedAt" TO "completed_at";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: task_assignments
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "task_assignments" RENAME COLUMN "taskId" TO "task_id";
ALTER TABLE "task_assignments" RENAME COLUMN "assignedTo" TO "assigned_to";
ALTER TABLE "task_assignments" RENAME COLUMN "assignedBy" TO "assigned_by";
ALTER TABLE "task_assignments" RENAME COLUMN "completionPercentage" TO "completion_percentage";
ALTER TABLE "task_assignments" RENAME COLUMN "assignedAt" TO "assigned_at";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: task_status_history
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "task_status_history" RENAME COLUMN "taskId" TO "task_id";
ALTER TABLE "task_status_history" RENAME COLUMN "previousStatus" TO "previous_status";
ALTER TABLE "task_status_history" RENAME COLUMN "newStatus" TO "new_status";
ALTER TABLE "task_status_history" RENAME COLUMN "changedBy" TO "changed_by";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: task_notifications
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "task_notifications" RENAME COLUMN "taskId" TO "task_id";
ALTER TABLE "task_notifications" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "task_notifications" RENAME COLUMN "scheduledFor" TO "scheduled_for";
ALTER TABLE "task_notifications" RENAME COLUMN "sentAt" TO "sent_at";
ALTER TABLE "task_notifications" RENAME COLUMN "readAt" TO "read_at";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: notification_preferences
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "notification_preferences" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "notification_preferences" RENAME COLUMN "emailEnabled" TO "email_enabled";
ALTER TABLE "notification_preferences" RENAME COLUMN "smsEnabled" TO "sms_enabled";
ALTER TABLE "notification_preferences" RENAME COLUMN "inAppEnabled" TO "in_app_enabled";
ALTER TABLE "notification_preferences" RENAME COLUMN "overdueReminders" TO "overdue_reminders";
ALTER TABLE "notification_preferences" RENAME COLUMN "completionNotifications" TO "completion_notifications";
ALTER TABLE "notification_preferences" RENAME COLUMN "assignmentNotifications" TO "assignment_notifications";
ALTER TABLE "notification_preferences" RENAME COLUMN "statusChangeNotifications" TO "status_change_notifications";
ALTER TABLE "notification_preferences" RENAME COLUMN "quietHoursStart" TO "quiet_hours_start";
ALTER TABLE "notification_preferences" RENAME COLUMN "quietHoursEnd" TO "quiet_hours_end";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: notification_history
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "notification_history" RENAME COLUMN "notificationId" TO "notification_id";
ALTER TABLE "notification_history" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "notification_history" RENAME COLUMN "errorMessage" TO "error_message";
ALTER TABLE "notification_history" RENAME COLUMN "sentAt" TO "sent_at";
ALTER TABLE "notification_history" RENAME COLUMN "openedAt" TO "opened_at";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: notification_templates
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "notification_templates" RENAME COLUMN "createdBy" TO "created_by";
ALTER TABLE "notification_templates" RENAME COLUMN "bodyText" TO "body_text";
ALTER TABLE "notification_templates" RENAME COLUMN "bodyHtml" TO "body_html";
ALTER TABLE "notification_templates" RENAME COLUMN "isActive" TO "is_active";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: notification_triggers
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "notification_triggers" RENAME COLUMN "createdBy" TO "created_by";
ALTER TABLE "notification_triggers" RENAME COLUMN "templateId" TO "template_id";
ALTER TABLE "notification_triggers" RENAME COLUMN "eventType" TO "event_type";
ALTER TABLE "notification_triggers" RENAME COLUMN "triggerCondition" TO "trigger_condition";
ALTER TABLE "notification_triggers" RENAME COLUMN "isActive" TO "is_active";
ALTER TABLE "notification_triggers" RENAME COLUMN "lastTriggeredAt" TO "last_triggered_at";
ALTER TABLE "notification_triggers" RENAME COLUMN "triggerCount" TO "trigger_count";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: trigger_execution_log
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "trigger_execution_log" RENAME COLUMN "triggerId" TO "trigger_id";
ALTER TABLE "trigger_execution_log" RENAME COLUMN "entityType" TO "entity_type";
ALTER TABLE "trigger_execution_log" RENAME COLUMN "entityId" TO "entity_id";
ALTER TABLE "trigger_execution_log" RENAME COLUMN "conditionsMet" TO "conditions_met";
ALTER TABLE "trigger_execution_log" RENAME COLUMN "notificationsSent" TO "notifications_sent";
ALTER TABLE "trigger_execution_log" RENAME COLUMN "executedAt" TO "executed_at";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: purchase_orders
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "purchase_orders" RENAME COLUMN "materialId" TO "material_id";
ALTER TABLE "purchase_orders" RENAME COLUMN "materialName" TO "material_name";
ALTER TABLE "purchase_orders" RENAME COLUMN "supplierEmail" TO "supplier_email";
ALTER TABLE "purchase_orders" RENAME COLUMN "orderDate" TO "order_date";
ALTER TABLE "purchase_orders" RENAME COLUMN "expectedDelivery" TO "expected_delivery";
ALTER TABLE "purchase_orders" RENAME COLUMN "actualDelivery" TO "actual_delivery";
ALTER TABLE "purchase_orders" RENAME COLUMN "totalCost" TO "total_cost";
ALTER TABLE "purchase_orders" RENAME COLUMN "createdBy" TO "created_by";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: report_settings
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "report_settings" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "report_settings" RENAME COLUMN "includeProduction" TO "include_production";
ALTER TABLE "report_settings" RENAME COLUMN "includeDeliveries" TO "include_deliveries";
ALTER TABLE "report_settings" RENAME COLUMN "includeMaterials" TO "include_materials";
ALTER TABLE "report_settings" RENAME COLUMN "includeQualityControl" TO "include_quality_control";
ALTER TABLE "report_settings" RENAME COLUMN "reportTime" TO "report_time";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: suppliers
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "suppliers" RENAME COLUMN "averageLeadTimeDays" TO "lead_time_days";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: timesheet_upload_history (renamed from timesheetUploadHistory)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "timesheet_upload_history" RENAME COLUMN "uploadedBy" TO "uploaded_by";
ALTER TABLE "timesheet_upload_history" RENAME COLUMN "fileName" TO "file_name";
ALTER TABLE "timesheet_upload_history" RENAME COLUMN "fileType" TO "file_type";
ALTER TABLE "timesheet_upload_history" RENAME COLUMN "totalRows" TO "total_rows";
ALTER TABLE "timesheet_upload_history" RENAME COLUMN "insertedRows" TO "inserted_rows";
ALTER TABLE "timesheet_upload_history" RENAME COLUMN "failedRows" TO "failed_rows";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: forecast_predictions
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "forecast_predictions" RENAME COLUMN "materialId" TO "material_id";
ALTER TABLE "forecast_predictions" RENAME COLUMN "materialName" TO "material_name";
ALTER TABLE "forecast_predictions" RENAME COLUMN "currentStock" TO "current_stock";
ALTER TABLE "forecast_predictions" RENAME COLUMN "dailyConsumptionRate" TO "daily_consumption_rate";
ALTER TABLE "forecast_predictions" RENAME COLUMN "predictedRunoutDate" TO "predicted_runout_date";
ALTER TABLE "forecast_predictions" RENAME COLUMN "daysUntilStockout" TO "days_until_stockout";
ALTER TABLE "forecast_predictions" RENAME COLUMN "recommendedOrderQty" TO "recommended_order_quantity";
ALTER TABLE "forecast_predictions" RENAME COLUMN "calculatedAt" TO "calculated_at";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: email_branding
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "email_branding" RENAME COLUMN "logoUrl" TO "logo_url";
ALTER TABLE "email_branding" RENAME COLUMN "primaryColor" TO "primary_color";
ALTER TABLE "email_branding" RENAME COLUMN "secondaryColor" TO "secondary_color";
ALTER TABLE "email_branding" RENAME COLUMN "companyName" TO "company_name";
ALTER TABLE "email_branding" RENAME COLUMN "footerText" TO "footer_text";

-- ─────────────────────────────────────────────────────────────────
-- Rename Columns: email_templates
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "email_templates" RENAME COLUMN "htmlTemplate" TO "html_template";
ALTER TABLE "email_templates" RENAME COLUMN "isActive" TO "is_active";

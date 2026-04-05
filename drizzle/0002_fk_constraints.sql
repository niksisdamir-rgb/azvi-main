-- Migration: 0002_fk_constraints
-- Phase 2.1 — Add Foreign Key constraints to enforce referential integrity
-- Generated: 2026-04-05
-- Run ONLY after verifying no orphaned data exists (see TODOnext.md 2.1 preflight)

-- ─────────────────────────────────────────────────────────────────
-- projects
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "projects"
  ADD CONSTRAINT "projects_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "users"("id");

-- ─────────────────────────────────────────────────────────────────
-- documents
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "documents"
  ADD CONSTRAINT "documents_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id"),
  ADD CONSTRAINT "documents_uploadedBy_fkey"
    FOREIGN KEY ("uploadedBy") REFERENCES "users"("id");

-- ─────────────────────────────────────────────────────────────────
-- deliveries
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "deliveries"
  ADD CONSTRAINT "deliveries_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id"),
  ADD CONSTRAINT "deliveries_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "users"("id");

-- ─────────────────────────────────────────────────────────────────
-- delivery_status_history
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "delivery_status_history"
  ADD CONSTRAINT "delivery_status_history_deliveryId_fkey"
    FOREIGN KEY ("deliveryId") REFERENCES "deliveries"("id");

-- ─────────────────────────────────────────────────────────────────
-- qualityTests
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "qualityTests"
  ADD CONSTRAINT "qualityTests_deliveryId_fkey"
    FOREIGN KEY ("deliveryId") REFERENCES "deliveries"("id"),
  ADD CONSTRAINT "qualityTests_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id");

-- ─────────────────────────────────────────────────────────────────
-- workHours
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "workHours"
  ADD CONSTRAINT "workHours_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "employees"("id"),
  ADD CONSTRAINT "workHours_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id"),
  ADD CONSTRAINT "workHours_approvedBy_fkey"
    FOREIGN KEY ("approvedBy") REFERENCES "users"("id");

-- ─────────────────────────────────────────────────────────────────
-- machines
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "machines"
  ADD CONSTRAINT "machines_concreteBaseId_fkey"
    FOREIGN KEY ("concreteBaseId") REFERENCES "concreteBases"("id");

-- ─────────────────────────────────────────────────────────────────
-- machineMaintenance
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "machineMaintenance"
  ADD CONSTRAINT "machineMaintenance_machineId_fkey"
    FOREIGN KEY ("machineId") REFERENCES "machines"("id");

-- ─────────────────────────────────────────────────────────────────
-- machineWorkHours
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "machineWorkHours"
  ADD CONSTRAINT "machineWorkHours_machineId_fkey"
    FOREIGN KEY ("machineId") REFERENCES "machines"("id"),
  ADD CONSTRAINT "machineWorkHours_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id"),
  ADD CONSTRAINT "machineWorkHours_operatorId_fkey"
    FOREIGN KEY ("operatorId") REFERENCES "employees"("id");

-- ─────────────────────────────────────────────────────────────────
-- aggregateInputs
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "aggregateInputs"
  ADD CONSTRAINT "aggregateInputs_concreteBaseId_fkey"
    FOREIGN KEY ("concreteBaseId") REFERENCES "concreteBases"("id");

-- ─────────────────────────────────────────────────────────────────
-- report_settings
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "report_settings"
  ADD CONSTRAINT "report_settings_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id");

-- ─────────────────────────────────────────────────────────────────
-- ai_conversations
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "ai_conversations"
  ADD CONSTRAINT "ai_conversations_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id");

-- ─────────────────────────────────────────────────────────────────
-- ai_messages
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "ai_messages"
  ADD CONSTRAINT "ai_messages_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "ai_conversations"("id");

-- ─────────────────────────────────────────────────────────────────
-- daily_tasks
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "daily_tasks"
  ADD CONSTRAINT "daily_tasks_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id"),
  ADD CONSTRAINT "daily_tasks_assignedTo_fkey"
    FOREIGN KEY ("assignedTo") REFERENCES "users"("id");

-- ─────────────────────────────────────────────────────────────────
-- task_assignments
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "task_assignments"
  ADD CONSTRAINT "task_assignments_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "daily_tasks"("id"),
  ADD CONSTRAINT "task_assignments_assignedTo_fkey"
    FOREIGN KEY ("assignedTo") REFERENCES "users"("id"),
  ADD CONSTRAINT "task_assignments_assignedBy_fkey"
    FOREIGN KEY ("assignedBy") REFERENCES "users"("id");

-- ─────────────────────────────────────────────────────────────────
-- task_status_history
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "task_status_history"
  ADD CONSTRAINT "task_status_history_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "daily_tasks"("id"),
  ADD CONSTRAINT "task_status_history_changedBy_fkey"
    FOREIGN KEY ("changedBy") REFERENCES "users"("id");

-- ─────────────────────────────────────────────────────────────────
-- task_notifications
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "task_notifications"
  ADD CONSTRAINT "task_notifications_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "daily_tasks"("id"),
  ADD CONSTRAINT "task_notifications_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id");

-- ─────────────────────────────────────────────────────────────────
-- notification_preferences
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "notification_preferences"
  ADD CONSTRAINT "notification_preferences_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id");

-- ─────────────────────────────────────────────────────────────────
-- notification_history
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "notification_history"
  ADD CONSTRAINT "notification_history_notificationId_fkey"
    FOREIGN KEY ("notificationId") REFERENCES "task_notifications"("id"),
  ADD CONSTRAINT "notification_history_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id");

-- ─────────────────────────────────────────────────────────────────
-- notification_templates
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "notification_templates"
  ADD CONSTRAINT "notification_templates_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "users"("id");

-- ─────────────────────────────────────────────────────────────────
-- notification_triggers
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "notification_triggers"
  ADD CONSTRAINT "notification_triggers_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "users"("id"),
  ADD CONSTRAINT "notification_triggers_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "notification_templates"("id");

-- ─────────────────────────────────────────────────────────────────
-- trigger_execution_log
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "trigger_execution_log"
  ADD CONSTRAINT "trigger_execution_log_triggerId_fkey"
    FOREIGN KEY ("triggerId") REFERENCES "notification_triggers"("id");

-- ─────────────────────────────────────────────────────────────────
-- timesheetUploadHistory
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "timesheetUploadHistory"
  ADD CONSTRAINT "timesheetUploadHistory_uploadedBy_fkey"
    FOREIGN KEY ("uploadedBy") REFERENCES "users"("id");

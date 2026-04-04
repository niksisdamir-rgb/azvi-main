# AzVirt DMS — API Reference

> **Transport:** tRPC over HTTP (type-safe, no REST URLs).
> All procedures are accessed via the tRPC client using the path format `router.procedure`.
>
> **Auth Levels**
> - 🌐 `public` — No session required
> - 🔒 `protected` — Valid session cookie required
> - 🛡️ `admin` — Admin role required

---

## Table of Contents

1. [Auth](#1-auth)
2. [Documents](#2-documents)
3. [Projects](#3-projects)
4. [Materials](#4-materials)
5. [Deliveries & Tracking](#5-deliveries--tracking)
6. [Concrete Bases](#6-concrete-bases)
7. [Machines & Maintenance](#7-machines--maintenance)
8. [Aggregate Inputs](#8-aggregate-inputs)
9. [Quality Control](#9-quality-control)
10. [Employees](#10-employees)
11. [Work Hours](#11-work-hours)
12. [Timesheets](#12-timesheets)
13. [Purchase Orders](#13-purchase-orders)
14. [Suppliers](#14-suppliers)
15. [Dashboard & Analytics](#15-dashboard--analytics)
16. [Forecasting](#16-forecasting)
17. [Inventory Analytics](#17-inventory-analytics)
18. [Supplier Analytics](#18-supplier-analytics)
19. [Reports](#19-reports)
20. [Notifications](#20-notifications)
21. [Email Branding](#21-email-branding)
22. [Email Templates](#22-email-templates)
23. [AI Assistant](#23-ai-assistant)
24. [AI Agent Tools](#24-ai-agent-tools)

---

## 1. Auth

**Prefix:** `auth.*`

| Procedure | Type | Auth | Input | Description |
|---|---|---|---|---|
| `auth.me` | query | 🌐 public | — | Returns current signed-in user or `null` |
| `auth.register` | mutation | 🌐 public | `{ username, password, name?, email? }` | Creates a new user account and issues a session |
| `auth.login` | mutation | 🌐 public | `{ username, password }` | Authenticates user and sets session cookie |
| `auth.logout` | mutation | 🌐 public | — | Clears session cookie |
| `auth.updateSMSSettings` | mutation | 🔒 protected | `{ phoneNumber, smsNotificationsEnabled }` | Updates SMS notification preferences for current user |

---

## 2. Documents

**Prefix:** `documents.*`

| Procedure | Type | Auth | Input | Description |
|---|---|---|---|---|
| `documents.list` | query | 🔒 protected | `{ projectId?, category?, search? }` | Lists documents with optional filters |
| `documents.upload` | mutation | 🔒 protected | `{ name, fileKey, fileUrl, mimeType, fileSize, category?, projectId?, description? }` | Registers a new document record (file already in S3) |
| `documents.delete` | mutation | 🔒 protected | `{ id }` | Deletes a document record |

---

## 3. Projects

**Prefix:** `projects.*`

| Procedure | Type | Auth | Input | Description |
|---|---|---|---|---|
| `projects.list` | query | 🔒 protected | — | Returns all projects ordered by creation date |
| `projects.create` | mutation | 🔒 protected | `{ name, description?, location?, startDate?, endDate?, status? }` | Creates a new project |
| `projects.update` | mutation | 🔒 protected | `{ id, name?, description?, status?, ... }` | Updates project fields |

---

## 4. Materials

**Prefix:** `materials.*`

| Procedure | Type | Auth | Input | Description |
|---|---|---|---|---|
| `materials.list` | query | 🔒 protected | — | Returns all materials sorted by name |
| `materials.create` | mutation | 🔒 protected | `{ name, category, unit, quantity, minQuantity?, supplier? }` | Adds a new material to inventory |
| `materials.update` | mutation | 🔒 protected | `{ id, name?, quantity?, minQuantity?, ... }` | Updates material fields |
| `materials.delete` | mutation | 🔒 protected | `{ id }` | Removes a material |
| `materials.getLowStock` | query | 🔒 protected | — | Returns materials below minimum stock threshold |
| `materials.getById` | query | 🔒 protected | `{ id }` | Returns a single material by ID |

---

## 5. Deliveries & Tracking

**Prefix:** `deliveries.*` / `tracking.*` *(same router, both aliases)*

| Procedure | Type | Auth | Input | Description |
|---|---|---|---|---|
| `deliveries.list` | query | 🔒 protected | `{ projectId?, status? }` | Lists deliveries with optional filters |
| `deliveries.getById` | query | 🔒 protected | `{ id }` | Returns a single delivery |
| `deliveries.create` | mutation | 🔒 protected | `{ projectId, concreteType, quantity, scheduledTime, driverName?, vehicleNumber?, ... }` | Creates a new delivery |
| `deliveries.update` | mutation | 🔒 protected | `{ id, status?, gpsLocation?, notes?, ... }` | Updates delivery fields and logs status history |
| `deliveries.updateStatus` | mutation | 🔒 protected | `{ id, status, gpsLocation?, notes? }` | Transitions delivery status and appends to history |
| `deliveries.calculateETA` | mutation | 🔒 protected | `{ deliveryId, startLocation, endLocation }` | Calculates and persists ETA |
| `deliveries.getStatusHistory` | query | 🔒 protected | `{ deliveryId }` | Returns full status change log for a delivery |
| `deliveries.getActiveDeliveries` | query | 🔒 protected | — | Returns deliveries not yet completed or cancelled |
| `deliveries.uploadPhoto` | mutation | 🔒 protected | `{ deliveryId, photoUrl, caption? }` | Attaches a photo to a delivery |
| `deliveries.addNote` | mutation | 🔒 protected | `{ deliveryId, note }` | Appends a driver note to a delivery |
| `deliveries.sendCustomerSMS` | mutation | 🔒 protected | `{ deliveryId, message? }` | Sends SMS update to the customer for a delivery |
| `deliveries.getAnalytics` | query | 🔒 protected | `{ projectId?, days? }` | Returns delivery performance statistics |

---

## 6. Concrete Bases

**Prefix:** `concreteBases.*`

| Procedure | Type | Auth | Input | Description |
|---|---|---|---|---|
| `concreteBases.list` | query | 🔒 protected | — | Lists all concrete bases |
| `concreteBases.create` | mutation | 🔒 protected | `{ name, location?, capacity? }` | Creates a new concrete base |
| `concreteBases.update` | mutation | 🔒 protected | `{ id, name?, location?, ... }` | Updates concrete base fields |

---

## 7. Machines & Maintenance

**Prefix:** `machines.*`

| Procedure | Type | Auth | Input | Description |
|---|---|---|---|---|
| `machines.list` | query | 🔒 protected | `{ concreteBaseId?, type?, status? }` | Lists machines with optional filters |
| `machines.create` | mutation | 🔒 protected | `{ name, type, concreteBaseId?, serialNumber?, ... }` | Registers a new machine |
| `machines.update` | mutation | 🔒 protected | `{ id, name?, status?, ... }` | Updates machine fields |
| `machines.delete` | mutation | 🔒 protected | `{ id }` | Removes a machine |
| `machines.maintenance.list` | query | 🔒 protected | `{ machineId? }` | Lists maintenance records |
| `machines.maintenance.create` | mutation | 🔒 protected | `{ machineId, type, description, cost?, date }` | Logs a maintenance event |
| `machines.maintenance.update` | mutation | 🔒 protected | `{ id, completedAt?, cost?, ... }` | Updates a maintenance record |
| `machines.maintenance.getById` | query | 🔒 protected | `{ id }` | Returns a single maintenance record |
| `machines.workHours.log` | mutation | 🔒 protected | `{ machineId, projectId?, date, startTime, endTime?, operatorId?, notes? }` | Logs machine working hours |
| `machines.workHours.list` | query | 🔒 protected | `{ machineId }` | Returns work hour logs for a machine |

---

## 8. Aggregate Inputs

**Prefix:** `aggregateInputs.*`

| Procedure | Type | Auth | Input | Description |
|---|---|---|---|---|
| `aggregateInputs.create` | mutation | 🔒 protected | `{ concreteBaseId, materialId, quantity, date }` | Logs an aggregate material input |
| `aggregateInputs.list` | query | 🔒 protected | `{ concreteBaseId? }` | Lists aggregate input records |

---

## 9. Quality Control

**Prefix:** `qualityTests.*`

| Procedure | Type | Auth | Input | Description |
|---|---|---|---|---|
| `qualityTests.list` | query | 🔒 protected | `{ projectId?, deliveryId?, testType?, status? }` | Lists QC tests with filters |
| `qualityTests.create` | mutation | 🔒 protected | `{ testName, testType, deliveryId?, projectId?, result, unit?, status, location?, standard? }` | Creates a QC test record |
| `qualityTests.update` | mutation | 🔒 protected | `{ id, result?, status?, inspectorSignature?, supervisorSignature?, ... }` | Updates a test record |
| `qualityTests.getById` | query | 🔒 protected | `{ id }` | Returns a single test record |
| `qualityTests.getTrends` | query | 🔒 protected | `{ days? }` | Returns pass/fail rates and type breakdowns |
| `qualityTests.getFailedTests` | query | 🔒 protected | `{ days? }` | Returns failed tests in the given window |
| `qualityTests.generateCertificate` | mutation | 🔒 protected | `{ id }` | Generates and stores a compliance PDF certificate |
| `qualityTests.uploadPhoto` | mutation | 🔒 protected | `{ testId, photoUrl }` | Attaches a photo to a test record |
| `qualityTests.sign` | mutation | 🔒 protected | `{ testId, role, signature }` | Records inspector or supervisor digital signature |

---

## 10. Employees

**Prefix:** `employees.*`

| Procedure | Type | Auth | Input | Description |
|---|---|---|---|---|
| `employees.create` | mutation | 🔒 protected | `{ name, department, position, hourlyRate?, phone?, email? }` | Adds a new employee |
| `employees.list` | query | 🔒 protected | `{ department?, status? }` | Lists employees with optional filters |
| `employees.update` | mutation | 🔒 protected | `{ id, name?, department?, status?, ... }` | Updates employee fields |
| `employees.delete` | mutation | 🔒 protected | `{ id }` | Removes an employee |

---

## 11. Work Hours

**Prefix:** `workHours.*`

| Procedure | Type | Auth | Input | Description |
|---|---|---|---|---|
| `workHours.log` | mutation | 🔒 protected | `{ employeeId, projectId?, date, startTime, endTime?, workType?, notes? }` | Logs a work hour entry |
| `workHours.list` | query | 🔒 protected | `{ employeeId?, projectId?, status? }` | Lists work hour entries |
| `workHours.approve` | mutation | 🔒 protected | `{ id, status }` | Approves or rejects a work hour entry |

---

## 12. Timesheets

**Prefix:** `timesheets.*`

| Procedure | Type | Auth | Input | Description |
|---|---|---|---|---|
| `timesheets.getWeeklySummary` | query | 🔒 protected | `{ employeeId, weekStart }` | Returns total & overtime hours for the week |
| `timesheets.getMonthlySummary` | query | 🔒 protected | `{ employeeId, month, year }` | Returns total, overtime, and day breakdown for the month |
| `timesheets.getPendingApprovals` | query | 🔒 protected | `{ managerId? }` | Lists entries awaiting manager approval |
| `timesheets.bulkApprove` | mutation | 🔒 protected | `{ ids, status }` | Bulk approves or rejects a set of timesheet entries |
| `timesheets.exportPDF` | mutation | 🔒 protected | `{ employeeId, month, year }` | Generates and returns a printable PDF timesheet |
| `timesheets.upload` | mutation | 🔒 protected | `{ fileUrl, fileName, employeeId? }` | Uploads a timesheet file for processing |
| `timesheets.processUpload` | mutation | 🔒 protected | `{ uploadId }` | Triggers AI processing of an uploaded timesheet |
| `timesheets.getUploadHistory` | query | 🔒 protected | `{ employeeId? }` | Returns upload history records |
| `timesheets.clockIn` | mutation | 🔒 protected | `{ employeeId, projectId?, notes? }` | Records a clock-in time |
| `timesheets.clockOut` | mutation | 🔒 protected | `{ employeeId }` | Records a clock-out time and closes the open entry |
| `timesheets.getRecentActivity` | query | 🔒 protected | `{ limit? }` | Returns recent timesheet activity across all employees |

---

## 13. Purchase Orders

**Prefix:** `purchaseOrders.*`

| Procedure | Type | Auth | Input | Description |
|---|---|---|---|---|
| `purchaseOrders.list` | query | 🔒 protected | `{ status?, supplierId? }` | Lists POs with optional filters |
| `purchaseOrders.getById` | query | 🔒 protected | `{ id }` | Returns a single PO with its line items |
| `purchaseOrders.create` | mutation | 🔒 protected | `{ supplierId, items: [{ materialId, quantity, unitPrice }], notes? }` | Creates a new purchase order |
| `purchaseOrders.updateStatus` | mutation | 🔒 protected | `{ id, status }` | Transitions PO status (draft → approved → sent → received) |
| `purchaseOrders.sendToSupplier` | mutation | 🔒 protected | `{ id }` | Sends the PO to the supplier via email/SMS |
| `purchaseOrders.autoGenerate` | mutation | 🔒 protected | `{ materialId? }` | Auto-generates POs for low-stock materials |
| `purchaseOrders.getAnalytics` | query | 🔒 protected | `{ days? }` | Returns spend and order volume analytics |

---

## 14. Suppliers

**Prefix:** `suppliers.*`

| Procedure | Type | Auth | Input | Description |
|---|---|---|---|---|
| `suppliers.list` | query | 🔒 protected | — | Returns all suppliers |
| `suppliers.getById` | query | 🔒 protected | `{ id }` | Returns a single supplier |
| `suppliers.create` | mutation | 🔒 protected | `{ name, contactName?, email?, phone?, address? }` | Adds a new supplier |
| `suppliers.update` | mutation | 🔒 protected | `{ id, name?, email?, phone?, ... }` | Updates supplier fields |
| `suppliers.delete` | mutation | 🔒 protected | `{ id }` | Removes a supplier |

---

## 15. Dashboard & Analytics

**Prefix:** `dashboard.*`

| Procedure | Type | Auth | Input | Description |
|---|---|---|---|---|
| `dashboard.stats` | query | 🔒 protected | — | Returns aggregate counts: deliveries, materials, projects, employees |
| `dashboard.deliveryTrends` | query | 🔒 protected | — | Returns daily delivery counts for the past 30 days |
| `dashboard.materialConsumption` | query | 🔒 protected | — | Returns top materials by consumption rate |

---

## 16. Forecasting

**Prefix:** `forecasting.*`

| Procedure | Type | Auth | Input | Description |
|---|---|---|---|---|
| `forecasting.getMaterialForecast` | query | 🔒 protected | `{ materialId? }` | Returns stockout predictions and reorder recommendations |
| `forecasting.getConsumptionRates` | query | 🔒 protected | `{ materialId, days? }` | Returns 30/60/90-day consumption rates |
| `forecasting.getEOQ` | query | 🔒 protected | `{ materialId }` | Returns EOQ calculation and optimal reorder point |
| `forecasting.get30DayProjection` | query | 🔒 protected | `{ materialId? }` | Returns 30-day stock level projection |
| `forecasting.runDailyCheck` | mutation | 🔒 protected | — | Triggers manual low-stock check (normally cron at 8 AM) |
| `forecasting.getAlerts` | query | 🔒 protected | `{}` | Returns active low-stock and stockout alerts |

---

## 17. Inventory Analytics

**Prefix:** `inventoryAnalytics.*`

| Procedure | Type | Auth | Input | Description |
|---|---|---|---|---|
| `inventoryAnalytics.getCostAnalysis` | query | 🔒 protected | — | Returns total inventory value and cost breakdown |
| `inventoryAnalytics.getTurnoverRate` | query | 🔒 protected | — | Returns inventory turnover ratios by material |
| `inventoryAnalytics.getAbcAnalysis` | query | 🔒 protected | — | Classifies materials by value (A/B/C) |

---

## 18. Supplier Analytics

**Prefix:** `supplierAnalytics.*`

| Procedure | Type | Auth | Input | Description |
|---|---|---|---|---|
| `supplierAnalytics.getScorecard` | query | 🔒 protected | `{ supplierId }` | Returns on-time rate, quality score, price competitiveness |
| `supplierAnalytics.getCostComparison` | query | 🔒 protected | `{ supplierId? }` | Returns cost comparison across suppliers |

---

## 19. Reports

**Prefix:** `reports.*`

| Procedure | Type | Auth | Input | Description |
|---|---|---|---|---|
| `reports.getDailyProduction` | query | 🔒 protected | `{ date, concreteBaseId? }` | Returns daily material usage stats |
| `reports.getMachineReport` | query | 🔒 protected | `{ machineId, startDate, endDate }` | Returns hours, maintenance costs, and utilization |
| `reports.getMaintenanceSummary` | query | 🔒 protected | `{ concreteBaseId?, startDate?, endDate? }` | Returns aggregated maintenance costs and counts |

---

## 20. Notifications

**Prefix:** `notifications.*`

| Procedure | Type | Auth | Input | Description |
|---|---|---|---|---|
| `notifications.list` | query | 🔒 protected | `{ limit? }` | Returns notifications for the current user |
| `notifications.getUnreadCount` | query | 🔒 protected | — | Returns count of unread notifications |
| `notifications.markAsRead` | mutation | 🔒 protected | `{ id }` | Marks a notification as read |
| `notifications.markAllAsRead` | mutation | 🔒 protected | — | Marks all notifications as read |
| `notifications.getPreferences` | query | 🔒 protected | — | Returns user notification preferences |
| `notifications.templates.list` | query | 🔒 protected | — | Lists notification templates |
| `notifications.templates.create` | mutation | 🔒 protected | `{ name, type, subject, body }` | Creates a notification template |
| `notifications.templates.delete` | mutation | 🔒 protected | `{ id }` | Deletes a template |
| `notifications.triggers.list` | query | 🔒 protected | — | Lists configured notification triggers |
| `notifications.triggers.create` | mutation | 🔒 protected | `{ event, templateId, channels }` | Creates a trigger for an event |
| `notifications.triggers.delete` | mutation | 🔒 protected | `{ id }` | Removes a trigger |
| `notifications.triggers.setEnabled` | mutation | 🔒 protected | `{ id, enabled }` | Enables or disables a trigger |

---

## 21. Email Branding

**Prefix:** `branding.*`

| Procedure | Type | Auth | Input | Description |
|---|---|---|---|---|
| `branding.get` | query | 🔒 protected | — | Returns current email branding settings |
| `branding.update` | mutation | 🔒 protected | `{ logoUrl?, primaryColor?, companyName?, footerText? }` | Updates branding settings |
| `branding.preview` | mutation | 🔒 protected | `{ templateType }` | Returns a rendered HTML preview with current branding |

---

## 22. Email Templates

**Prefix:** `emailTemplates.*`

| Procedure | Type | Auth | Input | Description |
|---|---|---|---|---|
| `emailTemplates.getEmailTemplates` | query | 🔒 protected | — | Lists all email templates |
| `emailTemplates.getByType` | query | 🔒 protected | `{ type }` | Returns a template for a specific event type |
| `emailTemplates.update` | mutation | 🔒 protected | `{ type, subject, body, variables? }` | Updates a template |
| `emailTemplates.reset` | mutation | 🔒 protected | `{ type }` | Resets a template to its factory default |

---

## 23. AI Assistant

**Prefix:** `ai.*`

| Procedure | Type | Auth | Input | Description |
|---|---|---|---|---|
| `ai.chat` | mutation | 🔒 protected | `{ message, conversationId?, model?, stream? }` | Sends a message to the AI assistant; returns response and thinking trace |
| `ai.getConversations` | query | 🔒 protected | — | Lists all conversations for the current user |
| `ai.getConversation` | query | 🔒 protected | `{ conversationId }` | Returns messages in a conversation |
| `ai.deleteConversation` | mutation | 🔒 protected | `{ conversationId }` | Deletes a conversation and its messages |
| `ai.listModels` | query | 🔒 protected | — | Lists available Ollama models |
| `ai.pullModel` | mutation | 🔒 protected | `{ modelName }` | Pulls a model from the Ollama registry |
| `ai.deleteModel` | mutation | 🔒 protected | `{ modelName }` | Removes a model from Ollama |
| `ai.getPromptTemplates` | query | 🔒 protected | `{ category }` | Returns pre-built prompt templates by category |
| `ai.searchTemplates` | query | 🔒 protected | `{ query }` | Full-text searches the prompt template library |
| `ai.getTemplateById` | query | 🔒 protected | `{ id }` | Returns a single prompt template |
| `ai.transcribeAudio` | mutation | 🔒 protected | `{ conversationId }` | Transcribes audio via Whisper and appends to conversation |

---

## 24. AI Agent Tools

The AI assistant is equipped with the following agentic tools that it can invoke autonomously based on the user's message. These are **not** directly callable by the client — they are invoked server-side during `ai.chat`.

| Tool Name | Description | Key Parameters |
|---|---|---|
| `search_materials` | Search inventory by name or filter low-stock items | `query`, `lowStockOnly` |
| `get_delivery_status` | Get real-time delivery status and GPS location | `deliveryId?`, `projectName?`, `status?` |
| `search_documents` | Search documents by name, category, or project | `query?`, `category?`, `projectId?` |
| `get_quality_tests` | Retrieve QC test results with filters | `status?`, `testType?`, `deliveryId?`, `limit?` |
| `generate_forecast` | Inventory stockout predictions and reorder recommendations | `materialId?` |
| `calculate_stats` | Aggregate statistics (totals, averages) over a date range | `metric`, `startDate?`, `endDate?` |
| `log_work_hours` | Record work hours for an employee | `employeeId`, `date`, `startTime`, `endTime?`, `workType?` |
| `get_work_hours_summary` | Summarise hours and overtime for an employee or project | `employeeId?`, `projectId?`, `startDate?`, `endDate?` |
| `log_machine_hours` | Log equipment working hours | `machineId`, `date`, `startTime`, `endTime?`, `operatorId?` |
| `update_document` | Update document metadata | `documentId`, `name?`, `description?`, `category?`, `projectId?` |
| `delete_document` | Permanently delete a document | `documentId` |
| `create_material` | Add a new material to inventory | `name`, `category`, `unit`, `quantity?`, `minQuantity?` |
| `update_material_quantity` | Adjust a material's stock quantity | `materialId`, `quantity`, `reason?` |
| `bulk_import_data` | Import CSV/Excel rows for materials, employees, or deliveries | `entityType`, `rows[]` |
| `detect_anomalies` | Run anomaly detection on delivery or quality data | `entityType`, `lookbackDays?` |
| `detect_sensor_anomalies` | Detect anomalies in time-series sensor readings | `sensorId`, `values[]` |
| `query_rag` | Semantic search over the document knowledge base | `query` |

---

## Prompt Template Categories

Available via `ai.getPromptTemplates({ category })`:

| Category | Examples |
|---|---|
| `inventory` | "Check low stock", "Order recommendations" |
| `deliveries` | "Today's active deliveries", "Delay analysis" |
| `quality` | "Recent failed tests", "QC trend summary" |
| `reports` | "Daily production report", "Weekly summary" |
| `analysis` | "Cost breakdown", "Performance comparison" |
| `forecasting` | "30-day stock projection", "Reorder schedule" |
| `bulk_import` | "Import from CSV", "Batch update materials" |

---

*Generated: 2026-03-12 — reflects `server/routers/**` and `server/lib/aiTools.ts`*

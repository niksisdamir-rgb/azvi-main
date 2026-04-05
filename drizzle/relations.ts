import { relations } from "drizzle-orm";
import {
	users,
	projects,
	documents,
	materials,
	deliveries,
	deliveryStatusHistory,
	qualityTests,
	employees,
	workHours,
	concreteBases,
	machines,
	machineMaintenance,
	machineWorkHours,
	aggregateInputs,
	materialConsumptionHistory,
	suppliers,
	purchaseOrders,
	purchaseOrderItems,
	aiConversations,
	aiMessages,
	dailyTasks,
	taskAssignments,
	taskStatusHistory,
	taskNotifications,
	notificationPreferences,
	notificationHistory,
	notificationTemplates,
	notificationTriggers,
	triggerExecutionLog,
	reportSettings,
	timesheetUploadHistory,
} from "./schema";

export const usersRelations = relations(users, ({ many, one }) => ({
	projects: many(projects),
	documents: many(documents),
	deliveries: many(deliveries),
	workHours: many(workHours, { relationName: "approvedBy" }),
	reportSettings: one(reportSettings, {
		fields: [users.id],
		references: [reportSettings.userId],
	}),
	aiConversations: many(aiConversations),
	dailyTasks: many(dailyTasks, { relationName: "user" }),
	assignedTasks: many(dailyTasks, { relationName: "assignedTo" }),
	notificationPreferences: one(notificationPreferences, {
		fields: [users.id],
		references: [notificationPreferences.userId],
	}),
	notificationTemplates: many(notificationTemplates),
	notificationTriggers: many(notificationTriggers),
	timesheetUploads: many(timesheetUploadHistory),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
	creator: one(users, {
		fields: [projects.createdBy],
		references: [users.id],
	}),
	documents: many(documents),
	deliveries: many(deliveries),
	qualityTests: many(qualityTests),
	workHours: many(workHours),
	machineWorkHours: many(machineWorkHours),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
	project: one(projects, {
		fields: [documents.projectId],
		references: [projects.id],
	}),
	uploader: one(users, {
		fields: [documents.uploadedBy],
		references: [users.id],
	}),
}));

export const materialsRelations = relations(materials, ({ one, many }) => ({
	supplier: one(suppliers, {
		fields: [materials.supplierId],
		references: [suppliers.id],
	}),
	consumptionHistory: many(materialConsumptionHistory),
	purchaseOrderItems: many(purchaseOrderItems),
}));

export const deliveriesRelations = relations(deliveries, ({ one, many }) => ({
	project: one(projects, {
		fields: [deliveries.projectId],
		references: [projects.id],
	}),
	creator: one(users, {
		fields: [deliveries.createdBy],
		references: [users.id],
	}),
	statusHistory: many(deliveryStatusHistory),
	qualityTests: many(qualityTests),
	consumptions: many(materialConsumptionHistory),
}));

export const deliveryStatusHistoryRelations = relations(deliveryStatusHistory, ({ one }) => ({
	delivery: one(deliveries, {
		fields: [deliveryStatusHistory.deliveryId],
		references: [deliveries.id],
	}),
	user: one(users, {
		fields: [deliveryStatusHistory.userId],
		references: [users.id],
	}),
}));

export const qualityTestsRelations = relations(qualityTests, ({ one }) => ({
	delivery: one(deliveries, {
		fields: [qualityTests.deliveryId],
		references: [deliveries.id],
	}),
	project: one(projects, {
		fields: [qualityTests.projectId],
		references: [projects.id],
	}),
}));

export const employeesRelations = relations(employees, ({ many }) => ({
	workHours: many(workHours),
	machineWorkHours: many(machineWorkHours),
}));

export const workHoursRelations = relations(workHours, ({ one }) => ({
	employee: one(employees, {
		fields: [workHours.employeeId],
		references: [employees.id],
	}),
	project: one(projects, {
		fields: [workHours.projectId],
		references: [projects.id],
	}),
	approver: one(users, {
		fields: [workHours.approvedBy],
		references: [users.id],
		relationName: "approvedBy",
	}),
}));

export const concreteBasesRelations = relations(concreteBases, ({ many }) => ({
	machines: many(machines),
	aggregateInputs: many(aggregateInputs),
}));

export const machinesRelations = relations(machines, ({ one, many }) => ({
	base: one(concreteBases, {
		fields: [machines.concreteBaseId],
		references: [concreteBases.id],
	}),
	maintenance: many(machineMaintenance),
	workHours: many(machineWorkHours),
}));

export const machineMaintenanceRelations = relations(machineMaintenance, ({ one }) => ({
	machine: one(machines, {
		fields: [machineMaintenance.machineId],
		references: [machines.id],
	}),
}));

export const machineWorkHoursRelations = relations(machineWorkHours, ({ one }) => ({
	machine: one(machines, {
		fields: [machineWorkHours.machineId],
		references: [machines.id],
	}),
	project: one(projects, {
		fields: [machineWorkHours.projectId],
		references: [projects.id],
	}),
	operator: one(employees, {
		fields: [machineWorkHours.operatorId],
		references: [employees.id],
	}),
}));

export const aggregateInputsRelations = relations(aggregateInputs, ({ one }) => ({
	base: one(concreteBases, {
		fields: [aggregateInputs.concreteBaseId],
		references: [concreteBases.id],
	}),
}));

export const materialConsumptionHistoryRelations = relations(materialConsumptionHistory, ({ one }) => ({
	material: one(materials, {
		fields: [materialConsumptionHistory.materialId],
		references: [materials.id],
	}),
	delivery: one(deliveries, {
		fields: [materialConsumptionHistory.deliveryId],
		references: [deliveries.id],
	}),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
	purchaseOrders: many(purchaseOrders),
	materials: many(materials),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
	supplier: one(suppliers, {
		fields: [purchaseOrders.supplierId],
		references: [suppliers.id],
	}),
	items: many(purchaseOrderItems),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
	order: one(purchaseOrders, {
		fields: [purchaseOrderItems.purchaseOrderId],
		references: [purchaseOrders.id],
	}),
	material: one(materials, {
		fields: [purchaseOrderItems.materialId],
		references: [materials.id],
	}),
}));

export const aiConversationsRelations = relations(aiConversations, ({ one, many }) => ({
	user: one(users, {
		fields: [aiConversations.userId],
		references: [users.id],
	}),
	messages: many(aiMessages),
}));

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
	conversation: one(aiConversations, {
		fields: [aiMessages.conversationId],
		references: [aiConversations.id],
	}),
}));

export const dailyTasksRelations = relations(dailyTasks, ({ one, many }) => ({
	user: one(users, {
		fields: [dailyTasks.userId],
		references: [users.id],
		relationName: "user",
	}),
	assignee: one(users, {
		fields: [dailyTasks.assignedTo],
		references: [users.id],
		relationName: "assignedTo",
	}),
	assignments: many(taskAssignments),
	statusHistory: many(taskStatusHistory),
	notifications: many(taskNotifications),
}));

export const taskAssignmentsRelations = relations(taskAssignments, ({ one }) => ({
	task: one(dailyTasks, {
		fields: [taskAssignments.taskId],
		references: [dailyTasks.id],
	}),
	assignee: one(users, {
		fields: [taskAssignments.assignedTo],
		references: [users.id],
	}),
	assigner: one(users, {
		fields: [taskAssignments.assignedBy],
		references: [users.id],
	}),
}));

export const taskStatusHistoryRelations = relations(taskStatusHistory, ({ one }) => ({
	task: one(dailyTasks, {
		fields: [taskStatusHistory.taskId],
		references: [dailyTasks.id],
	}),
	changedBy: one(users, {
		fields: [taskStatusHistory.changedBy],
		references: [users.id],
	}),
}));

export const taskNotificationsRelations = relations(taskNotifications, ({ one, many }) => ({
	task: one(dailyTasks, {
		fields: [taskNotifications.taskId],
		references: [dailyTasks.id],
	}),
	user: one(users, {
		fields: [taskNotifications.userId],
		references: [users.id],
	}),
	history: many(notificationHistory),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
	user: one(users, {
		fields: [notificationPreferences.userId],
		references: [users.id],
	}),
}));

export const notificationHistoryRelations = relations(notificationHistory, ({ one }) => ({
	notification: one(taskNotifications, {
		fields: [notificationHistory.notificationId],
		references: [taskNotifications.id],
	}),
	user: one(users, {
		fields: [notificationHistory.userId],
		references: [users.id],
	}),
}));

export const notificationTemplatesRelations = relations(notificationTemplates, ({ one }) => ({
	creator: one(users, {
		fields: [notificationTemplates.createdBy],
		references: [users.id],
	}),
}));

export const notificationTriggersRelations = relations(notificationTriggers, ({ one, many }) => ({
	creator: one(users, {
		fields: [notificationTriggers.createdBy],
		references: [users.id],
	}),
	template: one(notificationTemplates, {
		fields: [notificationTriggers.templateId],
		references: [notificationTemplates.id],
	}),
	logs: many(triggerExecutionLog),
}));

export const triggerExecutionLogRelations = relations(triggerExecutionLog, ({ one }) => ({
	trigger: one(notificationTriggers, {
		fields: [triggerExecutionLog.triggerId],
		references: [notificationTriggers.id],
	}),
}));

export const reportSettingsRelations = relations(reportSettings, ({ one }) => ({
	user: one(users, {
		fields: [reportSettings.userId],
		references: [users.id],
	}),
}));

export const timesheetUploadHistoryRelations = relations(timesheetUploadHistory, ({ one }) => ({
	uploader: one(users, {
		fields: [timesheetUploadHistory.uploadedBy],
		references: [users.id],
	}),
}));

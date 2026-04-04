/**
 * In-memory mock for server/db.ts
 * Used by vitest to avoid needing a real PostgreSQL database during testing.
 */

// ─────────────── In-memory stores ───────────────
let _idSeq = 1;
const nextId = () => _idSeq++;

const store = {
  users: new Map<number, any>(),
  documents: new Map<number, any>(),
  projects: new Map<number, any>(),
  materials: new Map<number, any>(),
  deliveries: new Map<number, any>(),
  deliveryStatusHistory: [] as any[],
  qualityTests: new Map<number, any>(),
  employees: new Map<number, any>(),
  workHours: new Map<number, any>(),
  machineWorkHours: new Map<number, any>(),
  machines: new Map<number, any>(),
  concreteBases: new Map<number, any>(),
  machineMaintenance: [] as any[],
  aggregateInputs: [] as any[],
  consumptionHistory: [] as any[],
  forecastPredictions: [] as any[],
  purchaseOrders: new Map<number, any>(),
  purchaseOrderItems: [] as any[],
  suppliers: new Map<number, any>(),
  aiConversations: new Map<number, any>(),
  aiMessages: new Map<number, any>(),
  notificationPrefs: new Map<number, any>(),
  notifications: new Map<number, any>(),
  notificationHistory: [] as any[],
  reportSettings: new Map<number, any>(),
};

// ─────────────── Users ───────────────
export async function getDb() {
  const mockDrizzle = {
    insert: (table: any) => ({
      values: (data: any) => ({
        returning: async () => {
          // Identify table by looking at unique columns or keys
          const isWorkHours = 'employeeId' in data && 'hoursWorked' in data;
          const isMachineHours = 'machineId' in data && 'operatorId' in data;
          const isMaterials = 'quantity' in data && 'minStock' in data;
          const isDocuments = 'fileKey' in data;
          const isEmployees = 'employeeNumber' in data;
          const isProjects = 'location' in data && 'status' in data;

          const id = nextId();
          const row = { id, createdAt: new Date(), updatedAt: new Date(), ...data };
          
          if (isWorkHours) store.workHours.set(id, row);
          else if (isMachineHours) store.machineWorkHours.set(id, row);
          else if (isMaterials) store.materials.set(id, row);
          else if (isDocuments) store.documents.set(id, row);
          else if (isEmployees) store.employees.set(id, row);
          else if (isProjects) store.projects.set(id, row);
          
          return [row];
        }
      })
    }),
    select: () => ({
      from: (table: any) => ({
        where: (cond: any) => {
          const filterId = cond?.right ?? cond?.value;
          const filter = (all: any[]) => {
            if (filterId === undefined) return all;
            return all.filter((r: any) => r.id === filterId || r.employeeId === filterId || r.materialId === filterId);
          };
          return {
            orderBy: (ord: any) => ({
              limit: async (l: number) => {
                const all = Array.from(store.workHours.values());
                return filter(all);
              },
              async then(resolve: any) { resolve(await this.limit(100)); }
            }),
            limit: async (l: number) => {
               const all = Array.from(store.materials.values());
               return filter(all);
            },
            async then(resolve: any) { resolve(await this.limit(100)); }
          };
        },
        orderBy: (ord: any) => ({ 
          limit: async (l: number) => store.forecastPredictions,
          async then(resolve: any) { resolve(store.forecastPredictions); }
        }),
        async then(resolve: any) { 
           resolve(Array.from(store.workHours.values()));
        }
      })
    }),
    update: (table: any) => ({
      set: (data: any) => ({
        where: (cond: any) => {
          const id = cond?.right ?? cond?.value;
          return {
            returning: async () => {
              if (id) {
                  const m = store.materials.get(id);
                  if (m) {
                    const updated = { ...m, ...data };
                    store.materials.set(id, updated);
                    return [updated];
                  }
              }
              return [];
            },
            async then(resolve: any) { resolve([]); }
          };
        }
      })
    }),
    delete: (table: any) => ({
      where: async (cond: any) => {
        // No-op for mock delete
        return [];
      }
    }),
  };
  return mockDrizzle as any;
}
export async function upsertUser(user: any) {}
export async function getUserByOpenId(openId: string) {
  return Array.from(store.users.values()).find(u => u.openId === openId);
}
export async function getUserByUsername(username: string) {
  return Array.from(store.users.values()).find(u => u.username === username);
}
export async function getUserById(id: number) { return store.users.get(id); }
export async function getUserByEmail(email: string) {
  return Array.from(store.users.values()).find(u => u.email === email);
}
export async function createUser(user: any) {
  const id = nextId();
  const row = { id, createdAt: new Date(), updatedAt: new Date(), ...user };
  store.users.set(id, row);
  return [row];
}
export async function updateUser(userId: number, data: any) {
  const u = store.users.get(userId);
  if (u) store.users.set(userId, { ...u, ...data, updatedAt: new Date() });
}
export async function getAdminUsersWithSMS() {
  return Array.from(store.users.values()).filter(u => u.role === 'admin' && u.smsNotificationsEnabled && u.phoneNumber);
}
export async function updateUserSMSSettings(userId: number, phoneNumber: string, enabled: boolean) {
  const u = store.users.get(userId);
  if (u) store.users.set(userId, { ...u, phoneNumber, smsNotificationsEnabled: enabled });
  return true;
}

// ─────────────── Documents ───────────────
export async function createDocument(doc: any) {
  const id = nextId();
  const row = { id, createdAt: new Date(), updatedAt: new Date(), ...doc };
  store.documents.set(id, row);
  return [row];
}
export async function getDocuments(filters?: any) {
  let docs = Array.from(store.documents.values());
  if (filters?.projectId) docs = docs.filter(d => d.projectId === filters.projectId);
  if (filters?.category) docs = docs.filter(d => d.category === filters.category);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    docs = docs.filter(d => d.name?.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q));
  }
  return docs;
}
export async function getDocumentById(id: number) { return store.documents.get(id); }
export async function deleteDocument(id: number) { store.documents.delete(id); }
export async function updateDocument(id: number, data: any) {
  const d = store.documents.get(id);
  if (d) store.documents.set(id, { ...d, ...data, updatedAt: new Date() });
}

// ─────────────── Projects ───────────────
export async function createProject(project: any) {
  const id = nextId();
  const row = { id, createdAt: new Date(), updatedAt: new Date(), ...project };
  store.projects.set(id, row);
  return [row];
}
export async function getProjects() { return Array.from(store.projects.values()); }
export async function getProjectById(id: number) { return store.projects.get(id); }
export async function updateProject(id: number, data: any) {
  const p = store.projects.get(id);
  if (p) store.projects.set(id, { ...p, ...data });
}

// ─────────────── Materials ───────────────
export async function createMaterial(material: any) {
  const id = nextId();
  const row = { id, createdAt: new Date(), updatedAt: new Date(), category: 'other', ...material };
  store.materials.set(id, row);
  return id;
}
export async function getMaterials() {
  return Array.from(store.materials.values()).sort((a, b) => a.name?.localeCompare(b.name ?? '') ?? 0);
}
export async function getMaterialById(id: number) { return store.materials.get(id); }
export async function updateMaterial(id: number, data: any) {
  const m = store.materials.get(id);
  if (m) store.materials.set(id, { ...m, ...data, updatedAt: new Date() });
}
export async function deleteMaterial(id: number) { store.materials.delete(id); }
export async function getLowStockMaterials() {
  return Array.from(store.materials.values()).filter(m => m.quantity <= m.minStock);
}
export async function getCriticalStockMaterials() {
  return Array.from(store.materials.values()).filter(m => m.criticalThreshold > 0 && m.quantity <= m.criticalThreshold);
}

// ─────────────── Deliveries ───────────────
export async function createDelivery(delivery: any) {
  const id = nextId();
  const row = { id, status: 'scheduled', createdAt: new Date(), updatedAt: new Date(), ...delivery };
  store.deliveries.set(id, row);
  return [row];
}
export async function getDeliveries(filters?: any) {
  let rows = Array.from(store.deliveries.values());
  if (filters?.projectId) rows = rows.filter(d => d.projectId === filters.projectId);
  if (filters?.status) rows = rows.filter(d => d.status === filters.status);
  return rows;
}
export async function getDeliveryById(id: number) { return store.deliveries.get(id); }
export async function updateDelivery(id: number, data: any) {
  const d = store.deliveries.get(id);
  if (d) {
    store.deliveries.set(id, { ...d, ...data, updatedAt: new Date() });
    if (data.status) await logDeliveryStatus(id, data.status, data.gpsLocation, data.notes ?? data.driverNotes);
  }
}
export async function logDeliveryStatus(deliveryId: number, status: string, gpsLocation?: string, notes?: string) {
  store.deliveryStatusHistory.push({ deliveryId, status, gpsLocation, notes, timestamp: new Date() });
}
export async function getDeliveryStatusHistory(deliveryId: number) {
  return store.deliveryStatusHistory.filter(h => h.deliveryId === deliveryId);
}
export async function calculateETA(deliveryId: number, _: string, __: string) {
  const eta = Math.floor((Date.now() + 45 * 60 * 1000) / 1000);
  await updateDelivery(deliveryId, { estimatedArrival: eta });
  return eta;
}

// ─────────────── Quality Tests ───────────────
export async function createQualityTest(test: any) {
  const id = nextId();
  const row = { id, createdAt: new Date(), status: 'pending', ...test };
  store.qualityTests.set(id, row);
  return [row];
}
export async function getQualityTests(filters?: any) {
  let rows = Array.from(store.qualityTests.values());
  if (filters?.projectId) rows = rows.filter(t => t.projectId === filters.projectId);
  if (filters?.deliveryId) rows = rows.filter(t => t.deliveryId === filters.deliveryId);
  return rows;
}
export async function getQualityTestById(id: number) { return store.qualityTests.get(id); }
export async function updateQualityTest(id: number, data: any) {
  const t = store.qualityTests.get(id);
  if (t) store.qualityTests.set(id, { ...t, ...data });
}
export async function getFailedQualityTests(_days = 30) {
  return Array.from(store.qualityTests.values()).filter(t => t.status === 'fail');
}
export async function getQualityTestTrends(_days = 30) {
  return { passRate: 100, failRate: 0, pendingRate: 0, totalTests: 0, byType: [] };
}
export async function generateCompliancePDF(testId: number) {
  const url = `https://mock-storage.example.com/certificates/${testId}/cert.pdf`;
  await createDocument({ name: `Compliance_Certificate_${testId}.pdf`, fileKey: `certs/${testId}.pdf`, fileUrl: url, category: 'certificate', uploadedBy: 1 });
  return url;
}

// ─────────────── Employees ───────────────
export async function createEmployee(employee: any) {
  const id = nextId();
  const row = { id, createdAt: new Date(), ...employee };
  store.employees.set(id, row);
  return [row];
}
export async function getEmployees(filters?: any) {
  let rows = Array.from(store.employees.values());
  if (filters?.department) rows = rows.filter(e => e.department === filters.department);
  if (filters?.status) rows = rows.filter(e => e.status === filters.status);
  return rows;
}
export async function getEmployeeById(id: number) { return store.employees.get(id); }
export async function updateEmployee(id: number, data: any) {
  const e = store.employees.get(id);
  if (e) store.employees.set(id, { ...e, ...data });
}
export async function deleteEmployee(id: number) { store.employees.delete(id); }

// ─────────────── Work Hours ───────────────
export async function createWorkHour(w: any) {
  const id = nextId();
  const row = { id, createdAt: new Date(), ...w };
  store.workHours.set(id, row);
  return [row];
}
export async function getWorkHours(filters?: any) {
  let rows = Array.from(store.workHours.values());
  if (filters?.employeeId) rows = rows.filter(w => w.employeeId === filters.employeeId);
  if (filters?.projectId) rows = rows.filter(w => w.projectId === filters.projectId);
  return rows;
}
export async function updateWorkHour(id: number, data: any) {
  const w = store.workHours.get(id);
  if (w) store.workHours.set(id, { ...w, ...data });
}
export async function getWeeklyTimesheetSummary(_empId: any, _weekStart: Date) { return []; }
export async function getMonthlyTimesheetSummary(_empId: any, _year: number, _month: number) { return []; }

// ─────────────── Machines ───────────────
export async function createMachine(machine: any) {
  const id = nextId();
  const row = { id, createdAt: new Date(), status: 'operational', ...machine };
  store.machines.set(id, row);
  return [row];
}
export async function getMachines(filters?: any) {
  let rows = Array.from(store.machines.values());
  if (filters?.type) rows = rows.filter(m => m.type === filters.type);
  return rows;
}
export async function getMachineById(id: number) { return store.machines.get(id); }
export async function updateMachine(id: number, data: any) {
  const m = store.machines.get(id);
  if (m) store.machines.set(id, { ...m, ...data });
}
export async function deleteMachine(id: number) { store.machines.delete(id); }
export async function createMachineMaintenance(m: any) {
  const id = nextId();
  store.machineMaintenance.push({ id, ...m });
  return [{ id }];
}
export async function getMachineMaintenance(filters?: any) {
  let rows = store.machineMaintenance;
  if (filters?.machineId) rows = rows.filter(m => m.machineId === filters.machineId);
  return rows;
}

// ─────────────── Machine Work Hours ───────────────
export async function createMachineWorkHour(w: any) {
  const id = nextId();
  const row = { id, createdAt: new Date(), ...w };
  store.machineWorkHours.set(id, row);
  return [row];
}
export async function getMachineWorkHours(filters?: any) {
  let rows = Array.from(store.machineWorkHours.values());
  if (filters?.machineId) rows = rows.filter(r => r.machineId === filters.machineId);
  return rows;
}

// ─────────────── Concrete Bases ───────────────
export async function createConcreteBase(base: any) {
  const id = nextId();
  const row = { id, createdAt: new Date(), ...base };
  store.concreteBases.set(id, row);
  return [row];
}
export async function getConcreteBases() { return Array.from(store.concreteBases.values()); }
export async function getConcreteBaseById(id: number) { return store.concreteBases.get(id); }
export async function updateConcreteBase(id: number, data: any) {
  const b = store.concreteBases.get(id);
  if (b) store.concreteBases.set(id, { ...b, ...data });
}

// ─────────────── Aggregate Inputs ───────────────
export async function createAggregateInput(input: any) {
  const id = nextId();
  store.aggregateInputs.push({ id, ...input });
  return [{ id }];
}
export async function getAggregateInputs(filters?: any) { return store.aggregateInputs; }

// ─────────────── Material Consumption ───────────────
export async function recordConsumption(c: any) { store.consumptionHistory.push(c); }
export async function getConsumptionHistory(materialId?: number, _days = 30) {
  return materialId ? store.consumptionHistory.filter(c => c.materialId === materialId) : store.consumptionHistory;
}
export async function calculateDailyConsumptionRate(_materialId: number, _days = 30) { return 0; }
export async function calculateEOQ(annual: number, order: number, holding: number) {
  if (holding <= 0) return 0;
  return Math.sqrt((2 * annual * order) / holding);
}

// ─────────────── Forecasting ───────────────
export async function generateForecastPredictions() { return []; }
export async function getForecastPredictions() { return store.forecastPredictions; }

// ─────────────── Purchase Orders ───────────────
export async function createPurchaseOrder(order: any, items: any[]) {
  const id = nextId();
  const row = { id, createdAt: new Date(), status: 'draft', ...order, items };
  store.purchaseOrders.set(id, row);
  items.forEach(item => store.purchaseOrderItems.push({ ...item, purchaseOrderId: id }));
  return row;
}
export async function getPurchaseOrders(filters?: any) { return Array.from(store.purchaseOrders.values()); }
export async function getPurchaseOrderItems(purchaseOrderId: number) {
  return store.purchaseOrderItems.filter(i => i.purchaseOrderId === purchaseOrderId);
}
export async function updatePurchaseOrder(id: number, data: any) {
  const po = store.purchaseOrders.get(id);
  if (po) store.purchaseOrders.set(id, { ...po, ...data });
}

// ─────────────── Suppliers ───────────────
export async function createSupplier(supplier: any) {
  const id = nextId();
  const row = { id, createdAt: new Date(), ...supplier };
  store.suppliers.set(id, row);
  return [row];
}
export async function getSuppliers() { return Array.from(store.suppliers.values()); }
export async function getSupplierById(id: number) { return store.suppliers.get(id); }
export async function updateSupplier(id: number, data: any) {
  const s = store.suppliers.get(id);
  if (s) store.suppliers.set(id, { ...s, ...data });
}
export async function deleteSupplier(id: number) { store.suppliers.delete(id); }

// ─────────────── Report Settings ───────────────
export async function getReportSettings(userId: number) { return store.reportSettings.get(userId) || null; }
export async function upsertReportSettings(data: any) {
  store.reportSettings.set(data.userId, data);
  return 0;
}
export async function getReportRecipients() { return []; }
export async function getAllReportRecipients() { return []; }
export async function addReportRecipient(_email: string, _name?: string) { return 0; }
export async function removeReportRecipient(_id: number) {}
export async function getEmailTemplates() { return []; }
export async function getEmailTemplateByType(_type: string) { return null; }
export async function upsertEmailTemplate(_data: any) { return 0; }
export async function getEmailBranding() { return null; }
export async function upsertEmailBranding(_data: any) { return 0; }

// ─────────────── AI Conversations ───────────────
export async function createAiConversation(data: { userId: number; title?: string; modelName?: string }) {
  const id = nextId();
  store.aiConversations.set(id, {
    id,
    userId: data.userId,
    title: data.title || 'New Conversation',
    modelName: data.modelName,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return id;
}
export async function getAiConversations(userId: number) {
  return Array.from(store.aiConversations.values())
    .filter(c => c.userId === userId)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}
export async function getConversation(id: number) { return store.aiConversations.get(id); }
export async function deleteAiConversation(conversationId: number) {
  // Delete messages
  for (const [msgId, msg] of store.aiMessages.entries()) {
    if (msg.conversationId === conversationId) store.aiMessages.delete(msgId);
  }
  store.aiConversations.delete(conversationId);
}
export async function createAiMessage(data: {
  conversationId: number;
  role: string;
  content: string;
  model?: string;
  audioUrl?: string;
  imageUrl?: string;
  thinkingProcess?: string;
  toolCalls?: string;
  metadata?: string;
}) {
  const id = nextId();
  store.aiMessages.set(id, { id, createdAt: new Date(), ...data });
  // Update conversation timestamp
  const conv = store.aiConversations.get(data.conversationId);
  if (conv) store.aiConversations.set(data.conversationId, { ...conv, updatedAt: new Date() });
  // Verify conversation exists
  if (!conv) throw new Error(`Conversation ${data.conversationId} not found`);
  return id;
}
export async function getAiMessages(conversationId: number) {
  const conv = store.aiConversations.get(conversationId);
  if (!conv) throw new Error(`Conversation ${conversationId} not found`);
  return Array.from(store.aiMessages.values())
    .filter(m => m.conversationId === conversationId)
    .sort((a, b) => a.createdAt - b.createdAt);
}
export async function getAvailableModels() { return []; }
export async function upsertModel(_name: string, _displayName: string, _type: string, _size?: string) {}

// Older conversation API aliases
export async function createConversation(userId: number, title: string, modelName: string) {
  return createAiConversation({ userId, title, modelName });
}
export async function getConversations(userId: number) { return getAiConversations(userId); }
export async function updateConversationTitle(id: number, title: string) {
  const c = store.aiConversations.get(id);
  if (c) store.aiConversations.set(id, { ...c, title, updatedAt: new Date() });
}
export async function addMessage(conversationId: number, role: string, content: string, metadata?: any) {
  return createAiMessage({ conversationId, role: role as any, content, metadata: metadata ? JSON.stringify(metadata) : undefined });
}
export async function getMessages(conversationId: number) { return getAiMessages(conversationId); }

// ─────────────── Tasks ───────────────
const taskStore = new Map<number, any>();
const taskAssignmentStore = new Map<number, any>();
const taskHistoryStore: any[] = [];

export async function createTask(task: any) {
  const id = nextId();
  taskStore.set(id, { id, createdAt: new Date(), status: 'pending', ...task });
  return [{ id }];
}
export async function getTasks(userId: number) {
  return Array.from(taskStore.values()).filter(t => t.userId === userId);
}
export async function getTaskById(taskId: number) { return taskStore.get(taskId); }
export async function updateTask(taskId: number, updates: any) {
  const t = taskStore.get(taskId);
  if (t) taskStore.set(taskId, { ...t, ...updates });
}
export async function deleteTask(taskId: number) { taskStore.delete(taskId); }
export async function getTasksByStatus(userId: number, status: string) {
  return Array.from(taskStore.values()).filter(t => t.userId === userId && t.status === status);
}
export async function getTasksByPriority(userId: number, priority: string) {
  return Array.from(taskStore.values()).filter(t => t.userId === userId && t.priority === priority);
}
export async function getOverdueTasks(userId: number) {
  const now = new Date();
  return Array.from(taskStore.values()).filter(t => t.userId === userId && t.dueDate < now && t.status !== 'completed');
}
export async function getTodaysTasks(userId: number) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  return Array.from(taskStore.values()).filter(t => t.userId === userId && t.dueDate >= today && t.dueDate < tomorrow);
}
export async function assignTask(assignment: any) {
  const id = nextId();
  taskAssignmentStore.set(id, { id, assignedAt: new Date(), ...assignment });
  return [{ id }];
}
export async function getTaskAssignments(taskId: number) {
  return Array.from(taskAssignmentStore.values()).filter(a => a.taskId === taskId);
}
export async function updateTaskAssignment(assignmentId: number, updates: any) {
  const a = taskAssignmentStore.get(assignmentId);
  if (a) taskAssignmentStore.set(assignmentId, { ...a, ...updates });
}
export async function getAssignmentsForUser(userId: number) {
  return Array.from(taskAssignmentStore.values()).filter(a => a.assignedTo === userId);
}
export async function recordTaskStatusChange(history: any) {
  const id = nextId();
  taskHistoryStore.push({ id, createdAt: new Date(), ...history });
  return [{ id }];
}
export async function getTaskHistory(taskId: number) {
  return taskHistoryStore.filter(h => h.taskId === taskId);
}

// ─────────────── Notifications ───────────────
export async function createNotification(notification: any) {
  const id = nextId();
  const row = { id, createdAt: new Date(), status: 'pending', ...notification };
  store.notifications.set(id, row);
  return [row];
}
export async function getNotifications(userId: number, limit = 50) {
  return Array.from(store.notifications.values()).filter(n => n.userId === userId).slice(0, limit);
}
export async function getUnreadNotifications(userId: number) {
  return Array.from(store.notifications.values()).filter(n => n.userId === userId && n.status !== 'read');
}
export async function markNotificationAsRead(notificationId: number) {
  const n = store.notifications.get(notificationId);
  if (n) store.notifications.set(notificationId, { ...n, status: 'read', readAt: new Date() });
}
export async function updateNotificationStatus(notificationId: number, status: string, sentAt?: Date) {
  const n = store.notifications.get(notificationId);
  if (n) store.notifications.set(notificationId, { ...n, status, sentAt: sentAt || new Date() });
}
export async function getPendingNotifications() {
  return Array.from(store.notifications.values()).filter(n => n.status === 'pending');
}

// ─────────────── Notification Preferences ───────────────
export async function getOrCreateNotificationPreferences(userId: number) {
  if (!store.notificationPrefs.has(userId)) {
    store.notificationPrefs.set(userId, {
      id: nextId(),
      userId,
      emailEnabled: true,
      smsEnabled: false,
      inAppEnabled: true,
      overdueReminders: true,
      completionNotifications: true,
      assignmentNotifications: true,
      statusChangeNotifications: true,
      timezone: 'UTC',
      createdAt: new Date(),
    });
  }
  return store.notificationPrefs.get(userId);
}
export async function updateNotificationPreferences(userId: number, preferences: any) {
  const existing = await getOrCreateNotificationPreferences(userId);
  store.notificationPrefs.set(userId, { ...existing, ...preferences });
}
export async function getNotificationPreferences(userId: number) {
  return store.notificationPrefs.get(userId) || null;
}

// ─────────────── Notification History ───────────────
export async function recordNotificationHistory(history: any) {
  const id = nextId();
  const row = { id, sentAt: new Date(), ...history };
  store.notificationHistory.push(row);
  return [row];
}
export async function getNotificationHistory(notificationId: number) {
  return store.notificationHistory.filter(h => h.notificationId === notificationId);
}
export async function getNotificationHistoryByUser(userId: number, _days = 30) {
  return store.notificationHistory.filter(h => h.userId === userId);
}
export async function getFailedNotifications(_hours = 24) {
  return store.notificationHistory.filter(h => h.status === 'failed');
}

// ─────────────── Notification Templates / Triggers ───────────────
export async function getNotificationTemplates(_limit = 50, _offset = 0) { return []; }
export async function getNotificationTemplate(_id: number) { return undefined; }
export async function createNotificationTemplate(_data: any) { return [{ id: nextId() }]; }
export async function updateNotificationTemplate(_id: number, _data: any) {}
export async function deleteNotificationTemplate(_id: number) {}
export async function getNotificationTriggers(_limit = 50, _offset = 0) { return []; }
export async function getNotificationTrigger(_id: number) { return undefined; }
export async function getTriggersByTemplate(_templateId: number) { return []; }
export async function getTriggersByEventType(_eventType: string) { return []; }
export async function getActiveTriggers() { return []; }
export async function createNotificationTrigger(_data: any) { return [{ id: nextId() }]; }
export async function updateNotificationTrigger(_id: number, _data: any) {}
export async function deleteNotificationTrigger(_id: number) {}
export async function recordTriggerExecution(_data: any) { return [{ id: nextId() }]; }
export async function getTriggerExecutionLog(_triggerId: number, _limit = 100) { return []; }

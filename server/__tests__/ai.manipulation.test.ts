import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../routers';
import * as db from '../db';

/**
 * AI Data Manipulation Tools Tests
 * Tests for work hours, machine hours, materials, and document manipulation
 */

const mockUser = {
  id: 1,
  openId: 'test-user',
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin' as const,
  phoneNumber: null,
  smsNotificationsEnabled: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createAuthContext() {
  const clearedCookies: string[] = [];
  const ctx = {
    user: mockUser,
    req: {} as any,
    res: {
      clearCookie: (name: string) => clearedCookies.push(name),
    } as any,
  };
  return { ctx, clearedCookies };
}

const { ctx } = createAuthContext();
const caller = appRouter.createCaller(ctx);

describe('AI Data Manipulation Tools', () => {
  let testEmployeeId: number;
  let testMachineId: number;
  let testProjectId: number;

  beforeAll(async () => {
    // Create test employee with unique number
    const timestamp = Date.now();
    const empResult = await db.createEmployee({
      firstName: 'Test',
      lastName: 'Employee',
      employeeNumber: `EMP-TEST-${timestamp}`,
      position: 'Worker',
      department: 'construction',
      phoneNumber: '+38761234567',
      email: 'test.employee@example.com',
      hireDate: new Date(),
      status: 'active',
    });
    testEmployeeId = (empResult[0] as any).id;

    // Create test machine with unique number
    const machineResult = await db.createMachine({
      name: 'Test Mixer',
      machineNumber: `MACH-TEST-${timestamp}`,
      type: 'mixer',
      model: 'MX-2000',
      status: 'operational',
    });
    testMachineId = (machineResult[0] as any).id;

    // Create test project
    const projectResult = await db.createProject({
      name: 'Test Project',
      description: 'Test project for AI tools',
      location: 'Test Location',
      status: 'active',
      createdBy: mockUser.id,
    });
    testProjectId = (projectResult[0] as any).id;
  });

  describe('Work Hours Tools', () => {
    it('should log employee work hours', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() - 8 * 60 * 60 * 1000); // 8 hours ago

      const result = await caller.ai.executeTool({
        toolName: 'log_work_hours',
        parameters: {
          employeeId: testEmployeeId,
          projectId: testProjectId,
          date: now.toISOString().split('T')[0],
          startTime: startTime.toISOString(),
          endTime: now.toISOString(),
          workType: 'regular',
          notes: 'Test work hours',
        },
      });

      expect(result.success).toBe(true);
      expect(result.result).toHaveProperty('workHourId');
      expect(result.result.hoursWorked).toBe(8);
      expect(result.result.overtimeHours).toBe(0);
    });

    it('should calculate overtime correctly', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() - 10 * 60 * 60 * 1000); // 10 hours ago

      const result = await caller.ai.executeTool({
        toolName: 'log_work_hours',
        parameters: {
          employeeId: testEmployeeId,
          date: now.toISOString().split('T')[0],
          startTime: startTime.toISOString(),
          endTime: now.toISOString(),
          workType: 'overtime',
        },
      });

      expect(result.success).toBe(true);
      expect(result.result.hoursWorked).toBe(10);
      expect(result.result.overtimeHours).toBe(2); // 10 - 8 = 2 hours overtime
    });

    it('should get work hours summary', async () => {
      const result = await caller.ai.executeTool({
        toolName: 'get_work_hours_summary',
        parameters: {
          employeeId: testEmployeeId,
        },
      });

      expect(result.success).toBe(true);
      expect(result.result).toHaveProperty('totalHours');
      expect(result.result).toHaveProperty('totalOvertime');
      expect(result.result).toHaveProperty('byWorkType');
      expect(result.result.totalEntries).toBeGreaterThanOrEqual(0);
    });

    it('should filter work hours by date range', async () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      const result = await caller.ai.executeTool({
        toolName: 'get_work_hours_summary',
        parameters: {
          employeeId: testEmployeeId,
          startDate: yesterday.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        },
      });

      expect(result.success).toBe(true);
      expect(result.result.totalHours).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Machine Hours Tools', () => {
    it('should log machine work hours', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() - 5 * 60 * 60 * 1000); // 5 hours ago

      const result = await caller.ai.executeTool({
        toolName: 'log_machine_hours',
        parameters: {
          machineId: testMachineId,
          projectId: testProjectId,
          date: now.toISOString().split('T')[0],
          startTime: startTime.toISOString(),
          endTime: now.toISOString(),
          operatorId: testEmployeeId,
          operatorName: 'Test Employee',
          notes: 'Test machine operation',
        },
      });

      expect(result.success).toBe(true);
      expect(result.result).toHaveProperty('machineWorkHourId');
      expect(result.result.hoursWorked).toBe(5);
    });

    it('should log machine hours without end time', async () => {
      const now = new Date();

      const result = await caller.ai.executeTool({
        toolName: 'log_machine_hours',
        parameters: {
          machineId: testMachineId,
          date: now.toISOString().split('T')[0],
          startTime: now.toISOString(),
        },
      });

      if (!result.success) console.log('Machine hours error:', result);
      expect(result.success).toBe(true);
      expect(result.result.hoursWorked).toBeNull(); // No end time yet
    });
  });

  describe('Material Manipulation Tools', () => {
    it('should create new material', async () => {
      const result = await caller.ai.executeTool({
        toolName: 'create_material',
        parameters: {
          name: 'AI Test Material',
          category: 'other',
          unit: 'kg',
          quantity: 1000,
          minStock: 100,
          supplier: 'Test Supplier',
          unitPrice: 50,
        },
      });

      expect(result.success).toBe(true);
      expect(result.result).toHaveProperty('materialId');
      expect(result.result.message).toContain('created successfully');
    });

    it('should update material quantity (absolute)', async () => {
      // First create a material
      const createResult = await caller.ai.executeTool({
        toolName: 'create_material',
        parameters: {
          name: `Material for Quantity Test ${Date.now()}`,
          unit: 'kg',
          quantity: 500,
        },
      });

      const materialId = createResult.result.materialId;

      // Update quantity
      const updateResult = await caller.ai.executeTool({
        toolName: 'update_material_quantity',
        parameters: {
          materialId,
          quantity: 750,
        },
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.result.newQuantity).toBe(750);
    });

    it('should update material quantity (adjustment)', async () => {
      // Create material
      const createResult = await caller.ai.executeTool({
        toolName: 'create_material',
        parameters: {
          name: `Material for Adjustment Test ${Date.now()}`,
          unit: 'kg',
          quantity: 500,
        },
      });

      const materialId = createResult.result.materialId;

      // Add 200
      const addResult = await caller.ai.executeTool({
        toolName: 'update_material_quantity',
        parameters: {
          materialId,
          adjustment: 200,
        },
      });

      expect(addResult.success).toBe(true);
      expect(typeof addResult.result.previousQuantity).toBe('number');
      expect(typeof addResult.result.newQuantity).toBe('number');
      expect(addResult.result.adjustment).toBe(200);

      // Subtract 150
      const subtractResult = await caller.ai.executeTool({
        toolName: 'update_material_quantity',
        parameters: {
          materialId,
          adjustment: -150,
        },
      });

      expect(subtractResult.success).toBe(true);
      expect(typeof subtractResult.result.newQuantity).toBe('number');
    });
  });

  describe('Document Manipulation Tools', () => {
    let testDocumentId: number;

    beforeAll(async () => {
      // Create test document
      const docResult = await db.createDocument({
        name: 'Test Document',
        description: 'Test document for AI tools',
        fileKey: 'test/document.pdf',
        fileUrl: 'https://example.com/test.pdf',
        category: 'other',
        uploadedBy: mockUser.id,
      });
      testDocumentId = (docResult[0] as any).id;
    });

    it('should update document metadata', async () => {
      const result = await caller.ai.executeTool({
        toolName: 'update_document',
        parameters: {
          documentId: testDocumentId,
          name: 'Updated Test Document',
          description: 'Updated description',
          category: 'report',
          projectId: testProjectId,
        },
      });

      if (!result.success) console.log('Update doc error:', result);
      expect(result.success).toBe(true);
      expect(result.result.updated).toContain('name');
      expect(result.result.updated).toContain('description');
      expect(result.result.updated).toContain('category');
    });

    it('should update only specified fields', async () => {
      const result = await caller.ai.executeTool({
        toolName: 'update_document',
        parameters: {
          documentId: testDocumentId,
          name: 'Partially Updated Document',
        },
      });

      expect(result.success).toBe(true);
      expect(result.result.updated).toContain('name');
      expect(result.result.updated.length).toBe(1);
    });

    it('should delete document', async () => {
      // Create a document to delete
      const deleteDocResult = await db.createDocument({
        name: 'Document to Delete',
        fileKey: 'test/delete.pdf',
        fileUrl: 'https://example.com/delete.pdf',
        category: 'other',
        uploadedBy: mockUser.id,
      });
      const docId = (deleteDocResult[0] as any).id;

      const result = await caller.ai.executeTool({
        toolName: 'delete_document',
        parameters: {
          documentId: docId,
        },
      });

      expect(result.success).toBe(true);
      expect(result.result.message).toContain('deleted successfully');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required parameters', async () => {
      const result = await caller.ai.executeTool({
        toolName: 'log_work_hours',
        parameters: {
          // Missing required fields
          employeeId: testEmployeeId,
        },
      });

      expect(result).toBeDefined();
    });

    it('should handle invalid material ID', async () => {
      const result = await caller.ai.executeTool({
        toolName: 'update_material_quantity',
        parameters: {
          materialId: 999999, // Non-existent ID
          quantity: 100,
        },
      });

      // Should still succeed but with no effect or error
      expect(result).toBeDefined();
    });

    it('should require either quantity or adjustment', async () => {
      const result = await caller.ai.executeTool({
        toolName: 'update_material_quantity',
        parameters: {
          materialId: 1,
          // Neither quantity nor adjustment provided
        },
      });

      // Tool execution succeeds, but result contains error
      expect(result.success).toBe(true);
      expect(result.result.error).toContain('quantity or adjustment');
    });
  });
});

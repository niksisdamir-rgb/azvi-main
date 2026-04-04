import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../routers';
import * as db from '../db';

/**
 * AI Agentic Tools Tests
 * Tests the execution of AI tools that access business data
 */

// Mock user context
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

describe('AI Agentic Tools', () => {
  describe('Tool Execution', () => {
    it('should execute search_materials tool', async () => {
      const result = await caller.ai.executeTool({
        toolName: 'search_materials',
        parameters: {
          query: 'cement',
        },
      });

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('toolName');
      expect(result.toolName).toBe('search_materials');
      
      if (result.success) {
        expect(result).toHaveProperty('result');
        expect(Array.isArray(result.result)).toBe(true);
      }
    });

    it('should execute get_delivery_status tool', async () => {
      const result = await caller.ai.executeTool({
        toolName: 'get_delivery_status',
        parameters: {
          status: 'completed',
        },
      });

      expect(result).toHaveProperty('success');
      expect(result.toolName).toBe('get_delivery_status');
      
      if (result.success) {
        expect(result).toHaveProperty('result');
        expect(Array.isArray(result.result)).toBe(true);
      }
    });

    it('should execute search_documents tool', async () => {
      const result = await caller.ai.executeTool({
        toolName: 'search_documents',
        parameters: {
          query: 'test',
        },
      });

      expect(result).toHaveProperty('success');
      expect(result.toolName).toBe('search_documents');
      
      if (result.success) {
        expect(result).toHaveProperty('result');
        expect(Array.isArray(result.result)).toBe(true);
      }
    });

    it('should execute get_quality_tests tool', async () => {
      const result = await caller.ai.executeTool({
        toolName: 'get_quality_tests',
        parameters: {
          testType: 'slump',
        },
      });

      expect(result).toHaveProperty('success');
      expect(result.toolName).toBe('get_quality_tests');
      
      if (result.success) {
        expect(result).toHaveProperty('result');
        expect(Array.isArray(result.result)).toBe(true);
      }
    });

    it('should execute generate_forecast tool', async () => {
      const result = await caller.ai.executeTool({
        toolName: 'generate_forecast',
        parameters: {
          materialName: 'cement',
          days: 30,
        },
      });

      expect(result).toHaveProperty('success');
      expect(result.toolName).toBe('generate_forecast');
      
      if (result.success) {
        expect(result).toHaveProperty('result');
        expect(Array.isArray(result.result)).toBe(true);
      }
    });

    it('should execute calculate_stats tool', async () => {
      const result = await caller.ai.executeTool({
        toolName: 'calculate_stats',
        parameters: {
          metric: 'total_deliveries',
        },
      });

      expect(result).toHaveProperty('success');
      expect(result.toolName).toBe('calculate_stats');
      
      if (result.success) {
        expect(result).toHaveProperty('result');
      }
    });
  });

  describe('Tool Error Handling', () => {
    it('should handle invalid tool name', async () => {
      const result = await caller.ai.executeTool({
        toolName: 'non_existent_tool',
        parameters: {},
      });

      expect(result).toHaveProperty('success');
      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
    });

    it('should handle missing required parameters', async () => {
      const result = await caller.ai.executeTool({
        toolName: 'search_materials',
        parameters: {}, // Missing 'query' parameter
      });

      expect(result).toHaveProperty('success');
      // Tool should handle gracefully, either succeed with empty results or fail gracefully
      expect(typeof result.success).toBe('boolean');
    });

    it('should handle invalid parameter types', async () => {
      const result = await caller.ai.executeTool({
        toolName: 'generate_forecast',
        parameters: {
          materialName: 'cement',
          days: 'invalid', // Should be number
        },
      });

      expect(result).toHaveProperty('success');
      // Should handle type mismatch gracefully
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Tool Response Format', () => {
    it('should return consistent response structure', async () => {
      const result = await caller.ai.executeTool({
        toolName: 'search_materials',
        parameters: { query: 'test' },
      });

      // All tools should return this structure
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('toolName');
      expect(result).toHaveProperty('parameters');
      
      if (result.success) {
        expect(result).toHaveProperty('result');
      } else {
        expect(result).toHaveProperty('error');
      }
    });

    it('should include original parameters in response', async () => {
      const params = { query: 'cement' };
      const result = await caller.ai.executeTool({
        toolName: 'search_materials',
        parameters: params,
      });

      expect(result.parameters).toEqual(params);
    });
  });

  describe('Tool Integration with Database', () => {
    it('should access real database data via tools', async () => {
      // Create a test material
      const materialId = await db.createMaterial({
        name: 'AI Test Material XYZ',
        category: 'other',
        unit: 'kg',
        quantity: 1000,
        minStock: 100,
        criticalThreshold: 50,
      });

      // Search for it using the tool with exact unique name
      const result = await caller.ai.executeTool({
        toolName: 'search_materials',
        parameters: { query: 'AI Test Material XYZ' },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const materials = result.result as any[];
        // Should find our test material
        expect(materials.length).toBeGreaterThan(0);
        const found = materials.find(m => m.name === 'AI Test Material XYZ');
        expect(found).toBeDefined();
        expect(found?.quantity).toBe(1000);
      }

      // Cleanup
      await db.deleteMaterial(materialId);
    });

    it('should return empty or valid results for search queries', async () => {
      const result = await caller.ai.executeTool({
        toolName: 'search_materials',
        parameters: { query: 'this-material-definitely-does-not-exist-xyz-123' },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const materials = result.result as any[];
        // Should return array (empty or with results)
        expect(Array.isArray(materials)).toBe(true);
      }
    });
  });
});

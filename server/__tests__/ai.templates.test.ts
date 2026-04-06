import { describe, it, expect } from 'vitest';
import { appRouter } from '../routers';
import { PROMPT_TEMPLATES } from '@shared/promptTemplates';

/**
 * AI Prompt Templates Tests
 * Tests template retrieval, search, and filtering functionality
 */

// Mock user context (templates are public, no auth needed)
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

describe('AI Prompt Templates', () => {
  describe('Get All Templates', () => {
    it('should return all templates', async () => {
      const templates = await caller.ai.getTemplates();

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.length).toBe(PROMPT_TEMPLATES.length);
    });

    it('should return templates with correct structure', async () => {
      const templates = await caller.ai.getTemplates();

      const template = templates[0];
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('category');
      expect(template).toHaveProperty('title');
      expect(template).toHaveProperty('description');
      expect(template).toHaveProperty('prompt');
      expect(template).toHaveProperty('icon');
      expect(template).toHaveProperty('tags');

      expect(typeof template.id).toBe('string');
      expect(typeof template.category).toBe('string');
      expect(typeof template.title).toBe('string');
      expect(typeof template.description).toBe('string');
      expect(typeof template.prompt).toBe('string');
      expect(Array.isArray(template.tags)).toBe(true);
    });
  });

  describe('Get Templates by Category', () => {
    it('should return inventory templates', async () => {
      const templates = await caller.ai.getTemplatesByCategory({ category: 'inventory' });

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      
      templates.forEach(t => {
        expect(t.category).toBe('inventory');
      });
    });

    it('should return delivery templates', async () => {
      const templates = await caller.ai.getTemplatesByCategory({ category: 'deliveries' });

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      
      templates.forEach(t => {
        expect(t.category).toBe('deliveries');
      });
    });

    it('should return quality templates', async () => {
      const templates = await caller.ai.getTemplatesByCategory({ category: 'quality' });

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      
      templates.forEach(t => {
        expect(t.category).toBe('quality');
      });
    });

    it('should return report templates', async () => {
      const templates = await caller.ai.getTemplatesByCategory({ category: 'reports' });

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      
      templates.forEach(t => {
        expect(t.category).toBe('reports');
      });
    });

    it('should return analysis templates', async () => {
      const templates = await caller.ai.getTemplatesByCategory({ category: 'analysis' });

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      
      templates.forEach(t => {
        expect(t.category).toBe('analysis');
      });
    });

    it('should return forecasting templates', async () => {
      const templates = await caller.ai.getTemplatesByCategory({ category: 'forecasting' });

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      
      templates.forEach(t => {
        expect(t.category).toBe('forecasting');
      });
    });
  });

  describe('Search Templates', () => {
    it('should find templates by title', async () => {
      const templates = await caller.ai.searchTemplates({ query: 'zalihe' });

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      
      const hasMatch = templates.some(t => 
        t.title.toLowerCase().includes('zalihe') ||
        t.description.toLowerCase().includes('zalihe') ||
        t.tags.some(tag => tag.toLowerCase().includes('zalihe'))
      );
      expect(hasMatch).toBe(true);
    });

    it('should find templates by description', async () => {
      const templates = await caller.ai.searchTemplates({ query: 'isporuke' });

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should find templates by tags', async () => {
      const templates = await caller.ai.searchTemplates({ query: 'kvalitet' });

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent query', async () => {
      const templates = await caller.ai.searchTemplates({ 
        query: 'this-definitely-does-not-exist-xyz-123' 
      });

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBe(0);
    });

    it('should be case-insensitive', async () => {
      const lowerCase = await caller.ai.searchTemplates({ query: 'materijal' });
      const upperCase = await caller.ai.searchTemplates({ query: 'MATERIJAL' });
      const mixedCase = await caller.ai.searchTemplates({ query: 'MaTeRiJaL' });

      expect(lowerCase.length).toBe(upperCase.length);
      expect(lowerCase.length).toBe(mixedCase.length);
      expect(lowerCase.length).toBeGreaterThan(0);
    });
  });

  describe('Get Template by ID', () => {
    it('should return specific template', async () => {
      const template = await caller.ai.getTemplate({ id: 'check-low-stock' });

      expect(template).toBeDefined();
      expect(template.id).toBe('check-low-stock');
      expect(template.category).toBe('inventory');
      expect(template.title).toContain('zaliha');
    });

    it('should throw error for non-existent template', async () => {
      await expect(
        caller.ai.getTemplate({ id: 'non-existent-template-xyz' })
      ).rejects.toThrow('Template not found');
    });
  });

  describe('Template Content Quality', () => {
    it('should have non-empty prompts', async () => {
      const templates = await caller.ai.getTemplates();

      templates.forEach(t => {
        expect(t.prompt.length).toBeGreaterThan(0);
        expect(t.prompt.trim()).toBe(t.prompt); // No leading/trailing whitespace
      });
    });

    it('should have meaningful descriptions', async () => {
      const templates = await caller.ai.getTemplates();

      templates.forEach(t => {
        expect(t.description.length).toBeGreaterThan(10); // At least some meaningful text
      });
    });

    it('should have at least one tag per template', async () => {
      const templates = await caller.ai.getTemplates();

      templates.forEach(t => {
        expect(t.tags.length).toBeGreaterThan(0);
      });
    });

    it('should have unique IDs', async () => {
      const templates = await caller.ai.getTemplates();

      const ids = templates.map(t => t.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Category Coverage', () => {
    it('should have templates for all categories', async () => {
      const categories = ['inventory', 'deliveries', 'quality', 'reports', 'analysis', 'forecasting'];

      for (const category of categories) {
        const templates = await caller.ai.getTemplatesByCategory({ 
          category: category as any 
        });
        expect(templates.length).toBeGreaterThan(0);
      }
    });

    it('should have balanced distribution across categories', async () => {
      const templates = await caller.ai.getTemplates();

      const categoryCounts: Record<string, number> = {};
      templates.forEach(t => {
        categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
      });

      // Each category should have at least 2 templates
      Object.values(categoryCounts).forEach(count => {
        expect(count).toBeGreaterThanOrEqual(2);
      });
    });
  });
});

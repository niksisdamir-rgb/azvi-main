import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { appRouter } from '../routers';
import * as db from '../db';

/**
 * AI Chat Integration Tests
 * Tests the AI assistant chat functionality with Ollama
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

describe('AI Chat Procedures', () => {
  let conversationId: number;
  let messageId: number;

  describe('Conversation Management', () => {
    it('should create a new conversation', async () => {
      const result = await caller.ai.createConversation({
        title: 'Test Conversation',
        modelName: 'llama3.2',
      });

      expect(result).toHaveProperty('conversationId');
      expect(typeof result.conversationId).toBe('number');
      conversationId = result.conversationId;
    });

    it('should list conversations for user', async () => {
      const conversations = await caller.ai.getConversations();

      expect(Array.isArray(conversations)).toBe(true);
      expect(conversations.length).toBeGreaterThan(0);
      
      const testConv = conversations.find(c => c.id === conversationId);
      expect(testConv).toBeDefined();
      expect(testConv?.title).toBe('Test Conversation');
      expect(testConv?.userId).toBe(mockUser.id);
    });

    it('should get messages for a conversation', async () => {
      const messages = await caller.ai.getMessages({ conversationId });

      expect(Array.isArray(messages)).toBe(true);
      // New conversation should have no messages yet
      expect(messages.length).toBe(0);
    });
  });

  describe('Chat Functionality', () => {
    it('should send a message and get AI response', async () => {
      const result = await caller.ai.chat({
        conversationId,
        message: 'What is 2+2?',
        model: 'llama3.2',
        useTools: false,
      });

      expect(result).toHaveProperty('conversationId');
      expect(result).toHaveProperty('messageId');
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('model');

      expect(result.conversationId).toBe(conversationId);
      expect(typeof result.content).toBe('string');
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.model).toBe('llama3.2');

      messageId = result.messageId;
    }, 30000); // 30s timeout for AI response

    it('should create conversation automatically if not provided', async () => {
      const result = await caller.ai.chat({
        message: 'Hello, this is a new conversation',
        model: 'llama3.2',
        useTools: false,
      });

      expect(result).toHaveProperty('conversationId');
      expect(result.conversationId).not.toBe(conversationId);
      expect(typeof result.content).toBe('string');
    }, 30000);

    it('should maintain conversation history', async () => {
      // Send first message
      await caller.ai.chat({
        conversationId,
        message: 'My name is Alice',
        model: 'llama3.2',
        useTools: false,
      });

      // Send follow-up message
      const result = await caller.ai.chat({
        conversationId,
        message: 'What is my name?',
        model: 'llama3.2',
        useTools: false,
      });

      // AI should remember the name from conversation history
      expect(result.content.toLowerCase()).toContain('alice');
    }, 60000);

    it('should store messages in database', async () => {
      const messages = await caller.ai.getMessages({ conversationId });

      expect(messages.length).toBeGreaterThan(0);
      
      // Check message structure
      const userMessage = messages.find(m => m.role === 'user');
      const assistantMessage = messages.find(m => m.role === 'assistant');

      expect(userMessage).toBeDefined();
      expect(assistantMessage).toBeDefined();

      expect(userMessage).toHaveProperty('content');
      expect(userMessage).toHaveProperty('createdAt');
      expect(assistantMessage).toHaveProperty('content');
      expect(assistantMessage).toHaveProperty('model');
    });
  });

  describe('Model Management', () => {
    it('should list available models', async () => {
      const models = await caller.ai.listModels();

      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);

      const llama32 = models.find(m => m.name.includes('llama3.2'));
      expect(llama32).toBeDefined();
      expect(llama32).toHaveProperty('name');
      expect(llama32).toHaveProperty('size');
      expect(llama32).toHaveProperty('family');
    });

    it('should handle different models', async () => {
      const models = await caller.ai.listModels();
      
      if (models.length > 0) {
        const modelName = models[0].name;
        
        const result = await caller.ai.chat({
          conversationId,
          message: 'Test with specific model',
          model: modelName,
          useTools: false,
        });

        expect(result.model).toBe(modelName);
      }
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should handle invalid conversation ID', async () => {
      await expect(
        caller.ai.getMessages({ conversationId: 999999 })
      ).rejects.toThrow();
    });

    it('should handle empty message', async () => {
      await expect(
        caller.ai.chat({
          conversationId,
          message: '',
          model: 'llama3.2',
        })
      ).rejects.toThrow(/Message cannot be empty|String must contain at least 1 character/);
    }, 10000);

    it('should handle non-existent model gracefully', async () => {
      // This should fail gracefully
      await expect(
        caller.ai.chat({
          conversationId,
          message: 'Test',
          model: 'non-existent-model-xyz',
        })
      ).rejects.toThrow();
    }, 15000);
  });

  describe('Cleanup', () => {
    it('should delete a conversation', async () => {
      const result = await caller.ai.deleteConversation({ conversationId });

      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);

      // Verify deletion
      const conversations = await caller.ai.getConversations();
      const deleted = conversations.find(c => c.id === conversationId);
      expect(deleted).toBeUndefined();
    });
  });
});

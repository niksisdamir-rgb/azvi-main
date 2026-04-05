import { logger } from '../../lib/logger';
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../../lib/trpc";
import * as db from "../../db";
import { ollamaService } from "../../lib/ollama";
import { executeTool } from "../../lib/aiTools";
import { transcribeAudio } from "../../lib/voiceTranscription";
import { storagePut } from "../../storage";
import { summarizationService } from "../../lib/summarization";
import { PROMPT_TEMPLATES, getTemplatesByCategory, searchTemplates, getTemplateById, type TemplateCategory } from "../../../packages/shared-core/promptTemplates";
import axios from "axios";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

/**
 * AI Assistant Router
 * Handles AI chat, voice transcription, model management, and agentic tool execution
 */
export const aiAssistantRouter = router({
  /**
   * Chat with AI assistant (streaming support)
   */
  chat: protectedProcedure
    .input(
      z.object({
        conversationId: z.number().optional(),
        message: z.string().min(1, 'Message cannot be empty'),
        model: z.string().default("llama3.2"),
        imageUrl: z.string().optional(),
        audioUrl: z.string().optional(),
        useTools: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.user.id;

        // Validate model availability
        const availableModels = await ollamaService.listModels();
        if (!availableModels.some(m => m.name === input.model)) {
          throw new Error(`Model "${input.model}" is not available. Please pull it first or use an available model.`);
        }

        // Create or get conversation
        let conversationId = input.conversationId;
        if (!conversationId) {
          conversationId = await db.createAiConversation({
            userId,
            title: input.message.substring(0, 50),
            modelName: input.model,
          });
        } else {
          // Verify user owns this conversation
          const conversations = await db.getAiConversations(userId);
          if (!conversations.some(c => c.id === conversationId)) {
            throw new Error('Conversation not found or access denied');
          }
        }

        // Save user message
        await db.createAiMessage({
          conversationId,
          role: "user",
          content: input.message,
          audioUrl: input.audioUrl,
          imageUrl: input.imageUrl,
        });

        // Get conversation history
        const history = await db.getAiMessages(conversationId);
        const messages = history.map((msg) => ({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
          images: msg.imageUrl ? [msg.imageUrl] : undefined,
        }));

        // Add system message with DMS context
        const systemMessage = {
          role: "system" as const,
          content: `You are an AI assistant for AzVirt DMS (Delivery Management System), a concrete production and delivery management platform. You have access to real-time data AND the ability to create, update, and manage business records.

DATA RETRIEVAL TOOLS:
- search_materials: Search and check inventory levels
- get_delivery_status: Track delivery status and history
- search_documents: Find documents and files
- get_quality_tests: Review quality control test results
- generate_forecast: Get inventory forecasting predictions
- calculate_stats: Calculate business metrics and statistics

DATA MANIPULATION TOOLS:
- log_work_hours: Record employee work hours with overtime tracking
- get_work_hours_summary: Get work hours summary for employees/projects
- log_machine_hours: Track equipment/machinery usage hours
- create_material: Add new materials to inventory
- update_material_quantity: Adjust material stock levels
- update_document: Modify document metadata (name, category, project)
- delete_document: Remove documents from the system

CAPABILITIES:
- Answer questions about inventory, deliveries, quality, and operations
- Create and log work hours for employees and machines
- Add new materials and update stock quantities
- Manage document metadata and organization
- Generate reports and calculate business metrics
- Provide forecasts and trend analysis

GUIDELINES:
- Always confirm before deleting or making significant changes
- When logging hours, calculate overtime automatically (>8 hours)
- For stock updates, show previous and new quantities
- Be precise with dates and times (use ISO format)
- Provide clear success/error messages
- Ask for clarification if parameters are ambiguous

Be helpful, accurate, and professional. Use tools to fetch real data and perform requested operations.`,
        };

        // Chat with Ollama (non-streaming)
        const response = await ollamaService.chat(
          input.model,
          [systemMessage, ...messages],
          {
            stream: false,
            temperature: 0.7,
          }
        ) as import("../../lib/ollama").OllamaResponse;

        if (!response || !response.message || !response.message.content) {
          throw new Error('Invalid response from AI model');
        }

        // Save assistant response
        const assistantMessageId = await db.createAiMessage({
          conversationId,
          role: "assistant",
          content: response.message.content,
          model: input.model,
        });

        return {
          conversationId,
          messageId: assistantMessageId,
          content: response.message.content,
          model: input.model,
        };
      } catch (error: any) {
        logger.error({ err: error }, 'AI chat error:');
        throw new Error(`Chat failed: ${error.message || 'Unknown error'}`);
      }
    }),

  /**
   * Chat with RAG (Retrieval-Augmented Generation)
   */
  ragChat: protectedProcedure
    .input(z.object({
      conversationId: z.number().optional(),
      message: z.string().min(1)
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.user.id;
        let conversationId = input.conversationId;

        // Create or get conversation
        if (!conversationId) {
          conversationId = await db.createAiConversation({
            userId,
            title: input.message.substring(0, 50),
            modelName: "RAG",
          });
        } else {
          // Verify user owns this conversation
          const conversations = await db.getAiConversations(userId);
          if (!conversations.some(c => c.id === conversationId)) {
            throw new Error('Conversation not found or access denied');
          }
        }

        // Save user message
        await db.createAiMessage({
          conversationId,
          role: "user",
          content: input.message,
        });

        const response = await fetch('http://127.0.0.1:8000/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: input.message, user_id: ctx.user.id }),
        });
        
        if (!response.ok) {
          throw new Error(`RAG server error: ${response.statusText}`);
        }
        
        const data = await response.json() as any;
        
        let answer = data.answer;
        if (data.sources && data.sources.length > 0) {
            answer += '\n\n**Sources:**\n' + data.sources.map((s: any) => `- ${s.metadata?.source || 'Unknown'}: ${s.content.substring(0, 100)}...`).join('\n');
        }

        // Save assistant message
        await db.createAiMessage({
          conversationId,
          role: "assistant",
          content: answer,
        });

        return {
          conversationId: conversationId,
          answer: data.answer,
          sources: data.sources || []
        };
      } catch (error: any) {
        logger.error({ err: error }, 'RAG chat error:');
        throw new Error(`RAG Chat failed: ${error.message || 'Unknown error'}`);
      }
    }),

  /**
   * Stream chat response (for real-time streaming)
   */
  streamChat: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        message: z.string(),
        model: z.string().default("llama3.2"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // This would require tRPC subscriptions for true streaming
      // For now, return the full response
      return { message: "Streaming not yet implemented. Use chat endpoint." };
    }),

  /**
   * Transcribe voice audio to text
   */
  transcribeVoice: protectedProcedure
    .input(
      z.object({
        audioData: z.string(), // base64 encoded audio
        language: z.string().optional(),
        summarize: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Convert base64 to buffer
        const audioBuffer = Buffer.from(input.audioData, "base64");

        // Upload to S3
        const timestamp = Date.now();
        const { url: audioUrl } = await storagePut(
          `voice/${ctx.user.id}/recording-${timestamp}.webm`,
          audioBuffer,
          "audio/webm"
        );

        // Transcribe using Whisper API
        const result = await transcribeAudio({
          audioUrl,
          language: input.language || "en",
        });

        // Check if transcription was successful
        if ('error' in result) {
          throw new Error(result.error);
        }

        // Summarize if requested
        let summary = null;
        if (input.summarize && result.text) {
          try {
            summary = await summarizationService.summarizeTranscription(result.text);
          } catch (error) {
            logger.error({ err: error }, "Summarization error:");
            // Don't fail the whole request if only summarization fails
          }
        }

        return {
          text: result.text,
          language: result.language || input.language || "en",
          audioUrl,
          summary,
        };
      } catch (error: any) {
        logger.error({ err: error }, "Voice transcription error:");
        throw new Error(`Transcription failed: ${error.message}`);
      }
    }),

  /**
   * Get all conversations for current user
   */
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    return await db.getAiConversations(ctx.user.id);
  }),

  /**
   * Get messages for a conversation
   */
  getMessages: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ input, ctx }) => {
      // Verify conversation belongs to user
      const conversations = await db.getAiConversations(ctx.user.id);
      const conversation = conversations.find((c) => c.id === input.conversationId);
      
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      return await db.getAiMessages(input.conversationId);
    }),

  /**
   * Create a new conversation
   */
  createConversation: protectedProcedure
    .input(
      z.object({
        title: z.string().optional(),
        modelName: z.string().default("llama3.2"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const conversationId = await db.createAiConversation({
        userId: ctx.user.id,
        title: input.title || "New Conversation",
        modelName: input.modelName,
      });

      return { conversationId };
    }),

  /**
   * Delete a conversation
   */
  deleteConversation: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Verify ownership
      const conversations = await db.getAiConversations(ctx.user.id);
      const conversation = conversations.find((c) => c.id === input.conversationId);
      
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      await db.deleteAiConversation(input.conversationId);
      return { success: true };
    }),

  /**
   * List available Ollama models
   */
  listModels: protectedProcedure.query(async () => {
    try {
      const models = await ollamaService.listModels();
      return models.map((model) => ({
        name: model.name,
        size: model.size,
        modifiedAt: model.modified_at,
        family: model.details?.family || "unknown",
        parameterSize: model.details?.parameter_size || "unknown",
      }));
    } catch (error: any) {
      logger.error({ err: error }, "Failed to list models:");
      return [];
    }
  }),

  /**
   * Pull a new model from Ollama registry
   */
  pullModel: protectedProcedure
    .input(z.object({ modelName: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const success = await ollamaService.pullModel(input.modelName);
        return { success, message: success ? "Model pulled successfully" : "Failed to pull model" };
      } catch (error: any) {
        logger.error({ err: error }, "Failed to pull model:");
        return { success: false, message: error.message };
      }
    }),

  /**
   * Delete a model
   */
  deleteModel: protectedProcedure
    .input(z.object({ modelName: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const success = await ollamaService.deleteModel(input.modelName);
        return { success, message: success ? "Model deleted successfully" : "Failed to delete model" };
      } catch (error: any) {
        logger.error({ err: error }, "Failed to delete model:");
        return { success: false, message: error.message };
      }
    }),

  /**
   * Get all prompt templates
   */
  getTemplates: publicProcedure
    .query(async () => {
      return PROMPT_TEMPLATES;
    }),

  /**
   * Get templates by category
   */
  getTemplatesByCategory: publicProcedure
    .input(z.object({ category: z.enum(['inventory', 'deliveries', 'quality', 'reports', 'analysis', 'forecasting', 'bulk_import']) }))
    .query(async ({ input }) => {
      return getTemplatesByCategory(input.category as TemplateCategory);
    }),

  /**
   * Search templates
   */
  searchTemplates: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      return searchTemplates(input.query);
    }),

  /**
   * Get template by ID
   */
  getTemplate: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const template = getTemplateById(input.id);
      if (!template) {
        throw new Error('Template not found');
      }
      return template;
    }),

  /**
   * Execute an agentic tool
   */
  executeTool: protectedProcedure
    .input(
      z.object({
        toolName: z.string(),
        parameters: z.record(z.string(), z.any()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await executeTool(
          input.toolName,
          input.parameters,
          ctx.user.id
        );
        return result;
      } catch (error: any) {
        logger.error({ err: error }, "Tool execution error:");
        // Return error response instead of throwing
        return {
          success: false,
          toolName: input.toolName,
          parameters: input.parameters,
          error: error.message || 'Unknown error',
        };
      }
    }),
  
  /**
   * Get a summary of a conversation
   */
  getConversationSummary: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        // Verify conversation belongs to user
        const conversations = await db.getAiConversations(ctx.user.id);
        const conversation = conversations.find((c) => c.id === input.conversationId);
        
        if (!conversation) {
          throw new Error("Conversation not found");
        }

        // Get messages to summarize
        const messages = await db.getAiMessages(input.conversationId);
        const history = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        const summary = await summarizationService.summarizeConversation(history);
        return { summary };
      } catch (error: any) {
        logger.error({ err: error }, "Conversation summarization error:");
        throw new Error(`Failed to summarize conversation: ${error.message}`);
      }
    }),

  /**
   * Query documents using RAG from ML service
   */
  ragQuery: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        k: z.number().min(1).max(10).default(3),
      })
    )
    .query(async ({ input }) => {
      try {
        const response = await axios.post(`${ML_SERVICE_URL}/api/rag/query`, {
          query: input.query,
          k: input.k,
        });

        return {
          status: "success",
          results: response.data.results,
        };
      } catch (error) {
        logger.error({ err: error }, "RAG Service error:");
        return {
          status: "error",
          results: [],
          message: "Failed to query RAG service",
        };
      }
    }),

  /**
   * Create document in RAG system
   */
  createRagDocument: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        content: z.string(),
        source: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const response = await axios.post(`${ML_SERVICE_URL}/api/rag/documents`, {
          title: input.title,
          content: input.content,
          source: input.source,
        });

        return {
          status: "success",
          document: response.data.document,
        };
      } catch (error) {
        logger.error({ err: error }, "RAG Document creation error:");
        return {
          status: "error",
          message: "Failed to create document in RAG service",
        };
      }
    }),
});

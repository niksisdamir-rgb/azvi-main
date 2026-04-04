/**
 * Summarization Service
 * Provides functionality to generate concise summaries from text using Ollama.
 */

import { ollamaService, OllamaMessage, OllamaResponse } from './ollama';

const SUMMARIZATION_MODEL = process.env.SUMMARIZATION_MODEL || 'deepseek-r1:1.5b';

export class SummarizationService {
  /**
   * Generates a concise summary from the provided transcription text.
   * @param text The transcription text to summarize.
   * @returns A Promise resolving to the generated summary.
   */
  async summarizeTranscription(text: string): Promise<string> {
    if (!text || text.trim().length === 0) {
      return '';
    }

    const systemPrompt = `
      You are an expert summarizer. 
      Your task is to provide a concise, clear summary of the following transcription.
      Focus on the main points and key takeaways.
      The summary should be formatted as a single, well-structured paragraph.
      Maintain a professional and objective tone.
    `;

    const messages: OllamaMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Summarize this text: ${text}`,
      },
    ];

    try {
      const response = await ollamaService.chat(SUMMARIZATION_MODEL, messages) as OllamaResponse;
      return response.message.content.trim();
    } catch (error) {
      console.error('Failed to generate summary using Ollama:', error);
      throw new Error('Summarization failed');
    }
  }

  /**
   * Generates a summary of a conversation session.
   * @param messages The conversation messages to summarize.
   * @returns A Promise resolving to the generated summary.
   */
  async summarizeConversation(conversationHistory: { role: string; content: string }[]): Promise<string> {
    if (!conversationHistory || conversationHistory.length === 0) {
      return '';
    }

    const conversationText = conversationHistory
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n');

    const systemPrompt = `
      You are an expert summarizer. 
      Your task is to provide a concise, high-level summary of the following AI Assistant conversation session.
      Highlight the main topics discussed, questions asked, and solutions provided.
      The summary should be brief (2-3 sentences max) to give the user a quick context of where they left off.
      Format it as a single paragraph.
    `;

    const messages: OllamaMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Summarize this conversation history:\n\n${conversationText}`,
      },
    ];

    try {
      const response = await ollamaService.chat(SUMMARIZATION_MODEL, messages) as OllamaResponse;
      return response.message.content.trim();
    } catch (error) {
      console.error('Failed to generate conversation summary:', error);
      throw new Error('Conversation summarization failed');
    }
  }
}

export const summarizationService = new SummarizationService();

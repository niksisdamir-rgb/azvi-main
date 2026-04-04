/**
 * Ollama Integration Service
 * Provides interface to local Ollama instance for AI model inference
 */

import axios, { AxiosInstance } from 'axios';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[]; // base64 encoded images for vision models
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaModelInfo {
  modelfile: string;
  parameters: string;
  template: string;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

class OllamaService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: OLLAMA_BASE_URL,
      timeout: 300000, // 5 minutes for large model responses
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Chat with Ollama model (streaming or non-streaming)
   */
  async chat(
    model: string,
    messages: OllamaMessage[],
    options?: {
      stream?: boolean;
      temperature?: number;
      top_p?: number;
      top_k?: number;
      num_predict?: number;
    }
  ): Promise<OllamaResponse | AsyncGenerator<OllamaResponse>> {
    const requestBody = {
      model,
      messages,
      stream: options?.stream ?? false,
      options: {
        temperature: options?.temperature ?? 0.7,
        top_p: options?.top_p ?? 0.9,
        top_k: options?.top_k ?? 40,
        num_predict: options?.num_predict ?? -1,
      },
    };

    if (options?.stream) {
      return this.streamChat(requestBody);
    }

    const response = await this.client.post<OllamaResponse>('/api/chat', requestBody);
    return response.data;
  }

  /**
   * Stream chat responses
   */
  private async *streamChat(requestBody: any): AsyncGenerator<OllamaResponse> {
    const response = await this.client.post('/api/chat', requestBody, {
      responseType: 'stream',
    });

    const stream = response.data;
    let buffer = '';

    for await (const chunk of stream) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            yield data;
          } catch (e) {
            console.error('Failed to parse Ollama stream chunk:', e);
          }
        }
      }
    }

    if (buffer.trim()) {
      try {
        const data = JSON.parse(buffer);
        yield data;
      } catch (e) {
        console.error('Failed to parse final Ollama chunk:', e);
      }
    }
  }

  /**
   * Generate completion (simpler interface for single prompts)
   */
  async generate(
    model: string,
    prompt: string,
    options?: {
      stream?: boolean;
      images?: string[];
      system?: string;
    }
  ): Promise<any> {
    const requestBody = {
      model,
      prompt,
      stream: options?.stream ?? false,
      images: options?.images,
      system: options?.system,
    };

    const response = await this.client.post('/api/generate', requestBody);
    return response.data;
  }

  /**
   * List all available models
   */
  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await this.client.get<{ models: OllamaModel[] }>('/api/tags');
      return response.data.models || [];
    } catch (error) {
      console.error('Failed to list Ollama models:', error);
      return [];
    }
  }

  /**
   * Get model information
   */
  async showModel(modelName: string): Promise<OllamaModelInfo | null> {
    try {
      const response = await this.client.post<OllamaModelInfo>('/api/show', {
        name: modelName,
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to get info for model ${modelName}:`, error);
      return null;
    }
  }

  /**
   * Pull a model from Ollama registry
   */
  async pullModel(modelName: string, onProgress?: (progress: any) => void): Promise<boolean> {
    try {
      const response = await this.client.post(
        '/api/pull',
        { name: modelName, stream: true },
        { responseType: 'stream' }
      );

      const stream = response.data;
      let buffer = '';

      for await (const chunk of stream) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (onProgress) {
                onProgress(data);
              }
              if (data.status === 'success') {
                return true;
              }
            } catch (e) {
              console.error('Failed to parse pull progress:', e);
            }
          }
        }
      }

      return true;
    } catch (error) {
      console.error(`Failed to pull model ${modelName}:`, error);
      return false;
    }
  }

  /**
   * Delete a model
   */
  async deleteModel(modelName: string): Promise<boolean> {
    try {
      await this.client.delete('/api/delete', {
        data: { name: modelName },
      });
      return true;
    } catch (error) {
      console.error(`Failed to delete model ${modelName}:`, error);
      return false;
    }
  }

  /**
   * Check if Ollama is running
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.client.get('/');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Analyze image with vision model
   */
  async analyzeImage(
    model: string,
    imageBase64: string,
    prompt: string
  ): Promise<string> {
    const messages: OllamaMessage[] = [
      {
        role: 'user',
        content: prompt,
        images: [imageBase64],
      },
    ];

    const response = await this.chat(model, messages) as OllamaResponse;
    return response.message.content;
  }
}

// Export singleton instance
export const ollamaService = new OllamaService();

// Helper functions
export async function chatWithOllama(
  model: string,
  messages: OllamaMessage[],
  stream: boolean = false
): Promise<OllamaResponse | AsyncGenerator<OllamaResponse>> {
  return ollamaService.chat(model, messages, { stream });
}

export async function listOllamaModels(): Promise<OllamaModel[]> {
  return ollamaService.listModels();
}

export async function pullOllamaModel(
  modelName: string,
  onProgress?: (progress: any) => void
): Promise<boolean> {
  return ollamaService.pullModel(modelName, onProgress);
}

export async function deleteOllamaModel(modelName: string): Promise<boolean> {
  return ollamaService.deleteModel(modelName);
}

export async function analyzeImageWithOllama(
  model: string,
  imageBase64: string,
  prompt: string
): Promise<string> {
  return ollamaService.analyzeImage(model, imageBase64, prompt);
}

export async function isOllamaAvailable(): Promise<boolean> {
  return ollamaService.isAvailable();
}

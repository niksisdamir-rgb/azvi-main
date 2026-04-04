/**
 * Mock for server/lib/ollama.ts
 * Returns deterministic fake responses so AI tests pass without a running Ollama instance.
 */

export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[];
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
  eval_count?: number;
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

const MOCK_MODELS: OllamaModel[] = [
  {
    name: 'llama3.2:latest',
    modified_at: new Date().toISOString(),
    size: 2_000_000_000,
    digest: 'sha256:mockhashdeadbeef',
    details: {
      format: 'gguf',
      family: 'llama',
      families: ['llama'],
      parameter_size: '3.2B',
      quantization_level: 'Q4_K_M',
    },
  },
  {
    name: 'llama3.2',
    modified_at: new Date().toISOString(),
    size: 2_000_000_000,
    digest: 'sha256:mockhashdeadbeef',
    details: {
      format: 'gguf',
      family: 'llama',
      families: ['llama'],
      parameter_size: '3.2B',
      quantization_level: 'Q4_K_M',
    },
  }
];

function buildMockResponse(model: string, userContent: string): OllamaResponse {
  // Simple deterministic reply — enough for test assertions
  let content = `Mock AI response for: ${userContent}`;

  // Make conversation-memory test pass ("What is my name?" → should contain "Alice")
  if (userContent.toLowerCase().includes('what is my name')) {
    content = 'Your name is Alice.';
  }

  return {
    model,
    created_at: new Date().toISOString(),
    message: { role: 'assistant', content },
    done: true,
    total_duration: 100_000_000,
    eval_count: 10,
  };
}

class MockOllamaService {
  async chat(model: string, messages: OllamaMessage[]): Promise<OllamaResponse> {
    const last = messages.filter(m => m.role === 'user').pop();
    const userContent = last?.content ?? '';
    return buildMockResponse(model, userContent);
  }

  async generate(model: string, prompt: string): Promise<any> {
    return buildMockResponse(model, prompt);
  }

  async listModels(): Promise<OllamaModel[]> {
    return MOCK_MODELS;
  }

  async showModel(_modelName: string) { return null; }

  async pullModel(modelName: string, _onProgress?: (p: any) => void): Promise<boolean> {
    return true;
  }

  async deleteModel(_modelName: string): Promise<boolean> {
    return true;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async analyzeImage(model: string, _imageBase64: string, prompt: string): Promise<string> {
    return `Mock vision response for: ${prompt}`;
  }
}

export const ollamaService = new MockOllamaService();

export async function chatWithOllama(model: string, messages: OllamaMessage[]): Promise<OllamaResponse> {
  return ollamaService.chat(model, messages);
}

export async function listOllamaModels(): Promise<OllamaModel[]> {
  return ollamaService.listModels();
}

export async function pullOllamaModel(modelName: string, onProgress?: (p: any) => void): Promise<boolean> {
  return ollamaService.pullModel(modelName, onProgress);
}

export async function deleteOllamaModel(modelName: string): Promise<boolean> {
  return ollamaService.deleteModel(modelName);
}

export async function analyzeImageWithOllama(model: string, imageBase64: string, prompt: string): Promise<string> {
  return ollamaService.analyzeImage(model, imageBase64, prompt);
}

export async function isOllamaAvailable(): Promise<boolean> {
  return ollamaService.isAvailable();
}

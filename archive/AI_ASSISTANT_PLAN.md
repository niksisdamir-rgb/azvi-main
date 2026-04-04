# AzVirt DMS AI Assistant - Implementation Plan

## Overview
Build a comprehensive AI assistant integrated into AzVirt DMS with local Ollama models, voice input, OCR, vision capabilities, agentic thinking, and dynamic model switching.

---

## Architecture Design

### Core Components

**1. Ollama Integration Layer**
- Connect to local Ollama instance (http://localhost:11434)
- Support multiple models: llama3.2, mistral, llava (vision), codellama
- Model management: list, pull, switch, delete models
- Streaming response support for real-time chat

**2. Voice Input System**
- Browser-based audio recording (MediaRecorder API)
- Upload audio to backend
- Transcribe using existing Whisper API integration
- Support multiple languages (Bosnian, English)

**3. OCR & Vision Processing**
- Document OCR using Tesseract.js (client-side) or Ollama llava model
- Image analysis using llava vision model
- Extract text from uploaded documents, photos, invoices
- Support PDF, PNG, JPG, JPEG formats

**4. Agentic Thinking System**
- Tool use framework: query database, search documents, analyze data
- Chain-of-thought reasoning with visible thinking process
- Context-aware responses based on DMS data
- Available tools:
  - Search materials inventory
  - Query delivery status
  - Find quality test results
  - Search documents
  - Generate reports
  - Calculate forecasts

**5. Chat Interface**
- Real-time streaming responses
- Message history with context
- Voice input button with recording indicator
- Image/document upload for vision/OCR
- Model selector dropdown
- Thinking process visualization
- Copy/export conversation

---

## Database Schema

### Tables

**ai_conversations**
- id (primary key)
- userId (foreign key)
- title (auto-generated from first message)
- createdAt
- updatedAt

**ai_messages**
- id (primary key)
- conversationId (foreign key)
- role (user | assistant | system | tool)
- content (text)
- model (ollama model used)
- audioUrl (if voice input)
- imageUrl (if image uploaded)
- thinkingProcess (JSON - chain of thought)
- toolCalls (JSON - tools used)
- createdAt

**ai_models**
- id (primary key)
- name (model identifier)
- displayName
- type (text | vision | code)
- size (in GB)
- isInstalled (boolean)
- lastUsed
- description

---

## Backend Implementation

### Ollama Service (`server/_core/ollama.ts`)

```typescript
interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[]; // base64 encoded images for vision models
}

interface OllamaStreamChunk {
  model: string;
  message: { role: string; content: string };
  done: boolean;
}

// Core functions
async function chatWithOllama(model: string, messages: OllamaMessage[], stream: boolean)
async function listOllamaModels()
async function pullOllamaModel(modelName: string)
async function deleteOllamaModel(modelName: string)
```

### OCR Service (`server/_core/ocr.ts`)

```typescript
async function extractTextFromImage(imageUrl: string): Promise<string>
async function extractTextFromPDF(pdfUrl: string): Promise<string>
async function analyzeImageWithVision(imageUrl: string, prompt: string): Promise<string>
```

### Agentic Tools (`server/_core/aiTools.ts`)

```typescript
interface Tool {
  name: string;
  description: string;
  parameters: object;
  execute: (params: any) => Promise<any>;
}

const tools: Tool[] = [
  {
    name: 'search_materials',
    description: 'Search materials inventory by name or check stock levels',
    execute: async (params) => { /* query materials table */ }
  },
  {
    name: 'get_delivery_status',
    description: 'Get real-time delivery status and GPS location',
    execute: async (params) => { /* query deliveries table */ }
  },
  {
    name: 'search_documents',
    description: 'Search documents by name, category, or content',
    execute: async (params) => { /* query documents table */ }
  },
  {
    name: 'get_quality_tests',
    description: 'Retrieve quality control test results',
    execute: async (params) => { /* query qualityTests table */ }
  },
  {
    name: 'generate_forecast',
    description: 'Generate inventory forecast predictions',
    execute: async (params) => { /* call forecasting engine */ }
  }
];
```

### tRPC Procedures (`server/routers.ts`)

```typescript
aiAssistant: router({
  // Chat
  chat: protectedProcedure
    .input(z.object({
      conversationId: z.number().optional(),
      message: z.string(),
      model: z.string(),
      imageUrl: z.string().optional(),
      audioUrl: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Process message with Ollama
      // Handle tool calls if needed
      // Save to database
      // Return streaming response
    }),

  // Conversations
  listConversations: protectedProcedure.query(async ({ ctx }) => { /* ... */ }),
  getConversation: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ input }) => { /* ... */ }),
  deleteConversation: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ input }) => { /* ... */ }),

  // Models
  listModels: protectedProcedure.query(async () => { /* ... */ }),
  pullModel: protectedProcedure
    .input(z.object({ modelName: z.string() }))
    .mutation(async ({ input }) => { /* ... */ }),
  deleteModel: protectedProcedure
    .input(z.object({ modelName: z.string() }))
    .mutation(async ({ input }) => { /* ... */ }),

  // Voice & Vision
  transcribeAudio: protectedProcedure
    .input(z.object({ audioData: z.string(), language: z.string().optional() }))
    .mutation(async ({ input }) => { /* use existing Whisper integration */ }),
  
  analyzeImage: protectedProcedure
    .input(z.object({ imageUrl: z.string(), prompt: z.string() }))
    .mutation(async ({ input }) => { /* use llava model */ }),
  
  extractText: protectedProcedure
    .input(z.object({ fileUrl: z.string(), fileType: z.string() }))
    .mutation(async ({ input }) => { /* OCR processing */ }),
});
```

---

## Frontend Implementation

### AI Assistant Page (`client/src/pages/AIAssistant.tsx`)

**Components:**
- Chat message list with streaming support
- Message input with voice recording button
- Image/document upload area
- Model selector dropdown
- Conversation sidebar
- Thinking process accordion (expandable)
- Tool call visualization

**Features:**
- Real-time streaming responses with typewriter effect
- Voice recording with waveform visualization
- Drag-and-drop image/document upload
- Auto-scroll to latest message
- Copy message content
- Export conversation as PDF/Markdown
- Dark mode optimized

### Voice Recording Component (`client/src/components/VoiceRecorder.tsx`)

```typescript
- MediaRecorder API integration
- Real-time audio visualization (waveform)
- Recording timer
- Cancel/send controls
- Audio playback preview
- Automatic transcription on send
```

### Model Switcher Component (`client/src/components/ModelSwitcher.tsx`)

```typescript
- Dropdown with installed models
- Model info (type, size, description)
- Pull new models button
- Model management (delete)
- Active model indicator
```

### Thinking Process Visualizer (`client/src/components/ThinkingProcess.tsx`)

```typescript
- Step-by-step reasoning display
- Tool calls with parameters and results
- Expandable/collapsible sections
- Timeline visualization
- Color-coded by step type (reasoning, tool use, synthesis)
```

---

## Integration Points

### 1. Document Management
- AI can search and summarize documents
- OCR for uploaded scanned documents
- Auto-categorize documents using AI

### 2. Inventory Management
- Natural language queries: "How much cement do we have?"
- Forecast questions: "When will we run out of gravel?"
- Reorder suggestions

### 3. Quality Control
- Analyze QC test photos with vision model
- Detect defects in concrete samples
- Suggest corrective actions

### 4. Delivery Tracking
- "Where is delivery #123?"
- "Show me all deliveries today"
- ETA predictions

### 5. Reporting
- "Generate a summary of this week's production"
- "What were the main quality issues last month?"
- Natural language report generation

---

## Ollama Models to Support

**Text Models:**
- `llama3.2:3b` - Fast, general purpose (default)
- `mistral:7b` - High quality reasoning
- `codellama:7b` - Code generation and analysis

**Vision Models:**
- `llava:7b` - Image analysis and OCR
- `llava:13b` - Higher quality vision (optional)

**Specialized:**
- `dolphin-mistral:7b` - Uncensored, tool use
- `neural-chat:7b` - Conversational

---

## Implementation Phases

### Phase 1: Core Ollama Integration (Day 1)
- Install Ollama on server
- Create Ollama service wrapper
- Implement basic chat with streaming
- Test with llama3.2 model

### Phase 2: Voice Transcription (Day 1)
- Integrate existing Whisper API
- Build voice recorder component
- Audio upload and transcription flow

### Phase 3: Vision & OCR (Day 2)
- Pull llava model
- Implement image analysis
- Build OCR extraction
- Image upload UI

### Phase 4: Agentic System (Day 2-3)
- Define tool schemas
- Implement tool execution
- Build thinking process tracker
- Test tool chaining

### Phase 5: UI & UX (Day 3)
- Build chat interface
- Model switcher
- Conversation management
- Thinking visualization

### Phase 6: Integration & Testing (Day 4)
- Connect to DMS features
- End-to-end testing
- Performance optimization
- Documentation

---

## Technical Requirements

### Server Requirements
- Ollama installed: `curl -fsSL https://ollama.com/install.sh | sh`
- Minimum 8GB RAM (16GB recommended)
- 20GB+ disk space for models
- GPU optional but recommended

### Dependencies to Install
```bash
pnpm add axios form-data tesseract.js
```

### Environment Variables
```
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=llama3.2:3b
```

---

## Success Metrics

- ✅ Chat with local Ollama models
- ✅ Voice input transcription working
- ✅ Image analysis with vision model
- ✅ OCR text extraction from documents
- ✅ At least 3 agentic tools functional
- ✅ Model switching without restart
- ✅ Conversation history persistence
- ✅ Thinking process visualization
- ✅ Integration with 3+ DMS features

---

## Future Enhancements

1. **Multi-modal conversations**: Mix text, voice, images in single chat
2. **RAG (Retrieval Augmented Generation)**: Index all documents for semantic search
3. **Fine-tuned models**: Train on company-specific data
4. **Voice output**: Text-to-speech responses
5. **Scheduled AI tasks**: Automated daily summaries
6. **Collaborative AI**: Multiple users in same conversation
7. **AI-powered automation**: Trigger actions based on AI analysis

---

## Implementation Start: Ready to Begin! 🚀

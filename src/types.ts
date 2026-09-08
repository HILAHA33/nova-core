export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface NovaRetrievedDoc {
  id: string;
  title: string;
  category: string;
  score: number;
  snippet: string;
}

export interface NovaMetadata {
  intent: string;
  detectedEntities: string[];
  complexityScore: number;
  retrievedDocs: NovaRetrievedDoc[];
  memoryHits: string[];
  reasoningDurationMs: number;
  engineUsed: string;
  thoughtTrace?: string;
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: 'stop' | 'length';
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  nova_metadata?: NovaMetadata;
}

export interface ModelObject {
  id: string;
  object: 'model';
  created: number;
  owned_by: string;
  description: string;
  context_window: number;
  type: string;
  capabilities: string[];
}

export interface MemoryFact {
  id: string;
  text: string;
  category: 'user_preference' | 'domain_knowledge' | 'system_fact' | 'entity_relation';
  tags: string[];
  source: string;
  confidence: number;
  createdAt: number;
  updatedAt: number;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'user' | 'preference' | 'entity' | 'concept' | 'tech' | 'domain';
  val: number;
}

export interface GraphLink {
  source: string;
  target: string;
  label: string;
}

export interface MemoryGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  totalFacts: number;
}

export interface RequestLog {
  id: string;
  timestamp: number;
  endpoint: string;
  method: string;
  statusCode: number;
  latencyMs: number;
  model: string;
  promptTokens: number;
  completionTokens: number;
  intent?: string;
  previewPrompt: string;
  previewResponse: string;
  clientIp?: string;
  stream: boolean;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded';
  timestamp: number;
  uptimeSeconds: number;
  serverVersion: string;
  memoryUsage: {
    rssMb: number;
    heapTotalMb: number;
    heapUsedMb: number;
    externalMb: number;
  };
  engine: string;
  activeModels: string[];
  totalRequestsServed: number;
  knowledgeBaseDocuments: number;
  learnedFactsCount: number;
  authConfigured: boolean;
}

export interface SystemMetrics {
  uptimeSeconds: number;
  totalRequests: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  requestsPerMin: number;
  tokensPerMin: number;
  activeLogCount: number;
  memory: {
    rssMb: number;
    heapTotalMb: number;
    heapUsedMb: number;
  };
}

export interface SelfLearningReflection {
  id: string;
  cycleNumber: number;
  timestamp: number;
  domain: string;
  curiosityTrigger: string;
  question: string;
  thoughtTrace?: string;
  answer: string;
  learnedFacts: Array<{
    id: string;
    text: string;
    tags: string[];
    category: string;
  }>;
  ragDocCreated?: {
    id: string;
    title: string;
  };
  durationMs: number;
  engineUsed: string;
}

export interface SelfLearningStatus {
  isRunning: boolean;
  cycleCount: number;
  totalFactsLearned: number;
  lastCycleTimestamp: number;
  nextCycleInSeconds: number;
  intervalSeconds: number;
  selectedDomain: string;
  availableDomains: string[];
  recentReflections: SelfLearningReflection[];
}

export interface MultiStepInstruction {
  id: string;
  userId: string;
  chatId: string;
  status: 'active' | 'completed' | 'cancelled';
  rawInstruction: string;
  instructionType: 'math_accumulator' | 'conditional_response' | 'sequential_task' | 'custom_rule';
  totalRequiredSteps: number;
  currentStep: number;
  capturedInputs: string[];
  capturedNumbers: number[];
  targetOperation: string;
  stepHistory: Array<{
    step: number;
    input: string;
    extractedValues: any;
    stepOutput: string;
    timestamp: number;
  }>;
  finalResult?: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  activeInstructionId?: string;
  lastMessagePreview?: string;
}

export interface UserChatMessage {
  id: string;
  chatId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
  thoughtTrace?: string;
  instructionExecution?: {
    instructionId: string;
    stepNumber: number;
    totalSteps: number;
    isCompleted: boolean;
    summary: string;
  };
}

export interface LearnedFactUserInquiry {
  id: string;
  text: string;
  category: string;
  tags: string[];
  sourceUserId: string;
  sourceChatId: string;
  confidence: number;
  timestamp: number;
}

export interface LearnedFactSelfLearning {
  id: string;
  text: string;
  category: string;
  tags: string[];
  cycleNumber: number;
  domain: string;
  confidence: number;
  timestamp: number;
}

export interface DatabaseOverview {
  connected: boolean;
  projectId: string;
  databaseId: string;
  userChatsCount: number;
  messagesCount: number;
  activeInstructionsCount: number;
  userInquiryFactsCount: number;
  selfLearningFactsCount: number;
  externalTrafficCount?: number;
  collections: string[];
}

export interface ExternalTrafficRecord {
  id: string;
  timestamp: number;
  originWebsite: string;
  clientSource: string;
  endpoint: string;
  method: string;
  statusCode: number;
  latencyMs: number;
  model: string;
  userId: string;
  chatId: string;
  userPrompt: string;
  assistantResponse: string;
  thoughtTrace?: string;
  promptTokens: number;
  completionTokens: number;
  clientIp?: string;
  userAgent?: string;
  isExternal: boolean;
}

export interface ExternalTrafficSummary {
  totalRequests: number;
  totalCalls: number;
  uniqueWebsitesCount: number;
  uniqueOriginsCount: number;
  avgLatencyMs: number;
  totalTokensProcessed: number;
  topWebsites: Array<{
    origin: string;
    count: number;
    lastSeen: number;
    samplePrompt: string;
  }>;
  origins: Array<{
    origin: string;
    callsCount: number;
    lastSeen: number;
    samplePrompt: string;
  }>;
  recentRecords: ExternalTrafficRecord[];
}



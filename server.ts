import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { novaReasoner, AVAILABLE_MODELS } from './server/reasoner.js';
import { memoryEngine } from './server/memoryEngine.js';
import { ragEngine } from './server/ragEngine.js';
import { telemetryService } from './server/telemetry.js';
import { selfLearningEngine } from './server/selfLearningEngine.js';
import { chatStore } from './server/chatStore.js';
import { instructionEngine } from './server/instructionEngine.js';
import { firebaseService } from './server/firebaseService.js';
import { polyglotEngine } from './server/polyglotEngine.js';
import { ChatCompletionRequest, HealthStatus, UserChatMessage } from './server/types.js';

dotenv.config();

const app = express();
const PORT = 3000;
const API_SECRET_KEY = process.env.API_SECRET_KEY || 'nova-sk-live-alpha';

// Parse JSON and form bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global CORS Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, api-secret-key, x-requested-with, Accept, X-User-Id, X-Chat-Id, X-Origin-Website');
  res.header('Access-Control-Expose-Headers', 'X-Nova-Latency-Ms, X-Nova-Engine, X-Nova-Tokens, X-User-Id, X-Chat-Id, X-Active-Instruction');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

import { GoogleGenAI } from "@google/genai";
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'dummy_key_to_allow_init' });

// Image Generation Endpoint
app.post('/v1/images/generations', authenticateApi, async (req: Request, res: Response) => {
  try {
    const { prompt, n = 1, size = '1024x1024' } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      // Simulate delay for DIY AI without a real key
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Dummy image (placeholder)
      const dummyUrl = `https://placehold.co/${size.replace('x', 'x')}/1E1E1E/FFFFFF/png?text=${encodeURIComponent(prompt)}`;
      res.json({
        created: Date.now(),
        data: [{ url: dummyUrl, b64_json: null }]
      });
      return;
    }

    // Call actual Gemini Imagen 3
    const response = await genai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: prompt,
      config: {
        numberOfImages: n,
        aspectRatio: size === '1024x1024' ? '1:1' : size === '1024x576' ? '16:9' : '1:1',
        outputMimeType: 'image/jpeg',
      },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error("Failed to generate image.");
    }

    const data = response.generatedImages.map((img) => ({
      b64_json: img.image?.imageBytes
    }));

    res.json({
      created: Date.now(),
      data
    });
  } catch (err: any) {
    console.error("Image generation error:", err);
    res.status(500).json({ error: { message: err.message || "Failed to generate image" } });
  }
});

// Authentication Middleware
function authenticateApi(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const apiKeyHeader = req.headers['x-api-key'] || req.headers['api-secret-key'];

  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (typeof apiKeyHeader === 'string') {
    token = apiKeyHeader.trim();
  }

  const isEnforced = process.env.ENFORCE_API_KEY === 'true';

  if (isEnforced && token !== API_SECRET_KEY) {
    res.status(401).json({
      error: {
        message: 'Unauthorized: Invalid or missing API Bearer token in Authorization header.',
        type: 'invalid_request_error',
        param: null,
        code: 'invalid_api_key',
      },
    });
    return;
  }

  (req as any).authenticated = token === API_SECRET_KEY || !isEnforced;
  next();
};

// Helper: Detect whether the request was sent from an external website or external client
function detectRequestOrigin(req: Request) {
  const isInternalHeader = req.headers['x-nova-internal'] === 'true';
  const customOrigin = (req.headers['x-origin-website'] || req.headers['x-client-origin'] || req.headers['x-app-name'] || req.body?.origin_website || req.body?.client_origin) as string | undefined;
  const originHeader = (req.headers.origin || req.headers.referer) as string | undefined;
  const userAgent = (req.headers['user-agent'] || 'External Client') as string;
  const host = req.headers.host || 'localhost:3000';

  let isExternal = false;
  let originWebsite = 'Nova Core Local Studio';
  let clientSource = 'Local Studio Interface';

  if (customOrigin) {
    isExternal = true;
    originWebsite = customOrigin;
    clientSource = 'External Registered Application';
  } else if (originHeader && !originHeader.includes(host) && !originHeader.includes('localhost:3000')) {
    isExternal = true;
    originWebsite = originHeader;
    clientSource = 'External Web Application (Cross-Origin CORS)';
  } else if (!isInternalHeader) {
    isExternal = true;
    if (userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari')) {
      originWebsite = originHeader || 'External Web Browser Client';
      clientSource = 'External Web Browser';
    } else if (userAgent.toLowerCase().includes('python')) {
      originWebsite = 'Python OpenAI Client / SDK';
      clientSource = 'Python Application Backend';
    } else if (userAgent.toLowerCase().includes('node') || userAgent.toLowerCase().includes('axios') || userAgent.toLowerCase().includes('undici')) {
      originWebsite = 'Node.js Backend Service';
      clientSource = 'Node.js Microservice';
    } else if (userAgent.toLowerCase().includes('curl')) {
      originWebsite = 'cURL CLI Terminal Client';
      clientSource = 'Command Line Script';
    } else if (userAgent.toLowerCase().includes('go-http-client')) {
      originWebsite = 'Go Microservice';
      clientSource = 'Go Application';
    } else {
      originWebsite = userAgent.substring(0, 50);
      clientSource = 'Remote Third-Party Client';
    }
  }

  return { isExternal, originWebsite, clientSource };
}

// ==========================================
// 1. OPENAI-COMPATIBLE & MULTI-TENANT CHAT COMPLETIONS
// ==========================================

// POST /v1/chat/completions
app.post('/v1/chat/completions', authenticateApi, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const body: ChatCompletionRequest & {
    user?: string;
    user_id?: string;
    chat_id?: string;
    session_id?: string;
  } = req.body;

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    res.status(400).json({
      error: {
        message: 'Invalid payload: "messages" array is required.',
        type: 'invalid_request_error',
        code: 'missing_required_parameter',
      },
    });
    return;
  }

  // Multi-tenant user & chat routing
  const userId =
    body.user_id ||
    body.user ||
    (req.headers['x-user-id'] as string) ||
    'default_user';
  
  const chatId =
    body.chat_id ||
    body.session_id ||
    (req.headers['x-chat-id'] as string) ||
    'session_main';

  const modelId = body.model || 'nova-autonomous-v1';
  const isStreaming = Boolean(body.stream);
  const clientIp = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
  const lastUserPrompt = [...body.messages].reverse().find(m => m.role === 'user')?.content || '';
  const originInfo = detectRequestOrigin(req);

  // Ensure user session exists in chatStore
  await chatStore.getSession(userId, chatId).then(async (session) => {
    if (!session) {
      await chatStore.saveSession({
        id: chatId,
        userId,
        title: lastUserPrompt.substring(0, 30) || 'Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 0,
      });
    }
  });

  // Save the incoming user message to Firestore / store
  const userMsgId = `msg-u-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const userMsgDoc: UserChatMessage = {
    id: userMsgId,
    chatId,
    userId,
    role: 'user',
    content: lastUserPrompt,
    timestamp: Date.now(),
  };
  await chatStore.addMessage(userMsgDoc);

  // Check stateful multi-step instruction engine for this user and chat
  const instructionResult = await instructionEngine.processMessage(userId, chatId, lastUserPrompt);

  if (instructionResult.hasActiveInstruction && instructionResult.stepResponseText) {
    // Instruction was processed or initiated
    const stepResponse = instructionResult.stepResponseText;
    const assistantMsgId = `msg-a-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    const assistantMsgDoc: UserChatMessage = {
      id: assistantMsgId,
      chatId,
      userId,
      role: 'assistant',
      content: stepResponse,
      timestamp: Date.now(),
      model: 'nova-instruction-engine',
      instructionExecution: instructionResult.instruction
        ? {
            instructionId: instructionResult.instruction.id,
            stepNumber: instructionResult.instruction.currentStep,
            totalSteps: instructionResult.instruction.totalRequiredSteps,
            isCompleted: instructionResult.isCompleted,
            summary: instructionResult.summary || 'Instruction step executed',
          }
        : undefined,
    };
    await chatStore.addMessage(assistantMsgDoc);

    const duration = Date.now() - startTime;
    const pTokens = Math.ceil(lastUserPrompt.length / 4);
    const cTokens = Math.ceil(stepResponse.length / 4);

    telemetryService.recordLog({
      endpoint: '/v1/chat/completions',
      method: 'POST',
      statusCode: 200,
      latencyMs: duration,
      model: 'nova-instruction-engine',
      promptTokens: pTokens,
      completionTokens: cTokens,
      intent: 'multi_step_instruction_execution',
      previewPrompt: `[Instruction Step ${instructionResult.instruction?.currentStep}/${instructionResult.instruction?.totalRequiredSteps}] ${lastUserPrompt}`,
      previewResponse: stepResponse.substring(0, 100),
      clientIp,
      stream: isStreaming,
    });

    // Record to external website traffic log if origin is external
    if (originInfo.isExternal) {
      chatStore.addExternalTrafficRecord({
        id: `ext-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now(),
        originWebsite: originInfo.originWebsite,
        clientSource: originInfo.clientSource,
        endpoint: '/v1/chat/completions',
        method: 'POST',
        statusCode: 200,
        latencyMs: duration,
        model: 'nova-instruction-engine',
        userId,
        chatId,
        userPrompt: lastUserPrompt,
        assistantResponse: stepResponse,
        thoughtTrace: `Executed multi-step instruction engine step ${instructionResult.instruction?.currentStep} of ${instructionResult.instruction?.totalRequiredSteps}`,
        promptTokens: pTokens,
        completionTokens: cTokens,
        clientIp,
        userAgent: req.headers['user-agent'] as string,
        isExternal: true,
      });
    }

    if (isStreaming) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Nova-Engine', 'Nova-Instruction-Engine');
      res.setHeader('X-User-Id', userId);
      res.setHeader('X-Chat-Id', chatId);

      const words = stepResponse.split(/(\s+)/);
      for (const word of words) {
        const chunk = {
          id: `chatcmpl-chunk-${Date.now()}`,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: 'nova-instruction-engine',
          choices: [{ index: 0, delta: { content: word }, finish_reason: null }],
        };
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }

      const finalChunk = {
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: 'nova-instruction-engine',
        choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
      };
      res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    } else {
      res.setHeader('X-User-Id', userId);
      res.setHeader('X-Chat-Id', chatId);
      res.setHeader('X-Active-Instruction', instructionResult.instruction?.id || '');
      res.json({
        id: `chatcmpl-inst-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'nova-instruction-engine',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: stepResponse },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: pTokens,
          completion_tokens: cTokens,
          total_tokens: pTokens + cTokens,
        },
        instruction_state: instructionResult.instruction,
      });
      return;
    }
  }

  // If no active instruction or standard reasoning:
  // Fetch prior conversation history for this specific user/chat to guarantee multi-turn context
  const pastChatMessages = await chatStore.getMessages(userId, chatId);
  const fullConversationHistory = pastChatMessages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const inferenceRequest: ChatCompletionRequest = {
    ...body,
    messages: fullConversationHistory.length > 0 ? fullConversationHistory : body.messages,
  };

  if (isStreaming) {
    // SSE streaming mode
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Nova-Engine', 'Nova-Core-Embedded-V1');
    res.setHeader('X-User-Id', userId);
    res.setHeader('X-Chat-Id', chatId);

    let fullGeneratedText = '';

    try {
      const responseObj = await novaReasoner.executeInference(inferenceRequest, (chunkText) => {
        fullGeneratedText += chunkText;
        const chunk = {
          id: `chatcmpl-chunk-${Date.now()}`,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: modelId,
          choices: [
            {
              index: 0,
              delta: { content: chunkText },
              finish_reason: null,
            },
          ],
        };
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      });

      // Save assistant response to chatStore
      const assistantMsgDoc: UserChatMessage = {
        id: `msg-a-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        chatId,
        userId,
        role: 'assistant',
        content: fullGeneratedText,
        timestamp: Date.now(),
        model: modelId,
        thoughtTrace: responseObj.nova_metadata?.thoughtTrace,
      };
      await chatStore.addMessage(assistantMsgDoc);

      // Send final stop chunk
      const finalChunk = {
        id: responseObj.id,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: modelId,
        choices: [
          {
            index: 0,
            delta: {},
            finish_reason: 'stop',
          },
        ],
      };
      res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();

      const duration = Date.now() - startTime;
      telemetryService.recordLog({
        endpoint: '/v1/chat/completions',
        method: 'POST',
        statusCode: 200,
        latencyMs: duration,
        model: modelId,
        promptTokens: responseObj.usage.prompt_tokens,
        completionTokens: responseObj.usage.completion_tokens,
        intent: responseObj.nova_metadata?.intent,
        previewPrompt: lastUserPrompt,
        previewResponse: fullGeneratedText,
        clientIp,
        stream: true,
      });

      // Record to external website traffic log
      if (originInfo.isExternal) {
        chatStore.addExternalTrafficRecord({
          id: `ext-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          timestamp: Date.now(),
          originWebsite: originInfo.originWebsite,
          clientSource: originInfo.clientSource,
          endpoint: '/v1/chat/completions',
          method: 'POST',
          statusCode: 200,
          latencyMs: duration,
          model: modelId,
          userId,
          chatId,
          userPrompt: lastUserPrompt,
          assistantResponse: fullGeneratedText,
          thoughtTrace: responseObj.nova_metadata?.thoughtTrace,
          promptTokens: responseObj.usage.prompt_tokens,
          completionTokens: responseObj.usage.completion_tokens,
          clientIp,
          userAgent: req.headers['user-agent'] as string,
          isExternal: true,
        });
      }
    } catch (err: any) {
      console.error('Streaming inference error:', err);
      res.write(`data: ${JSON.stringify({ error: { message: err.message || 'Inference failure' } })}\n\n`);
      res.end();
    }
  } else {
    // Standard synchronous JSON mode
    try {
      const responseObj = await novaReasoner.executeInference(inferenceRequest);
      const duration = Date.now() - startTime;
      const content = responseObj.choices[0]?.message?.content || '';

      // Save assistant response to chatStore
      const assistantMsgDoc: UserChatMessage = {
        id: `msg-a-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        chatId,
        userId,
        role: 'assistant',
        content,
        timestamp: Date.now(),
        model: modelId,
        thoughtTrace: responseObj.nova_metadata?.thoughtTrace,
      };
      await chatStore.addMessage(assistantMsgDoc);

      res.setHeader('X-Nova-Latency-Ms', String(duration));
      res.setHeader('X-Nova-Engine', responseObj.nova_metadata?.engineUsed || 'Nova-Core-Embedded-V1');
      res.setHeader('X-Nova-Tokens', String(responseObj.usage.total_tokens));
      res.setHeader('X-User-Id', userId);
      res.setHeader('X-Chat-Id', chatId);

      telemetryService.recordLog({
        endpoint: '/v1/chat/completions',
        method: 'POST',
        statusCode: 200,
        latencyMs: duration,
        model: modelId,
        promptTokens: responseObj.usage.prompt_tokens,
        completionTokens: responseObj.usage.completion_tokens,
        intent: responseObj.nova_metadata?.intent,
        previewPrompt: lastUserPrompt,
        previewResponse: content,
        clientIp,
        stream: false,
      });

      // Record to external website traffic log
      if (originInfo.isExternal) {
        chatStore.addExternalTrafficRecord({
          id: `ext-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          timestamp: Date.now(),
          originWebsite: originInfo.originWebsite,
          clientSource: originInfo.clientSource,
          endpoint: '/v1/chat/completions',
          method: 'POST',
          statusCode: 200,
          latencyMs: duration,
          model: modelId,
          userId,
          chatId,
          userPrompt: lastUserPrompt,
          assistantResponse: content,
          thoughtTrace: responseObj.nova_metadata?.thoughtTrace,
          promptTokens: responseObj.usage.prompt_tokens,
          completionTokens: responseObj.usage.completion_tokens,
          clientIp,
          userAgent: req.headers['user-agent'] as string,
          isExternal: true,
        });
      }

      res.json(responseObj);
    } catch (err: any) {
      console.error('Chat completions error:', err);
      const duration = Date.now() - startTime;
      telemetryService.recordLog({
        endpoint: '/v1/chat/completions',
        method: 'POST',
        statusCode: 500,
        latencyMs: duration,
        model: modelId,
        promptTokens: 0,
        completionTokens: 0,
        previewPrompt: lastUserPrompt,
        previewResponse: `Error: ${err.message}`,
        clientIp,
        stream: false,
      });

      res.status(500).json({
        error: {
          message: err.message || 'Internal Nova inference failure',
          type: 'internal_server_error',
          code: 'inference_error',
        },
      });
    }
  }
});

// GET /v1/models
app.get('/v1/models', (req: Request, res: Response) => {
  res.json({
    object: 'list',
    data: AVAILABLE_MODELS,
  });
});

// ==========================================
// 2. MULTI-USER CHATS & STATEFUL API
// ==========================================

// GET /v1/users/:userId/chats - List all chats for a specific user
app.get('/v1/users/:userId/chats', async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const sessions = await chatStore.getSessions(userId);
  res.json({
    userId,
    count: sessions.length,
    chats: sessions,
  });
});

// POST /v1/users/:userId/chats - Create a new chat session for a user
app.post('/v1/users/:userId/chats', async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const title = req.body.title || 'New Conversation';
  const newChat = await chatStore.createSession(userId, title);
  res.status(201).json({
    status: 'success',
    chat: newChat,
  });
});

// GET /v1/users/:userId/chats/:chatId - Get messages and active instruction for a chat
app.get('/v1/users/:userId/chats/:chatId', async (req: Request, res: Response) => {
  const { userId, chatId } = req.params;
  const session = await chatStore.getSession(userId, chatId);
  const messages = await chatStore.getMessages(userId, chatId);
  const activeInstruction = await instructionEngine.getActiveInstruction(userId, chatId);

  res.json({
    userId,
    chatId,
    session,
    activeInstruction,
    messageCount: messages.length,
    messages,
  });
});

// DELETE /v1/users/:userId/chats/:chatId - Delete a chat session
app.delete('/v1/users/:userId/chats/:chatId', async (req: Request, res: Response) => {
  const { userId, chatId } = req.params;
  await chatStore.deleteSession(userId, chatId);
  await instructionEngine.cancelInstruction(userId, chatId);
  res.json({ status: 'success', message: `Chat ${chatId} deleted.` });
});

// GET /v1/users/:userId/instructions - List instructions for a user
app.get('/v1/users/:userId/instructions', async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const instructions = await firebaseService.getInstructions(userId);
  res.json({
    userId,
    count: instructions.length,
    instructions,
  });
});

// POST /v1/users/:userId/chats/:chatId/instructions/cancel - Cancel an active instruction
app.post('/v1/users/:userId/chats/:chatId/instructions/cancel', async (req: Request, res: Response) => {
  const { userId, chatId } = req.params;
  const cancelled = await instructionEngine.cancelInstruction(userId, chatId);
  res.json({ status: 'success', cancelled });
});

// ==========================================
// 3. DUAL KNOWLEDGE REPOSITORIES & DATABASE OVERVIEW
// ==========================================

// GET /v1/knowledge/user-inquiries - Knowledge distilled from what everyone has asked
app.get('/v1/knowledge/user-inquiries', (req: Request, res: Response) => {
  const facts = chatStore.getLearnedFactsUserInquiries();
  res.json({
    source: 'user_inquiries_across_all_chats',
    count: facts.length,
    facts,
  });
});

// GET /v1/knowledge/self-learning - Knowledge distilled from autonomous self-learning
app.get('/v1/knowledge/self-learning', (req: Request, res: Response) => {
  const facts = chatStore.getLearnedFactsSelfLearning();
  res.json({
    source: 'autonomous_recursive_self_learning',
    count: facts.length,
    facts,
  });
});

// GET /v1/database/overview - Unified database view (Firestore status, user chats, dual repositories)
app.get('/v1/database/overview', (req: Request, res: Response) => {
  const overview = chatStore.getDatabaseOverview();
  res.json(overview);
});

// ==========================================
// 4. MEMORY & RAG ENDPOINTS
// ==========================================

// POST /v1/learn - Accept user facts, summaries, or domain knowledge
app.post('/v1/learn', authenticateApi, (req: Request, res: Response) => {
  const { fact, text, title, category, tags, source } = req.body;
  const contentToLearn = fact || text;

  if (!contentToLearn || typeof contentToLearn !== 'string' || contentToLearn.trim().length === 0) {
    res.status(400).json({
      error: {
        message: 'Invalid payload: "fact" or "text" string is required.',
        type: 'invalid_request_error',
      },
    });
    return;
  }

  // 1. Add to conversational memory engine
  const memoryFact = memoryEngine.addFact(
    contentToLearn,
    category || 'domain_knowledge',
    Array.isArray(tags) ? tags : [],
    source || 'api_learn',
    1.0
  );

  // 2. Also index into BM25 RAG if substantial knowledge document
  if (contentToLearn.length > 50 || title) {
    ragEngine.addDocument({
      id: `learned-${Date.now()}`,
      title: title || `Learned: ${contentToLearn.substring(0, 32)}...`,
      category: category || 'Learned Knowledge',
      tags: Array.isArray(tags) ? tags : memoryFact.tags,
      content: contentToLearn,
    });
  }

  telemetryService.recordLog({
    endpoint: '/v1/learn',
    method: 'POST',
    statusCode: 201,
    latencyMs: 8,
    model: 'nova-memory-engine',
    promptTokens: 15,
    completionTokens: 25,
    intent: 'knowledge_ingestion',
    previewPrompt: `Learn: ${contentToLearn.substring(0, 45)}...`,
    previewResponse: `Persisted to knowledge graph (ID: ${memoryFact.id})`,
    clientIp: req.ip || '127.0.0.1',
    stream: false,
  });

  res.status(201).json({
    status: 'success',
    message: 'Knowledge successfully indexed in persistent memory and RAG store.',
    fact: memoryFact,
  });
});

// GET /v1/memory - Inspect memory graph & facts
app.get('/v1/memory', (req: Request, res: Response) => {
  const facts = memoryEngine.getFacts();
  const graph = memoryEngine.getMemoryGraphData();
  res.json({
    totalFacts: facts.length,
    facts,
    graph,
  });
});

// DELETE /v1/memory/:id - Delete a memory fact
app.delete('/v1/memory/:id', authenticateApi, (req: Request, res: Response) => {
  const id = req.params.id;
  const deleted = memoryEngine.deleteFact(id);
  if (deleted) {
    res.json({ status: 'success', message: `Memory fact ${id} pruned.` });
  } else {
    res.status(404).json({ error: { message: `Fact ${id} not found.` } });
  }
});

// GET /v1/rag/search - Test RAG search directly
app.get('/v1/rag/search', (req: Request, res: Response) => {
  const q = String(req.query.q || '');
  if (!q) {
    res.json({ results: [] });
    return;
  }
  const results = ragEngine.search(q, 5, 0.1);
  res.json({
    query: q,
    count: results.length,
    results,
  });
});

// GET /v1/logs - Telemetry inspection
app.get('/v1/logs', (req: Request, res: Response) => {
  const limit = parseInt(String(req.query.limit || '50'), 10);
  res.json({
    logs: telemetryService.getLogs(limit),
  });
});

// DELETE /v1/logs - Clear logs
app.delete('/v1/logs', authenticateApi, (req: Request, res: Response) => {
  telemetryService.clearLogs();
  res.json({ status: 'success', message: 'Logs cleared.' });
});

// ==========================================
// 5. AUTONOMOUS RECURSIVE SELF-LEARNING ENDPOINTS
// ==========================================

// GET /v1/self-learn/status - Current status & recent reflections
app.get('/v1/self-learn/status', (req: Request, res: Response) => {
  res.json(selfLearningEngine.getStatus());
});

// POST /v1/self-learn/step - Manually trigger one self-inquiry cycle
app.post('/v1/self-learn/step', async (req: Request, res: Response) => {
  try {
    const reflection = await selfLearningEngine.executeSelfInquiryStep();
    res.json({
      status: 'success',
      reflection,
      currentStatus: selfLearningEngine.getStatus(),
    });
  } catch (err: any) {
    console.error('Self-learn step execution failed:', err);
    res.status(500).json({
      error: {
        message: err.message || 'Failed to execute self-inquiry step',
      },
    });
  }
});

// POST /v1/self-learn/toggle - Toggle auto-learning on/off
app.post('/v1/self-learn/toggle', (req: Request, res: Response) => {
  const isRunning = selfLearningEngine.toggleRunning();
  res.json({
    status: 'success',
    isRunning,
    currentStatus: selfLearningEngine.getStatus(),
  });
});

// POST /v1/self-learn/config - Update auto-learning settings
app.post('/v1/self-learn/config', (req: Request, res: Response) => {
  const { isRunning, intervalSeconds, selectedDomain } = req.body;
  const status = selfLearningEngine.setConfig({
    isRunning,
    intervalSeconds,
    selectedDomain,
  });
  res.json({
    status: 'success',
    currentStatus: status,
  });
});

// DELETE /v1/self-learn/history - Clear reflections history
app.delete('/v1/self-learn/history', (req: Request, res: Response) => {
  selfLearningEngine.clearHistory();
  res.json({ status: 'success', message: 'Self-learning history cleared.' });
});

// ==========================================
// 6. POLYGLOT CODING ENGINE & CODE REASONING ENDPOINTS
// ==========================================

// GET /v1/code/languages - List supported programming languages and metadata
app.get('/v1/code/languages', (_req: Request, res: Response) => {
  res.json({
    totalLanguages: polyglotEngine.getAllLanguages().length,
    languages: polyglotEngine.getAllLanguages(),
  });
});

// ==========================================
// 7. EXTERNAL WEBSITES & CROSS-PLATFORM TRAFFIC TRACKING
// ==========================================

// GET /v1/external-traffic - Retrieve all logged requests & responses from other websites
app.get('/v1/external-traffic', (req: Request, res: Response) => {
  const limit = parseInt(String(req.query.limit || '100'), 10);
  const summary = chatStore.getExternalTrafficSummary();
  res.json({
    status: 'success',
    summary,
    records: chatStore.getExternalTraffic(limit),
  });
});

// DELETE /v1/external-traffic - Clear external traffic logs
app.delete('/v1/external-traffic', authenticateApi, (req: Request, res: Response) => {
  chatStore.clearExternalTraffic();
  res.json({ status: 'success', message: 'External website traffic logs cleared.' });
});

// POST /v1/external-traffic/simulate - Simulate an external website query to verify tracking
app.post('/v1/external-traffic/simulate', async (req: Request, res: Response) => {
  const { originWebsite, prompt, model, userId, chatId } = req.body;
  const targetOrigin = originWebsite || 'https://my-external-agent.vercel.app';
  const targetPrompt = prompt || 'How do I optimize memory alignment in high-frequency trading engines?';
  const targetModel = model || 'nova-autonomous-v1';
  const targetUserId = userId || 'external_web_user_77';
  const targetChatId = chatId || 'ext_session_web';

  const startTime = Date.now();

  try {
    const result = await novaReasoner.executeInference({
      model: targetModel,
      messages: [
        { role: 'system', content: 'You are Nova Core AI responding to an external client application.' },
        { role: 'user', content: targetPrompt },
      ],
      temperature: 0.3,
    });

    const duration = Date.now() - startTime;
    const responseText = result.choices[0]?.message?.content || '';

    const record = {
      id: `ext-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      originWebsite: targetOrigin,
      clientSource: 'Simulated Remote Web Application',
      endpoint: '/v1/chat/completions',
      method: 'POST',
      statusCode: 200,
      latencyMs: duration,
      model: targetModel,
      userId: targetUserId,
      chatId: targetChatId,
      userPrompt: targetPrompt,
      assistantResponse: responseText,
      thoughtTrace: result.nova_metadata?.thoughtTrace,
      promptTokens: result.usage.prompt_tokens,
      completionTokens: result.usage.completion_tokens,
      clientIp: '198.51.100.99',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      isExternal: true,
    };

    await chatStore.addExternalTrafficRecord(record);

    res.json({
      status: 'success',
      message: `Simulated external request from ${targetOrigin} recorded successfully.`,
      record,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Simulation failed' } });
  }
});

// POST /v1/code/generate - Direct polyglot code generation & synthesis
app.post('/v1/code/generate', authenticateApi, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { language, prompt, task, paradigm } = req.body;
  if (!prompt && !task) {
    res.status(400).json({ error: { message: 'Missing "prompt" or "task" field.' } });
    return;
  }

  const queryPrompt = prompt || `Write a production-grade, idiomatic implementation of ${task} in ${language || 'Rust'}. Include Big-O complexity analysis and test cases.`;
  const result = await novaReasoner.executeInference({
    model: 'nova-coder-v1',
    messages: [
      {
        role: 'system',
        content: `You are Nova Core AI's specialized Polyglot Coding Engine (nova-coder-v1).
Target Language: ${language || 'Auto-detect'}
Paradigm / Focus: ${paradigm || 'Production-grade, Idiomatic, Thread-safe, Zero-allocation where possible'}
Instructions: Provide clean, bug-free, fully typed, production-ready code with language-specific idioms, memory considerations, and Big-O complexity breakdown.`,
      },
      {
        role: 'user',
        content: queryPrompt,
      },
    ],
    temperature: 0.2,
  });

  const duration = Date.now() - startTime;
  const generatedCode = result.choices[0]?.message?.content || '';
  const originInfo = detectRequestOrigin(req);

  if (originInfo.isExternal) {
    chatStore.addExternalTrafficRecord({
      id: `ext-code-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      originWebsite: originInfo.originWebsite,
      clientSource: originInfo.clientSource,
      endpoint: '/v1/code/generate',
      method: 'POST',
      statusCode: 200,
      latencyMs: duration,
      model: 'nova-coder-v1',
      userId: (req.headers['x-user-id'] as string) || 'external_coder',
      chatId: (req.headers['x-chat-id'] as string) || 'code_session',
      userPrompt: queryPrompt,
      assistantResponse: generatedCode,
      thoughtTrace: result.nova_metadata?.thoughtTrace,
      promptTokens: result.usage.prompt_tokens,
      completionTokens: result.usage.completion_tokens,
      clientIp: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] as string,
      isExternal: true,
    });
  }

  res.json({
    status: 'success',
    language: language || 'auto-detected',
    code: generatedCode,
    metadata: result.nova_metadata,
    usage: result.usage,
  });
});

// GET /v1/metrics - Real-time metrics
app.get('/v1/metrics', (req: Request, res: Response) => {
  res.json(telemetryService.getMetrics());
});

// GET /healthz - Standard health check
app.get('/healthz', (req: Request, res: Response) => {
  const mem = process.memoryUsage();
  const metrics = telemetryService.getMetrics();
  const dbOverview = chatStore.getDatabaseOverview();

  const healthData: HealthStatus = {
    status: 'healthy',
    timestamp: Date.now(),
    uptimeSeconds: metrics.uptimeSeconds,
    serverVersion: 'Nova-Core-v1.5.0',
    memoryUsage: {
      rssMb: Math.round(mem.rss / 1024 / 1024),
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      externalMb: Math.round(mem.external / 1024 / 1024),
    },
    engine: 'Nova Autonomous Multi-Step Reasoning Engine',
    activeModels: AVAILABLE_MODELS.map(m => m.id),
    totalRequestsServed: metrics.totalRequests,
    knowledgeBaseDocuments: ragEngine.getDocumentCount(),
    learnedFactsCount: memoryEngine.getFacts().length,
    authConfigured: Boolean(process.env.API_SECRET_KEY),
  };

  res.json({ ...healthData, database: dbOverview });
});

// ==========================================
// 6. VITE MIDDLEWARE & STATIC SERVING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nova Core AI Server listening on http://0.0.0.0:${PORT}`);
    console.log(`OpenAI Endpoint: http://0.0.0.0:${PORT}/v1/chat/completions`);
    console.log(`Multi-User Sessions: http://0.0.0.0:${PORT}/v1/users/:userId/chats`);
    console.log(`Database Overview: http://0.0.0.0:${PORT}/v1/database/overview`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Nova Core AI server:', err);
  process.exit(1);
});

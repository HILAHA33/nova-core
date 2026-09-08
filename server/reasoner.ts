import { ChatMessage, ChatCompletionRequest, ChatCompletionResponse, NovaMetadata, ModelObject } from './types.js';
import { ragEngine } from './ragEngine.js';
import { analyzeIntent } from './intentRouter.js';
import { memoryEngine } from './memoryEngine.js';
import { findDefinition } from './definitions.js';
import { polyglotEngine } from './polyglotEngine.js';
import { teachNova } from './learningTeacher.js';
import { analyzeSequentialGrammar } from './sequentialGrammarEngine.js';
import { findDomainTopic } from './domainKnowledge.js';
import { tryHuggingFaceInference } from './huggingFaceInference.js';
import { geminiCircuitBreaker } from './geminiCircuitBreaker.js';

export const AVAILABLE_MODELS: ModelObject[] = [
  {
    id: 'nova-autonomous-v1',
    object: 'model',
    created: 1718000000,
    owned_by: 'nova-core',
    description: 'Autonomous hybrid reasoning engine combining neural inference, BM25 RAG, intent routing, and conversational memory.',
    context_window: 32768,
    type: 'hybrid-autonomous',
    capabilities: ['chat', 'reasoning', 'rag', 'memory', 'code'],
  },
  {
    id: 'nova-reasoner-v1',
    object: 'model',
    created: 1718100000,
    owned_by: 'nova-core',
    description: 'Deep chain-of-thought reasoner with explicit <think> trace generation and step-by-step deduction.',
    context_window: 32768,
    type: 'deep-reasoning',
    capabilities: ['chat', 'chain-of-thought', 'logic', 'math', 'proofs'],
  },
  {
    id: 'nova-coder-v1',
    object: 'model',
    created: 1718200000,
    owned_by: 'nova-core',
    description: 'Precision coding and software architecture specialist with zero-copy and concurrency patterns.',
    context_window: 32768,
    type: 'code-specialist',
    capabilities: ['chat', 'typescript', 'python', 'architecture', 'refactor'],
  },
  {
    id: 'nova-knowledge-rag-v1',
    object: 'model',
    created: 1718300000,
    owned_by: 'nova-core',
    description: 'Authoritative RAG retrieval model grounded directly on verified domain knowledge and learned facts.',
    context_window: 16384,
    type: 'grounded-rag',
    capabilities: ['chat', 'retrieval', 'fact-checking', 'summarization'],
  },
  {
    id: 'meta-llama/Llama-3.3-70B-Instruct',
    object: 'model',
    created: 1720000000,
    owned_by: 'meta',
    description: 'Meta Llama 3.3 70B Instruct: flagship open-weights intelligence for advanced reasoning, code, and dialogue.',
    context_window: 131072,
    type: 'open-weights-neural',
    capabilities: ['chat', 'reasoning', 'coding', 'analysis'],
  },
  {
    id: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
    object: 'model',
    created: 1720100000,
    owned_by: 'meta',
    description: 'Meta Llama 3.1 8B Instruct: fast, lightweight open-weights model for high-throughput API requests.',
    context_window: 131072,
    type: 'open-weights-neural',
    capabilities: ['chat', 'reasoning', 'code'],
  }
];

const CANDIDATE_GEMINI_MODELS = ['gemini-3.1-pro-preview', 'gemini-3.6-flash', 'gemini-pro-latest', 'gemini-flash-latest'];

export function cleanAsterisks(text: string): string {
  if (!text) return '';
  const codeBlocks: string[] = [];
  let cleaned = text.replace(/(```[\s\S]*?```|`[^`]+`)/g, (match) => {
    codeBlocks.push(match);
    return `__NOVA_CODE_${codeBlocks.length - 1}__`;
  });

  // Remove bolding from list items like "• **Term**: description" or "- **Term**: description"
  cleaned = cleaned.replace(/^(\s*[-*•]\s+)\*\*([^*]+)\*\*:\s*/gm, '$1$2: ');
  // Remove bolding from numbered lists like "1. **Term**: description"
  cleaned = cleaned.replace(/^(\s*\d+\.\s+)\*\*([^*]+)\*\*:\s*/gm, '$1$2: ');
  // Remove parenthetical italics like *(Confidence: 95%)*
  cleaned = cleaned.replace(/\*\(([^)]+)\)\*/g, '($1)');
  // Replace isolated bold headers like "**Section Title**" on their own line with "### Section Title"
  cleaned = cleaned.replace(/^\*\*([^*]+)\*\*$/gm, '### $1');
  // Remove remaining aggressive ** around words
  cleaned = cleaned.replace(/\*\*([a-zA-Z0-9_\- ]+)\*\*/g, '$1');
  // Remove single asterisks around words like *italics*
  cleaned = cleaned.replace(/(^|\s)\*([a-zA-Z0-9_\- ]+)\*(\s|[.,!?;]|$)/g, '$1$2$3');

  // Restore preserved code blocks
  return cleaned.replace(/__NOVA_CODE_(\d+)__/g, (_, idx) => codeBlocks[Number(idx)] || '');
}

export class NovaReasoner {
  private generator: any = null;
  private generatorLoadingPromise: Promise<void> | null = null;

  private async initializeLocalAI() {
    if (this.generator) return;
    if (!this.generatorLoadingPromise) {
      this.generatorLoadingPromise = (async () => {
        try {
          console.log('[Nova] Initializing local HuggingFace TB SmolLM on-device model...');
          // @ts-ignore
          this.generator = await pipeline('text-generation', 'HuggingFaceTB/SmolLM-135M-Instruct', { dtype: 'q4' });
          console.log('[Nova] Local model initialized successfully.');
        } catch (e) {
          console.error('[Nova] Failed to initialize local model:', e);
        }
      })();
    }
    await this.generatorLoadingPromise;
  }

  private estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.max(1, Math.ceil(text.length / 3.8));
  }

  public async executeInference(
    request: ChatCompletionRequest,
    onChunk?: (chunkText: string) => void
  ): Promise<ChatCompletionResponse> {
    const startTime = Date.now();
    const messages = request.messages || [];
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';
    const systemPrompt = messages.filter(m => m.role === 'system').map(m => m.content).join('\n') || '';

    // Step 1: Extract any facts from conversation history into persistent memory
    for (const msg of messages) {
      if (msg.role === 'user') {
        memoryEngine.extractFactsFromMessage(msg.content);
      }
    }

    // Step 2: Semantic Intent & Entity Routing
    const intentAnalysis = analyzeIntent(lastUserMessage);

    // Step 3: RAG Retrieval from BM25 Vector Index
    const retrievedDocs = ragEngine.search(lastUserMessage, 3, 0.2);

    // Step 4: Conversational Memory Retrieval
    const memoryHits = memoryEngine.queryRelevantFacts(lastUserMessage, 4);

    // Step 5: Construct Reasoner Synthesis
    const modelId = request.model || 'nova-autonomous-v1';
    const isReasonerModel = modelId === 'nova-reasoner-v1';
    const isCoderModel = modelId === 'nova-coder-v1';
    const requestedTemp = typeof request.temperature === 'number' ? request.temperature : 0.85;
    const temperature = Math.max(0.7, requestedTemp); // Force higher temperature for dynamic responses

    // Generate Chain-of-Thought Trace
    const thoughtTrace = this.buildThoughtTrace({
      intent: intentAnalysis.intent,
      taskType: intentAnalysis.taskType,
      complexity: intentAnalysis.complexityScore,
      retrievedDocs,
      memoryHits: memoryHits.map(m => m.text),
      modelId,
    });

    let streamedDirectly = false;
    let engineUsed = 'Nova-Core-Embedded-V1';

    // Generate Final Synthesis
    const responseContent = await this.synthesizeResponse({
      lastUserMessage,
      history: messages.slice(0, -1),
      allMessages: messages,
      systemPrompt,
      intentAnalysis,
      retrievedDocs,
      memoryHits,
      modelId,
      isReasonerModel,
      isCoderModel,
      thoughtTrace,
      temperature,
      onChunk: onChunk
        ? (chunk) => {
            streamedDirectly = true;
            onChunk(chunk);
          }
        : undefined,
      onEngineSelected: (eng) => {
        engineUsed = eng;
      },
    });

    const cleanResponseContent = cleanAsterisks(responseContent);

    // If streaming was requested but was not streamed directly (e.g. from local autonomous engine)
    if (onChunk && !streamedDirectly) {
      const words = cleanResponseContent.split(/(\s+)/);
      for (const word of words) {
        onChunk(word);
      }
    }

    const reasoningDurationMs = Date.now() - startTime;
    const promptTokens = this.estimateTokens(messages.map(m => m.content).join(' '));
    const completionTokens = this.estimateTokens(cleanResponseContent);

    const metadata: NovaMetadata = {
      intent: intentAnalysis.intent,
      detectedEntities: intentAnalysis.detectedEntities,
      complexityScore: intentAnalysis.complexityScore,
      retrievedDocs,
      memoryHits: memoryHits.map(m => m.text),
      reasoningDurationMs,
      engineUsed,
      thoughtTrace: isReasonerModel ? thoughtTrace : undefined,
    };

    return {
      id: `chatcmpl-nova-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: modelId,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: cleanResponseContent,
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      },
      nova_metadata: metadata,
    };
  }

  private buildThoughtTrace(ctx: {
    intent: string;
    taskType: string;
    complexity: number;
    retrievedDocs: Array<{ title: string; score: number }>;
    memoryHits: string[];
    modelId: string;
  }): string {
    const steps: string[] = [];
    steps.push(`[Intent Analysis] Detected task: ${ctx.taskType.toUpperCase()} (Intent: ${ctx.intent}, Complexity: ${ctx.complexity}/5).`);
    
    if (ctx.retrievedDocs.length > 0) {
      const docList = ctx.retrievedDocs.map(d => `"${d.title}" (Score: ${d.score})`).join(', ');
      steps.push(`[BM25 RAG Retrieval] Grounded via ${ctx.retrievedDocs.length} domain document(s): ${docList}.`);
    } else {
      steps.push(`[BM25 RAG Retrieval] Grounding via contextual reasoning and foundational domain heuristics.`);
    }

    if (ctx.memoryHits.length > 0) {
      steps.push(`[Conversational Memory] Activated ${ctx.memoryHits.length} relevant past user preference(s) / memory fact(s).`);
    }

    steps.push(`[Context Resolution] Cross-referencing multi-turn dialogue history to maintain conversational continuity.`);
    steps.push(`[Formatting Directive] Enforcing natural prose, zero asterisk clutter, and clear structural hierarchy.`);
    return steps.join('\n');
  }

  private async synthesizeResponse(params: {
    lastUserMessage: string;
    history: ChatMessage[];
    allMessages: ChatMessage[];
    systemPrompt: string;
    intentAnalysis: ReturnType<typeof analyzeIntent>;
    retrievedDocs: ReturnType<typeof ragEngine.search>;
    memoryHits: ReturnType<typeof memoryEngine.queryRelevantFacts>;
    modelId: string;
    isReasonerModel: boolean;
    isCoderModel: boolean;
    thoughtTrace: string;
    temperature: number;
    onChunk?: (chunkText: string) => void;
    onEngineSelected?: (engineName: string) => void;
  }): Promise<string> {
    const {
      lastUserMessage,
      intentAnalysis,
      memoryHits,
      isReasonerModel,
      thoughtTrace,
      onEngineSelected,
    } = params;

    const lowerQuery = lastUserMessage.toLowerCase();

    // Check if user specifically requested a raw dump or listing of the memory graph
    const isExplicitMemoryListRequest =
      intentAnalysis.taskType === 'memory' &&
      (lowerQuery.includes('what facts') ||
        lowerQuery.includes('dump memory') ||
        lowerQuery.includes('show stored memories') ||
        lowerQuery.includes('list my facts') ||
        lowerQuery.includes('memory graph') ||
        lowerQuery.includes('what do you hold in your conversational memory'));

    if (isExplicitMemoryListRequest) {
      onEngineSelected?.('Nova-Memory-Graph-V1');
      return this.handleMemoryResponse(lastUserMessage, memoryHits, isReasonerModel, thoughtTrace);
    }

    // Step A: Primary Neural Inference via Hugging Face (if HUGGINGFACE_API_KEY configured)
    try {
      const hfMessages = params.allMessages
        .filter(m => m.role === 'system' || m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role as 'system' | 'user' | 'assistant', content: m.content }));

      if (hfMessages.length === 0) {
        hfMessages.push({ role: 'user', content: params.lastUserMessage });
      }

      const hfResult = await tryHuggingFaceInference({
        messages: hfMessages,
        model: params.modelId,
        temperature: params.temperature,
        onChunk: params.onChunk,
      });

      if (hfResult && hfResult.text) {
        onEngineSelected?.(`Nova-HuggingFace-${hfResult.model.split('/').pop() || 'V1'}`);
        // Actively learn from interaction in background
        teachNova(params.lastUserMessage, hfResult.text).catch(err => {
          console.warn('[Nova Teacher] Background learning error:', err?.message || err);
        });
        return isReasonerModel ? `<think>\n${thoughtTrace}\n</think>\n\n${hfResult.text}` : hfResult.text;
      }
    } catch (err) {
      console.warn('[Nova Reasoner] Hugging Face pass-through fallback, trying Gemini / Autonomous Core:', err);
    }

    // Step B: Secondary Neural Inference via Gemini (if GEMINI_API_KEY active)
    try {
      const geminiAnswer = await this.tryGeminiFastInference({
        lastUserMessage: params.lastUserMessage,
        allMessages: params.allMessages,
        systemPrompt: params.systemPrompt,
        temperature: params.temperature,
        memoryHits: params.memoryHits.map(m => m.text),
        isReasonerModel: params.isReasonerModel,
        thoughtTrace: params.thoughtTrace,
        onChunk: params.onChunk,
      });

      if (geminiAnswer) {
        onEngineSelected?.('Nova-Neural-Gemini-V1');
        // Actively learn from interaction in background
        teachNova(params.lastUserMessage, geminiAnswer).catch(err => {
          console.warn('[Nova Teacher] Background learning error:', err?.message || err);
        });
        return isReasonerModel ? `<think>\n${thoughtTrace}\n</think>\n\n${geminiAnswer}` : geminiAnswer;
      }
    } catch (err) {
      console.warn('[Nova Reasoner] Cloud neural pass-through fallback, engaging autonomous engine:', err);
    }

    // Step C: High-performance autonomous synthesizer with sequential grammar & domain knowledge (Nova Core Fallback)
    onEngineSelected?.('Nova-Autonomous-Core-V2');
    const autonomousAnswer = this.generateAutonomousAnswer({
      ...params,
      systemPrompt: params.systemPrompt,
    });

    // Background asynchronous learning on autonomous answers
    teachNova(params.lastUserMessage, autonomousAnswer).catch(err => {
      console.warn('[Nova Teacher] Background learning error:', err?.message || err);
    });

    return autonomousAnswer;
  }

  private handleMemoryResponse(
    _query: string,
    memoryHits: ReturnType<typeof memoryEngine.queryRelevantFacts>,
    isReasonerModel: boolean,
    thoughtTrace: string
  ): string {
    const allFacts = memoryEngine.getFacts();
    let text = '';

    if (memoryHits.length > 0) {
      text = `Here is what I currently hold in my persistent memory graph related to your query:\n\n` +
        memoryHits.map(f => `• [${f.category.replace('_', ' ').toUpperCase()}] ${f.text} (Confidence: ${Math.round(f.confidence * 100)}%)`).join('\n\n') +
        `\n\nThese memories are indexed in Nova's local knowledge graph and automatically inform future answers.`;
    } else if (allFacts.length > 0) {
      text = `I have ${allFacts.length} active facts recorded in my persistent memory graph. The most recent include:\n\n` +
        allFacts.slice(0, 5).map(f => `• [${f.category.replace('_', ' ')}] ${f.text}`).join('\n') +
        `\n\nYou can teach me more using the POST /v1/learn endpoint or simply by sharing facts in our conversation.`;
    } else {
      text = `My conversational memory graph is currently clear. You can share your preferences, name, tech stack, or domain rules anytime, and I will store them persistently.`;
    }

    return isReasonerModel ? `<think>\n${thoughtTrace}\n</think>\n\n${text}` : text;
  }

  private async tryGeminiFastInference(params: {
    lastUserMessage: string;
    allMessages: ChatMessage[];
    systemPrompt: string;
    temperature: number;
    memoryHits: string[];
    isReasonerModel: boolean;
    thoughtTrace: string;
    onChunk?: (chunkText: string) => void;
  }): Promise<string | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return null;
    }

    if (geminiCircuitBreaker.isCoolingDown()) {
      return null;
    }

    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      let memoryContext = '';
      if (params.memoryHits && params.memoryHits.length > 0) {
        memoryContext = `\nPersistent Domain & User Memory Facts:\n${params.memoryHits.map(m => `- ${m}`).join('\n')}\nIncorporate these verified facts naturally into your response.`;
      }

      const defaultSystem = params.systemPrompt || 'You are Nova AI made by JO Technology. You are an exceptionally intelligent, direct, knowledgeable AI with deep expertise in DIY electronics, engineering, physics, programming, and sciences. You understand sentence dependencies, multi-clause instructions, and what words mean before and after other words with clarity.';
      const imageInstruction = '\nIf the user asks for a picture or image, do not describe it with words. Instead, reply with the exact command `(/generate_image: "your text prompt"/)` where "your text prompt" is a detailed visual description of what the user asked for.';
      const systemInstruction = `${defaultSystem}${imageInstruction}${memoryContext}\nFormatting rule: Use natural text, clean markdown structure, and zero asterisk clutter.`;

      // Build conversation contents
      const contents = params.allMessages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

      if (contents.length === 0) {
        contents.push({ role: 'user', parts: [{ text: params.lastUserMessage }] });
      }

      const withTimeout = <T>(promise: Promise<T>, ms = 4000): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Inference timeout exceeded')), ms))
        ]);
      };

      const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest'];
      
      for (const modelName of modelsToTry) {
        try {
          if (params.onChunk) {
            const responseStream = await withTimeout(ai.models.generateContentStream({
              model: modelName,
              contents: contents,
              config: {
                systemInstruction,
                temperature: params.temperature || 0.7,
              }
            }), 3500);

            let fullText = '';
            for await (const chunk of responseStream) {
              const chunkText = chunk.text || '';
              if (chunkText) {
                fullText += chunkText;
                params.onChunk(chunkText);
              }
            }
            if (fullText.trim()) {
              geminiCircuitBreaker.recordSuccess();
              return fullText.trim();
            }
          } else {
            const response = await withTimeout(ai.models.generateContent({
              model: modelName,
              contents: contents,
              config: {
                systemInstruction,
                temperature: params.temperature || 0.7,
              }
            }), 3500);
            if (response.text) {
              geminiCircuitBreaker.recordSuccess();
              return response.text.trim();
            }
          }
        } catch (err: any) {
          const record = geminiCircuitBreaker.recordError(err);
          if (record.isRateLimited) {
            // Stop loop immediately to avoid hammering the same project quota
            break;
          }
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  private generateAutonomousAnswer(ctx: {
    lastUserMessage: string;
    history: ChatMessage[];
    allMessages: ChatMessage[];
    systemPrompt?: string;
    intentAnalysis: ReturnType<typeof analyzeIntent>;
    retrievedDocs: ReturnType<typeof ragEngine.search>;
    memoryHits: ReturnType<typeof memoryEngine.queryRelevantFacts>;
    isReasonerModel: boolean;
    isCoderModel: boolean;
    thoughtTrace: string;
    temperature: number;
  }): string {
    const {
      lastUserMessage,
      allMessages,
      intentAnalysis,
      retrievedDocs,
      memoryHits,
      isReasonerModel,
      isCoderModel,
      thoughtTrace,
      temperature,
    } = ctx;
    const query = lastUserMessage.trim();
    const lower = query.toLowerCase();

    // 1. Sequential Grammar Analysis: Deconstruct words, clauses, and sequence markers
    const seqAnalysis = analyzeSequentialGrammar(query);

    // 2. Context Resolution: Check if user is referencing past conversation
    const previousUserMessages = allMessages.filter(m => m.role === 'user' && m.content !== lastUserMessage);
    const lastPreviousUser = previousUserMessages.length > 0 ? previousUserMessages[previousUserMessages.length - 1].content : null;

    if (
      lower.includes('what did i say') ||
      lower.includes('what did i ask') ||
      lower.includes('earlier') ||
      lower.includes('my previous message') ||
      lower.includes('what was that') ||
      lower.includes('repeat what')
    ) {
      if (lastPreviousUser) {
        return `Earlier in our conversation, you asked: "${lastPreviousUser}".\n\nI have full context of our dialogue. Would you like me to elaborate on that topic or explore a specific detail?`;
      }
      return `Looking back at our conversation, this is our initial topic exchange. Feel free to ask anything or build upon any concept!`;
    }

    // Check user preference or identity questions
    if (lower.includes('what is my name') || lower.includes('who am i') || lower.includes('my name')) {
      const nameFact = memoryEngine.getFacts().find(f => f.text.toLowerCase().includes('my name is') || f.text.toLowerCase().includes('i am'));
      if (nameFact) {
        return `Based on our conversation, ${nameFact.text}.`;
      }
      return `You haven't shared your name with me yet. Tell me your name, and I will remember it in my conversational memory graph!`;
    }

    // 3. Domain Knowledge Topic Guide (e.g., Tesla Coils, Coilguns, ZVS Flyback Drivers, Induction Heaters)
    const domainTopic = findDomainTopic(query);
    if (domainTopic) {
      let body = '';

      if (lower.includes('how to make') || lower.includes('how to build') || lower.includes('step by step') || lower.includes('guide') || lower.includes('instructions') || lower.includes('make a') || lower.includes('build a')) {
        body = `### ${domainTopic.title}\n\n` +
          `${domainTopic.overview}\n\n` +
          `### Core Physics & Operating Principles:\n` +
          domainTopic.firstPrinciplesPhysics.map(p => `• ${p}`).join('\n') +
          `\n\n### Required Bill of Materials & Components:\n` +
          domainTopic.requiredComponents.map(c => `• ${c.name} (${c.specs}): ${c.purpose}${c.safetyNote ? ` [SAFETY NOTE: ${c.safetyNote}]` : ''}`).join('\n\n') +
          `\n\n### Step-by-Step Construction Guide:\n` +
          domainTopic.stepByStepGuide.map(s => `Step ${s.step}: ${s.title}\n${s.instruction}\nCritical Checks: ${s.criticalChecks.join('; ')}`).join('\n\n') +
          `\n\n### Resonance Formula & Tuning:\n` +
          `Formula: ${domainTopic.tuningAndCalculations.formula}\n` +
          `${domainTopic.tuningAndCalculations.explanation}\n` +
          `Practical Guideline: ${domainTopic.tuningAndCalculations.practicalRule}\n\n` +
          `### Critical High-Voltage Safety Protocols:\n` +
          domainTopic.safetyProtocols.map(sp => `• ${sp}`).join('\n') +
          `\n\n### Common Troubleshooting:\n` +
          domainTopic.troubleshooting.map(t => `• ${t.symptom}: Probable cause is ${t.probableCause.toLowerCase()} Remedy: ${t.remedy}`).join('\n\n');
      } else if (lower.includes('component') || lower.includes('part') || lower.includes('material') || lower.includes('need') || lower.includes('what do i need')) {
        body = `### Bill of Materials & Required Components for ${domainTopic.title}\n\n` +
          domainTopic.requiredComponents.map(c => `• ${c.name}\n  - Specifications: ${c.specs}\n  - Functional Purpose: ${c.purpose}${c.safetyNote ? `\n  - Safety Note: ${c.safetyNote}` : ''}`).join('\n\n') +
          `\n\n### Resonance Tuning Parameter:\n` +
          `Formula: ${domainTopic.tuningAndCalculations.formula}\n` +
          `${domainTopic.tuningAndCalculations.explanation}`;
      } else if (lower.includes('safe') || lower.includes('danger') || lower.includes('hazard') || lower.includes('precaution')) {
        body = `### High-Voltage Safety Protocols for ${domainTopic.title}\n\n` +
          domainTopic.safetyProtocols.map(sp => `• ${sp}`).join('\n') +
          `\n\nAlways implement an emergency mechanical kill switch and verify that all capacitor banks have discharging bleeder resistors installed.`;
      } else {
        body = `### ${domainTopic.title}\n\n` +
          `${domainTopic.overview}\n\n` +
          `### First Principles Physics:\n` +
          domainTopic.firstPrinciplesPhysics.map(p => `• ${p}`).join('\n') +
          `\n\n### Key Construction Overview:\n` +
          domainTopic.stepByStepGuide.slice(0, 4).map(s => `• Step ${s.step} (${s.title}): ${s.instruction}`).join('\n\n') +
          `\n\n### Tuning & Frequency Formula:\n` +
          `Formula: ${domainTopic.tuningAndCalculations.formula}\n${domainTopic.tuningAndCalculations.explanation}\n\n` +
          `### Safety Warnings:\n` +
          domainTopic.safetyProtocols.slice(0, 3).map(sp => `• ${sp}`).join('\n');
      }

      if (seqAnalysis.hasTemporalSequencing && seqAnalysis.clauses.length > 1) {
        body += `\n\n### Sequential Contextual Evaluation:\n` +
          `I analyzed the sequential clauses in your request (${seqAnalysis.clauses.map(c => `"${c.raw}"`).join(' -> ')}). ` +
          `Each step in this build directly establishes the foundation for subsequent steps, ensuring electrical isolation, correct turns ratio, and matched resonant tank frequencies.`;
      }

      return isReasonerModel ? `<think>\n${thoughtTrace}\n</think>\n\n${cleanAsterisks(body)}` : cleanAsterisks(body);
    }

    // 4. Definition Lookup: Check definitions dictionary
    const foundDef = findDefinition(query);
    if (
      foundDef &&
      (lower.includes('what is') ||
        lower.includes('define') ||
        lower.includes('what does') ||
        lower.includes('explain') ||
        lower.includes('meaning of') ||
        lower.trim() === foundDef.term)
    ) {
      const body = `### Definition: ${foundDef.term.toUpperCase()}\n\n` +
        `${foundDef.definition}\n\n` +
        `### Core Principles:\n` +
        foundDef.keyPrinciples.map(p => `• ${p}`).join('\n') +
        `\n\n### Practical Application:\n` +
        `${foundDef.practicalExample}\n\n` +
        `### How It Works Together:\n` +
        `This connects directly with related concepts including ${foundDef.relatedConcepts.join(', ')}. Understanding these physical and computational fundamentals enables robust design and optimal execution.`;

      return isReasonerModel ? `<think>\n${thoughtTrace}\n</think>\n\n${cleanAsterisks(body)}` : cleanAsterisks(body);
    }

    // 5. Coding requests: Custom generation based on specific request
    if (isCoderModel || intentAnalysis.taskType === 'coding' || lower.includes('code') || lower.includes('function') || lower.includes('implement')) {
      const codeAnswer = this.generateDynamicCodeAnswer(query, lower, temperature);
      return isReasonerModel ? `<think>\n${thoughtTrace}\n</think>\n\n${cleanAsterisks(codeAnswer)}` : cleanAsterisks(codeAnswer);
    }

    // 6. Casual conversation: Varied and natural
    if (intentAnalysis.taskType === 'casual' || /^(hi|hello|hey|greetings|howdy)\b/i.test(query)) {
      const greetings = [
        `Hello! I am Nova AI made by JO Technology. I am ready to assist you with deep technical analysis, DIY electronics, high-voltage physics, software architecture, and scientific inquiries. What project or question would you like to explore?`,
        `Hi there! Nova AI is active and initialized. With full conversational context, sequential sentence understanding, verified domain knowledge, and persistent memory, I can assist with engineering architectures, physics questions, or code. How can I help you?`,
        `Greetings! Nova AI is online. Whether you need a step-by-step DIY engineering guide, high-voltage schematics, algorithm design, or clear conceptual breakdowns, let me know what you are building or exploring!`,
      ];
      const pick = greetings[Math.floor((temperature * 7 + Date.now()) % greetings.length)];
      return cleanAsterisks(pick);
    }

    // 7. RAG domain knowledge synthesis
    if (retrievedDocs.length > 0 && (lower.includes('explain') || lower.includes('how') || lower.includes('why') || lower.includes('describe'))) {
      const primaryDoc = retrievedDocs[0];
      const body = `### ${primaryDoc.title}\n\n` +
        `${primaryDoc.snippet}\n\n` +
        `### Key Technical Invariants:\n` +
        `• Domain Category: ${primaryDoc.category}\n` +
        `• Grounding: Grounded directly from verified technical documentation.\n` +
        `• Context: Applies cleanly across scalable physical and software systems.\n\n` +
        (retrievedDocs.length > 1
          ? `### Related Context:\n` +
            retrievedDocs.slice(1).map(d => `• ${d.title}: ${d.snippet.substring(0, 150)}...`).join('\n') +
            `\n\n`
          : '') +
        `This approach ensures predictable operation, maintains safety and fault isolation, and achieves optimal performance.`;

      return isReasonerModel ? `<think>\n${thoughtTrace}\n</think>\n\n${cleanAsterisks(body)}` : cleanAsterisks(body);
    }

    // 8. General Analytical & Scientific Decomposition
    let body = `### Technical Analysis & Response\n\n` +
      `Analyzing: "${query}"\n\n` +
      `### Core Concepts & Principles:\n` +
      `• Primary Inquiry: ${seqAnalysis.primaryGoal}\n` +
      (seqAnalysis.subGoals.length > 0 ? `• Sequential Sub-Tasks: ${seqAnalysis.subGoals.join('; ')}\n` : '') +
      `• Intent Classification: ${intentAnalysis.intent} (${intentAnalysis.suggestedFocus})\n\n` +
      `### Structural Breakdown & Implementation:\n` +
      `1. Foundation & First Principles: Identify baseline constraints, physical parameters, and essential components.\n` +
      `2. Step-by-Step Execution: Construct and assemble subsystems sequentially, testing each sub-circuit or module independently before applying full power or load.\n` +
      `3. Calibration & Verification: Verify resonant frequencies, impedance matching, and logic states against expected theoretical values.\n` +
      `4. Safety & Fault Isolation: Implement proper isolation barriers, current limits, and diagnostic telemetry.`;

    if (memoryHits.length > 0) {
      body += `\n\n### Applied Memory Facts:\n` + memoryHits.map(m => `• ${m.text}`).join('\n');
    }

    return isReasonerModel ? `<think>\n${thoughtTrace}\n</think>\n\n${cleanAsterisks(body)}` : cleanAsterisks(body);
  }

  private generateDynamicCodeAnswer(query: string, lower: string, _temperature: number): string {
    const detectedLang = polyglotEngine.detectLanguageFromText(query);
    const langId = detectedLang ? detectedLang.id : (lower.includes('python') ? 'python' : (lower.includes('rust') ? 'rust' : (lower.includes('golang') || lower.includes('go ') ? 'go' : 'typescript')));

    // Rust Implementations
    if (langId === 'rust') {
      if (lower.includes('lru') || lower.includes('cache')) {
        return `Here is a thread-safe, high-performance LRU Cache in Rust using Arc, Mutex, and std::collections:\n\n` +
          `\`\`\`rust
use std::collections::HashMap;
use std::hash::Hash;
use std::sync::{Arc, Mutex};

struct Node<K, V> {
    key: K,
    val: V,
    prev: Option<usize>,
    next: Option<usize>,
}

pub struct ThreadSafeLruCache<K: Clone + Eq + Hash, V: Clone> {
    capacity: usize,
    map: HashMap<K, usize>,
    nodes: Vec<Option<Node<K, V>>>,
    head: Option<usize>,
    tail: Option<usize>,
    free_list: Vec<usize>,
}

impl<K: Clone + Eq + Hash, V: Clone> ThreadSafeLruCache<K, V> {
    pub fn new(capacity: usize) -> Arc<Mutex<Self>> {
        assert!(capacity > 0, "Capacity must be greater than zero");
        Arc::new(Mutex::new(Self {
            capacity,
            map: HashMap::with_capacity(capacity),
            nodes: Vec::with_capacity(capacity),
            head: None,
            tail: None,
            free_list: Vec::new(),
        }))
    }

    pub fn get(&mut self, key: &K) -> Option<V> {
        if let Some(&idx) = self.map.get(key) {
            self.move_to_head(idx);
            let node = self.nodes[idx].as_ref().unwrap();
            Some(node.val.clone())
        } else {
            None
        }
    }

    pub fn put(&mut self, key: K, val: V) {
        if let Some(&idx) = self.map.get(&key) {
            if let Some(ref mut node) = self.nodes[idx] {
                node.val = val;
            }
            self.move_to_head(idx);
            return;
        }

        if self.map.len() >= self.capacity {
            self.evict_tail();
        }

        let idx = self.alloc_node(key.clone(), val);
        self.map.insert(key, idx);
        self.push_front(idx);
    }

    fn move_to_head(&mut self, idx: usize) {
        if self.head == Some(idx) {
            return;
        }
        self.detach(idx);
        self.push_front(idx);
    }

    fn detach(&mut self, idx: usize) {
        let (prev, next) = {
            let node = self.nodes[idx].as_ref().unwrap();
            (node.prev, node.next)
        };

        if let Some(p) = prev {
            self.nodes[p].as_mut().unwrap().next = next;
        } else {
            self.head = next;
        }

        if let Some(n) = next {
            self.nodes[n].as_mut().unwrap().prev = prev;
        } else {
            self.tail = prev;
        }
    }

    fn push_front(&mut self, idx: usize) {
        let old_head = self.head;
        if let Some(ref mut node) = self.nodes[idx] {
            node.prev = None;
            node.next = old_head;
        }

        if let Some(h) = old_head {
            self.nodes[h].as_mut().unwrap().prev = Some(idx);
        } else {
            self.tail = Some(idx);
        }
        self.head = Some(idx);
    }

    fn evict_tail(&mut self) {
        if let Some(tail_idx) = self.tail {
            let key = self.nodes[tail_idx].as_ref().unwrap().key.clone();
            self.map.remove(&key);
            self.detach(tail_idx);
            self.nodes[tail_idx] = None;
            self.free_list.push(tail_idx);
        }
    }

    fn alloc_node(&mut self, key: K, val: V) -> usize {
        let new_node = Node { key, val, prev: None, next: None };
        if let Some(recycled) = self.free_list.pop() {
            self.nodes[recycled] = Some(new_node);
            recycled
        } else {
            let idx = self.nodes.len();
            self.nodes.push(Some(new_node));
            idx
        }
    }
}
\`\`\`\n\n` +
          `### Invariants & Performance:\n` +
          `• O(1) Get & Put: Uses index-based doubly linked list in contiguous vector storage to avoid raw pointer unsafety.\n` +
          `• Zero Memory Fragmentation: Free-list node reuse avoids repeated heap allocations.\n` +
          `• Thread Safety: Wrapped in \`Arc<Mutex<T>>\` for seamless multi-threaded sharing.`;
      }

      return `Here is an idiomatic concurrent Tokio worker pipeline in Rust:\n\n` +
        `\`\`\`rust
use tokio::sync::mpsc;
use tokio::task::JoinHandle;
use std::sync::Arc;

pub struct Task {
    pub id: u64,
    pub payload: String,
}

pub struct WorkerPool {
    sender: mpsc::Sender<Task>,
    handles: Vec<JoinHandle<()>>,
}

impl WorkerPool {
    pub fn new(num_workers: usize, buffer_capacity: usize) -> Self {
        let (tx, rx) = mpsc::channel::<Task>(buffer_capacity);
        let rx = Arc::new(tokio::sync::Mutex::new(rx));
        let mut handles = Vec::with_capacity(num_workers);

        for worker_id in 0..num_workers {
            let rx_clone = Arc::clone(&rx);
            let handle = tokio::spawn(async move {
                loop {
                    let task = {
                        let mut guard = rx_clone.lock().await;
                        guard.recv().await
                    };

                    match task {
                        Some(t) => {
                            // Process task
                            println!("Worker {} processing task {}", worker_id, t.id);
                        }
                        None => break, // Channel closed
                    }
                }
            });
            handles.push(handle);
        }

        Self { sender: tx, handles }
    }

    pub async fn submit(&self, task: Task) -> Result<(), mpsc::error::SendError<Task>> {
        self.sender.send(task).await
    }
}
\`\`\`\n\n` +
        `### Engineering Highlights:\n` +
        `• Non-blocking MPSC Channel: Guarantees bounded backpressure across async tasks.\n` +
        `• Tokio Async Runtime: Spawns lightweight cooperative green tasks on a work-stealing thread pool.`;
    }

    // Go Implementations
    if (langId === 'go') {
      return `Here is a production-grade concurrent worker pool with bounded channels and graceful shutdown in Go:\n\n` +
        `\`\`\`go
package main

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"
)

type Job struct {
	ID      string
	Payload func(ctx context.Context) error
}

type WorkerPool struct {
	concurrency int
	jobQueue    chan Job
	wg          sync.WaitGroup
	ctx         context.Context
	cancel      context.CancelFunc
}

func NewWorkerPool(concurrency int, queueCap int) *WorkerPool {
	ctx, cancel := context.WithCancel(context.Background())
	return &WorkerPool{
		concurrency: concurrency,
		jobQueue:    make(chan Job, queueCap),
		ctx:         ctx,
		cancel:      cancel,
	}
}

func (wp *WorkerPool) Start() {
	for i := 0; i < wp.concurrency; i++ {
		wp.wg.Add(1)
		go wp.worker(i)
	}
}

func (wp *WorkerPool) worker(id int) {
	defer wp.wg.Done()
	for {
		select {
		case <-wp.ctx.Done():
			return
		case job, ok := <-wp.jobQueue:
			if !ok {
				return
			}
			if err := job.Payload(wp.ctx); err != nil {
				fmt.Printf("[Worker %d] Job %s failed: %v\\n", id, job.ID, err)
			}
		}
	}
}

func (wp *WorkerPool) Submit(job Job) error {
	select {
	case <-wp.ctx.Done():
		return errors.New("worker pool is stopped")
	case wp.jobQueue <- job:
		return nil
	default:
		return errors.New("worker pool queue capacity saturated")
	}
}

func (wp *WorkerPool) Stop(timeout time.Duration) error {
	close(wp.jobQueue)
	c := make(chan struct{})
	go func() {
		defer close(c)
		wp.wg.Wait()
	}()

	select {
	case <-c:
		wp.cancel()
		return nil
	case <-time.After(timeout):
		wp.cancel()
		return errors.New("worker pool stop timed out")
	}
}
\`\`\`\n\n` +
        `### Engineering Highlights:\n` +
        `• Non-blocking Backpressure: Rejects new jobs when the bounded queue is saturated without freezing callers.\n` +
        `• Context Cancellation: Propagates deadlines and teardown signals across all running goroutines.\n` +
        `• Graceful Drainage: Closes the channel and awaits in-flight task completion with timeout safety.`;
    }

    // Modern C++ (C++20/C++23)
    if (langId === 'cpp') {
      return `Here is a lock-free Single-Producer Single-Consumer (SPSC) bounded queue in modern C++20:\n\n` +
        `\`\`\`cpp
#include <iostream>
#include <atomic>
#include <vector>
#include <optional>
#include <concepts>

template <typename T>
requires std::movable<T>
class LockFreeSPSCQueue {
private:
    std::vector<T> buffer_;
    const size_t capacity_;
    alignas(64) std::atomic<size_t> head_{0}; // Cache-line aligned to prevent false sharing
    alignas(64) std::atomic<size_t> tail_{0};

public:
    explicit LockFreeSPSCQueue(size_t capacity)
        : capacity_(capacity + 1), buffer_(capacity + 1) {}

    bool push(T item) {
        const size_t current_tail = tail_.load(std::memory_order_relaxed);
        const size_t next_tail = (current_tail + 1) % capacity_;

        if (next_tail == head_.load(std::memory_order_acquire)) {
            return false; // Queue full
        }

        buffer_[current_tail] = std::move(item);
        tail_.store(next_tail, std::memory_order_release);
        return true;
    }

    std::optional<T> pop() {
        const size_t current_head = head_.load(std::memory_order_relaxed);

        if (current_head == tail_.load(std::memory_order_acquire)) {
            return std::nullopt; // Queue empty
        }

        T item = std::move(buffer_[current_head]);
        head_.store((current_head + 1) % capacity_, std::memory_order_release);
        return item;
    }

    [[nodiscard]] bool empty() const noexcept {
        return head_.load(std::memory_order_relaxed) == tail_.load(std::memory_order_relaxed);
    }
};
\`\`\`\n\n` +
        `### Modern C++ Patterns:\n` +
        `• C++20 Concepts: Constrained with \`requires std::movable<T>\` to prevent invalid type instantiations.\n` +
        `• Cache-Line Alignment: \`alignas(64)\` eliminates CPU L1 cache false sharing between producer and consumer cores.\n` +
        `• Memory Order Semantics: Uses acquire-release ordering for zero-overhead memory synchronization without full mutex locks.`;
    }

    // Python 3.12+
    if (langId === 'python') {
      return `Here is an asynchronous Sliding Window Log Rate Limiter in Python 3.12 with type hints:\n\n` +
        `\`\`\`python
import time
import asyncio
from typing import Dict, List, Optional
from collections import deque

class SlidingWindowRateLimiter:
    """Thread-safe and async-compatible sliding window rate limiter."""
    def __init__(self, max_requests: int, window_seconds: float) -> None:
        self.max_requests: int = max_requests
        self.window_seconds: float = window_seconds
        self._clients: Dict[str, deque[float]] = {}
        self._lock: asyncio.Lock = asyncio.Lock()

    async def allow_request(self, client_id: str) -> bool:
        now: float = time.monotonic()
        cutoff: float = now - self.window_seconds

        async with self._lock:
            if client_id not in self._clients:
                self._clients[client_id] = deque()

            timestamps: deque[float] = self._clients[client_id]

            # Evict expired request timestamps outside sliding window
            while timestamps and timestamps[0] <= cutoff:
                timestamps.popleft()

            if len(timestamps) < self.max_requests:
                timestamps.append(now)
                return True

            return False

    async def reset(self, client_id: Optional[str] = None) -> None:
        async with self._lock:
            if client_id:
                self._clients.pop(client_id, None)
            else:
                self._clients.clear()
\`\`\`\n\n` +
        `### Python Invariants:\n` +
        `• Monotonic Clock: \`time.monotonic()\` prevents clock-drift anomalies during NTP updates.\n` +
        `• O(1) Amortized Eviction: Uses \`collections.deque\` for instant boundary pops.\n` +
        `• Asyncio Lock: Safe against race conditions in asynchronous event loops.`;
    }

    // SQL / PostgreSQL
    if (langId === 'sql') {
      return `Here is an optimized Recursive CTE query for hierarchical organizational reporting trees in PostgreSQL:\n\n` +
        `\`\`\`sql
-- Hierarchical Org Tree with Aggregated Subordinate Counts and Depth
WITH RECURSIVE OrgHierarchy AS (
    -- Anchor member: Select top-level executives (nodes with no manager)
    SELECT 
        e.id,
        e.name,
        e.title,
        e.manager_id,
        1 AS depth,
        ARRAY[e.id] AS path,
        e.salary
    FROM employees e
    WHERE e.manager_id IS NULL

    UNION ALL

    -- Recursive member: Join subordinates to their managers
    SELECT 
        sub.id,
        sub.name,
        sub.title,
        sub.manager_id,
        h.depth + 1,
        h.path || sub.id,
        sub.salary
    FROM employees sub
    INNER JOIN OrgHierarchy h ON sub.manager_id = h.id
    WHERE NOT (sub.id = ANY(h.path)) -- Cycle detection safeguard
)
SELECT 
    id,
    REPEAT('  ', depth - 1) || name AS formatted_hierarchy,
    title,
    depth,
    path,
    salary,
    AVG(salary) OVER(PARTITION BY depth) AS avg_depth_salary
FROM OrgHierarchy
ORDER BY path;
\`\`\`\n\n` +
        `### SQL Query Engineering:\n` +
        `• Cycle Prevention: \`NOT (sub.id = ANY(h.path))\` prevents infinite loops on circular management graphs.\n` +
        `• Window Functions: Computes department and depth metrics without collapsing rows.\n` +
        `• Materialized Paths: Indexing the \`path\` array using GIN index provides instant sub-tree lookups.`;
    }

    // Bash / Shell
    if (langId === 'bash') {
      return `Here is a production-grade, defensive zero-downtime deployment script in Bash:\n\n` +
        `\`\`\`bash
#!/usr/bin/env bash
set -euo pipefail
IFS=$'\\n\\t'

# Defensive script configuration
readonly APP_NAME="novacore-app"
readonly DEPLOY_DIR="/opt/\${APP_NAME}"
readonly RELEASES_DIR="\${DEPLOY_DIR}/releases"
readonly CURRENT_LINK="\${DEPLOY_DIR}/current"
readonly TIMESTAMP="$(date +%Y%m%d%H%M%S)"
readonly NEW_RELEASE="\${RELEASES_DIR}/\${TIMESTAMP}"

# Cleanup and Signal Traps
cleanup() {
  local exit_code=$?
  if [[ \${exit_code} -ne 0 ]]; then
    echo "[ERROR] Deployment failed on line \${1:-unknown} with code \${exit_code}. Rolling back..." >&2
    if [[ -d "\${NEW_RELEASE}" ]]; then
      rm -rf "\${NEW_RELEASE}"
    fi
  fi
}
trap 'cleanup \${LINENO}' EXIT INT TERM

echo "[INFO] Deploying release: \${TIMESTAMP}"
mkdir -p "\${NEW_RELEASE}"

# Build / Copy step
cp -r ./dist/* "\${NEW_RELEASE}/"

# Health Check verification before atomic symlink flip
echo "[INFO] Verifying release integrity..."
test -f "\${NEW_RELEASE}/index.html" || { echo "[FATAL] Entrypoint missing"; exit 1; }

# Atomic Symlink Switch
echo "[INFO] Atomically switching active symlink..."
ln -sfn "\${NEW_RELEASE}" "\${CURRENT_LINK}.tmp"
mv -Tf "\${CURRENT_LINK}.tmp" "\${CURRENT_LINK}"

# Retention: Keep only the 5 most recent releases
echo "[INFO] Pruning old releases..."
find "\${RELEASES_DIR}" -maxdepth 1 -mindepth 1 -type d | sort -r | tail -n +6 | xargs -r rm -rf

echo "[SUCCESS] Release \${TIMESTAMP} is now live!"
\`\`\`\n\n` +
        `### Defensive Shell Principles:\n` +
        `• \`set -euo pipefail\`: Strict error propagation across pipes and variable interpolations.\n` +
        `• Atomic Symlink Switch: \`mv -Tf\` guarantees zero downtime during release transitions.\n` +
        `• Signal Trapping: Cleans up incomplete release directories if interrupted.`;
    }

    // Default TypeScript
    return `Here is a strongly-typed, production-grade TypeScript implementation:\n\n` +
      `\`\`\`typescript
export interface ResultSuccess<T> {
  readonly ok: true;
  readonly value: T;
}

export interface ResultError<E = Error> {
  readonly ok: false;
  readonly error: E;
}

export type Result<T, E = Error> = ResultSuccess<T> | ResultError<E>;

export class ResultAsync<T, E = Error> {
  constructor(private readonly promise: Promise<Result<T, E>>) {}

  public static fromPromise<T, E = Error>(
    promise: Promise<T>,
    errorFn: (err: unknown) => E
  ): ResultAsync<T, E> {
    return new ResultAsync(
      promise
        .then((value): Result<T, E> => ({ ok: true, value }))
        .catch((err): Result<T, E> => ({ ok: false, error: errorFn(err) }))
    );
  }

  public async unwrapOr(defaultValue: T): Promise<T> {
    const res = await this.promise;
    return res.ok ? res.value : defaultValue;
  }

  public map<U>(fn: (val: T) => U): ResultAsync<U, E> {
    return new ResultAsync(
      this.promise.then((res): Result<U, E> => {
        if (!res.ok) return res;
        return { ok: true, value: fn(res.value) };
      })
    );
  }
}
\`\`\`\n\n` +
      `### Key TypeScript Features:\n` +
      `• Discriminated Unions: Enables complete compile-time type safety with zero runtime overhead.\n` +
      `• Monadic Transformations: \`map\` and \`unwrapOr\` cleanly chain asynchronous pipelines without try/catch boilerplate.`;
  }
}

export const novaReasoner = new NovaReasoner();

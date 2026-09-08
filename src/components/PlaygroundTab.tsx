import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Send,
  Sparkles,
  Cpu,
  Brain,
  Sliders,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap,
  Copy,
  Check,
  Code2,
  Terminal,
  BookOpen,
  Users,
  Calculator,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Download,
} from 'lucide-react';
import { ChatMessage, ChatCompletionResponse, ModelObject, MultiStepInstruction } from '../types.js';
import { webLlmManager, SUPPORTED_LOCAL_MODELS } from '../lib/webLlmEngine.js';
import { localServerManager } from '../lib/localOllamaEngine.js';

interface PlaygroundTabProps {
  models: ModelObject[];
  onTriggerLogRefresh: () => void;
  initialPrompt?: string;
  initialLocalModelId?: string;
  onOpenLocalModels?: () => void;
}

interface MessageWithMeta extends ChatMessage {
  id: string;
  timestamp: number;
  metadata?: ChatCompletionResponse['nova_metadata'];
  latencyMs?: number;
  usage?: ChatCompletionResponse['usage'];
  isStreaming?: boolean;
  imageUrl?: string;
  imageLoading?: boolean;
  instructionExecution?: {
    instructionId: string;
    stepNumber: number;
    totalSteps: number;
    isCompleted: boolean;
    summary: string;
  };
}

const PRESETS = [
  {
    label: '⚡ Multi-Step Math Instruction',
    prompt: 'multiply whatever number I tell you in the next 2 messages and than add all the numbers together in the 3rd message and tell me what it is',
    model: 'nova-reasoner-v1',
  },
  {
    label: '🦀 Rust: Thread-Safe LRU Cache',
    prompt: 'Implement a high-performance, thread-safe LRU Cache in Rust using Arc and Mutex with O(1) operations.',
    model: 'nova-coder-v1',
  },
  {
    label: '🐹 Go: Bounded Worker Pool',
    prompt: 'Write a production-grade concurrent worker pool in Go with bounded channels, backpressure, and graceful shutdown.',
    model: 'nova-coder-v1',
  },
  {
    label: '⚡ C++20: Lock-Free SPSC Queue',
    prompt: 'Implement a lock-free Single-Producer Single-Consumer (SPSC) queue in C++20 with atomic memory orders.',
    model: 'nova-coder-v1',
  },
  {
    label: '🐍 Python 3.12: Sliding Window Limiter',
    prompt: 'Write an asynchronous sliding window log rate limiter in Python 3.12 with asyncio and type hints.',
    model: 'nova-coder-v1',
  },
  {
    label: '🐘 PostgreSQL: Recursive Tree CTE',
    prompt: 'Write an optimized recursive CTE query in PostgreSQL for employee organizational hierarchy with depth and path aggregation.',
    model: 'nova-coder-v1',
  },
  {
    label: '🐚 Bash: Zero-Downtime Deployment',
    prompt: 'Write a robust defensive bash script for zero-downtime atomic release symlinking with rollback and traps.',
    model: 'nova-coder-v1',
  },
  {
    label: '🧠 Autonomous Self-Learning Knowledge',
    prompt: 'What are the latest concepts, insights, and axioms you have autonomously learned from your self-inquiry loops?',
    model: 'nova-reasoner-v1',
  },
];

const POLYGLOT_SNIPPETS = [
  { lang: 'Rust', icon: '🦀', prompt: 'Implement a thread-safe LRU Cache in Rust with Arc and Mutex.' },
  { lang: 'Go', icon: '🐹', prompt: 'Write a concurrent worker pool with bounded channels and graceful context cancellation in Go.' },
  { lang: 'C++20', icon: '⚡', prompt: 'Implement a cache-aligned, lock-free SPSC bounded queue in C++20 with acquire-release semantics.' },
  { lang: 'Python', icon: '🐍', prompt: 'Write an async sliding window rate limiter in Python 3.12 with type hints.' },
  { lang: 'TypeScript', icon: '🔷', prompt: 'Write a type-safe ResultAsync monad and debounce/throttle utility in TypeScript.' },
  { lang: 'SQL', icon: '🐘', prompt: 'Write a recursive CTE query for hierarchical graph traversal with cycle prevention in PostgreSQL.' },
  { lang: 'Java 21', icon: '☕', prompt: 'Demonstrate Java 21 Virtual Threads (Project Loom) structured concurrency with StructuredTaskScope.' },
  { lang: 'Swift', icon: '🦅', prompt: 'Implement an actor-isolated stateful cache in Swift 5.9 with async/await.' },
  { lang: 'Bash', icon: '🐚', prompt: 'Write a defensive Bash script with strict mode, signal traps, and atomic symlinks.' },
];

export const PlaygroundTab: React.FC<PlaygroundTabProps> = ({
  models,
  onTriggerLogRefresh,
  initialPrompt,
  initialLocalModelId,
  onOpenLocalModels,
}) => {
  const [selectedModel, setSelectedModel] = useState<string>(initialLocalModelId || 'Llama-3.2-1B-Instruct-q4f16_1-MLC');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [systemPrompt, setSystemPrompt] = useState<string>('You are Nova Core AI, a high-performance standalone reasoning microservice.');
  const [showSystemPrompt, setShowSystemPrompt] = useState<boolean>(false);
  const [inputPrompt, setInputPrompt] = useState<string>(initialPrompt || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Multi-tenant User and Chat Session state (kept for API but no persistence loaded)
  const [selectedUserId, setSelectedUserId] = useState<string>('default_user');
  const [selectedChatId, setSelectedChatId] = useState<string>('session_main');
  const [userSessions, setUserSessions] = useState<Array<{ id: string; title: string; messageCount: number }>>([]);
  const [activeInstruction, setActiveInstruction] = useState<MultiStepInstruction | null>(null);

  useEffect(() => {
    if (initialPrompt) {
      setInputPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (initialLocalModelId) {
      setSelectedModel(initialLocalModelId);
    }
  }, [initialLocalModelId]);

  const [messages, setMessages] = useState<MessageWithMeta[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: "Hello! I am Nova Core AI with stateful multi-step instruction tracking, per-user persistent memory, and dual knowledge distillation.\n\nTry sending a multi-step instruction such as:\n*\"multiply whatever number I tell you in the next 2 messages and than add all the numbers together in the 3rd message and tell me what it is\"*\n\nOr select a benchmark below!",
      timestamp: Date.now(),
      metadata: {
        intent: 'system_welcome',
        detectedEntities: ['nova-core', 'rag', 'memory', 'instruction_engine'],
        complexityScore: 1,
        retrievedDocs: [],
        memoryHits: [],
        reasoningDurationMs: 14,
        engineUsed: 'Nova-Core-Embedded-V1',
      },
    },
  ]);

  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);
  const [activeCurlModal, setActiveCurlModal] = useState<string | null>(null);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Image Generation Observer
  useEffect(() => {
    messages.forEach((msg) => {
      if (msg.role === 'assistant' && !msg.isStreaming && !msg.imageUrl && !msg.imageLoading) {
        const imageCommandMatch = msg.content.match(/\(\/generate_image:\s*"(.*?)"\/\)/);
        if (imageCommandMatch && imageCommandMatch[1]) {
          const prompt = imageCommandMatch[1];
          // Mark as loading to prevent duplicate requests
          setMessages((prev) =>
            prev.map((m) => (m.id === msg.id ? { ...m, imageLoading: true } : m))
          );
          
          fetch('/v1/images/generations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer nova-sk-live-alpha',
            },
            body: JSON.stringify({ prompt, n: 1, size: '1024x1024' }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.data && data.data[0]) {
                const imgData = data.data[0];
                const url = imgData.b64_json ? `data:image/jpeg;base64,${imgData.b64_json}` : imgData.url;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === msg.id ? { ...m, imageUrl: url, imageLoading: false } : m
                  )
                );
              } else {
                throw new Error('No image returned');
              }
            })
            .catch((err) => {
              console.error('Image generation failed:', err);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === msg.id
                    ? { ...m, content: `${m.content}\n\n⚠️ Failed to generate image.`, imageLoading: false }
                    : m
                )
              );
            });
        }
      }
    });
  }, [messages]);

  const handleCreateNewChat = async () => {
    try {
      const res = await fetch(`/v1/users/${selectedUserId}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Chat ${new Date().toLocaleTimeString()}` }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedChatId(data.chat.id);
        setMessages([]);
        setActiveInstruction(null);
      }
    } catch (err) {
      console.error('Error creating chat:', err);
    }
  };

  const handleCancelInstruction = async () => {
    try {
      await fetch(`/v1/users/${selectedUserId}/chats/${selectedChatId}/instructions/cancel`, {
        method: 'POST',
      });
      setActiveInstruction(null);
    } catch (err) {
      console.error('Error cancelling instruction:', err);
    }
  };

  const handleSend = async (overrideText?: string, overrideModel?: string) => {
    const textToSend = (overrideText || inputPrompt).trim();
    if (!textToSend || isLoading) return;

    const modelToUse = overrideModel || selectedModel;
    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `asst-${Date.now()}`;

    const userMessage: MessageWithMeta = {
      id: userMsgId,
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputPrompt('');
    setIsLoading(true);

    const apiMessages = [
      ...(systemPrompt.trim() ? [{ role: 'system' as const, content: systemPrompt.trim() }] : []),
      ...newHistory.map((m) => ({ role: m.role, content: m.content })),
    ];

    const startTime = Date.now();
    const isLocalWebGpu = SUPPORTED_LOCAL_MODELS.some((m) => m.id === modelToUse);
    const isOllama = modelToUse.startsWith('ollama:');

    // 1. Direct In-Browser WebGPU Execution (0 API Keys, Runs locally on GPU)
    if (isLocalWebGpu) {
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: 'assistant',
          content: '⏳ Preparing local neural model in WebGPU...',
          timestamp: Date.now(),
          isStreaming: true,
        },
      ]);

      if (!webLlmManager.isLoaded() || webLlmManager.getLoadedModelId() !== modelToUse) {
        try {
          await webLlmManager.loadModel(modelToUse, (prog) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: `⏳ Loading ${modelToUse} in WebGPU (${prog.progressPercent}%)...\n${prog.text}`,
                    }
                  : m
              )
            );
          });
        } catch (loadErr: any) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: `⚠️ Failed to initialize WebGPU model: ${loadErr.message}\nPlease check WebGPU support or switch to another model.`,
                    isStreaming: false,
                  }
                : m
            )
          );
          setIsLoading(false);
          return;
        }
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === assistantMsgId ? { ...m, content: '' } : m))
      );

      let accumulatedContent = '';
      let tokenCount = 0;
      const genStartTime = Date.now();

      try {
        for await (const chunk of webLlmManager.streamChat({
          messages: apiMessages,
          temperature,
          systemPrompt: systemPrompt.trim() || undefined,
        })) {
          accumulatedContent += chunk.text;
          tokenCount = chunk.tokensGenerated;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, content: accumulatedContent } : m
            )
          );
        }

        const latencyMs = Date.now() - genStartTime;
        const tokSec = latencyMs > 0 ? ((tokenCount / latencyMs) * 1000).toFixed(1) : '0';

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: accumulatedContent,
                  isStreaming: false,
                  latencyMs,
                  metadata: {
                    intent: 'local_gpu_neural_generation',
                    detectedEntities: [modelToUse],
                    complexityScore: 4,
                    retrievedDocs: [],
                    memoryHits: [],
                    reasoningDurationMs: latencyMs,
                    engineUsed: `WebGPU Local Neural: ${modelToUse} (${tokSec} tok/s)`,
                  },
                  usage: {
                    prompt_tokens: Math.ceil(textToSend.length / 4),
                    completion_tokens: tokenCount,
                    total_tokens: Math.ceil(textToSend.length / 4) + tokenCount,
                  },
                }
              : m
          )
        );
      } catch (genErr: any) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: `⚠️ WebGPU execution error: ${genErr.message}`,
                  isStreaming: false,
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 2. Direct Local Ollama Server Execution (0 API Keys, Local machine)
    if (isOllama) {
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          isStreaming: true,
        },
      ]);

      const realModel = modelToUse.replace(/^ollama:/, '');
      let accumulatedContent = '';

      try {
        for await (const chunk of localServerManager.streamChat({
          model: realModel,
          messages: apiMessages,
          temperature,
          systemPrompt: systemPrompt.trim() || undefined,
        })) {
          accumulatedContent += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, content: accumulatedContent } : m
            )
          );
        }

        const latencyMs = Date.now() - startTime;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: accumulatedContent,
                  isStreaming: false,
                  latencyMs,
                  metadata: {
                    intent: 'local_ollama_generation',
                    detectedEntities: [realModel],
                    complexityScore: 4,
                    retrievedDocs: [],
                    memoryHits: [],
                    reasoningDurationMs: latencyMs,
                    engineUsed: `Local Server: ${realModel}`,
                  },
                  usage: {
                    prompt_tokens: Math.ceil(textToSend.length / 4),
                    completion_tokens: Math.ceil(accumulatedContent.length / 4),
                    total_tokens: Math.ceil((textToSend.length + accumulatedContent.length) / 4),
                  },
                }
              : m
          )
        );
      } catch (err: any) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: `⚠️ Failed to connect to local Ollama server: ${err.message}`,
                  isStreaming: false,
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 3. Server-Side Execution (Nova Autonomous Engine, HuggingFace, Gemini)
    if (isStreaming) {
      // Streaming SSE mode
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          isStreaming: true,
        },
      ]);

      try {
        const res = await fetch('/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer nova-sk-live-alpha',
            'X-User-Id': selectedUserId,
            'X-Chat-Id': selectedChatId,
            'X-Nova-Internal': 'true',
          },
          body: JSON.stringify({
            model: modelToUse,
            user_id: selectedUserId,
            chat_id: selectedChatId,
            messages: apiMessages,
            temperature,
            stream: true,
          }),
        });

        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.replace('data: ', '').trim();
                if (dataStr === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(dataStr);
                  const delta = parsed.choices?.[0]?.delta?.content || '';
                  accumulatedContent += delta;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId ? { ...m, content: accumulatedContent } : m
                    )
                  );
                } catch {
                  // ignore
                }
              }
            }
          }
        }

        const latencyMs = Date.now() - startTime;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: accumulatedContent,
                  isStreaming: false,
                  latencyMs,
                  usage: {
                    prompt_tokens: Math.ceil(textToSend.length / 4),
                    completion_tokens: Math.ceil(accumulatedContent.length / 4),
                    total_tokens: Math.ceil((textToSend.length + accumulatedContent.length) / 4),
                  },
                }
              : m
          )
        );
        onTriggerLogRefresh();
      } catch (err: any) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: `⚠️ Error executing stream: ${err.message}`,
                  isStreaming: false,
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    } else {
      // Synchronous JSON mode
      try {
        const res = await fetch('/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer nova-sk-live-alpha',
            'X-User-Id': selectedUserId,
            'X-Chat-Id': selectedChatId,
            'X-Nova-Internal': 'true',
          },
          body: JSON.stringify({
            model: modelToUse,
            user_id: selectedUserId,
            chat_id: selectedChatId,
            messages: apiMessages,
            temperature,
            stream: false,
          }),
        });

        const data: ChatCompletionResponse = await res.json();
        const latencyMs = Date.now() - startTime;

        if (data.choices && data.choices[0]) {
          const assistantContent = data.choices[0].message.content;
          setMessages((prev) => [
            ...prev,
            {
              id: assistantMsgId,
              role: 'assistant',
              content: assistantContent,
              timestamp: Date.now(),
              metadata: data.nova_metadata,
              latencyMs,
              usage: data.usage,
            },
          ]);
        }
        onTriggerLogRefresh();
      } catch (err: any) {
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            role: 'assistant',
            content: `⚠️ Failed to execute inference: ${err.message}`,
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const generateCurlSnippet = (promptText: string) => {
    return `curl -X POST "${window.location.origin}/v1/chat/completions" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer nova-sk-live-alpha" \\
  -H "X-User-Id: ${selectedUserId}" \\
  -H "X-Chat-Id: ${selectedChatId}" \\
  -d '{
    "model": "${selectedModel}",
    "user_id": "${selectedUserId}",
    "chat_id": "${selectedChatId}",
    "messages": [
      {"role": "user", "content": "${promptText.replace(/"/g, '\\"')}"}
    ],
    "temperature": ${temperature},
    "stream": ${isStreaming}
  }'`;
  };

  const handleCopyCurl = (snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Parameters, User Persona & Sessions */}
        <div className="lg:col-span-4 space-y-4">
          {/* User Persona & Chat Sessions Selector */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2 text-slate-200">
                <Users className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold">User & Chat Isolation</h2>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                Firestore Sync
              </span>
            </div>

            {/* User Selector */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">User Identity (X-User-Id)</label>
              <select
                id="user-persona-select"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              >
                <option value="default_user">default_user (Standard User)</option>
                <option value="user_alex">user_alex (Alex)</option>
                <option value="user_sarah">user_sarah (Sarah)</option>
                <option value="api_client_1">api_client_1 (External Site)</option>
              </select>
            </div>

            {/* Chat Sessions list for this user */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Chat Sessions</span>
                <button
                  id="create-new-chat-btn"
                  onClick={handleCreateNewChat}
                  className="inline-flex items-center space-x-1 px-2 py-0.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded text-[11px] font-mono cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Chat</span>
                </button>
              </div>

              <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                {userSessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedChatId(s.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer flex items-center justify-between ${
                      selectedChatId === s.id
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-850'
                    }`}
                  >
                    <span className="truncate max-w-[170px]">{s.title || s.id}</span>
                    <span className="text-[10px] text-slate-500">{s.messageCount} msgs</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Model Controls */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-slate-200">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold">Model Controls</h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                REST API
              </span>
            </div>

            {/* Model Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span>Model Engine</span>
                {SUPPORTED_LOCAL_MODELS.some((m) => m.id === selectedModel) ? (
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                    ⚡ 0 Keys (WebGPU)
                  </span>
                ) : (
                  <span className="text-[10px] text-indigo-400 font-mono">OpenAI Spec</span>
                )}
              </div>
              <select
                id="model-selector"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <optgroup label="⚡ Local Neural Models (0 API Keys — In-Browser WebGPU)">
                  {SUPPORTED_LOCAL_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.downloadSize})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🌐 Server Autonomous & Distillation Microservice">
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.id} ({m.type})
                    </option>
                  ))}
                </optgroup>
              </select>

              {/* Local Model Quick Action and Status */}
              {SUPPORTED_LOCAL_MODELS.some((m) => m.id === selectedModel) ? (
                <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      In-Browser Neural Execution
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {webLlmManager.getLoadedModelId() === selectedModel ? (
                        <span className="text-emerald-400 font-semibold">● Active in VRAM</span>
                      ) : (
                        <span className="text-amber-400">○ Auto-loads on send</span>
                      )}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    {SUPPORTED_LOCAL_MODELS.find((m) => m.id === selectedModel)?.description}
                  </p>
                  {onOpenLocalModels && (
                    <button
                      type="button"
                      onClick={onOpenLocalModels}
                      className="w-full py-1 text-[11px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/30 rounded border border-emerald-500/20 transition-colors flex items-center justify-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Manage Weights & AI Code
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {models.find((m) => m.id === selectedModel)?.description ||
                    'High-performance autonomous inference.'}
                </p>
              )}
            </div>

            {/* Temperature Slider */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Temperature</span>
                <span className="font-mono text-indigo-400">{temperature.toFixed(2)}</span>
              </div>
              <input
                id="temperature-slider"
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Streaming Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
              <div>
                <span className="text-xs font-medium text-slate-300 block">Stream Tokens (SSE)</span>
                <span className="text-[11px] text-slate-500 block">text/event-stream protocol</span>
              </div>
              <button
                id="toggle-stream-btn"
                onClick={() => setIsStreaming(!isStreaming)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isStreaming ? 'bg-indigo-600' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isStreaming ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Quick Test Presets */}
            <div className="pt-3 border-t border-slate-800/60 space-y-2">
              <span className="text-xs font-medium text-slate-400 block">Quick Benchmark Prompts</span>
              <div className="grid grid-cols-1 gap-1.5">
                {PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    id={`preset-btn-${idx}`}
                    onClick={() => {
                      setSelectedModel(preset.model);
                      handleSend(preset.prompt, preset.model);
                    }}
                    disabled={isLoading}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800/80 hover:border-indigo-500/40 text-[11px] text-slate-300 hover:text-white transition-all flex items-center justify-between group cursor-pointer disabled:opacity-50"
                  >
                    <span className="truncate">{preset.label}</span>
                    <span className="text-[10px] font-mono text-slate-500 group-hover:text-indigo-400">
                      {preset.model.replace('nova-', '')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Dialogue & Active Instruction Banner */}
        <div className="lg:col-span-8 flex flex-col h-[740px] bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          {/* Chat Header Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-slate-200">
                Active Session: <strong className="text-indigo-300 font-mono">{selectedUserId}</strong> /{' '}
                <strong className="text-slate-400 font-mono">{selectedChatId}</strong>
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                ({messages.length} messages)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                id="clear-chat-btn"
                onClick={handleClearChat}
                className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* ACTIVE MULTI-STEP INSTRUCTION BANNER (If Active) */}
          {activeInstruction && activeInstruction.status === 'active' && (
            <div className="p-3 bg-amber-950/40 border-b border-amber-500/30 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-amber-200">
                      Multi-Step Instruction Active (Step {activeInstruction.currentStep}/
                      {activeInstruction.totalRequiredSteps})
                    </span>
                    <span className="px-1.5 py-0.2 bg-amber-900/60 text-amber-300 border border-amber-600/40 rounded text-[10px] font-mono">
                      Stateful Engine
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-300/80 truncate font-mono">
                    Captured values so far: [
                    {activeInstruction.capturedNumbers?.join(', ') || 'Waiting for message 1'}
                    ]
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {/* Quick Number Buttons to complete the instruction */}
                <span className="text-[10px] text-amber-400 font-mono hidden sm:inline">
                  Quick test:
                </span>
                <button
                  onClick={() => handleSend('4')}
                  className="px-2 py-1 bg-amber-900/50 hover:bg-amber-800/60 text-amber-200 border border-amber-600/40 rounded text-[10px] font-mono cursor-pointer"
                >
                  Send &quot;4&quot;
                </button>
                <button
                  onClick={() => handleSend('5')}
                  className="px-2 py-1 bg-amber-900/50 hover:bg-amber-800/60 text-amber-200 border border-amber-600/40 rounded text-[10px] font-mono cursor-pointer"
                >
                  Send &quot;5&quot;
                </button>
                <button
                  onClick={handleCancelInstruction}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 rounded text-[10px] font-mono cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Messages Stream Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Brain className="w-10 h-10 text-slate-600 mb-3" />
                <p className="text-sm font-medium text-slate-300">Nova Reasoning Engine Ready</p>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Type a prompt below or select a benchmark to evaluate stateful multi-step instructions, autonomous reasoning, and memory recall.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === 'user';
                const hasThought = msg.content.includes('<think>') && msg.content.includes('</think>');
                let thoughtContent = '';
                let cleanContent = msg.content;

                if (hasThought) {
                  const match = msg.content.match(/<think>([\s\S]*?)<\/think>/);
                  if (match) {
                    thoughtContent = match[1].trim();
                    cleanContent = msg.content.replace(/<think>[\s\S]*?<\/think>/, '').trim();
                  }
                } else if (msg.metadata?.thoughtTrace) {
                  thoughtContent = msg.metadata.thoughtTrace;
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                  >
                    {/* Role & Telemetry Header */}
                    <div className="flex items-center space-x-2 px-1 text-[11px] font-mono text-slate-400">
                      <span className="font-semibold text-slate-300">
                        {isUser ? `User (${selectedUserId})` : 'Nova Assistant'}
                      </span>
                      {msg.latencyMs && (
                        <span className="inline-flex items-center text-emerald-400 bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-800/40">
                          <Clock className="w-2.5 h-2.5 mr-1" />
                          {msg.latencyMs}ms
                        </span>
                      )}
                      {msg.usage && (
                        <span className="text-slate-500">
                          {msg.usage.total_tokens} tokens
                        </span>
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[92%] rounded-xl p-4 text-xs leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                          : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                      }`}
                    >
                      {/* Multi-step instruction execution badge */}
                      {msg.instructionExecution && (
                        <div className="mb-2.5 p-2 bg-amber-950/40 border border-amber-500/40 rounded-lg text-[11px] font-mono text-amber-300 flex items-center space-x-2">
                          <Calculator className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>
                            Step {msg.instructionExecution.stepNumber}/
                            {msg.instructionExecution.totalSteps}: {msg.instructionExecution.summary}
                          </span>
                        </div>
                      )}

                      {/* Thought Trace Accordion */}
                      {thoughtContent && (
                        <div className="mb-3 rounded-lg border border-amber-500/20 bg-amber-950/20 overflow-hidden">
                          <button
                            onClick={() =>
                              setExpandedTraceId(
                                expandedTraceId === msg.id ? null : msg.id
                              )
                            }
                            className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-mono text-amber-300 hover:bg-amber-900/30 transition-colors cursor-pointer"
                          >
                            <span className="flex items-center space-x-1.5">
                              <Brain className="w-3.5 h-3.5 text-amber-400" />
                              <span>Internal Reasoning Chain (Thought Trace)</span>
                            </span>
                            {expandedTraceId === msg.id ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                          {expandedTraceId === msg.id && (
                            <div className="px-3 py-2 border-t border-amber-500/20 text-[11px] font-mono text-amber-200/90 whitespace-pre-wrap bg-slate-950/70">
                              {thoughtContent}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Main Text Content */}
                      <div className="markdown-body text-xs leading-relaxed font-sans text-slate-200 space-y-2">
                        <Markdown>{cleanContent}</Markdown>
                      </div>

                      {/* Generated Image */}
                      {msg.imageUrl && (
                        <div className="mt-3">
                          <img src={msg.imageUrl} alt="Generated" className="rounded-lg shadow-sm max-w-full h-auto max-h-64 object-contain" />
                        </div>
                      )}
                      
                      {/* Loading Image State */}
                      {msg.imageLoading && (
                        <div className="mt-3 flex items-center space-x-2 text-indigo-400 text-[11px] bg-indigo-900/20 px-3 py-2 rounded-lg border border-indigo-500/20">
                          <Sparkles className="w-4 h-4 animate-spin" />
                          <span>Generating image using Diffusion Engine...</span>
                        </div>
                      )}

                      {/* Retrieved RAG Citations */}
                      {msg.metadata?.retrievedDocs && msg.metadata.retrievedDocs.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1.5">
                            Retrieved Domain Sources (BM25 RAG)
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.metadata.retrievedDocs.map((doc) => (
                              <span
                                key={doc.id}
                                title={doc.snippet}
                                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300"
                              >
                                <BookOpen className="w-2.5 h-2.5 text-indigo-400" />
                                <span className="truncate max-w-[160px]">{doc.title}</span>
                                <span className="text-emerald-400">({doc.score})</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Copy cURL Action for User Prompts */}
                    {isUser && (
                      <button
                        onClick={() => setActiveCurlModal(msg.content)}
                        className="text-[10px] font-mono text-slate-500 hover:text-indigo-300 transition-colors flex items-center space-x-1 mr-1 cursor-pointer"
                      >
                        <Code2 className="w-3 h-3" />
                        <span>View cURL</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}

            {isLoading && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs py-2 px-3 bg-slate-950/60 border border-slate-800/60 rounded-xl w-fit">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                <span className="font-mono">Synthesizing inference & multi-step execution...</span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/90 space-y-2">
            {/* Quick Polyglot Language Bar */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              <span className="text-slate-400 font-mono flex items-center space-x-1 shrink-0 mr-1">
                <Code2 className="w-3 h-3 text-indigo-400" />
                <span>Polyglot:</span>
              </span>
              {POLYGLOT_SNIPPETS.map((snippet, sIdx) => (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => {
                    setSelectedModel('nova-coder-v1');
                    setInputPrompt(snippet.prompt);
                  }}
                  className="px-2 py-0.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-white shrink-0 transition-all font-mono text-[10px] flex items-center space-x-1 cursor-pointer"
                >
                  <span>{snippet.icon}</span>
                  <span>{snippet.lang}</span>
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-end space-x-2"
            >
              <textarea
                id="playground-chat-input"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Message Nova Core AI (e.g. 'multiply whatever number I tell you in the next 2 messages and than add all the numbers together in the 3rd message and tell me what it is')..."
                rows={2}
                disabled={isLoading}
                className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans resize-none disabled:opacity-50"
              />

              <button
                id="send-chat-btn"
                type="submit"
                disabled={!inputPrompt.trim() || isLoading}
                className="h-11 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* cURL Inspection Modal */}
      {activeCurlModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-slate-100">OpenAI Compatible cURL Command</h3>
              </div>
              <button
                onClick={() => setActiveCurlModal(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Run this command from any external site, backend, or terminal with isolated user & chat session headers:
            </p>

            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-indigo-200 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {generateCurlSnippet(activeCurlModal)}
            </pre>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => handleCopyCurl(generateCurlSnippet(activeCurlModal))}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer"
              >
                {copiedCurl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCurl ? 'Copied' : 'Copy cURL'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


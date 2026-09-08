import {
  UserChatSession,
  UserChatMessage,
  LearnedFactUserInquiry,
  LearnedFactSelfLearning,
  DatabaseOverview,
  ExternalTrafficRecord,
  ExternalTrafficSummary,
} from './types.js';
import { firebaseService } from './firebaseService.js';

class ChatStore {
  // In-memory cache for ultra-low latency, synchronized with Firestore
  private sessionsMap: Map<string, Map<string, UserChatSession>> = new Map();
  private messagesMap: Map<string, UserChatMessage[]> = new Map();
  private userInquiryFacts: Map<string, LearnedFactUserInquiry> = new Map();
  private selfLearningFacts: Map<string, LearnedFactSelfLearning> = new Map();
  private externalTrafficMap: Map<string, ExternalTrafficRecord> = new Map();

  constructor() {
    this.seedDefaults();
    this.seedInitialExternalTraffic();
    this.syncFromFirebase();
  }

  private async syncFromFirebase() {
    if (!firebaseService.isConnected) return;
    try {
      const userFacts = await firebaseService.getLearnedFactsUserInquiries(100);
      userFacts.forEach((f) => this.userInquiryFacts.set(f.id, f));

      const selfFacts = await firebaseService.getLearnedFactsSelfLearning(100);
      selfFacts.forEach((f) => this.selfLearningFacts.set(f.id, f));

      const extTraffic = await firebaseService.getExternalTrafficRecords(100);
      extTraffic.forEach((t) => this.externalTrafficMap.set(t.id, t));
    } catch (err) {
      console.warn('[ChatStore] Error initial syncing from Firebase:', err);
    }
  }

  private seedInitialExternalTraffic() {
    const samples: ExternalTrafficRecord[] = [
      {
        id: 'ext-log-001',
        timestamp: Date.now() - 180000,
        originWebsite: 'https://jaxson-gemini-agent.vercel.app',
        clientSource: 'External Web Application (Cross-Origin)',
        endpoint: '/v1/chat/completions',
        method: 'POST',
        statusCode: 200,
        latencyMs: 142,
        model: 'nova-autonomous-v1',
        userId: 'client_user_production_88',
        chatId: 'thread_remote_901',
        userPrompt: 'Please explain how to implement zero-copy deserialization in Rust and whether we should use serde or rkyv.',
        assistantResponse: 'For zero-copy deserialization in high-throughput Rust services:\n\n1. rkyv provides true zero-copy access by reading directly from mapped byte buffers without memory allocations.\n2. serde requires allocating intermediate structs unless utilizing &str or borrowed byte slices with lifetimes.\n\nRecommendation: Use rkyv for read-heavy IPC/caches, and serde for public JSON/REST endpoints.',
        thoughtTrace: 'Analyzed query intent -> Detected Rust performance and serialization trade-offs -> Retrieved BM25 Rust memory paradigms.',
        promptTokens: 38,
        completionTokens: 114,
        clientIp: '198.51.100.42',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        isExternal: true,
      },
      {
        id: 'ext-log-002',
        timestamp: Date.now() - 540000,
        originWebsite: 'https://dev-dashboard.external-client.io',
        clientSource: 'Remote Frontend Dashboard',
        endpoint: '/v1/chat/completions',
        method: 'POST',
        statusCode: 200,
        latencyMs: 98,
        model: 'nova-coder-v1',
        userId: 'dev_engineer_44',
        chatId: 'session_code_review',
        userPrompt: 'Generate a thread-safe Go worker pool using sync.WaitGroup and channel cancellation contexts.',
        assistantResponse: 'To implement a thread-safe Go worker pool with context cancellation:\n\nCreate a WorkerPool function taking context.Context, input jobs channel, output results channel, and worker count. Each goroutine increments the sync.WaitGroup, runs a select loop on ctx.Done() and jobs, and defers wg.Done(). The master thread calls wg.Wait() and closes the results channel safely.',
        thoughtTrace: 'Synthesized concurrent Go concurrency pattern with context awareness and bounded buffered channels.',
        promptTokens: 26,
        completionTokens: 185,
        clientIp: '203.0.113.19',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/127.0.0.0',
        isExternal: true,
      },
    ];

    samples.forEach((s) => this.externalTrafficMap.set(s.id, s));
  }

  private seedDefaults() {
    const defaultUserId = 'default_user';
    const defaultChatId = 'session_main';

    const defaultSession: UserChatSession = {
      id: defaultChatId,
      userId: defaultUserId,
      title: 'General Nova Chat & Multi-Step Reasoning',
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now(),
      messageCount: 2,
      lastMessagePreview: 'Ready for multi-step instructions and queries.',
    };

    this.saveSessionInMemory(defaultSession);

    const welcomeMsg: UserChatMessage = {
      id: 'msg-welcome-1',
      chatId: defaultChatId,
      userId: defaultUserId,
      role: 'assistant',
      content: 'Welcome to Nova Core AI! I support stateful multi-step instruction tracking, per-user persistent memory, and dual knowledge distillation. How can I assist you today?',
      timestamp: Date.now() - 3600000,
      model: 'nova-reasoner-v1',
    };
    this.saveMessageInMemory(welcomeMsg);

    // Seed some initial user inquiry facts
    const initialUserFact: LearnedFactUserInquiry = {
      id: 'fact-ui-1',
      text: 'User inquiries in distributed systems require strict linearizability verification and idempotency keys across state snapshots.',
      category: 'domain_knowledge',
      tags: ['distributed_systems', 'user_inquiry', 'idempotency'],
      sourceUserId: 'user_alex',
      sourceChatId: 'chat_arch_review',
      confidence: 0.96,
      timestamp: Date.now() - 7200000,
    };
    this.userInquiryFacts.set(initialUserFact.id, initialUserFact);
  }

  private saveSessionInMemory(session: UserChatSession) {
    if (!this.sessionsMap.has(session.userId)) {
      this.sessionsMap.set(session.userId, new Map());
    }
    this.sessionsMap.get(session.userId)!.set(session.id, session);
  }

  private saveMessageInMemory(msg: UserChatMessage) {
    const key = `${msg.userId}:::${msg.chatId}`;
    if (!this.messagesMap.has(key)) {
      this.messagesMap.set(key, []);
    }
    const list = this.messagesMap.get(key)!;
    const existingIdx = list.findIndex((m) => m.id === msg.id);
    if (existingIdx >= 0) {
      list[existingIdx] = msg;
    } else {
      list.push(msg);
    }
  }

  // --- USER CHAT SESSIONS ---
  public async getSessions(userId: string): Promise<UserChatSession[]> {
    // Check in-memory first
    const memoryUserMap = this.sessionsMap.get(userId);
    let list: UserChatSession[] = memoryUserMap ? Array.from(memoryUserMap.values()) : [];

    // Also fetch from Firebase if available
    if (firebaseService.isConnected) {
      const dbSessions = await firebaseService.getChatSessions(userId);
      dbSessions.forEach((s) => {
        this.saveSessionInMemory(s);
      });
      list = Array.from((this.sessionsMap.get(userId) || new Map()).values());
    }

    // If still empty, create default chat
    if (list.length === 0) {
      const newSession: UserChatSession = {
        id: `chat_${Date.now().toString(36)}`,
        userId,
        title: 'New Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 0,
        lastMessagePreview: 'No messages yet.',
      };
      await this.saveSession(newSession);
      return [newSession];
    }

    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public async getSession(userId: string, chatId: string): Promise<UserChatSession | null> {
    const userMap = this.sessionsMap.get(userId);
    if (userMap && userMap.has(chatId)) {
      return userMap.get(chatId)!;
    }

    if (firebaseService.isConnected) {
      const fromDb = await firebaseService.getChatSession(userId, chatId);
      if (fromDb) {
        this.saveSessionInMemory(fromDb);
        return fromDb;
      }
    }

    return null;
  }

  public async saveSession(session: UserChatSession): Promise<void> {
    session.updatedAt = Date.now();
    this.saveSessionInMemory(session);
    await firebaseService.saveChatSession(session);
  }

  public async createSession(userId: string, title = 'New Conversation'): Promise<UserChatSession> {
    const session: UserChatSession = {
      id: `chat_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 0,
      lastMessagePreview: 'Started new conversation session.',
    };
    await this.saveSession(session);
    return session;
  }

  public async deleteSession(userId: string, chatId: string): Promise<void> {
    const userMap = this.sessionsMap.get(userId);
    if (userMap) {
      userMap.delete(chatId);
    }
    const key = `${userId}:::${chatId}`;
    this.messagesMap.delete(key);
    await firebaseService.deleteChatSession(userId, chatId);
  }

  // --- MESSAGES ---
  public async getMessages(userId: string, chatId: string): Promise<UserChatMessage[]> {
    const key = `${userId}:::${chatId}`;
    let list = this.messagesMap.get(key) || [];

    if (firebaseService.isConnected) {
      const dbMsgs = await firebaseService.getChatMessages(userId, chatId);
      if (dbMsgs.length > 0) {
        dbMsgs.forEach((m) => this.saveMessageInMemory(m));
        list = this.messagesMap.get(key) || [];
      }
    }

    return list.sort((a, b) => a.timestamp - b.timestamp);
  }

  public async addMessage(msg: UserChatMessage): Promise<void> {
    this.saveMessageInMemory(msg);
    await firebaseService.saveChatMessage(msg);

    // Update session preview and message count
    const session = await this.getSession(msg.userId, msg.chatId);
    if (session) {
      session.messageCount = (this.messagesMap.get(`${msg.userId}:::${msg.chatId}`) || []).length;
      session.lastMessagePreview = msg.content.substring(0, 80);
      session.updatedAt = Date.now();
      await this.saveSession(session);
    }

    // Automatically distill facts from user questions into the user inquiries database
    if (msg.role === 'user') {
      this.distillUserInquiryFact(msg);
    }
  }

  // --- KNOWLEDGE EXTRACTION FROM USER INQUIRIES ---
  private distillUserInquiryFact(msg: UserChatMessage) {
    const text = msg.content.trim();
    if (text.length < 15) return;

    // Detect if user is sharing knowledge, technical context, preference, or domain question
    const lower = text.toLowerCase();
    let category = 'user_inquiry';
    const tags: string[] = ['user_interaction'];

    if (lower.includes('i prefer') || lower.includes('my stack') || lower.includes('we use')) {
      category = 'user_preference';
      tags.push('preference', 'tech_stack');
    } else if (lower.includes('in our system') || lower.includes('our architecture') || lower.includes('our database')) {
      category = 'system_architecture';
      tags.push('architecture', 'client_infra');
    } else if (lower.includes('algorithm') || lower.includes('formula') || lower.includes('multiply') || lower.includes('compute')) {
      category = 'algorithmic_inquiry';
      tags.push('computation', 'logic');
    } else {
      category = 'domain_knowledge';
      tags.push('inquiry_concept');
    }

    const fact: LearnedFactUserInquiry = {
      id: `fact-ui-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: `User Query Context (${msg.userId}): "${text.length > 200 ? text.substring(0, 197) + '...' : text}"`,
      category,
      tags,
      sourceUserId: msg.userId,
      sourceChatId: msg.chatId,
      confidence: 0.9,
      timestamp: Date.now(),
    };

    this.userInquiryFacts.set(fact.id, fact);
    firebaseService.saveLearnedFactUserInquiry(fact).catch(() => {});
  }

  // --- KNOWLEDGE DISTILLED FROM SELF-LEARNING ---
  public async addSelfLearningFact(fact: LearnedFactSelfLearning): Promise<void> {
    this.selfLearningFacts.set(fact.id, fact);
    await firebaseService.saveLearnedFactSelfLearning(fact);
  }

  public getLearnedFactsUserInquiries(): LearnedFactUserInquiry[] {
    return Array.from(this.userInquiryFacts.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  public getLearnedFactsSelfLearning(): LearnedFactSelfLearning[] {
    return Array.from(this.selfLearningFacts.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  // --- DATABASE OVERVIEW ---
  public getDatabaseOverview(): DatabaseOverview {
    let totalMessages = 0;
    this.messagesMap.forEach((list) => {
      totalMessages += list.length;
    });

    let totalSessions = 0;
    this.sessionsMap.forEach((userMap) => {
      totalSessions += userMap.size;
    });

    return {
      connected: firebaseService.isConnected,
      projectId: firebaseService.config?.projectId || 'gemini-project-500800',
      databaseId: firebaseService.config?.firestoreDatabaseId || 'ai-studio-novacoreai-00f965b8-2aa4-4086-aed0-0d19b09d0107',
      userChatsCount: totalSessions,
      messagesCount: totalMessages,
      activeInstructionsCount: 0,
      userInquiryFactsCount: this.userInquiryFacts.size,
      selfLearningFactsCount: this.selfLearningFacts.size,
      externalTrafficCount: this.externalTrafficMap.size,
      collections: [
        'users/{userId}/chats/{chatId}',
        'users/{userId}/chats/{chatId}/messages',
        'users/{userId}/instructions/{instructionId}',
        'learned_facts_user_inquiries',
        'learned_facts_self_learning',
        'external_traffic',
      ],
    };
  }

  // --- EXTERNAL TRAFFIC METHODS ---
  public async addExternalTrafficRecord(record: ExternalTrafficRecord): Promise<void> {
    this.externalTrafficMap.set(record.id, record);
    if (this.externalTrafficMap.size > 250) {
      const oldestKey = Array.from(this.externalTrafficMap.keys())[0];
      if (oldestKey) this.externalTrafficMap.delete(oldestKey);
    }
    await firebaseService.saveExternalTrafficRecord(record);
  }

  public getExternalTraffic(limit = 100): ExternalTrafficRecord[] {
    return Array.from(this.externalTrafficMap.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  public getExternalTrafficSummary(): ExternalTrafficSummary {
    const records = Array.from(this.externalTrafficMap.values()).sort((a, b) => b.timestamp - a.timestamp);
    const originsMap = new Map<string, { callsCount: number; lastSeen: number; samplePrompt: string }>();

    let totalLatency = 0;
    let totalTokens = 0;

    for (const r of records) {
      totalLatency += r.latencyMs || 0;
      totalTokens += (r.promptTokens || 0) + (r.completionTokens || 0);

      const orig = r.originWebsite || 'Unknown External Client';
      if (!originsMap.has(orig)) {
        originsMap.set(orig, {
          callsCount: 1,
          lastSeen: r.timestamp,
          samplePrompt: r.userPrompt,
        });
      } else {
        const entry = originsMap.get(orig)!;
        entry.callsCount += 1;
        if (r.timestamp > entry.lastSeen) {
          entry.lastSeen = r.timestamp;
          entry.samplePrompt = r.userPrompt;
        }
      }
    }

    const originsList = Array.from(originsMap.entries()).map(([origin, stats]) => ({
      origin,
      callsCount: stats.callsCount,
      lastSeen: stats.lastSeen,
      samplePrompt: stats.samplePrompt,
    })).sort((a, b) => b.callsCount - a.callsCount);

    const topWebsites = originsList.map((item) => ({
      origin: item.origin,
      count: item.callsCount,
      lastSeen: item.lastSeen,
      samplePrompt: item.samplePrompt,
    }));

    const avgLatencyMs = records.length > 0 ? Math.round(totalLatency / records.length) : 0;

    return {
      totalRequests: records.length,
      totalCalls: records.length,
      uniqueWebsitesCount: originsMap.size,
      uniqueOriginsCount: originsMap.size,
      avgLatencyMs,
      totalTokensProcessed: totalTokens,
      topWebsites,
      origins: originsList,
      recentRecords: records.slice(0, 50),
    };
  }

  public clearExternalTraffic(): void {
    this.externalTrafficMap.clear();
  }
}

export const chatStore = new ChatStore();

import React, { useState, useEffect } from 'react';
import {
  Database,
  Users,
  Brain,
  Sparkles,
  Layers,
  Search,
  RefreshCw,
  Clock,
  Shield,
  MessageSquare,
  Calculator,
  CheckCircle2,
  Tag,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';
import {
  DatabaseOverview,
  LearnedFactUserInquiry,
  LearnedFactSelfLearning,
  UserChatSession,
  UserChatMessage,
  MultiStepInstruction,
} from '../types.js';

export const DatabaseTab: React.FC = () => {
  const [overview, setOverview] = useState<DatabaseOverview | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<
    'dual_knowledge' | 'user_chats' | 'instructions' | 'firestore_schema'
  >('dual_knowledge');

  const [userInquiryFacts, setUserInquiryFacts] = useState<LearnedFactUserInquiry[]>([]);
  const [selfLearningFacts, setSelfLearningFacts] = useState<LearnedFactSelfLearning[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('default_user');
  const [userChats, setUserChats] = useState<UserChatSession[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<UserChatMessage[]>([]);
  const [userInstructions, setUserInstructions] = useState<MultiStepInstruction[]>([]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [knowledgeFilter, setKnowledgeFilter] = useState<'all' | 'user_inquiries' | 'self_learning'>('all');

  const fetchDatabaseData = async () => {
    setIsLoading(true);
    try {
      const [overviewRes, userFactsRes, selfFactsRes, chatsRes, instructionsRes] = await Promise.all([
        fetch('/v1/database/overview').catch(() => null),
        fetch('/v1/knowledge/user-inquiries').catch(() => null),
        fetch('/v1/knowledge/self-learning').catch(() => null),
        fetch(`/v1/users/${selectedUserId}/chats`).catch(() => null),
        fetch(`/v1/users/${selectedUserId}/instructions`).catch(() => null),
      ]);

      if (overviewRes && overviewRes.ok) {
        setOverview(await overviewRes.json());
      }
      if (userFactsRes && userFactsRes.ok) {
        const data = await userFactsRes.json();
        setUserInquiryFacts(data.facts || []);
      }
      if (selfFactsRes && selfFactsRes.ok) {
        const data = await selfFactsRes.json();
        setSelfLearningFacts(data.facts || []);
      }
      if (chatsRes && chatsRes.ok) {
        const data = await chatsRes.json();
        const list = data.chats || [];
        setUserChats(list);
        if (list.length > 0 && !selectedChatId) {
          setSelectedChatId(list[0].id);
        }
      }
      if (instructionsRes && instructionsRes.ok) {
        const data = await instructionsRes.json();
        setUserInstructions(data.instructions || []);
      }
    } catch (err) {
      console.error('Error fetching database information:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseData();
    const interval = setInterval(fetchDatabaseData, 6000);
    return () => clearInterval(interval);
  }, [selectedUserId]);

  useEffect(() => {
    if (!selectedChatId) return;
    const fetchChatMessages = async () => {
      try {
        const res = await fetch(`/v1/users/${selectedUserId}/chats/${selectedChatId}`);
        if (res.ok) {
          const data = await res.json();
          setChatMessages(data.messages || []);
        }
      } catch (err) {
        console.error('Error fetching chat messages:', err);
      }
    };
    fetchChatMessages();
  }, [selectedUserId, selectedChatId]);

  const filteredUserFacts = userInquiryFacts.filter((f) =>
    searchQuery
      ? f.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      : true
  );

  const filteredSelfFacts = selfLearningFacts.filter((f) =>
    searchQuery
      ? f.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      : true
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner: Architecture & Dual Database Summary */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-semibold text-slate-100">
                  Firebase Persistent Multi-Tenant & Dual Knowledge Repositories
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 rounded">
                  Firestore Connected
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Independent per-user chat partitions alongside dual knowledge stores: One for user inquiries & one for autonomous self-learning.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchDatabaseData}
              disabled={isLoading}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
              <span>Sync Firestore</span>
            </button>
          </div>
        </div>

        {/* Database Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3">
            <span className="text-[11px] text-slate-400 font-mono block flex items-center space-x-1">
              <Users className="w-3 h-3 text-indigo-400" />
              <span>Per-User Chats</span>
            </span>
            <span className="text-lg font-bold font-mono text-slate-100">
              {overview?.userChatsCount ?? userChats.length}
            </span>
            <span className="text-[10px] text-slate-500 block font-mono">Isolated by userId</span>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3">
            <span className="text-[11px] text-slate-400 font-mono block flex items-center space-x-1">
              <MessageSquare className="w-3 h-3 text-emerald-400" />
              <span>User Inquiries Facts</span>
            </span>
            <span className="text-lg font-bold font-mono text-emerald-400">
              {userInquiryFacts.length}
            </span>
            <span className="text-[10px] text-slate-500 block font-mono">Distilled from what people ask</span>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3">
            <span className="text-[11px] text-slate-400 font-mono block flex items-center space-x-1">
              <Brain className="w-3 h-3 text-purple-400" />
              <span>Self-Learning Axioms</span>
            </span>
            <span className="text-lg font-bold font-mono text-purple-400">
              {selfLearningFacts.length}
            </span>
            <span className="text-[10px] text-slate-500 block font-mono">Distilled from self-inquiry</span>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3">
            <span className="text-[11px] text-slate-400 font-mono block flex items-center space-x-1">
              <Calculator className="w-3 h-3 text-amber-400" />
              <span>Multi-Step State Machines</span>
            </span>
            <span className="text-lg font-bold font-mono text-amber-400">
              {userInstructions.length}
            </span>
            <span className="text-[10px] text-slate-500 block font-mono">Accumulators & trackers</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800">
        <div className="flex space-x-2">
          {[
            { id: 'dual_knowledge', label: 'Dual Knowledge Databases', icon: Brain },
            { id: 'user_chats', label: 'Per-User Chat History', icon: Users },
            { id: 'instructions', label: 'Multi-Step Instructions Engine', icon: Calculator },
            { id: 'firestore_schema', label: 'Firestore Collections & Schema', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`db-subtab-${tab.id}`}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-indigo-500 text-indigo-300 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. DUAL KNOWLEDGE DATABASES VIEW */}
      {activeSubTab === 'dual_knowledge' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search distilled facts, tags, or concepts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center space-x-1.5 w-full sm:w-auto justify-end">
              <span className="text-[11px] text-slate-400 flex items-center mr-1">
                <Filter className="w-3 h-3 mr-1" /> View:
              </span>
              {[
                { id: 'all', label: 'All Databases' },
                { id: 'user_inquiries', label: 'User Inquiries' },
                { id: 'self_learning', label: 'Self-Learning' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setKnowledgeFilter(btn.id as any)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
                    knowledgeFilter === btn.id
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Database A: User Inquiries Distillation */}
            {(knowledgeFilter === 'all' || knowledgeFilter === 'user_inquiries') && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-slate-200">
                      Database A: Distilled from User Inquiries
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                    {filteredUserFacts.length} facts
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Global repository capturing domain context, system constraints, and logic formulas extracted from what everyone asks Nova across all chat channels.
                </p>

                <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
                  {filteredUserFacts.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500 font-mono">
                      No user inquiry facts found matching query.
                    </div>
                  ) : (
                    filteredUserFacts.map((fact) => (
                      <div
                        key={fact.id}
                        className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg space-y-2 hover:border-emerald-500/40 transition-colors"
                      >
                        <p className="text-xs text-slate-200 leading-relaxed font-sans">{fact.text}</p>
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-850">
                          <span className="text-emerald-400">User: {fact.sourceUserId}</span>
                          <span>Category: {fact.category}</span>
                          <span className="text-slate-500">
                            {new Date(fact.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        {fact.tags && fact.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {fact.tags.map((t) => (
                              <span
                                key={t}
                                className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Database B: Autonomous Self-Learning Distillation */}
            {(knowledgeFilter === 'all' || knowledgeFilter === 'self_learning') && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-semibold text-slate-200">
                      Database B: Distilled from Autonomous Self-Learning
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-purple-400 bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 rounded">
                    {filteredSelfFacts.length} axioms
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Global repository of fundamental architectural axioms, algorithmic truths, and engineering proofs generated by Nova asking itself questions in recursive background loops.
                </p>

                <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
                  {filteredSelfFacts.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500 font-mono">
                      No self-learning axioms found matching query.
                    </div>
                  ) : (
                    filteredSelfFacts.map((fact) => (
                      <div
                        key={fact.id}
                        className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg space-y-2 hover:border-purple-500/40 transition-colors"
                      >
                        <p className="text-xs text-slate-200 leading-relaxed font-sans">{fact.text}</p>
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-850">
                          <span className="text-purple-300">Cycle #{fact.cycleNumber}</span>
                          <span className="text-slate-400">{fact.domain}</span>
                          <span className="text-emerald-400">Conf: {(fact.confidence * 100).toFixed(0)}%</span>
                        </div>
                        {fact.tags && fact.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {fact.tags.map((t) => (
                              <span
                                key={t}
                                className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. PER-USER CHAT HISTORY VIEW */}
      {activeSubTab === 'user_chats' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* User Persona & Sessions Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Select User Persona</span>
                </span>
              </div>

              <div className="space-y-1.5">
                {[
                  { id: 'default_user', label: 'Default User (General)' },
                  { id: 'user_alex', label: 'User Alex (Distributed Systems)' },
                  { id: 'user_sarah', label: 'User Sarah (Math & Logic)' },
                  { id: 'api_client_1', label: 'External Site API Client 1' },
                ].map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setSelectedUserId(u.id);
                      setSelectedChatId('');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer flex items-center justify-between ${
                      selectedUserId === u.id
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/50'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <span>{u.label}</span>
                    <span className="text-[10px] text-slate-500">({u.id})</span>
                  </button>
                ))}
              </div>

              {/* Custom User ID Input */}
              <div className="pt-2 border-t border-slate-800">
                <label className="text-[11px] text-slate-400 block mb-1">Or Enter Custom User ID:</label>
                <input
                  type="text"
                  placeholder="e.g. customer_9482"
                  value={selectedUserId}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value);
                    setSelectedChatId('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Chat Sessions for Selected User */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs font-semibold text-slate-200">
                  Chat Sessions for &quot;{selectedUserId}&quot;
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {userChats.length} chats
                </span>
              </div>

              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {userChats.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-500 font-mono">
                    No active chat threads for this user.
                  </div>
                ) : (
                  userChats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => setSelectedChatId(chat.id)}
                      className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors cursor-pointer border ${
                        selectedChatId === chat.id
                          ? 'bg-indigo-600/20 border-indigo-500/50 text-slate-100'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                        <span className="font-semibold truncate max-w-[160px] text-indigo-300">
                          {chat.title}
                        </span>
                        <span className="text-slate-500">{chat.messageCount} msgs</span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate font-sans">
                        {chat.lastMessagePreview || 'Session started'}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Chat Messages Inspector */}
          <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col h-[650px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-200">
                  Firestore Partition: users/{selectedUserId}/chats/{selectedChatId || '...'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                {chatMessages.length} Messages Persisted
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 font-mono text-xs">
                  Select a chat session or send a message with user_id=&quot;{selectedUserId}&quot; to inspect isolated message storage.
                </div>
              ) : (
                chatMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-lg text-xs leading-relaxed space-y-1.5 border ${
                      m.role === 'user'
                        ? 'bg-slate-950 border-slate-800 text-slate-200'
                        : 'bg-indigo-950/30 border-indigo-500/30 text-indigo-100'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                      <span className="font-semibold uppercase tracking-wider">
                        {m.role === 'user' ? `User (${m.userId})` : 'Nova Assistant'}
                      </span>
                      <span>{new Date(m.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="font-sans whitespace-pre-wrap">{m.content}</p>

                    {m.instructionExecution && (
                      <div className="mt-2 p-2 bg-amber-950/30 border border-amber-500/40 rounded text-[11px] font-mono text-amber-300">
                        ⚡ Step {m.instructionExecution.stepNumber}/{m.instructionExecution.totalSteps}:{' '}
                        {m.instructionExecution.summary}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. MULTI-STEP INSTRUCTIONS STATE MACHINE VIEW */}
      {activeSubTab === 'instructions' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Calculator className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-100">
                Multi-Step Instruction State Engine
              </h3>
            </div>
            <span className="text-xs font-mono text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded border border-amber-800/40">
              Pattern: Multiply 2 messages & Add 3rd message
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            The Nova Instruction Engine allows external sites and users to issue complex multi-turn stateful directives.
            The engine stores step state in Firestore under <code className="font-mono text-amber-300">users/{'{userId}'}/instructions</code>,
            accumulates values across turns, and resolves the final result automatically on completion.
          </p>

          <div className="space-y-4">
            {userInstructions.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <Calculator className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-300 font-medium">No Multi-Step Instructions Recorded Yet</p>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  Try issuing an instruction in the API Playground:
                  <br />
                  <span className="italic text-indigo-300 font-mono">
                    &quot;multiply whatever number I tell you in the next 2 messages and than add all the numbers together in the 3rd message and tell me what it is&quot;
                  </span>
                </p>
              </div>
            ) : (
              userInstructions.map((inst) => (
                <div
                  key={inst.id}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold font-mono text-slate-200">
                        ID: {inst.id}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                          inst.status === 'completed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : inst.status === 'active'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {inst.status.toUpperCase()} (Step {inst.currentStep}/{inst.totalRequiredSteps})
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      User: {inst.userId} &bull; Chat: {inst.chatId}
                    </span>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded-lg text-xs font-mono text-indigo-300">
                    &quot;{inst.rawInstruction}&quot;
                  </div>

                  {/* Step History Breakdown */}
                  {inst.stepHistory && inst.stepHistory.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[11px] font-semibold text-slate-400 block font-mono">
                        Step-by-Step State Tracking:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {inst.stepHistory.map((step) => (
                          <div
                            key={step.step}
                            className="p-2 bg-slate-900/80 border border-slate-800 rounded text-[11px] font-mono space-y-1"
                          >
                            <span className="text-amber-400 font-bold block">
                              Step {step.step}: Input &quot;{step.input}&quot;
                            </span>
                            <span className="text-slate-300 block">{step.stepOutput}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {inst.finalResult && (
                    <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/40 rounded-lg text-xs font-mono text-emerald-300">
                      <strong>Final Output:</strong> {inst.finalResult}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. FIRESTORE COLLECTIONS & SCHEMA VIEW */}
      {activeSubTab === 'firestore_schema' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Live Cloud Firestore Collections Layout
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <span className="text-indigo-400 font-bold block">
                1. Multi-Tenant Chat Partitions
              </span>
              <p className="text-slate-400 text-[11px]">
                <code>users/{'{userId}'}/chats/{'{chatId}'}</code>
                <br />
                <code>users/{'{userId}'}/chats/{'{chatId}'}/messages/{'{msgId}'}</code>
              </p>
              <p className="text-slate-500 text-[11px] font-sans">
                Guarantees complete isolation across different users and independent chat threads.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <span className="text-amber-400 font-bold block">
                2. Stateful Multi-Step Instructions
              </span>
              <p className="text-slate-400 text-[11px]">
                <code>users/{'{userId}'}/instructions/{'{instructionId}'}</code>
              </p>
              <p className="text-slate-500 text-[11px] font-sans">
                Maintains multi-turn state machines (e.g. multiply 2 messages then add 3rd).
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <span className="text-emerald-400 font-bold block">
                3. Global User Inquiries Knowledge
              </span>
              <p className="text-slate-400 text-[11px]">
                <code>learned_facts_user_inquiries/{'{factId}'}</code>
              </p>
              <p className="text-slate-500 text-[11px] font-sans">
                Distills domain knowledge, system setups, and questions asked by all users.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <span className="text-purple-400 font-bold block">
                4. Autonomous Self-Learning Axioms
              </span>
              <p className="text-slate-400 text-[11px]">
                <code>learned_facts_self_learning/{'{factId}'}</code>
              </p>
              <p className="text-slate-500 text-[11px] font-sans">
                Stores truths discovered during background self-questioning cycles.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  Radio,
  ExternalLink,
  RefreshCw,
  Trash2,
  Send,
  Sparkles,
  Search,
  Check,
  Copy,
  Terminal,
  Activity,
  Code2,
  Clock,
  Laptop,
  Cpu,
  Eye,
  Filter,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { ExternalTrafficRecord, ExternalTrafficSummary } from '../types.js';

const QUICK_PRESETS = [
  {
    origin: 'https://jaxson-gemini-agent.vercel.app',
    label: 'Jaxson Agent App (Llama 3.3 70B)',
    prompt: 'Give me the latest update on quantum error correction in topological qubits.',
    model: 'meta-llama/Llama-3.3-70B-Instruct',
  },
  {
    origin: 'https://jaxson-gemini-agent.vercel.app',
    label: 'Jaxson Agent App (Nova Autonomous)',
    prompt: 'Synthesize a high-throughput architectural blueprint for an autonomous agent mesh.',
    model: 'nova-autonomous-v1',
  },
  {
    origin: 'https://code-assistant-portal.dev',
    label: 'Developer Code Portal',
    prompt: 'Write a zero-allocation circular buffer in Zig with comptime capacity and thread safety.',
    model: 'nova-coder-v1',
  },
  {
    origin: 'http://localhost:5173',
    label: 'Local Dev React App',
    prompt: 'Explain how async event loops work in V8 engine.',
    model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
  },
];

export const ExternalTrafficTab: React.FC = () => {
  const [records, setRecords] = useState<ExternalTrafficRecord[]>([]);
  const [summary, setSummary] = useState<ExternalTrafficSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOriginFilter, setSelectedOriginFilter] = useState<string>('ALL');

  // Simulation Form State
  const [simOrigin, setSimOrigin] = useState<string>('https://jaxson-gemini-agent.vercel.app');
  const [simPrompt, setSimPrompt] = useState<string>('How does Nova Core ensure low latency across multi-turn reasoning?');
  const [simModel, setSimModel] = useState<string>('nova-autonomous-v1');
  const [simUserId, setSimUserId] = useState<string>('external_user_jaxson');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<ExternalTrafficRecord | null>(null);

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [activeSnippetTab, setActiveSnippetTab] = useState<'fetch' | 'openai' | 'curl'>('fetch');

  const fetchExternalTraffic = useCallback(async () => {
    try {
      const res = await fetch('/v1/external-traffic?limit=100');
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error('Failed to fetch external traffic:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExternalTraffic();
    let interval: any = null;
    if (autoRefresh) {
      interval = setInterval(fetchExternalTraffic, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchExternalTraffic, autoRefresh]);

  const handleClearLogs = async () => {
    if (!window.confirm('Clear all external website traffic logs?')) return;
    try {
      await fetch('/v1/external-traffic', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer nova-sk-live-alpha' },
      });
      fetchExternalTraffic();
    } catch (err) {
      console.error('Failed to clear external traffic:', err);
    }
  };

  const handleSimulateRequest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!simPrompt.trim() || !simOrigin.trim() || isSimulating) return;

    setIsSimulating(true);
    setSimulationResult(null);

    try {
      const res = await fetch('/v1/external-traffic/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer nova-sk-live-alpha',
        },
        body: JSON.stringify({
          originWebsite: simOrigin.trim(),
          prompt: simPrompt.trim(),
          model: simModel,
          userId: simUserId.trim() || 'external_user',
          chatId: `ext_chat_${Date.now().toString(36)}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSimulationResult(data.record);
        fetchExternalTraffic();
      } else {
        const err = await res.json();
        alert(`Simulation error: ${err.error?.message || 'Failed'}`);
      }
    } catch (err: any) {
      alert(`Simulation error: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopySnippet = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(key);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  // Filter records
  const filteredRecords = records.filter((r) => {
    const matchesOrigin =
      selectedOriginFilter === 'ALL' || r.originWebsite === selectedOriginFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.originWebsite.toLowerCase().includes(q) ||
      r.userPrompt.toLowerCase().includes(q) ||
      r.assistantResponse.toLowerCase().includes(q) ||
      r.userId.toLowerCase().includes(q) ||
      r.model.toLowerCase().includes(q);
    return matchesOrigin && matchesSearch;
  });

  const liveBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.run.app';

  const codeSnippets = {
    fetch: `// 1. External Web App (JavaScript / TypeScript fetch)
// Calling your Nova Core backend as an AI Provider from your other website!
const response = await fetch('${liveBaseUrl}/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer nova-sk-live-alpha',
    'X-Origin-Website': window.location.origin, // e.g. https://jaxson-gemini-agent.vercel.app
    'X-User-Id': 'user_123',
  },
  body: JSON.stringify({
    // Choose either Meta Llama 3.3 70B, Llama 3.1 8B, or Nova Autonomous
    model: 'meta-llama/Llama-3.3-70B-Instruct', 
    messages: [
      { role: 'user', content: 'Synthesize a high-throughput architectural blueprint.' }
    ],
    temperature: 0.7
  })
});
const data = await response.json();
console.log('Nova Core response:', data.choices[0].message.content);`,

    openai: `# 2. Python OpenAI SDK (from any remote backend or server)
from openai import OpenAI

client = OpenAI(
    base_url="${liveBaseUrl}/v1",
    api_key="nova-sk-live-alpha",
    default_headers={
        "X-Origin-Website": "https://jaxson-gemini-agent.vercel.app",
        "X-User-Id": "remote_python_agent"
    }
)

completion = client.chat.completions.create(
    model="meta-llama/Llama-3.3-70B-Instruct",
    messages=[
        {"role": "user", "content": "Explain memory barriers and acquire-release semantics."}
    ]
)
print("Llama 3.3 via Nova Core responded:", completion.choices[0].message.content)`,

    curl: `# 3. cURL CLI (Direct from any external server / machine)
curl -X POST ${liveBaseUrl}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer nova-sk-live-alpha" \\
  -H "X-Origin-Website: https://jaxson-gemini-agent.vercel.app" \\
  -d '{
    "model": "meta-llama/Llama-3.3-70B-Instruct",
    "messages": [
      {"role": "user", "content": "Explain memory barriers and acquire-release semantics."}
    ]
  }'`,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner & Stats */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                <Globe className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                External Website & Cross-Platform Usage Tracking
                <span className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-mono font-medium rounded-full bg-emerald-950/70 border border-emerald-800/60 text-emerald-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Live Remote Sentinel
                </span>
              </h2>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
              Real-time monitoring of all external websites, mobile apps, and remote microservices querying Nova Core AI.
              Inspect exactly <strong>which website called Nova Core</strong>, <strong>what question was asked</strong>, and <strong>what Nova Core responded with</strong> in real time.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="toggle-auto-refresh-btn"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                autoRefresh
                  ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${autoRefresh ? 'text-emerald-400 animate-pulse' : ''}`} />
              <span>{autoRefresh ? 'Live Streaming: ON' : 'Live Streaming: OFF'}</span>
            </button>

            <button
              id="refresh-external-traffic-btn"
              onClick={fetchExternalTraffic}
              disabled={isLoading}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              id="clear-external-traffic-btn"
              onClick={handleClearLogs}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 text-xs font-medium transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Logs</span>
            </button>
          </div>
        </div>

        {/* Aggregate Stats Cards */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Total External Calls</span>
              <p className="text-xl font-bold font-mono text-indigo-300 mt-0.5">{summary.totalRequests}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Unique Remote Domains</span>
              <p className="text-xl font-bold font-mono text-emerald-300 mt-0.5">{summary.uniqueWebsitesCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Avg Response Time</span>
              <p className="text-xl font-bold font-mono text-purple-300 mt-0.5">{summary.avgLatencyMs}ms</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Total Tokens Streamed</span>
              <p className="text-xl font-bold font-mono text-amber-300 mt-0.5">{summary.totalTokensProcessed.toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>

      {/* Interactive External Website Simulation Sandbox */}
      <div className="bg-slate-900/90 border border-indigo-900/40 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Laptop className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Interactive External Website Sandbox & Tester</h3>
          </div>
          <span className="text-xs text-indigo-300 font-mono bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/50">
            Simulate Cross-Origin Calls
          </span>
        </div>

        {/* Presets */}
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mr-1">
            <Sparkles className="w-3 h-3 text-indigo-400" /> Quick Presets:
          </span>
          {QUICK_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              id={`preset-btn-${idx}`}
              onClick={() => {
                setSimOrigin(preset.origin);
                setSimPrompt(preset.prompt);
                setSimModel(preset.model);
              }}
              className="px-2.5 py-1 text-[11px] font-mono rounded-md bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSimulateRequest} className="mt-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                External Website URL / Origin Domain
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={simOrigin}
                  onChange={(e) => setSimOrigin(e.target.value)}
                  placeholder="https://my-external-site.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Simulated Remote User ID
              </label>
              <input
                type="text"
                value={simUserId}
                onChange={(e) => setSimUserId(e.target.value)}
                placeholder="external_user_jaxson"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Target Nova Model
              </label>
              <select
                value={simModel}
                onChange={(e) => setSimModel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="meta-llama/Llama-3.3-70B-Instruct">meta-llama/Llama-3.3-70B-Instruct (Meta Llama 3.3 70B)</option>
                <option value="meta-llama/Meta-Llama-3.1-8B-Instruct">meta-llama/Meta-Llama-3.1-8B-Instruct (Meta Llama 3.1 8B)</option>
                <option value="nova-autonomous-v1">nova-autonomous-v1 (Autonomous Reasoning)</option>
                <option value="nova-coder-v1">nova-coder-v1 (Polyglot Engineering)</option>
                <option value="nova-reasoner-v1">nova-reasoner-v1 (Step-by-Step Logic)</option>
                <option value="nova-instruction-engine">nova-instruction-engine (Multi-step)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              User Prompt Sent From The Other Website
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={simPrompt}
                onChange={(e) => setSimPrompt(e.target.value)}
                placeholder="Ask Nova Core something from this external website..."
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              />
              <button
                type="submit"
                id="execute-external-sim-btn"
                disabled={isSimulating || !simPrompt.trim() || !simOrigin.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer shadow-md"
              >
                {isSimulating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{isSimulating ? 'Sending...' : 'Send From Other Website'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Immediate Result Card if simulated */}
        {simulationResult && (
          <div className="mt-4 p-4 rounded-lg bg-emerald-950/30 border border-emerald-800/50 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                Successfully Simulated & Logged Remote Request from {simulationResult.originWebsite}
              </span>
              <span className="text-[11px] font-mono text-emerald-300">
                Latency: {simulationResult.latencyMs}ms | Tokens: {simulationResult.promptTokens + simulationResult.completionTokens}
              </span>
            </div>
            <div className="text-xs text-slate-200 bg-slate-950/80 p-3 rounded-lg border border-slate-800">
              <p className="font-semibold text-indigo-300 text-[11px] uppercase tracking-wider mb-1 font-mono">
                🤖 Nova Core's Response to {simulationResult.originWebsite}:
              </p>
              <p className="whitespace-pre-wrap leading-relaxed">{simulationResult.assistantResponse}</p>
            </div>
          </div>
        )}
      </div>

      {/* Origin Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Origin Quick Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs text-slate-400 font-mono flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-indigo-400" /> Website:
          </span>
          <button
            onClick={() => setSelectedOriginFilter('ALL')}
            className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
              selectedOriginFilter === 'ALL'
                ? 'bg-indigo-600 text-white font-medium shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All ({records.length})
          </button>
          {summary?.topWebsites?.map((site, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedOriginFilter(site.origin)}
              className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                selectedOriginFilter === site.origin
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {site.origin.replace('https://', '').replace('http://', '').substring(0, 24)} ({site.count})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prompts, responses, sites..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Main List of External Traffic Logs & What Nova Core Responded */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-14 bg-slate-900/60 border border-slate-800 rounded-xl">
            <Globe className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
            <h4 className="text-sm font-semibold text-slate-300">No External Website Queries Found</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Use the sandbox simulator above or send an API request from any website or cURL client to see live logs and responses.
            </p>
          </div>
        ) : (
          filteredRecords.map((item) => (
            <div
              key={item.id}
              id={`traffic-record-${item.id}`}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-xl overflow-hidden shadow-lg transition-all"
            >
              {/* Record Top Bar */}
              <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-md bg-indigo-950/80 border border-indigo-800/60 text-indigo-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs sm:text-sm font-bold font-mono text-indigo-300">
                        {item.originWebsite}
                      </span>
                      <span className="px-1.5 py-0.5 text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 rounded">
                        HTTP 200
                      </span>
                      <span className="px-1.5 py-0.5 text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/40 rounded">
                        {item.model}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-500 mt-0.5">
                      <span>User: <strong className="text-slate-400">{item.userId}</strong></span>
                      <span>&bull;</span>
                      <span>IP: <strong className="text-slate-400">{item.clientIp || 'Remote'}</strong></span>
                      <span>&bull;</span>
                      <span>Source: <strong className="text-slate-400">{item.clientSource}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="flex items-center gap-1 text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/50">
                    <Activity className="w-3 h-3 text-purple-400" />
                    {item.latencyMs}ms
                  </span>
                  <span className="flex items-center gap-1 text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                    <Zap className="w-3 h-3 text-amber-400" />
                    {item.promptTokens + item.completionTokens} tok
                  </span>
                </div>
              </div>

              {/* Record Content: Request & Response */}
              <div className="p-4 space-y-3">
                {/* 1. What the external website asked */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-mono uppercase font-semibold text-slate-400 flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                      1. Query Sent from {item.originWebsite}
                    </span>
                    <button
                      onClick={() => handleCopyText(item.userPrompt, `prompt-${item.id}`)}
                      className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === `prompt-${item.id}` ? (
                        <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Copied</span>
                      ) : (
                        <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> Copy Prompt</span>
                      )}
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                    {item.userPrompt}
                  </p>
                </div>

                {/* 2. What Nova Core responded to that website */}
                <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-mono uppercase font-semibold text-indigo-300 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                      2. What Nova Core Responded on That Website
                    </span>
                    <button
                      onClick={() => handleCopyText(item.assistantResponse, `res-${item.id}`)}
                      className="text-[11px] text-indigo-300 hover:text-indigo-100 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === `res-${item.id}` ? (
                        <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Copied</span>
                      ) : (
                        <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> Copy Response</span>
                      )}
                    </button>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-sans bg-slate-950/60 p-3 rounded border border-indigo-950">
                    {item.assistantResponse}
                  </div>
                </div>

                {/* 3. Thought Trace & Autonomous Reasoning (if available) */}
                {item.thoughtTrace && (
                  <div className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-2.5">
                    <span className="text-[10px] font-mono uppercase font-medium text-slate-500 flex items-center gap-1 mb-1">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      Autonomous Thought Trace for External Caller:
                    </span>
                    <p className="text-xs font-mono text-slate-400 whitespace-pre-wrap leading-relaxed">
                      {item.thoughtTrace}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Integration Code Snippets & Guidelines for Other Websites */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-400" />
              How Other Websites & External Apps Connect to Nova Core
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Any website or backend can access Nova Core via standard OpenAI API compatibility.
            </p>
          </div>

          {/* Snippet Tabs */}
          <div className="flex space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveSnippetTab('fetch')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeSnippetTab === 'fetch'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              JS / TypeScript fetch
            </button>
            <button
              onClick={() => setActiveSnippetTab('openai')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeSnippetTab === 'openai'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Python OpenAI SDK
            </button>
            <button
              onClick={() => setActiveSnippetTab('curl')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeSnippetTab === 'curl'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              cURL CLI
            </button>
          </div>
        </div>

        <div className="relative">
          <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
            {codeSnippets[activeSnippetTab]}
          </pre>
          <button
            onClick={() => handleCopySnippet(codeSnippets[activeSnippetTab], activeSnippetTab)}
            className="absolute top-3 right-3 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer shadow"
          >
            {copiedSnippet === activeSnippetTab ? (
              <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Copied</span>
            ) : (
              <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> Copy Code</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

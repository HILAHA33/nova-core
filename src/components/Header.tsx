import React, { useState, useEffect } from 'react';
import { Terminal, Shield, Activity, Copy, Check, RefreshCw, Layers, Brain, Database, FileCode, Sparkles, Orbit, Globe, Cpu } from 'lucide-react';
import { HealthStatus, SystemMetrics, SelfLearningStatus } from '../types.js';

interface HeaderProps {
  activeTab: 'playground' | 'localllm' | 'selflearn' | 'database' | 'memory' | 'external' | 'logs' | 'rag' | 'docs';
  setActiveTab: (tab: 'playground' | 'localllm' | 'selflearn' | 'database' | 'memory' | 'external' | 'logs' | 'rag' | 'docs') => void;
  health: HealthStatus | null;
  metrics: SystemMetrics | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  externalCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  health,
  metrics,
  onRefresh,
  isRefreshing,
  externalCount,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [selfLearnStatus, setSelfLearnStatus] = useState<SelfLearningStatus | null>(null);

  useEffect(() => {
    const fetchSelfLearn = async () => {
      try {
        const res = await fetch('/v1/self-learn/status');
        if (res.ok) {
          const data = await res.json();
          setSelfLearnStatus(data);
        }
      } catch {
        // silent
      }
    };
    fetchSelfLearn();
    const interval = setInterval(fetchSelfLearn, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyUrl = () => {
    const baseUrl = `${window.location.origin}/v1`;
    navigator.clipboard.writeText(baseUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText('nova-sk-live-alpha');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const formatUptime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    if (mins > 0) return `${mins}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3.5 gap-3">
          {/* Brand & Engine Status */}
          <div className="flex items-center space-x-3.5">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-blue-500/10 border border-indigo-500/30 text-indigo-400 shadow-inner">
              <Terminal className="w-5 h-5" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-semibold tracking-tight text-slate-100">Nova Core AI</h1>
                <span className="px-2 py-0.5 text-[11px] font-mono tracking-wider font-medium uppercase bg-indigo-950/80 text-indigo-300 border border-indigo-800/50 rounded-md">
                  v1.4.0
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded-md">
                  Autonomous Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                OpenAI-Compatible Inference &bull; Port :3000 &bull; {health ? `Uptime: ${formatUptime(health.uptimeSeconds)}` : 'Connecting...'}
              </p>
            </div>
          </div>

          {/* Quick Actions & Telemetry Badges */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Live Autonomous Self-Learning Indicator Pill */}
            {selfLearnStatus && (
              <button
                id="header-self-learn-pill"
                onClick={() => setActiveTab('selflearn')}
                className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 transition-colors cursor-pointer"
                title="View Autonomous Self-Learning Engine"
              >
                <span className="relative flex h-2 w-2">
                  {selfLearnStatus.isRunning && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${selfLearnStatus.isRunning ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                </span>
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-mono text-[11px]">
                  Self-Learning: #{selfLearnStatus.cycleCount} (+{selfLearnStatus.totalFactsLearned} facts)
                </span>
              </button>
            )}

            {metrics && (
              <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                <span>Avg: <strong className="text-slate-100">{metrics.avgLatencyMs}ms</strong></span>
                <span className="text-slate-600">|</span>
                <span>Reqs: <strong className="text-slate-100">{metrics.totalRequests}</strong></span>
              </div>
            )}

            {/* Copy Base URL */}
            <button
              id="copy-base-url-btn"
              onClick={handleCopyUrl}
              title="Copy OpenAI Base URL"
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span className="font-mono text-[11px]">{copiedUrl ? 'Copied URL' : 'Base: /v1'}</span>
            </button>

            {/* Copy Secret Key */}
            <button
              id="copy-api-key-btn"
              onClick={handleCopyKey}
              title="Default API Key: nova-sk-live-alpha"
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono text-[11px]">{copiedKey ? 'Key Copied' : 'API Key'}</span>
            </button>

            {/* Refresh Button */}
            <button
              id="refresh-telemetry-btn"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh server telemetry"
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'playground', label: 'API Playground', icon: Terminal },
            { id: 'localllm', label: 'Local Neural (Llama 3.2 / Qwen)', icon: Cpu, badge: '0 Keys' },
            { id: 'selflearn', label: 'Autonomous Self-Learning', icon: Orbit, badge: selfLearnStatus?.cycleCount ? `#${selfLearnStatus.cycleCount}` : undefined },
            { id: 'external', label: 'Other Websites & Traffic', icon: Globe, badge: externalCount },
            { id: 'database', label: 'Dual Databases & Users', icon: Database },
            { id: 'memory', label: 'Memory & Knowledge Graph', icon: Brain, badge: health?.learnedFactsCount },
            { id: 'logs', label: 'Request Logs', icon: Layers, badge: metrics?.totalRequests },
            { id: 'rag', label: 'Vector RAG Search', icon: Layers, badge: health?.knowledgeBaseDocuments },
            { id: 'docs', label: 'SDK & API Docs', icon: FileCode },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1.5 px-1.5 py-0.2 text-[10px] font-mono rounded-full ${
                      isActive ? 'bg-indigo-500/30 text-indigo-200' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

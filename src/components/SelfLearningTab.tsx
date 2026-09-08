import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import {
  Brain,
  Sparkles,
  Play,
  Pause,
  FastForward,
  RotateCcw,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  Database,
  Tag,
  Cpu,
  Share2,
  Search,
  BookOpen,
  Zap,
  ChevronDown,
  ChevronUp,
  Activity,
  Compass
} from 'lucide-react';
import { SelfLearningStatus, SelfLearningReflection } from '../types.js';

interface SelfLearningTabProps {
  onNavigateToPlayground?: (initialPrompt?: string) => void;
  onNavigateToMemory?: () => void;
}

export const SelfLearningTab: React.FC<SelfLearningTabProps> = ({
  onNavigateToPlayground,
  onNavigateToMemory,
}) => {
  const [status, setStatus] = useState<SelfLearningStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecutingManual, setIsExecutingManual] = useState(false);
  const [selectedReflection, setSelectedReflection] = useState<SelfLearningReflection | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedDomainFilter, setSelectedDomainFilter] = useState('All Domains');
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  const [countdown, setCountdown] = useState<number>(10);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch self-learning status
  const fetchStatus = async () => {
    try {
      const res = await fetch('/v1/self-learn/status');
      if (res.ok) {
        const data: SelfLearningStatus = await res.json();
        setStatus(data);
        setCountdown(data.nextCycleInSeconds);
        if (!selectedReflection && data.recentReflections.length > 0) {
          setSelectedReflection(data.recentReflections[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch self-learning status:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll status every 3 seconds for smooth countdown and live updates
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // Smooth local countdown ticking
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status?.lastCycleTimestamp]);

  const handleToggleRunning = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/v1/self-learn/toggle', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setStatus(data.currentStatus);
      }
    } catch (err) {
      console.error('Failed to toggle auto-learning:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerStep = async () => {
    setIsExecutingManual(true);
    try {
      const res = await fetch('/v1/self-learn/step', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setStatus(data.currentStatus);
        setSelectedReflection(data.reflection);
        setCountdown(data.currentStatus.intervalSeconds);
      }
    } catch (err) {
      console.error('Failed to trigger step:', err);
    } finally {
      setIsExecutingManual(false);
    }
  };

  const handleIntervalChange = async (newInterval: number) => {
    try {
      const res = await fetch('/v1/self-learn/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervalSeconds: newInterval }),
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data.currentStatus);
      }
    } catch (err) {
      console.error('Failed to update interval:', err);
    }
  };

  const handleDomainChange = async (domain: string) => {
    setSelectedDomainFilter(domain);
    try {
      const res = await fetch('/v1/self-learn/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedDomain: domain }),
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data.currentStatus);
      }
    } catch (err) {
      console.error('Failed to update domain filter:', err);
    }
  };

  const toggleThoughtTrace = (id: string) => {
    setExpandedThoughts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const currentReflection = selectedReflection || status?.recentReflections[0];

  const filteredHistory = (status?.recentReflections || []).filter((r) => {
    const matchesSearch =
      r.question.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.domain.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.learnedFacts.some((f) => f.text.toLowerCase().includes(searchFilter.toLowerCase()));
    const matchesDomain =
      selectedDomainFilter === 'All Domains' || r.domain.toLowerCase() === selectedDomainFilter.toLowerCase();
    return matchesSearch && matchesDomain;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner / Live Learning Status Bar */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
                <Brain className="w-5 h-5" />
                {status?.isRunning && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Autonomous Recursive Self-Learning
                  <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Live Engine
                  </span>
                </h2>
                <p className="text-xs text-slate-300">
                  Nova continuously formulates deep technical inquiries, reasons through solutions, distills fundamental axioms, and expands its persistent memory graph.
                </p>
              </div>
            </div>
          </div>

          {/* Controls Cluster */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Play/Pause Toggle */}
            <button
              id="self-learn-toggle-btn"
              onClick={handleToggleRunning}
              disabled={isLoading}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                status?.isRunning
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
              }`}
            >
              {status?.isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Self-Learning</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume Self-Learning</span>
                </>
              )}
            </button>

            {/* Trigger Now Button */}
            <button
              id="self-learn-trigger-btn"
              onClick={handleTriggerStep}
              disabled={isExecutingManual}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 ${isExecutingManual ? 'animate-spin' : ''}`} />
              <span>{isExecutingManual ? 'Thinking...' : 'Inquire & Learn Now'}</span>
            </button>

            {/* Speed Selector */}
            <div className="flex items-center rounded-xl bg-slate-950/80 border border-slate-800 p-1 text-xs">
              <span className="text-[11px] text-slate-400 font-mono px-2 flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-400" />
                Cadence:
              </span>
              {[
                { label: '6s', value: 6 },
                { label: '10s', value: 10 },
                { label: '20s', value: 20 },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => handleIntervalChange(item.value)}
                  className={`px-2 py-1 rounded-lg font-mono text-[11px] transition-all cursor-pointer ${
                    status?.intervalSeconds === item.value
                      ? 'bg-indigo-600 text-white font-medium shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono uppercase tracking-wider">
              <RotateCcw className="w-3 h-3 text-indigo-400" />
              Cycles Completed
            </span>
            <div className="text-xl font-bold text-white font-mono mt-1">
              #{status?.cycleCount || 0}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Facts Distilled
            </span>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
              {status?.totalFactsLearned || 0}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono uppercase tracking-wider">
              <Compass className="w-3 h-3 text-blue-400" />
              Curiosity Focus
            </span>
            <div className="text-sm font-semibold text-slate-200 truncate mt-1" title={status?.selectedDomain}>
              {status?.selectedDomain || 'All Domains'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono uppercase tracking-wider">
              <Activity className="w-3 h-3 text-amber-400" />
              Next Inquiry In
            </span>
            <div className="text-xl font-bold text-amber-400 font-mono mt-1 flex items-center gap-2">
              {status?.isRunning ? `${countdown}s` : 'Paused'}
              {status?.isRunning && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Split View with Active Live Reflection and History Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Top: Active Highlighted Self-Reflection */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              Active Self-Reflection & Knowledge Synthesis
            </h3>
            {currentReflection && (
              <span className="text-xs font-mono text-slate-400">
                Cycle #{currentReflection.cycleNumber} &bull; {new Date(currentReflection.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>

          {currentReflection ? (
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-lg">
              {/* Domain & Trigger */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-950/80 text-indigo-300 border border-indigo-800/50">
                    {currentReflection.domain}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Engine: <strong className="text-slate-300">{currentReflection.engineUsed}</strong>
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {currentReflection.durationMs}ms latency
                </span>
              </div>

              {/* Curiosity Trigger Motivation */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs text-slate-300 space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-semibold block">
                  Curiosity Trigger & Knowledge Gap
                </span>
                <p className="italic text-slate-300">"{currentReflection.curiosityTrigger}"</p>
              </div>

              {/* Formulated Question */}
              <div className="space-y-1.5">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-semibold">
                  <Search className="w-3.5 h-3.5 text-indigo-400" />
                  Self-Formulated Inquiry
                </span>
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/40 via-slate-950/60 to-indigo-950/20 border border-indigo-500/30 text-sm font-medium text-indigo-100 leading-relaxed">
                  {currentReflection.question}
                </div>
              </div>

              {/* Chain-of-Thought Trace (if available) */}
              {currentReflection.thoughtTrace && (
                <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 overflow-hidden">
                  <button
                    onClick={() => toggleThoughtTrace(currentReflection.id)}
                    className="w-full px-3.5 py-2 flex items-center justify-between text-xs text-slate-300 hover:bg-slate-900/60 transition-colors cursor-pointer"
                  >
                    <span className="font-mono flex items-center gap-2 text-indigo-400">
                      <Brain className="w-3.5 h-3.5" />
                      Chain-of-Thought Internal Reasoning Trace
                    </span>
                    {expandedThoughts[currentReflection.id] ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  {expandedThoughts[currentReflection.id] && (
                    <div className="p-3.5 text-xs font-mono text-slate-300 bg-slate-950 border-t border-slate-800/80 whitespace-pre-wrap leading-relaxed">
                      {currentReflection.thoughtTrace}
                    </div>
                  )}
                </div>
              )}

              {/* Complete Synthesized Answer */}
              <div className="space-y-1.5">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-semibold">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  Autonomous Deduction & Synthesis
                </span>
                <div className="markdown-body p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 leading-relaxed max-h-80 overflow-y-auto">
                  <Markdown>{currentReflection.answer}</Markdown>
                </div>
              </div>

              {/* Distilled Knowledge Nuggets (Persisted to Memory) */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Distilled Facts Injected to Persistent Memory Graph ({currentReflection.learnedFacts.length})
                  </span>
                  {onNavigateToMemory && (
                    <button
                      onClick={onNavigateToMemory}
                      className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                    >
                      View in Graph <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {currentReflection.learnedFacts.map((fact, idx) => (
                    <div
                      key={fact.id || idx}
                      className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-xs text-emerald-200 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-sans leading-relaxed text-slate-200 font-medium">
                          {fact.text}
                        </span>
                        <span className="px-1.5 py-0.5 text-[10px] font-mono rounded-md bg-emerald-950 text-emerald-300 border border-emerald-700/50 whitespace-nowrap">
                          Node: {fact.id || 'persisted'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {fact.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.2 text-[10px] font-mono rounded-md bg-slate-900 text-slate-400 border border-slate-800"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Bar: Test In Playground */}
              <div className="pt-2 flex items-center justify-end gap-2">
                {onNavigateToPlayground && (
                  <button
                    onClick={() =>
                      onNavigateToPlayground(
                        `Tell me what you understand about: ${currentReflection.question}`
                      )
                    }
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Test This In API Playground</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-8 text-center text-slate-400 space-y-3">
              <Brain className="w-8 h-8 mx-auto text-indigo-400 animate-pulse" />
              <p className="text-sm">Initializing autonomous self-inquiry cycle...</p>
              <button
                onClick={handleTriggerStep}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer hover:bg-indigo-500"
              >
                Inquire & Learn Now
              </button>
            </div>
          )}
        </div>

        {/* Right / Bottom: Stream of Past Inquiries & Dynamic Filter */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Self-Learning Evolution History
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {filteredHistory.length} Cycles
            </span>
          </div>

          {/* Filter & Search Bar */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search self-learned topics, facts..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Domain Dropdown */}
            <select
              value={selectedDomainFilter}
              onChange={(e) => handleDomainChange(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {(status?.availableDomains || ['All Domains']).map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>
          </div>

          {/* History Scroll Feed */}
          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredHistory.length > 0 ? (
              filteredHistory.map((reflection) => {
                const isSelected = selectedReflection?.id === reflection.id;
                return (
                  <div
                    key={reflection.id}
                    onClick={() => setSelectedReflection(reflection)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left space-y-2 ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/60 shadow-md ring-1 ring-indigo-500/30'
                        : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                        {reflection.domain}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        Cycle #{reflection.cycleNumber} &bull; {new Date(reflection.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-200 line-clamp-2 leading-relaxed">
                      {reflection.question}
                    </p>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        +{reflection.learnedFacts.length} Facts Distilled
                      </span>
                      <span>{reflection.durationMs}ms</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
                No matching self-learning reflections found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Brain,
  Plus,
  Trash2,
  Search,
  Check,
  Tag,
  Calendar,
  Layers,
  Sparkles,
  Info,
  RefreshCw
} from 'lucide-react';
import { MemoryFact, MemoryGraphData } from '../types.js';

interface MemoryGraphTabProps {
  onRefreshTrigger: () => void;
}

export const MemoryGraphTab: React.FC<MemoryGraphTabProps> = ({ onRefreshTrigger }) => {
  const [facts, setFacts] = useState<MemoryFact[]>([]);
  const [graphData, setGraphData] = useState<MemoryGraphData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedNode, setSelectedNode] = useState<any>(null);

  // Form state for teaching Nova
  const [newFactText, setNewFactText] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryFact['category']>('domain_knowledge');
  const [newTags, setNewTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchMemoryData = async () => {
    try {
      const res = await fetch('/v1/memory');
      const data = await res.json();
      setFacts(data.facts || []);
      setGraphData(data.graph || null);
    } catch (err) {
      console.error('Failed to load memory data:', err);
    }
  };

  useEffect(() => {
    fetchMemoryData();
    const interval = setInterval(fetchMemoryData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLearnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFactText.trim()) return;

    setIsSubmitting(true);
    setFeedbackMsg(null);

    try {
      const tagsArray = newTags
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean);

      const res = await fetch('/v1/learn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer nova-sk-live-alpha',
        },
        body: JSON.stringify({
          fact: newFactText.trim(),
          category: newCategory,
          tags: tagsArray,
          source: 'dashboard_ui',
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed with status ${res.status}`);
      }

      const data = await res.json();
      setFeedbackMsg({
        type: 'success',
        text: 'Fact successfully integrated into persistent knowledge graph!',
      });
      setNewFactText('');
      setNewTags('');
      fetchMemoryData();
      onRefreshTrigger();
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Failed to submit knowledge fact.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFact = async (id: string) => {
    if (!confirm('Are you sure you want to prune this fact from Nova\'s persistent memory?')) {
      return;
    }

    try {
      const res = await fetch(`/v1/memory/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer nova-sk-live-alpha',
        },
      });
      if (res.ok) {
        fetchMemoryData();
        onRefreshTrigger();
      }
    } catch (err) {
      console.error('Failed to delete fact:', err);
    }
  };

  const filteredFacts = facts.filter((f) => {
    const matchesSearch =
      f.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || f.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'user_preference':
        return 'bg-purple-950/60 text-purple-300 border-purple-800/40';
      case 'domain_knowledge':
        return 'bg-blue-950/60 text-blue-300 border-blue-800/40';
      case 'system_fact':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-slate-100">Persistent Conversational Memory Graph</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Nova Core continuously tracks facts, developer guidelines, and domain knowledge in an in-memory graph backed by disk persistence (<code className="font-mono text-indigo-300">data/nova_memory.json</code>).
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Total Facts</span>
            <span className="text-lg font-semibold text-indigo-400">{facts.length}</span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Graph Nodes</span>
            <span className="text-lg font-semibold text-emerald-400">{graphData?.nodes.length || 0}</span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Relations</span>
            <span className="text-lg font-semibold text-amber-400">{graphData?.links.length || 0}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Visual Graph */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-slate-200">Knowledge Graph Visualization</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Interactive SVG Topology
            </span>
          </div>

          {/* SVG Graph View */}
          <div className="relative w-full h-[460px] bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center">
            {graphData && graphData.nodes.length > 0 ? (
              <svg className="w-full h-full" viewBox="0 0 600 460">
                <defs>
                  <linearGradient id="linkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
                  </linearGradient>
                </defs>

                {/* Draw Links */}
                {graphData.links.map((link, idx) => {
                  const sIdx = graphData.nodes.findIndex(n => n.id === link.source);
                  const tIdx = graphData.nodes.findIndex(n => n.id === link.target);
                  if (sIdx === -1 || tIdx === -1) return null;

                  // Compute orbital positioning
                  const total = graphData.nodes.length;
                  const getPos = (i: number, node: any) => {
                    if (node.id === 'nova-brain') return { x: 300, y: 230 };
                    if (node.id === 'user-profile') return { x: 180, y: 160 };
                    if (node.id === 'knowledge-base') return { x: 420, y: 160 };

                    const angle = (i / total) * Math.PI * 2;
                    const radius = node.type === 'tech' ? 190 : 130;
                    return {
                      x: 300 + Math.cos(angle) * radius,
                      y: 230 + Math.sin(angle) * radius,
                    };
                  };

                  const sPos = getPos(sIdx, graphData.nodes[sIdx]);
                  const tPos = getPos(tIdx, graphData.nodes[tIdx]);

                  return (
                    <line
                      key={`link-${idx}`}
                      x1={sPos.x}
                      y1={sPos.y}
                      x2={tPos.x}
                      y2={tPos.y}
                      stroke="url(#linkGrad)"
                      strokeWidth="1.5"
                      strokeDasharray={link.label === 'prefers' ? '3 3' : undefined}
                    />
                  );
                })}

                {/* Draw Nodes */}
                {graphData.nodes.map((node, i) => {
                  const total = graphData.nodes.length;
                  const getPos = () => {
                    if (node.id === 'nova-brain') return { x: 300, y: 230 };
                    if (node.id === 'user-profile') return { x: 180, y: 160 };
                    if (node.id === 'knowledge-base') return { x: 420, y: 160 };

                    const angle = (i / total) * Math.PI * 2;
                    const radius = node.type === 'tech' ? 190 : 130;
                    return {
                      x: 300 + Math.cos(angle) * radius,
                      y: 230 + Math.sin(angle) * radius,
                    };
                  };

                  const pos = getPos();
                  const isSelected = selectedNode?.id === node.id;

                  let fillColor = '#6366f1';
                  if (node.type === 'user') fillColor = '#a855f7';
                  if (node.type === 'domain') fillColor = '#3b82f6';
                  if (node.type === 'preference') fillColor = '#ec4899';
                  if (node.type === 'tech') fillColor = '#10b981';

                  const radius = node.id === 'nova-brain' ? 22 : node.val ? Math.min(18, node.val) : 12;

                  return (
                    <g
                      key={`node-${node.id}`}
                      className="cursor-pointer transition-transform hover:scale-110"
                      onClick={() => setSelectedNode(node)}
                    >
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={radius}
                        fill={fillColor}
                        fillOpacity={isSelected ? 0.9 : 0.6}
                        stroke={isSelected ? '#ffffff' : fillColor}
                        strokeWidth={isSelected ? 2.5 : 1}
                        className="transition-all"
                      />
                      <text
                        x={pos.x}
                        y={pos.y + radius + 10}
                        textAnchor="middle"
                        fill="#cbd5e1"
                        fontSize="9"
                        fontFamily="monospace"
                        className="select-none pointer-events-none"
                      >
                        {node.label.length > 14 ? node.label.substring(0, 12) + '...' : node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            ) : (
              <div className="text-slate-500 text-xs">No graph nodes available</div>
            )}

            {/* Selected Node Details Overlay */}
            {selectedNode && (
              <div className="absolute bottom-3 left-3 right-3 p-3 bg-slate-900/95 border border-slate-700/80 rounded-lg shadow-lg flex items-center justify-between text-xs backdrop-blur-sm">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-100">{selectedNode.label}</span>
                    <span className="px-1.5 py-0.2 text-[10px] font-mono uppercase bg-slate-800 text-indigo-300 rounded">
                      {selectedNode.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">Node ID: {selectedNode.id}</p>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 font-mono">
            <span>• Indigo: Central Brain & Concept</span>
            <span>• Purple: User Context</span>
            <span>• Pink: User Preference</span>
            <span>• Emerald: Tech Entity</span>
          </div>
        </div>

        {/* Right Column: "Teach Nova" Form */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-slate-200">
              <Plus className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold">Teach Nova (POST /v1/learn)</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Inject custom rules, company guidelines, or personal preferences directly into Nova's memory.
            </p>
          </div>

          <form onSubmit={handleLearnSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Fact, Rule or Knowledge Statement
              </label>
              <textarea
                id="teach-fact-input"
                rows={3}
                required
                value={newFactText}
                onChange={(e) => setNewFactText(e.target.value)}
                placeholder="e.g. 'Our team uses PostgreSQL 16 with Read Replicas and Prisma ORM.' or 'Always format errors using standard RFC 7807.'"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Category
                </label>
                <select
                  id="teach-category-select"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="domain_knowledge">Domain Knowledge</option>
                  <option value="user_preference">User Preference</option>
                  <option value="system_fact">System Fact</option>
                  <option value="entity_relation">Entity Relation</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Tags (comma separated)
                </label>
                <input
                  id="teach-tags-input"
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="e.g. database, postgres, orm"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            {feedbackMsg && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center space-x-2 ${
                  feedbackMsg.type === 'success'
                    ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-300'
                    : 'bg-rose-950/60 border border-rose-800/60 text-rose-300'
                }`}
              >
                {feedbackMsg.type === 'success' ? (
                  <Check className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <Info className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{feedbackMsg.text}</span>
              </div>
            )}

            <button
              id="submit-learn-btn"
              type="submit"
              disabled={isSubmitting || !newFactText.trim()}
              className="w-full py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Integrating Knowledge...' : 'Integrate Into Knowledge Graph'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Learned Facts Table & Management */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-slate-200">
            <Brain className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold">Active Memory Records ({filteredFacts.length})</h3>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                id="memory-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search facts or tags..."
                className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48 font-mono"
              />
            </div>

            <select
              id="category-filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            >
              <option value="all">All Categories</option>
              <option value="user_preference">User Preferences</option>
              <option value="domain_knowledge">Domain Knowledge</option>
              <option value="system_fact">System Facts</option>
            </select>
          </div>
        </div>

        {/* Fact Cards */}
        {filteredFacts.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No memory facts found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredFacts.map((fact) => (
              <div
                key={fact.id}
                className="p-3.5 bg-slate-950 border border-slate-800/90 rounded-xl space-y-2 hover:border-slate-700 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getCategoryBadgeClass(
                          fact.category
                        )}`}
                      >
                        {fact.category.replace('_', ' ').toUpperCase()}
                      </span>
                      {fact.source === 'nova_self_learning' && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                          Self-Learned
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400">
                      {Math.round(fact.confidence * 100)}% Confidence
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {fact.text}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[11px] text-slate-400 font-mono">
                  <div className="flex items-center space-x-1 flex-wrap gap-1">
                    {fact.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded"
                      >
                        <Tag className="w-2.5 h-2.5 mr-0.5 text-indigo-400" />
                        {tag}
                      </span>
                    ))}
                  </div>

                  <button
                    id={`delete-fact-${fact.id}`}
                    onClick={() => handleDeleteFact(fact.id)}
                    title="Prune this fact"
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

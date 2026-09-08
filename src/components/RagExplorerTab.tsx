import React, { useState, useEffect } from 'react';
import { Database, Search, BookOpen, Tag, Check, Sparkles, ArrowRight } from 'lucide-react';
import { NovaRetrievedDoc } from '../types.js';

const SAMPLE_QUERIES = [
  'CAP theorem and Raft consensus',
  'Worker pool concurrency in TypeScript',
  'Bayesian probability and Occam razor',
  'First principles reasoning',
  'Microservice API security and token auth',
];

export const RagExplorerTab: React.FC = () => {
  const [query, setQuery] = useState('distributed systems consensus');
  const [results, setResults] = useState<NovaRetrievedDoc[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const executeSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/v1/rag/search?q=${encodeURIComponent(searchTerm)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error('RAG query failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    executeSearch(query);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-1">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-slate-100">In-Memory BM25 Vector RAG Explorer</h2>
        </div>
        <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
          Test and inspect the underlying BM25 information retrieval index. Nova ranks authoritative domain passages in sub-millisecond timeframes to eliminate hallucination.
        </p>
      </div>

      {/* Search Bar & Preset Chips */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            executeSearch(query);
          }}
          className="flex items-center space-x-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              id="rag-query-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search vector knowledge base using keywords or natural language..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <button
            id="rag-search-btn"
            type="submit"
            disabled={isSearching || !query.trim()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </form>

        {/* Sample queries */}
        <div className="flex items-center space-x-2 overflow-x-auto text-[11px] text-slate-400 font-mono scrollbar-none pt-1">
          <span className="shrink-0 text-slate-500">Quick Test:</span>
          {SAMPLE_QUERIES.map((q, idx) => (
            <button
              key={idx}
              id={`rag-sample-btn-${idx}`}
              onClick={() => {
                setQuery(q);
                executeSearch(q);
              }}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Retrieval Results */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
          <span>Ranked Document Excerpts ({results.length} matched)</span>
          <span>Scoring Formula: BM25 (k1=1.5, b=0.75)</span>
        </div>

        {results.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs font-mono">
            {isSearching ? 'Computing BM25 ranking across documents...' : 'No documents reached the similarity threshold.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {results.map((doc, idx) => (
              <div
                key={doc.id}
                className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 text-[10px] font-mono flex items-center justify-center font-bold">
                      #{idx + 1}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-100">{doc.title}</h3>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 text-[10px] font-mono border border-slate-800">
                      {doc.category}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 text-[11px] font-mono font-semibold border border-emerald-800/40">
                      BM25: {doc.score.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-xs text-slate-300 font-sans leading-relaxed">
                  "{doc.snippet}"
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
                  <span>Document ID: {doc.id}</span>
                  <span className="text-indigo-400">Ready for generation grounding</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

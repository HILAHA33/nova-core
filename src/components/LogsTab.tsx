import React, { useState } from 'react';
import {
  Layers,
  Search,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Filter,
  ArrowUpRight,
  RefreshCw,
  Terminal
} from 'lucide-react';
import { RequestLog } from '../types.js';

interface LogsTabProps {
  logs: RequestLog[];
  onClearLogs: () => void;
  onRefreshLogs: () => void;
  isRefreshing: boolean;
}

export const LogsTab: React.FC<LogsTabProps> = ({
  logs,
  onClearLogs,
  onRefreshLogs,
  isRefreshing,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | '200' | 'errors'>('all');
  const [selectedLog, setSelectedLog] = useState<RequestLog | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.intent && log.intent.toLowerCase().includes(searchQuery.toLowerCase())) ||
      log.previewPrompt.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === '200'
        ? log.statusCode === 200 || log.statusCode === 201
        : log.statusCode >= 400;

    return matchesSearch && matchesStatus;
  });

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header & Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-slate-100">Live API Telemetry & Ingress Logs</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time trace of OpenAI-compatible requests, token throughput, intent classification, and latency.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="refresh-logs-btn"
            onClick={onRefreshLogs}
            disabled={isRefreshing}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-mono text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            id="clear-logs-btn"
            onClick={onClearLogs}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800/60 text-xs font-mono text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="log-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter logs by path, model, prompt keyword..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-slate-400">Status:</span>
          {(['all', '200', 'errors'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === filter
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {filter === 'all' ? 'All Logs' : filter === '200' ? '200 OK' : 'Errors'}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table / Cards */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs font-mono">
            No telemetry records match the current filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredLogs.map((log) => {
              const isSuccess = log.statusCode >= 200 && log.statusCode < 300;
              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="p-3.5 hover:bg-slate-850/50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs font-mono"
                >
                  <div className="flex items-center space-x-3">
                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        isSuccess
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40'
                          : 'bg-rose-950/60 text-rose-300 border-rose-800/40'
                      }`}
                    >
                      {isSuccess ? (
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-rose-400" />
                      )}
                      <span>{log.statusCode}</span>
                    </span>

                    {/* Method & Endpoint */}
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-200">{log.method}</span>
                      <span className="text-indigo-300">{log.endpoint}</span>
                      {log.stream && (
                        <span className="px-1.5 py-0.2 text-[9px] bg-purple-950/80 text-purple-300 border border-purple-800/40 rounded uppercase">
                          SSE
                        </span>
                      )}
                    </div>

                    {/* Model Pill */}
                    <span className="hidden md:inline-block px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 text-[11px]">
                      {log.model}
                    </span>
                  </div>

                  {/* Right Meta Info */}
                  <div className="flex items-center space-x-4 text-slate-400">
                    {log.intent && (
                      <span className="hidden lg:inline-block text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {log.intent}
                      </span>
                    )}

                    <span className="text-slate-300 font-semibold">
                      {log.promptTokens + log.completionTokens} tokens
                    </span>

                    <span className="inline-flex items-center text-emerald-400">
                      <Clock className="w-3 h-3 mr-1" />
                      {log.latencyMs}ms
                    </span>

                    <span className="text-slate-500 text-[11px]">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-5 space-y-4 shadow-xl text-xs font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-slate-100">Telemetry Record: {selectedLog.id}</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-500 block text-[10px]">Status</span>
                <span className="font-semibold text-emerald-400">{selectedLog.statusCode} OK</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Duration</span>
                <span className="font-semibold text-indigo-400">{selectedLog.latencyMs}ms</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Model</span>
                <span className="font-semibold text-slate-200">{selectedLog.model}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Client IP</span>
                <span className="font-semibold text-slate-200">{selectedLog.clientIp}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block mb-1">Prompt Excerpt:</span>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 whitespace-pre-wrap font-sans">
                {selectedLog.previewPrompt || 'No prompt preview'}
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block mb-1">Response Excerpt:</span>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 whitespace-pre-wrap font-sans max-h-48 overflow-y-auto">
                {selectedLog.previewResponse || 'No response preview'}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

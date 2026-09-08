/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.js';
import { PlaygroundTab } from './components/PlaygroundTab.js';
import { SelfLearningTab } from './components/SelfLearningTab.js';
import { ExternalTrafficTab } from './components/ExternalTrafficTab.js';
import { DatabaseTab } from './components/DatabaseTab.js';
import { MemoryGraphTab } from './components/MemoryGraphTab.js';
import { LogsTab } from './components/LogsTab.js';
import { RagExplorerTab } from './components/RagExplorerTab.js';
import { MetricsDocsTab } from './components/MetricsDocsTab.js';
import { LocalLlmPanel } from './components/LocalLlmPanel.js';
import { HealthStatus, SystemMetrics, ModelObject, RequestLog } from './types.js';

export default function App() {
  const [activeTab, setActiveTab] = useState<'playground' | 'localllm' | 'selflearn' | 'database' | 'memory' | 'external' | 'logs' | 'rag' | 'docs'>('playground');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [models, setModels] = useState<ModelObject[]>([]);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [externalCount, setExternalCount] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [playgroundInitialPrompt, setPlaygroundInitialPrompt] = useState<string>('');
  const [activeLocalModelId, setActiveLocalModelId] = useState<string>('Llama-3.2-1B-Instruct-q4f16_1-MLC');

  const fetchTelemetry = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [healthRes, metricsRes, modelsRes, logsRes, extRes] = await Promise.all([
        fetch('/healthz').catch(() => null),
        fetch('/v1/metrics').catch(() => null),
        fetch('/v1/models').catch(() => null),
        fetch('/v1/logs?limit=50').catch(() => null),
        fetch('/v1/external-traffic?limit=1').catch(() => null),
      ]);

      if (healthRes && healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData);
      }
      if (metricsRes && metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }
      if (modelsRes && modelsRes.ok) {
        const modelsData = await modelsRes.json();
        setModels(modelsData.data || []);
      }
      if (logsRes && logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }
      if (extRes && extRes.ok) {
        const extData = await extRes.json();
        setExternalCount(extData.summary?.totalRequests || extData.records?.length || 0);
      }
    } catch (err) {
      console.error('Telemetry polling error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();
    // Auto-refresh telemetry every 10 seconds
    const interval = setInterval(fetchTelemetry, 10000);
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  const handleClearLogs = async () => {
    try {
      await fetch('/v1/logs', {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer nova-sk-live-alpha' },
      });
      fetchTelemetry();
    } catch (err) {
      console.error('Failed to clear logs:', err);
    }
  };

  const handleNavigateToPlayground = (prompt?: string) => {
    if (prompt) {
      setPlaygroundInitialPrompt(prompt);
    }
    setActiveTab('playground');
  };

  const handleNavigateToMemory = () => {
    setActiveTab('memory');
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
        metrics={metrics}
        onRefresh={fetchTelemetry}
        isRefreshing={isRefreshing}
        externalCount={externalCount}
      />

      <main className="flex-1 pb-12">
        {activeTab === 'playground' && (
          <PlaygroundTab
            models={models}
            onTriggerLogRefresh={fetchTelemetry}
            initialPrompt={playgroundInitialPrompt}
            initialLocalModelId={activeLocalModelId}
            onOpenLocalModels={() => setActiveTab('localllm')}
          />
        )}
        {activeTab === 'localllm' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <LocalLlmPanel
              activeModelId={activeLocalModelId}
              onSelectModelForChat={(modelId) => {
                setActiveLocalModelId(modelId);
                setActiveTab('playground');
              }}
            />
          </div>
        )}
        {activeTab === 'selflearn' && (
          <SelfLearningTab
            onNavigateToPlayground={handleNavigateToPlayground}
            onNavigateToMemory={handleNavigateToMemory}
          />
        )}
        {activeTab === 'external' && <ExternalTrafficTab />}
        {activeTab === 'database' && <DatabaseTab />}
        {activeTab === 'memory' && (
          <MemoryGraphTab onRefreshTrigger={fetchTelemetry} />
        )}
        {activeTab === 'logs' && (
          <LogsTab
            logs={logs}
            onClearLogs={handleClearLogs}
            onRefreshLogs={fetchTelemetry}
            isRefreshing={isRefreshing}
          />
        )}
        {activeTab === 'rag' && <RagExplorerTab />}
        {activeTab === 'docs' && (
          <MetricsDocsTab health={health} metrics={metrics} />
        )}
      </main>
    </div>
  );
}


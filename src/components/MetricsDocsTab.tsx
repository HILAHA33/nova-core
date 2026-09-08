import React, { useState } from 'react';
import {
  FileCode,
  Activity,
  Cpu,
  Server,
  Zap,
  Copy,
  Check,
  ShieldCheck,
  Terminal,
  BookOpen
} from 'lucide-react';
import { HealthStatus, SystemMetrics } from '../types.js';

interface MetricsDocsTabProps {
  health: HealthStatus | null;
  metrics: SystemMetrics | null;
}

export const MetricsDocsTab: React.FC<MetricsDocsTabProps> = ({ health, metrics }) => {
  const [activeLang, setActiveLang] = useState<'python' | 'node' | 'rust' | 'go' | 'curl' | 'learn'>('python');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/v1` : 'http://localhost:3000/v1';

  const copyCode = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const SNIPPETS = {
    python: `from openai import OpenAI

# Nova Core AI is fully OpenAI SDK compatible
client = OpenAI(
    base_url="${baseUrl}",
    api_key="nova-sk-live-alpha"  # Matches API_SECRET_KEY
)

# Multi-tenant and polyglot coding completion
response = client.chat.completions.create(
    model="nova-coder-v1",
    messages=[
        {"role": "system", "content": "You are Nova Core AI's specialized Polyglot Coding Engine."},
        {"role": "user", "content": "Implement a high-performance thread-safe LRU cache in Rust with Arc and Mutex."}
    ],
    extra_headers={
        "X-User-Id": "user_production_99",
        "X-Chat-Id": "session_polyglot_1"
    },
    temperature=0.2,
    stream=False
)

print(response.choices[0].message.content)`,

    node: `import OpenAI from 'openai';

// Initialize with Nova Core base URL & Multi-tenant headers
const client = new OpenAI({
  baseURL: '${baseUrl}',
  apiKey: 'nova-sk-live-alpha',
  defaultHeaders: {
    'X-User-Id': 'tenant_user_alpha',
    'X-Chat-Id': 'chat_workflow_01',
  },
});

async function main() {
  const stream = await client.chat.completions.create({
    model: 'nova-coder-v1',
    messages: [
      { role: 'user', content: 'Implement a lock-free SPSC queue in modern C++20 with atomic acquire-release semantics.' }
    ],
    stream: true,
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || '');
  }
}

main();`,

    rust: `// Cargo.toml: reqwest = { version = "0.11", features = ["json"] }, tokio = { version = "1", features = ["full"] }
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let mut headers = HeaderMap::new();
    headers.insert(AUTHORIZATION, HeaderValue::from_static("Bearer nova-sk-live-alpha"));
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    headers.insert("X-User-Id", HeaderValue::from_static("rust_client_service"));
    headers.insert("X-Chat-Id", HeaderValue::from_static("rust_chat_42"));

    let payload = json!({
        "model": "nova-coder-v1",
        "messages": [
            {"role": "user", "content": "Write a concurrent worker pool in Go with bounded channels and graceful context cancellation."}
        ],
        "temperature": 0.2
    });

    let res = client.post("${baseUrl}/chat/completions")
        .headers(headers)
        .json(&payload)
        .send()
        .await?
        .text()
        .await?;

    println!("{res}");
    Ok(())
}`,

    go: `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	payload, _ := json.Marshal(map[string]interface{}{
		"model": "nova-coder-v1",
		"messages": []map[string]string{
			{"role": "user", "content": "Implement an asynchronous sliding window log rate limiter in Python 3.12."},
		},
		"temperature": 0.2,
	})

	req, _ := http.NewRequest("POST", "${baseUrl}/chat/completions", bytes.NewBuffer(payload))
	req.Header.Set("Authorization", "Bearer nova-sk-live-alpha")
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-User-Id", "go_backend_worker")
	req.Header.Set("X-Chat-Id", "chat_sync_001")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}`,

    curl: `curl -X POST "${baseUrl}/chat/completions" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer nova-sk-live-alpha" \\
  -H "X-User-Id: client_user_102" \\
  -H "X-Chat-Id: thread_coding_rust" \\
  -d '{
    "model": "nova-coder-v1",
    "messages": [
      {"role": "user", "content": "Implement a thread-safe LRU Cache in Rust using Arc and Mutex."}
    ],
    "temperature": 0.2
  }'`,

    learn: `# Continuous Knowledge Ingestion Endpoint: POST /v1/learn
curl -X POST "${baseUrl}/learn" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer nova-sk-live-alpha" \\
  -d '{
    "fact": "Rust Arc and Mutex provide O(1) concurrent thread-safe access for shared data structures.",
    "category": "polyglot_systems",
    "tags": ["rust", "concurrency", "memory_safety"]
  }'`,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* System Metrics Grid */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-slate-200">
          <Activity className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-semibold">Microservice Health & Telemetry Metrics</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
          {/* Gauge 1 */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Average Latency</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold text-emerald-400">{metrics?.avgLatencyMs || 0}</span>
              <span className="text-xs text-slate-500">ms</span>
            </div>
            <span className="text-[10px] text-slate-500">P95: {metrics?.p95LatencyMs || 0}ms</span>
          </div>

          {/* Gauge 2 */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Total Requests</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold text-indigo-400">{metrics?.totalRequests || 0}</span>
              <span className="text-xs text-slate-500">reqs</span>
            </div>
            <span className="text-[10px] text-slate-500">{metrics?.requestsPerMin || 0} req/min</span>
          </div>

          {/* Gauge 3 */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Memory Footprint</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold text-purple-400">{metrics?.memory.rssMb || 0}</span>
              <span className="text-xs text-slate-500">MB RSS</span>
            </div>
            <span className="text-[10px] text-slate-500">Heap: {metrics?.memory.heapUsedMb || 0}MB</span>
          </div>

          {/* Gauge 4 */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Tokens Processed</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold text-amber-400">{metrics?.totalTokens || 0}</span>
              <span className="text-xs text-slate-500">tokens</span>
            </div>
            <span className="text-[10px] text-slate-500">{metrics?.tokensPerMin || 0} tok/min</span>
          </div>
        </div>
      </div>

      {/* Integration Code Documentation */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center space-x-2 text-slate-200">
              <FileCode className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold">Drop-in OpenAI SDK Integration</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Nova Core AI is a drop-in replacement for OpenAI endpoints with 100% standard compatibility.
            </p>
          </div>

          {/* Language Selector */}
          <div className="flex flex-wrap items-center gap-1 font-mono text-xs bg-slate-950 p-1 rounded-lg border border-slate-800">
            {[
              { id: 'python', label: 'Python' },
              { id: 'node', label: 'Node / TS' },
              { id: 'rust', label: 'Rust' },
              { id: 'go', label: 'Go' },
              { id: 'curl', label: 'cURL' },
              { id: 'learn', label: 'POST /v1/learn' },
            ].map((lang) => (
              <button
                key={lang.id}
                id={`lang-tab-${lang.id}`}
                onClick={() => setActiveLang(lang.id as any)}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  activeLang === lang.id
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Code Snippet Box */}
        <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 text-[11px] font-mono text-slate-400">
            <span>
              {activeLang === 'python'
                ? 'main.py'
                : activeLang === 'node'
                ? 'client.ts'
                : activeLang === 'rust'
                ? 'main.rs'
                : activeLang === 'go'
                ? 'main.go'
                : 'terminal.sh'}
            </span>
            <button
              onClick={() => copyCode(activeLang, SNIPPETS[activeLang])}
              className="inline-flex items-center space-x-1 text-slate-300 hover:text-white cursor-pointer"
            >
              {copiedKey === activeLang ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedKey === activeLang ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          <pre className="p-4 text-xs font-mono text-indigo-200 overflow-x-auto whitespace-pre leading-relaxed">
            {SNIPPETS[activeLang]}
          </pre>
        </div>
      </div>

      {/* Security & Endpoint Catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center space-x-2 text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider">Authentication & Headers</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Requests to <code className="text-indigo-300 font-mono">/v1/*</code> accept standard Bearer authorization:
          </p>
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
            <div>Authorization: Bearer nova-sk-live-alpha</div>
            <div>X-User-Id: customer_user_123</div>
            <div>X-Chat-Id: session_chat_456</div>
          </div>
          <p className="text-[11px] text-slate-500">
            Set the <code className="text-slate-400 font-mono">API_SECRET_KEY</code> environment variable to configure a custom token.
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center space-x-2 text-slate-200">
            <Server className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider">Available Microservice Endpoints</h4>
          </div>
          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex items-center justify-between p-1.5 bg-slate-950 rounded border border-slate-800">
              <span className="text-emerald-400 font-bold">POST</span>
              <span className="text-slate-300">/v1/chat/completions</span>
              <span className="text-slate-500 text-[10px]">OpenAI Chat (Multi-Tenant)</span>
            </div>
            <div className="flex items-center justify-between p-1.5 bg-slate-950 rounded border border-slate-800">
              <span className="text-emerald-400 font-bold">POST</span>
              <span className="text-slate-300">/v1/code/generate</span>
              <span className="text-slate-500 text-[10px]">Polyglot Code Synthesis</span>
            </div>
            <div className="flex items-center justify-between p-1.5 bg-slate-950 rounded border border-slate-800">
              <span className="text-blue-400 font-bold">GET</span>
              <span className="text-slate-300">/v1/code/languages</span>
              <span className="text-slate-500 text-[10px]">20+ Languages Metadata</span>
            </div>
            <div className="flex items-center justify-between p-1.5 bg-slate-950 rounded border border-slate-800">
              <span className="text-blue-400 font-bold">GET</span>
              <span className="text-slate-300">/v1/models</span>
              <span className="text-slate-500 text-[10px]">List Models</span>
            </div>
            <div className="flex items-center justify-between p-1.5 bg-slate-950 rounded border border-slate-800">
              <span className="text-emerald-400 font-bold">POST</span>
              <span className="text-slate-300">/v1/learn</span>
              <span className="text-slate-500 text-[10px]">Continuous Memory</span>
            </div>
            <div className="flex items-center justify-between p-1.5 bg-slate-950 rounded border border-slate-800">
              <span className="text-blue-400 font-bold">GET</span>
              <span className="text-slate-300">/healthz</span>
              <span className="text-slate-500 text-[10px]">Health Check</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

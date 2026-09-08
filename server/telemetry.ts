import { RequestLog } from './types.js';

export class TelemetryService {
  private logs: RequestLog[] = [];
  private readonly maxLogs = 200;
  private totalRequests = 0;
  private totalPromptTokens = 0;
  private totalCompletionTokens = 0;
  private serverStartTime = Date.now();

  constructor() {
    // Seed initial mock logs to demonstrate the telemetry pipeline immediately
    this.seedInitialLogs();
  }

  private seedInitialLogs() {
    const models = ['nova-autonomous-v1', 'nova-reasoner-v1', 'nova-coder-v1', 'nova-knowledge-rag-v1'];
    const intents = ['code_generation_analysis', 'system_architecture', 'mathematical_scientific_reasoning', 'memory_query'];
    
    for (let i = 0; i < 6; i++) {
      const ts = Date.now() - (6 - i) * 45000;
      this.recordLog({
        endpoint: '/v1/chat/completions',
        method: 'POST',
        statusCode: 200,
        latencyMs: 120 + Math.floor(Math.random() * 250),
        model: models[i % models.length],
        promptTokens: 45 + i * 15,
        completionTokens: 180 + i * 40,
        intent: intents[i % intents.length],
        previewPrompt: i === 0 ? 'Explain CAP theorem in distributed systems' : 'Build concurrent worker pool in TypeScript',
        previewResponse: 'Guaranteed architectural analysis with zero hallucination...',
        clientIp: '127.0.0.1',
        stream: false,
        customTimestamp: ts,
      });
    }
  }

  public recordLog(params: {
    endpoint: string;
    method: string;
    statusCode: number;
    latencyMs: number;
    model: string;
    promptTokens: number;
    completionTokens: number;
    intent?: string;
    previewPrompt: string;
    previewResponse: string;
    clientIp?: string;
    stream: boolean;
    customTimestamp?: number;
  }): RequestLog {
    this.totalRequests++;
    this.totalPromptTokens += params.promptTokens;
    this.totalCompletionTokens += params.completionTokens;

    const log: RequestLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: params.customTimestamp || Date.now(),
      endpoint: params.endpoint,
      method: params.method,
      statusCode: params.statusCode,
      latencyMs: params.latencyMs,
      model: params.model,
      promptTokens: params.promptTokens,
      completionTokens: params.completionTokens,
      intent: params.intent,
      previewPrompt: params.previewPrompt.length > 80 ? params.previewPrompt.substring(0, 77) + '...' : params.previewPrompt,
      previewResponse: params.previewResponse.length > 100 ? params.previewResponse.substring(0, 97) + '...' : params.previewResponse,
      clientIp: params.clientIp || '127.0.0.1',
      stream: params.stream,
    };

    this.logs.unshift(log);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    return log;
  }

  public getLogs(limit = 50): RequestLog[] {
    return this.logs.slice(0, limit);
  }

  public clearLogs() {
    this.logs = [];
  }

  public getMetrics() {
    const uptimeSeconds = Math.floor((Date.now() - this.serverStartTime) / 1000);
    const validLogs = this.logs.filter(l => l.statusCode === 200);

    const latencies = validLogs.map(l => l.latencyMs).sort((a, b) => a - b);
    const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
    const p95Latency = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] || latencies[latencies.length - 1] : 0;

    // Requests in the last minute
    const oneMinAgo = Date.now() - 60000;
    const recentLogs = this.logs.filter(l => l.timestamp >= oneMinAgo);
    const requestsPerMin = recentLogs.length;
    const tokensPerMin = recentLogs.reduce((sum, l) => sum + l.promptTokens + l.completionTokens, 0);

    const mem = process.memoryUsage();

    return {
      uptimeSeconds,
      totalRequests: this.totalRequests,
      totalPromptTokens: this.totalPromptTokens,
      totalCompletionTokens: this.totalCompletionTokens,
      totalTokens: this.totalPromptTokens + this.totalCompletionTokens,
      avgLatencyMs: avgLatency,
      p95LatencyMs: p95Latency,
      requestsPerMin,
      tokensPerMin,
      activeLogCount: this.logs.length,
      memory: {
        rssMb: Math.round(mem.rss / 1024 / 1024),
        heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      },
    };
  }
}

export const telemetryService = new TelemetryService();

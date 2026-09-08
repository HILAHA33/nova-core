/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Local Server Connector for Ollama / llama.cpp / vLLM
 * Allows running any size model (8B, 14B, 70B) on your local hardware with 0 API keys.
 */

export interface OllamaModel {
  name: string;
  size?: number;
  digest?: string;
  modified_at?: string;
}

export class LocalServerManager {
  private endpointUrl = 'http://localhost:11434';

  public setEndpoint(url: string) {
    this.endpointUrl = url.replace(/\/+$/, '');
  }

  public getEndpoint() {
    return this.endpointUrl;
  }

  /**
   * Check if local Ollama or llama.cpp server is reachable
   */
  public async checkConnection(): Promise<{ connected: boolean; models: string[]; error?: string }> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${this.endpointUrl}/api/tags`, {
        signal: controller.signal,
      });
      clearTimeout(id);

      if (res.ok) {
        const data = await res.json();
        const models = (data.models || []).map((m: any) => m.name || m.model);
        return { connected: true, models };
      }
      return { connected: false, models: [], error: `Server returned status ${res.status}` };
    } catch (err: any) {
      return { connected: false, models: [], error: 'Could not connect to local server at ' + this.endpointUrl };
    }
  }

  /**
   * Stream response from local Ollama endpoint
   */
  public async *streamChat(params: {
    model: string;
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    temperature?: number;
    systemPrompt?: string;
  }): AsyncGenerator<string> {
    const messages = [...params.messages];
    if (params.systemPrompt && (!messages[0] || messages[0].role !== 'system')) {
      messages.unshift({ role: 'system', content: params.systemPrompt });
    }

    const res = await fetch(`${this.endpointUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: params.model,
        messages,
        options: {
          temperature: params.temperature ?? 0.7,
        },
        stream: true,
      }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`Local server returned HTTP ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const textChunk = decoder.decode(value, { stream: true });
      const lines = textChunk.split('\n');

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          const chunk = parsed.message?.content || '';
          if (chunk) {
            yield chunk;
          }
        } catch {
          // ignore
        }
      }
    }
  }
}

export const localServerManager = new LocalServerManager();

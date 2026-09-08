/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * In-Browser Neural Engine powered by WebLLM & WebGPU
 * - 100% Free & Open-Source: No API Keys, No Quotas, No Subscription.
 * - Truly Smart: Runs genuine Meta Llama 3.2, Qwen 2.5, and DeepSeek R1 weights directly in your browser.
 * - Editable & Hackable: You can tweak prompts, temperature, stop sequences, and model weights right in this file.
 */

import * as webllm from '@mlc-ai/web-llm';

export interface LocalModelOption {
  id: string;
  name: string;
  family: 'Llama' | 'Qwen' | 'DeepSeek' | 'SmolLM' | 'Phi';
  size: string;
  downloadSize: string;
  description: string;
  recommendedFor: string;
}

export const SUPPORTED_LOCAL_MODELS: LocalModelOption[] = [
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    name: 'Meta Llama 3.2 (1B Instruct)',
    family: 'Llama',
    size: '1.2 Billion',
    downloadSize: '~870 MB',
    description: 'Meta\'s latest compact model. Ultra-fast, highly conversational, and low memory usage.',
    recommendedFor: 'Fast chat, creative brainstorming, quick answers, laptops with integrated GPUs.',
  },
  {
    id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    name: 'Meta Llama 3.2 (3B Instruct)',
    family: 'Llama',
    size: '3.2 Billion',
    downloadSize: '~2.2 GB',
    description: 'Meta\'s flagship small language model. Deep general knowledge, strong logic, and nuanced understanding.',
    recommendedFor: 'Complex reasoning, multi-turn dialogue, advanced analysis, GPUs with 4GB+ VRAM.',
  },
  {
    id: 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 Coder (1.5B Instruct)',
    family: 'Qwen',
    size: '1.5 Billion',
    downloadSize: '~1.1 GB',
    description: 'Alibaba Cloud\'s specialized coding powerhouse. Trained on 5.5T code tokens.',
    recommendedFor: 'Code generation, debugging, algorithms, TypeScript/Python/Rust architecture.',
  },
  {
    id: 'DeepSeek-R1-Distill-Qwen-1.5B-q4f16_1-MLC',
    name: 'DeepSeek R1 Distill (1.5B Reasoning)',
    family: 'DeepSeek',
    size: '1.5 Billion',
    downloadSize: '~1.1 GB',
    description: 'State-of-the-art chain-of-thought reasoning distilled from DeepSeek-R1.',
    recommendedFor: 'Step-by-step logic, mathematical proofs, complex troubleshooting.',
  },
  {
    id: 'SmolLM2-1.7B-Instruct-q4f16_1-MLC',
    name: 'SmolLM2 (1.7B Instruct)',
    family: 'SmolLM',
    size: '1.7 Billion',
    downloadSize: '~1.2 GB',
    description: 'Hugging Face\'s community-trained high-efficiency dialogue model.',
    recommendedFor: 'General assistance, balanced speed & memory efficiency.',
  },
];

export interface LoadProgress {
  status: 'idle' | 'checking' | 'downloading' | 'compiling' | 'ready' | 'error';
  progressPercent: number;
  text: string;
  error?: string;
}

class WebLlmManager {
  private engine: webllm.MLCEngineInterface | null = null;
  private currentModelId: string | null = null;
  private isInitializing = false;

  /**
   * Check if the user's browser supports WebGPU
   */
  public async checkWebGpuSupport(): Promise<{ supported: boolean; reason?: string }> {
    if (typeof window === 'undefined') {
      return { supported: false, reason: 'SSR environment' };
    }
    if (!(navigator as any).gpu) {
      return {
        supported: false,
        reason: 'WebGPU is not enabled or supported in this browser. Please use Chrome 113+, Edge 113+, or Firefox Nightly with WebGPU enabled.',
      };
    }
    try {
      const adapter = await (navigator as any).gpu.requestAdapter();
      if (!adapter) {
        return {
          supported: false,
          reason: 'No compatible WebGPU hardware adapter found. Ensure hardware acceleration is enabled in your browser settings.',
        };
      }
      return { supported: true };
    } catch (err: any) {
      return { supported: false, reason: err?.message || 'Error querying WebGPU adapter.' };
    }
  }

  /**
   * Initialize and load model weights directly into the browser
   */
  public async loadModel(
    modelId: string,
    onProgress: (progress: LoadProgress) => void
  ): Promise<void> {
    if (this.currentModelId === modelId && this.engine) {
      onProgress({ status: 'ready', progressPercent: 100, text: 'Model is already loaded and ready.' });
      return;
    }

    if (this.isInitializing) {
      throw new Error('Another model initialization is already in progress.');
    }

    this.isInitializing = true;
    onProgress({ status: 'checking', progressPercent: 5, text: 'Verifying WebGPU hardware & local cache...' });

    try {
      const webGpuStatus = await this.checkWebGpuSupport();
      if (!webGpuStatus.supported) {
        throw new Error(webGpuStatus.reason);
      }

      // Initialize MLCEngine
      const appConfig = webllm.prebuiltAppConfig;
      
      this.engine = await webllm.CreateMLCEngine(modelId, {
        appConfig,
        initProgressCallback: (report: webllm.InitProgressReport) => {
          // Calculate percentage from report (0.0 to 1.0)
          const pct = Math.min(100, Math.max(5, Math.round(report.progress * 100)));
          const isCompiling = report.text.toLowerCase().includes('compil') || report.text.toLowerCase().includes('warmup');
          
          onProgress({
            status: isCompiling ? 'compiling' : 'downloading',
            progressPercent: pct,
            text: report.text,
          });
        },
      });

      this.currentModelId = modelId;
      this.isInitializing = false;
      onProgress({
        status: 'ready',
        progressPercent: 100,
        text: `Loaded ${modelId} into WebGPU memory. Ready for instant inference!`,
      });
    } catch (err: any) {
      this.isInitializing = false;
      this.engine = null;
      this.currentModelId = null;
      onProgress({
        status: 'error',
        progressPercent: 0,
        text: 'Failed to initialize local model.',
        error: err?.message || String(err),
      });
      throw err;
    }
  }

  public isLoaded(): boolean {
    return this.engine !== null && this.currentModelId !== null;
  }

  public getLoadedModelId(): string | null {
    return this.currentModelId;
  }

  /**
   * Stream a chat completion with zero API keys directly from the local GPU
   * You can edit system prompts, decoding parameters, and temperature below!
   */
  public async *streamChat(params: {
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    temperature?: number;
    top_p?: number;
    maxTokens?: number;
    systemPrompt?: string;
  }): AsyncGenerator<{ text: string; tokensGenerated: number }> {
    if (!this.engine) {
      throw new Error('Local WebLLM engine is not loaded. Please load a model first.');
    }

    const messagesToSend = [...params.messages];

    // Inject system prompt if provided and not already present
    if (params.systemPrompt && (!messagesToSend[0] || messagesToSend[0].role !== 'system')) {
      messagesToSend.unshift({
        role: 'system',
        content: params.systemPrompt,
      });
    }

    const chunks = await this.engine.chat.completions.create({
      messages: messagesToSend as any,
      temperature: params.temperature ?? 0.7,
      top_p: params.top_p ?? 0.9,
      max_tokens: params.maxTokens ?? 2048,
      stream: true,
      stream_options: { include_usage: true },
    });

    let tokenCount = 0;

    for await (const chunk of chunks) {
      const delta = chunk.choices?.[0]?.delta?.content || '';
      if (delta) {
        tokenCount++;
        yield { text: delta, tokensGenerated: tokenCount };
      }
    }
  }

  /**
   * Reset or unload engine to free VRAM
   */
  public async unload(): Promise<void> {
    if (this.engine) {
      await this.engine.unload();
      this.engine = null;
      this.currentModelId = null;
    }
  }
}

export const webLlmManager = new WebLlmManager();

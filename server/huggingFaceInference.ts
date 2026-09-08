export interface HFMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface HFInferenceParams {
  messages: HFMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  onChunk?: (chunkText: string) => void;
}

// Ordered by highest intelligence-to-compute efficiency on Hugging Face Serverless
const HIGH_EFFICIENCY_HF_MODELS = [
  'meta-llama/Llama-3.3-70B-Instruct',
  'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
  'Qwen/Qwen2.5-Coder-32B-Instruct',
  'deepseek-ai/DeepSeek-R1-Distill-Qwen-14B',
  'Qwen/Qwen2.5-72B-Instruct',
  'meta-llama/Meta-Llama-3.1-8B-Instruct',
  'mistralai/Mistral-7B-Instruct-v0.3',
  'Qwen/Qwen2.5-7B-Instruct',
];

export function resolveHfModel(rawModel?: string): string {
  if (!rawModel) return HIGH_EFFICIENCY_HF_MODELS[0];
  const m = rawModel.trim().toLowerCase();
  if (m === 'llama' || m === 'llama3' || m === 'llama-3.3-70b' || m.includes('70b')) {
    return 'meta-llama/Llama-3.3-70B-Instruct';
  }
  if (m === 'llama-3.1-8b' || m.includes('8b')) {
    return 'meta-llama/Meta-Llama-3.1-8B-Instruct';
  }
  if (m === 'llama-3.2-3b' || m.includes('3b')) {
    return 'meta-llama/Llama-3.2-3B-Instruct';
  }
  if (m === 'llama-3.2-1b' || m.includes('1b')) {
    return 'meta-llama/Llama-3.2-1B-Instruct';
  }
  if (m.includes('qwen') && m.includes('coder')) {
    return 'Qwen/Qwen2.5-Coder-32B-Instruct';
  }
  if (m.includes('deepseek') || m.includes('r1')) {
    return 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B';
  }
  return rawModel;
}

export async function tryHuggingFaceInference(params: HFInferenceParams): Promise<{ text: string; model: string } | null> {
  const rawKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || process.env.HUGGING_FACE_HUB_TOKEN;

  if (!rawKey) {
    return null;
  }

  const apiKey = rawKey.trim();
  if (apiKey === 'MY_HUGGINGFACE_API_KEY' || apiKey === 'MY_HF_TOKEN' || apiKey.length < 5) {
    return null;
  }

  // Selected model or environment secret model (default: meta-llama/Llama-3.3-70B-Instruct)
  const configuredModel = (process.env.HUGGINGFACE_MODEL && process.env.HUGGINGFACE_MODEL !== 'MY_HUGGINGFACE_MODEL') 
    ? process.env.HUGGINGFACE_MODEL.trim() 
    : undefined;

  const resolvedRequestedModel = params.model ? resolveHfModel(params.model) : undefined;
  const primaryModel = resolvedRequestedModel || configuredModel || HIGH_EFFICIENCY_HF_MODELS[0];
  const candidateModels = [
    primaryModel,
    ...HIGH_EFFICIENCY_HF_MODELS.filter(m => m !== primaryModel),
  ];

  // Token optimization: ensure concise, high-density outputs that avoid wasting Hugging Face credits
  const maxTokensToRequest = Math.min(params.maxTokens || 1500, 2048);

  for (const model of candidateModels) {
    try {
      // 1. OpenAI-compatible Hugging Face router endpoints
      const endpoints = [
        'https://router.huggingface.co/hf-inference/v1/chat/completions',
        `https://api-inference.huggingface.co/models/${encodeURIComponent(model)}/v1/chat/completions`,
        'https://api-inference.huggingface.co/v1/chat/completions',
      ];

      for (const endpoint of endpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages: params.messages,
              temperature: params.temperature ?? 0.6,
              max_tokens: maxTokensToRequest,
              stream: false,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data: any = await response.json();
            const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text;
            if (text && typeof text === 'string' && text.trim()) {
              if (params.onChunk) {
                params.onChunk(text.trim());
              }
              return { text: text.trim(), model };
            }
          } else if (response.status === 401 || response.status === 403) {
            // Invalid token or unauthorized - stop immediately to avoid infinite retries
            return null;
          }
        } catch {
          // Attempt next endpoint
        }
      }

      // 2. Direct model pipeline endpoint fallback
      const directEndpoint = `https://api-inference.huggingface.co/models/${encodeURIComponent(model)}`;
      const promptText = params.messages
        .map(m => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n\n') + '\n\nASSISTANT:';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const directRes = await fetch(directEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          inputs: promptText,
          parameters: {
            temperature: params.temperature ?? 0.6,
            max_new_tokens: maxTokensToRequest,
            return_full_text: false,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (directRes.ok) {
        const raw: any = await directRes.json();
        let directText = '';
        if (Array.isArray(raw) && raw[0]?.generated_text) {
          directText = raw[0].generated_text;
        } else if (typeof raw?.generated_text === 'string') {
          directText = raw.generated_text;
        }

        if (directText && directText.trim()) {
          const cleaned = directText.replace(/^ASSISTANT:\s*/i, '').trim();
          if (params.onChunk) {
            params.onChunk(cleaned);
          }
          return { text: cleaned, model };
        }
      }
    } catch {
      // Model offline or pipeline unavailable, continue to next candidate
    }
  }

  return null;
}

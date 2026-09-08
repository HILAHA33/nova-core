import { memoryEngine } from './memoryEngine.js';
import { geminiCircuitBreaker } from './geminiCircuitBreaker.js';

/**
 * Background Teacher & Distillation Engine:
 * Analyzes interactions and distills facts, axioms, and technical domain rules
 * into Nova's persistent memory graph using Hugging Face (or Gemini fallback).
 */
export async function teachNova(userMessage: string, novaResponse: string) {
  const hfKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || process.env.HUGGING_FACE_HUB_TOKEN;
  const geminiKey = process.env.GEMINI_API_KEY;

  if ((!hfKey || hfKey === 'MY_HUGGINGFACE_API_KEY') && (!geminiKey || geminiKey === 'MY_GEMINI_API_KEY')) {
    // Autonomous self-extraction fallback if external teachers are not connected
    extractHeuristicFacts(userMessage, novaResponse);
    return;
  }

  const prompt = `Analyze this AI interaction and extract 1 to 3 permanent, high-value technical facts, component rules, or domain relationships that should be stored in memory.

User Query: "${userMessage}"
AI Response: "${novaResponse.slice(0, 1000)}"

Return ONLY a valid JSON array of concise string facts.
Example format:
["A Tesla coil requires high-voltage primary capacitor tank resonance.", "LSM-Tree compaction reduces read amplification."]`;

  // 1. Try Hugging Face as teacher if available
  if (hfKey && hfKey !== 'MY_HUGGINGFACE_API_KEY') {
    try {
      const { tryHuggingFaceInference } = await import('./huggingFaceInference.js');
      const hfResult = await tryHuggingFaceInference({
        messages: [
          { role: 'system', content: 'You are an expert AI knowledge extractor. Output only raw JSON array of strings.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        maxTokens: 500,
      });

      if (hfResult && hfResult.text) {
        const parsed = parseFactsJson(hfResult.text);
        if (parsed.length > 0) {
          saveLearnedFacts(parsed, 'teacher-huggingface');
          return;
        }
      }
    } catch (e: any) {
      console.warn('[Nova Teacher] Hugging Face teacher pass failed, checking Gemini:', e?.message || e);
    }
  }

  // 2. Try Gemini as teacher (if not cooling down from quota limits)
  if (geminiKey && geminiKey !== 'MY_GEMINI_API_KEY' && !geminiCircuitBreaker.isCoolingDown()) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest'];
      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              temperature: 0.2,
            },
          });
          const text = response.text || '[]';
          const parsed = parseFactsJson(text);
          if (parsed.length > 0) {
            geminiCircuitBreaker.recordSuccess();
            saveLearnedFacts(parsed, 'teacher-gemini');
            return;
          }
        } catch (err: any) {
          const record = geminiCircuitBreaker.recordError(err);
          if (record.isRateLimited) {
            break;
          }
        }
      }
    } catch {
      // Fall through to heuristic extractor
    }
  }

  // 3. Heuristic fallback
  extractHeuristicFacts(userMessage, novaResponse);
}

function parseFactsJson(rawText: string): string[] {
  try {
    const cleaned = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const startIdx = cleaned.indexOf('[');
    const endIdx = cleaned.lastIndexOf(']');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const jsonSubstr = cleaned.substring(startIdx, endIdx + 1);
      const parsed = JSON.parse(jsonSubstr);
      if (Array.isArray(parsed)) {
        return parsed.filter(item => typeof item === 'string' && item.trim().length > 5);
      }
    }
  } catch (err) {
    // JSON parsing failed
  }
  return [];
}

function saveLearnedFacts(facts: string[], source: string) {
  for (const fact of facts) {
    const trimmed = fact.trim();
    if (trimmed.length > 5) {
      memoryEngine.addFact(
        trimmed,
        'domain_knowledge',
        ['auto-learned', source],
        'nova_teacher',
        0.95
      );
      console.log(`[Nova Teacher] Stored learned fact (${source}): ${trimmed}`);
    }
  }
}

function extractHeuristicFacts(userMessage: string, novaResponse: string) {
  // Extract bullet points or key definitions if present
  const lines = novaResponse.split('\n');
  const bullets = lines
    .filter(l => l.trim().startsWith('•') || l.trim().startsWith('-') || l.trim().startsWith('*'))
    .map(l => l.replace(/^[\s•\-\*]+/, '').trim())
    .filter(l => l.length > 20 && l.length < 200 && !l.toLowerCase().includes('http'));

  if (bullets.length > 0) {
    saveLearnedFacts(bullets.slice(0, 2), 'heuristic-distillation');
  }
}

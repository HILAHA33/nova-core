export interface SequentialClause {
  raw: string;
  order: number;
  connector?: 'first' | 'then' | 'after' | 'next' | 'finally' | 'if' | 'when' | 'because' | 'before' | 'also' | 'additionally';
  actionOrSubject: string;
  conditionOrContext?: string;
  entities: string[];
}

export interface SequentialAnalysis {
  isMultiStepQuestion: boolean;
  hasTemporalSequencing: boolean;
  hasConditionalLogic: boolean;
  clauses: SequentialClause[];
  primaryGoal: string;
  subGoals: string[];
  contextDependencies: string[];
}

const TEMPORAL_CONNECTORS = [
  { pattern: /\b(first|firstly|to start|begin with)\b/i, type: 'first' as const },
  { pattern: /\b(then|after that|afterwards|subsequently)\b/i, type: 'then' as const },
  { pattern: /\b(next|following this|after this)\b/i, type: 'next' as const },
  { pattern: /\b(after|once|when)\s+([^,.;]+)/i, type: 'after' as const },
  { pattern: /\b(before|prior to)\s+([^,.;]+)/i, type: 'before' as const },
  { pattern: /\b(finally|lastly|in the end)\b/i, type: 'finally' as const },
  { pattern: /\b(if|provided that|assuming|in case)\s+([^,.;]+)/i, type: 'if' as const },
  { pattern: /\b(because|due to|since|as a result of)\s+([^,.;]+)/i, type: 'because' as const },
  { pattern: /\b(also|additionally|plus|and then|furthermore)\b/i, type: 'also' as const },
];

export function analyzeSequentialGrammar(text: string): SequentialAnalysis {
  if (!text || !text.trim()) {
    return {
      isMultiStepQuestion: false,
      hasTemporalSequencing: false,
      hasConditionalLogic: false,
      clauses: [],
      primaryGoal: '',
      subGoals: [],
      contextDependencies: [],
    };
  }

  // 1. Split text into logical sentences and compound clauses
  const rawSentences = text
    .split(/(?<=[.?!])\s+|\s+(?:and\s+then|and\s+after\s+that|and\s+also|but\s+first)\s+/i)
    .map(s => s.trim())
    .filter(Boolean);

  const clauses: SequentialClause[] = [];
  let isMultiStep = false;
  let hasTemporal = false;
  let hasConditional = false;
  const subGoals: string[] = [];
  const contextDependencies: string[] = [];

  let orderCounter = 1;

  for (const sentence of rawSentences) {
    // Check for comma-separated or connector-separated clauses
    const subSegments = sentence.split(/,\s*(?:then|after\s+that|next|and|or)\s+/i);

    for (const segment of subSegments) {
      const cleanSeg = segment.trim();
      if (!cleanSeg) continue;

      let detectedConnector: SequentialClause['connector'] = undefined;
      let conditionOrContext: string | undefined = undefined;

      for (const conn of TEMPORAL_CONNECTORS) {
        const match = cleanSeg.match(conn.pattern);
        if (match) {
          detectedConnector = conn.type;
          if (conn.type === 'after' || conn.type === 'before' || conn.type === 'if' || conn.type === 'because') {
            conditionOrContext = match[2] ? match[2].trim() : undefined;
            if (conn.type === 'if') hasConditional = true;
            if (conn.type === 'after' || conn.type === 'before') hasTemporal = true;
          } else {
            hasTemporal = true;
          }
          break;
        }
      }

      // Extract entities / key nouns
      const nouns = cleanSeg.match(/\b[A-Za-z0-9_-]{3,}\b/g) || [];
      const entities = nouns.filter(w => !['the', 'and', 'for', 'with', 'that', 'this', 'from', 'what', 'how', 'when', 'make', 'build'].includes(w.toLowerCase()));

      clauses.push({
        raw: cleanSeg,
        order: orderCounter++,
        connector: detectedConnector,
        actionOrSubject: cleanSeg.replace(/\b(first|then|next|finally|after that)\b/gi, '').trim(),
        conditionOrContext,
        entities,
      });

      if (detectedConnector && ['then', 'next', 'after', 'finally', 'also'].includes(detectedConnector)) {
        isMultiStep = true;
        subGoals.push(cleanSeg);
      }

      if (conditionOrContext) {
        contextDependencies.push(conditionOrContext);
      }
    }
  }

  // Determine primary goal from the first major clause
  const primaryGoal = clauses[0]?.actionOrSubject || text;

  if (clauses.length > 1) {
    isMultiStep = true;
  }

  return {
    isMultiStepQuestion: isMultiStep,
    hasTemporalSequencing: hasTemporal,
    hasConditionalLogic: hasConditional,
    clauses,
    primaryGoal,
    subGoals,
    contextDependencies,
  };
}

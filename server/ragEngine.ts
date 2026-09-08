import { KnowledgeDocument, NovaRetrievedDoc } from './types.js';
import { INITIAL_KNOWLEDGE_DOCS } from './knowledgeBase.js';

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'were', 'will', 'with', 'the', 'this', 'but', 'they',
  'have', 'had', 'what', 'when', 'where', 'who', 'which', 'why', 'how',
  'can', 'could', 'should', 'would', 'do', 'does', 'did', 'or', 'so'
]);

export class RagEngine {
  private documents: KnowledgeDocument[] = [];
  private avgDocLength = 0;
  private dfMap: Map<string, number> = new Map(); // Document frequency per term
  private totalDocs = 0;
  private k1 = 1.5;
  private b = 0.75;

  constructor() {
    this.init(INITIAL_KNOWLEDGE_DOCS);
  }

  public init(initialDocs: KnowledgeDocument[]) {
    this.documents = [];
    this.dfMap.clear();
    for (const doc of initialDocs) {
      this.addDocument(doc, false);
    }
    this.recalculateStats();
  }

  public tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .map(w => w.trim())
      .filter(w => w.length > 1 && !STOP_WORDS.has(w));
  }

  public addDocument(doc: KnowledgeDocument, recalculate = true) {
    const combinedText = `${doc.title} ${doc.category} ${doc.tags.join(' ')} ${doc.content}`;
    const tokens = this.tokenize(combinedText);
    const tf: Record<string, number> = {};

    for (const token of tokens) {
      tf[token] = (tf[token] || 0) + 1;
    }

    const preparedDoc: KnowledgeDocument = {
      ...doc,
      tokens,
      tf,
      docLength: tokens.length,
    };

    // Check if doc already exists
    const existingIndex = this.documents.findIndex(d => d.id === doc.id);
    if (existingIndex >= 0) {
      this.documents[existingIndex] = preparedDoc;
    } else {
      this.documents.push(preparedDoc);
    }

    if (recalculate) {
      this.recalculateStats();
    }
  }

  private recalculateStats() {
    this.totalDocs = this.documents.length;
    let totalLength = 0;
    this.dfMap.clear();

    for (const doc of this.documents) {
      totalLength += doc.docLength || 0;
      const uniqueTokens = new Set(doc.tokens || []);
      for (const token of uniqueTokens) {
        this.dfMap.set(token, (this.dfMap.get(token) || 0) + 1);
      }
    }

    this.avgDocLength = this.totalDocs > 0 ? totalLength / this.totalDocs : 1;
  }

  private idf(term: string): number {
    const df = this.dfMap.get(term) || 0;
    if (df === 0) return 0;
    // Standard Lucene/BM25 IDF formula
    return Math.log(1 + (this.totalDocs - df + 0.5) / (df + 0.5));
  }

  public search(query: string, topK = 3, minScore = 0.5): NovaRetrievedDoc[] {
    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0 || this.documents.length === 0) {
      return [];
    }

    const scores: { doc: KnowledgeDocument; score: number }[] = [];

    const lowerQuery = query.toLowerCase();

    for (const doc of this.documents) {
      let bm25Score = 0;
      const docLen = doc.docLength || 1;

      for (const token of queryTokens) {
        const idfVal = this.idf(token);
        if (idfVal <= 0) continue;

        const tfVal = doc.tf?.[token] || 0;
        if (tfVal === 0) continue;

        const numerator = tfVal * (this.k1 + 1);
        const denominator = tfVal + this.k1 * (1 - this.b + this.b * (docLen / this.avgDocLength));
        bm25Score += idfVal * (numerator / denominator);
      }

      // Title exact/partial boost
      if (doc.title.toLowerCase().includes(lowerQuery)) {
        bm25Score += 4.0;
      }
      for (const tag of doc.tags) {
        if (lowerQuery.includes(tag.toLowerCase())) {
          bm25Score += 2.0;
        }
      }

      if (bm25Score >= minScore) {
        scores.push({ doc, score: bm25Score });
      }
    }

    // Sort descending by score
    scores.sort((a, b) => b.score - a.score);

    return scores.slice(0, topK).map(({ doc, score }) => {
      // Find the most relevant excerpt
      const snippet = this.extractSnippet(doc.content, queryTokens);
      return {
        id: doc.id,
        title: doc.title,
        category: doc.category,
        score: Math.round(score * 100) / 100,
        snippet,
      };
    });
  }

  private extractSnippet(content: string, queryTokens: string[], maxLength = 260): string {
    const sentences = content.split(/\n+|\.\s+/).map(s => s.trim()).filter(Boolean);
    let bestSentence = sentences[0] || content;
    let maxMatches = -1;

    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      let matches = 0;
      for (const token of queryTokens) {
        if (lower.includes(token)) matches++;
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        bestSentence = sentence;
      }
    }

    if (bestSentence.length > maxLength) {
      return bestSentence.substring(0, maxLength).trim() + '...';
    }
    return bestSentence;
  }

  public getAllDocuments(): KnowledgeDocument[] {
    return this.documents.map(d => ({
      id: d.id,
      title: d.title,
      category: d.category,
      tags: d.tags,
      content: d.content,
    }));
  }

  public getDocumentCount(): number {
    return this.documents.length;
  }
}

export const ragEngine = new RagEngine();

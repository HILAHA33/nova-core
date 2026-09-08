import fs from 'fs';
import path from 'path';
import { MemoryFact, MemoryGraphData, GraphNode, GraphLink } from './types.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const MEMORY_FILE = path.join(DATA_DIR, 'nova_memory.json');

const SEED_FACTS: MemoryFact[] = [
  {
    id: 'fact-seed-1',
    text: 'Nova Core AI is a self-hosted, standalone AI brain operating without external third-party API keys.',
    category: 'system_fact',
    tags: ['nova-core', 'architecture', 'standalone'],
    source: 'system_bootstrap',
    confidence: 1.0,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'fact-seed-2',
    text: 'The reasoning pipeline couples semantic intent routing with BM25 vector retrieval and an internal reasoning engine.',
    category: 'domain_knowledge',
    tags: ['rag', 'bm25', 'reasoning'],
    source: 'system_bootstrap',
    confidence: 0.98,
    createdAt: Date.now() - 80000000,
    updatedAt: Date.now() - 80000000,
  },
  {
    id: 'fact-seed-3',
    text: 'Client API calls authenticate via Bearer token API_SECRET_KEY and conform to OpenAI API specs.',
    category: 'system_fact',
    tags: ['openai-spec', 'auth', 'security'],
    source: 'system_bootstrap',
    confidence: 1.0,
    createdAt: Date.now() - 70000000,
    updatedAt: Date.now() - 70000000,
  },
  {
    id: 'fact-seed-4',
    text: 'Prefers strongly-typed TypeScript with strict compile verification and modular component decoupling.',
    category: 'user_preference',
    tags: ['typescript', 'clean-code', 'developer_guidelines'],
    source: 'default_preference',
    confidence: 0.95,
    createdAt: Date.now() - 60000000,
    updatedAt: Date.now() - 60000000,
  }
];

export class MemoryEngine {
  private facts: MemoryFact[] = [];

  constructor() {
    this.loadFromDisk();
  }

  private ensureDataDir() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (err) {
      console.error('Failed to create data directory:', err);
    }
  }

  private loadFromDisk() {
    this.ensureDataDir();
    try {
      if (fs.existsSync(MEMORY_FILE)) {
        const raw = fs.readFileSync(MEMORY_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.facts = parsed;
          return;
        }
      }
    } catch (err) {
      console.warn('Could not read existing nova_memory.json, initializing seeds:', err);
    }

    this.facts = [...SEED_FACTS];
    this.saveToDisk();
  }

  public saveToDisk() {
    try {
      this.ensureDataDir();
      fs.writeFileSync(MEMORY_FILE, JSON.stringify(this.facts, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save facts to disk:', err);
    }
  }

  public getFacts(): MemoryFact[] {
    return [...this.facts].sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public addFact(
    text: string,
    category: MemoryFact['category'] = 'domain_knowledge',
    tags: string[] = [],
    source = 'user_interaction',
    confidence = 0.95
  ): MemoryFact {
    const existing = this.facts.find(f => f.text.toLowerCase().trim() === text.toLowerCase().trim());
    if (existing) {
      existing.updatedAt = Date.now();
      existing.confidence = Math.min(1.0, existing.confidence + 0.05);
      this.saveToDisk();
      return existing;
    }

    const newFact: MemoryFact = {
      id: `fact-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      text: text.trim(),
      category,
      tags: tags.length > 0 ? tags : this.extractAutoTags(text),
      source,
      confidence,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.facts.unshift(newFact);
    this.saveToDisk();
    return newFact;
  }

  public deleteFact(id: string): boolean {
    const initialLen = this.facts.length;
    this.facts = this.facts.filter(f => f.id !== id);
    if (this.facts.length !== initialLen) {
      this.saveToDisk();
      return true;
    }
    return false;
  }

  public extractAutoTags(text: string): string[] {
    const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const tech = ['typescript', 'react', 'python', 'docker', 'database', 'sql', 'cache', 'redis', 'api', 'nova', 'memory', 'auth'];
    const matched = words.filter(w => tech.includes(w));
    return Array.from(new Set(matched.length > 0 ? matched : words.slice(0, 3)));
  }

  public extractFactsFromMessage(content: string): MemoryFact[] {
    const added: MemoryFact[] = [];
    const lower = content.toLowerCase();

    // Look for preference patterns
    const prefPatterns = [
      /(?:i prefer|my preference is|always use|never use)\s+([^.!?\n]+)/i,
      /(?:my name is|i am|call me)\s+([A-Za-z0-9_\- ]+)/i,
      /(?:i work with|our stack is|we use|i am building)\s+([^.!?\n]+)/i,
      /(?:remember that|note that|take note that)\s+([^.!?\n]+)/i,
    ];

    for (const pattern of prefPatterns) {
      const match = content.match(pattern);
      if (match && match[1] && match[1].trim().length > 3) {
        const factText = match[0].trim();
        const fact = this.addFact(factText, 'user_preference', [], 'dialogue_extraction', 0.9);
        added.push(fact);
      }
    }

    return added;
  }

  public queryRelevantFacts(query: string, limit = 4): MemoryFact[] {
    const queryWords = (query.toLowerCase().match(/\b[a-z0-9]{3,}\b/g) || []);
    if (queryWords.length === 0) return [];

    const scored = this.facts.map(fact => {
      let score = 0;
      const factLower = fact.text.toLowerCase();
      for (const word of queryWords) {
        if (factLower.includes(word)) score += 2;
        for (const tag of fact.tags) {
          if (tag.toLowerCase().includes(word)) score += 3;
        }
      }
      return { fact, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.fact);
  }

  public getMemoryGraphData(): MemoryGraphData {
    const nodesMap = new Map<string, GraphNode>();
    const links: GraphLink[] = [];

    // Add Central Nodes
    nodesMap.set('nova-brain', { id: 'nova-brain', label: 'Nova Brain', type: 'concept', val: 24 });
    nodesMap.set('user-profile', { id: 'user-profile', label: 'User Context', type: 'user', val: 18 });
    nodesMap.set('knowledge-base', { id: 'knowledge-base', label: 'Knowledge Base', type: 'domain', val: 20 });

    links.push({ source: 'nova-brain', target: 'user-profile', label: 'tracks' });
    links.push({ source: 'nova-brain', target: 'knowledge-base', label: 'queries' });

    for (const fact of this.facts) {
      const factNodeId = fact.id;
      const shortLabel = fact.text.length > 28 ? fact.text.substring(0, 26) + '...' : fact.text;
      
      let nodeType: GraphNode['type'] = 'concept';
      if (fact.category === 'user_preference') nodeType = 'preference';
      if (fact.category === 'domain_knowledge') nodeType = 'domain';

      nodesMap.set(factNodeId, {
        id: factNodeId,
        label: shortLabel,
        type: nodeType,
        val: Math.max(8, Math.round(fact.confidence * 12)),
      });

      if (fact.category === 'user_preference') {
        links.push({ source: 'user-profile', target: factNodeId, label: 'prefers' });
      } else {
        links.push({ source: 'knowledge-base', target: factNodeId, label: 'stores' });
      }

      // Link tags as satellite entity nodes
      for (const tag of fact.tags.slice(0, 2)) {
        const tagId = `tag-${tag}`;
        if (!nodesMap.has(tagId)) {
          nodesMap.set(tagId, { id: tagId, label: `#${tag}`, type: 'tech', val: 10 });
        }
        links.push({ source: factNodeId, target: tagId, label: 'tagged' });
      }
    }

    return {
      nodes: Array.from(nodesMap.values()),
      links,
      totalFacts: this.facts.length,
    };
  }
}

export const memoryEngine = new MemoryEngine();

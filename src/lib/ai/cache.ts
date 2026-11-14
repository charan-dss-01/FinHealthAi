interface CacheEntry {
  response: string;
  modelUsed: string;
  provider: 'gemini' | 'groq';
  timestamp: number;
}

class AIResponseCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly defaultTTLMs: number = 60 * 1000; // 60 seconds default for fast repeated UI questions

  private normalizeKey(businessId: string, query: string, language: string): string {
    const q = query.toLowerCase().trim().replace(/[?!.,;]/g, '');
    return `${businessId}:${language}:${q}`;
  }

  get(businessId: string, query: string, language: string): CacheEntry | null {
    const key = this.normalizeKey(businessId, query, language);
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.defaultTTLMs) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  set(businessId: string, query: string, language: string, response: string, modelUsed: string, provider: 'gemini' | 'groq'): void {
    // Only cache concise/deterministic answers, not error responses
    if (!response || response.includes('Unable to') || response.includes('⚠️')) return;

    const key = this.normalizeKey(businessId, query, language);
    this.cache.set(key, {
      response,
      modelUsed,
      provider,
      timestamp: Date.now(),
    });

    // Simple cache eviction if size exceeds 200 items
    if (this.cache.size > 200) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
  }

  invalidateBusiness(businessId: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${businessId}:`)) {
        this.cache.delete(key);
      }
    }
  }
}

export const aiResponseCache = new AIResponseCache();

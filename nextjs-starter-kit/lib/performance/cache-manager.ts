/**
 * Advanced Caching System for LangSet MVP
 * Multi-tier caching for database queries, API responses, and computed data
 */

import { createHash } from 'crypto';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  hitCount: number;
  accessTimes: number[];
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

class MultiTierCache {
  private static instance: MultiTierCache;
  
  // Memory cache (L1) - fastest, smallest
  private memoryCache = new Map<string, CacheEntry>();
  private readonly MAX_MEMORY_ENTRIES = 1000;
  
  // Persistent cache (L2) - slower, larger
  private persistentCache = new Map<string, CacheEntry>();
  private readonly MAX_PERSISTENT_ENTRIES = 10000;
  
  // Statistics
  private stats = {
    memory: { hits: 0, misses: 0 },
    persistent: { hits: 0, misses: 0 },
    evictions: 0
  };

  private constructor() {
    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
    
    // Log cache statistics every 15 minutes
    setInterval(() => this.logStats(), 15 * 60 * 1000);
  }

  static getInstance(): MultiTierCache {
    if (!MultiTierCache.instance) {
      MultiTierCache.instance = new MultiTierCache();
    }
    return MultiTierCache.instance;
  }

  // Get data with automatic tier promotion
  get<T>(key: string): T | null {
    const now = Date.now();
    
    // Check L1 (memory) first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && now < memoryEntry.timestamp + memoryEntry.ttl) {
      memoryEntry.hitCount++;
      memoryEntry.accessTimes.push(now);
      this.stats.memory.hits++;
      return memoryEntry.data;
    }

    this.stats.memory.misses++;

    // Check L2 (persistent)
    const persistentEntry = this.persistentCache.get(key);
    if (persistentEntry && now < persistentEntry.timestamp + persistentEntry.ttl) {
      persistentEntry.hitCount++;
      persistentEntry.accessTimes.push(now);
      this.stats.persistent.hits++;
      
      // Promote to L1 if frequently accessed
      if (persistentEntry.hitCount >= 3) {
        this.promoteToMemory(key, persistentEntry);
      }
      
      return persistentEntry.data;
    }

    this.stats.persistent.misses++;
    return null;
  }

  // Set data with intelligent tier placement
  set<T>(key: string, data: T, ttl: number = 30 * 60 * 1000): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl,
      hitCount: 0,
      accessTimes: [now]
    };

    // Determine tier based on data characteristics
    const dataSize = this.estimateSize(data);
    const shouldUseMemory = dataSize < 10000; // < 10KB goes to memory

    if (shouldUseMemory && this.memoryCache.size < this.MAX_MEMORY_ENTRIES) {
      this.memoryCache.set(key, entry);
    } else {
      this.persistentCache.set(key, entry);
      
      // Evict if needed
      if (this.persistentCache.size > this.MAX_PERSISTENT_ENTRIES) {
        this.evictLeastUsed(this.persistentCache);
      }
    }

    // Evict from memory if needed
    if (this.memoryCache.size > this.MAX_MEMORY_ENTRIES) {
      this.evictLeastUsed(this.memoryCache);
    }
  }

  // Delete from all tiers
  delete(key: string): boolean {
    const memoryDeleted = this.memoryCache.delete(key);
    const persistentDeleted = this.persistentCache.delete(key);
    return memoryDeleted || persistentDeleted;
  }

  // Clear all caches
  clear(): void {
    this.memoryCache.clear();
    this.persistentCache.clear();
    this.resetStats();
  }

  // Get cache statistics
  getStats(): {
    memory: CacheStats;
    persistent: CacheStats;
    total: CacheStats;
    evictions: number;
  } {
    const memoryStats = {
      hits: this.stats.memory.hits,
      misses: this.stats.memory.misses,
      size: this.memoryCache.size,
      hitRate: this.stats.memory.hits / Math.max(1, this.stats.memory.hits + this.stats.memory.misses)
    };

    const persistentStats = {
      hits: this.stats.persistent.hits,
      misses: this.stats.persistent.misses,
      size: this.persistentCache.size,
      hitRate: this.stats.persistent.hits / Math.max(1, this.stats.persistent.hits + this.stats.persistent.misses)
    };

    const totalHits = memoryStats.hits + persistentStats.hits;
    const totalMisses = memoryStats.misses + persistentStats.misses;

    return {
      memory: memoryStats,
      persistent: persistentStats,
      total: {
        hits: totalHits,
        misses: totalMisses,
        size: memoryStats.size + persistentStats.size,
        hitRate: totalHits / Math.max(1, totalHits + totalMisses)
      },
      evictions: this.stats.evictions
    };
  }

  private promoteToMemory(key: string, entry: CacheEntry): void {
    if (this.memoryCache.size >= this.MAX_MEMORY_ENTRIES) {
      this.evictLeastUsed(this.memoryCache);
    }
    this.memoryCache.set(key, { ...entry });
  }

  private evictLeastUsed(cache: Map<string, CacheEntry>): void {
    let leastUsedKey = '';
    let leastUsedScore = Infinity;

    for (const [key, entry] of cache.entries()) {
      // Calculate usage score based on hit count and recency
      const recency = Date.now() - entry.accessTimes[entry.accessTimes.length - 1];
      const score = entry.hitCount / (recency / 1000 / 60); // hits per minute
      
      if (score < leastUsedScore) {
        leastUsedScore = score;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      cache.delete(leastUsedKey);
      this.stats.evictions++;
    }
  }

  private cleanup(): void {
    const now = Date.now();
    
    // Cleanup memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now >= entry.timestamp + entry.ttl) {
        this.memoryCache.delete(key);
      }
    }

    // Cleanup persistent cache
    for (const [key, entry] of this.persistentCache.entries()) {
      if (now >= entry.timestamp + entry.ttl) {
        this.persistentCache.delete(key);
      }
    }
  }

  private estimateSize(data: any): number {
    return JSON.stringify(data).length;
  }

  private resetStats(): void {
    this.stats = {
      memory: { hits: 0, misses: 0 },
      persistent: { hits: 0, misses: 0 },
      evictions: 0
    };
  }

  private logStats(): void {
    const stats = this.getStats();
    if (stats.total.hits + stats.total.misses > 0) {
      console.info('[Cache] Performance stats:', {
        totalHitRate: Math.round(stats.total.hitRate * 100) + '%',
        memoryHitRate: Math.round(stats.memory.hitRate * 100) + '%',
        persistentHitRate: Math.round(stats.persistent.hitRate * 100) + '%',
        totalSize: stats.total.size,
        evictions: stats.evictions
      });
    }
  }
}

// Specialized cache managers for different data types
class DatabaseQueryCache {
  private cache = MultiTierCache.getInstance();
  private readonly DEFAULT_TTL = 15 * 60 * 1000; // 15 minutes

  generateKey(query: string, params?: any[]): string {
    const combined = query + (params ? JSON.stringify(params) : '');
    return createHash('md5').update(combined).digest('hex');
  }

  async get<T>(query: string, params?: any[]): Promise<T | null> {
    const key = `db:${this.generateKey(query, params)}`;
    return this.cache.get<T>(key);
  }

  set<T>(query: string, params: any[] | undefined, result: T, ttl?: number): void {
    const key = `db:${this.generateKey(query, params)}`;
    this.cache.set(key, result, ttl || this.DEFAULT_TTL);
  }

  invalidatePattern(pattern: string): void {
    // Invalidate all keys matching pattern (simple implementation)
    // In production, use Redis with pattern-based invalidation
    console.info(`[Cache] Invalidating pattern: ${pattern}`);
  }
}

class APIResponseCache {
  private cache = MultiTierCache.getInstance();
  private readonly DEFAULT_TTL = 10 * 60 * 1000; // 10 minutes

  generateKey(url: string, method: string = 'GET', body?: any): string {
    const combined = `${method}:${url}${body ? ':' + JSON.stringify(body) : ''}`;
    return createHash('md5').update(combined).digest('hex');
  }

  async get<T>(url: string, method?: string, body?: any): Promise<T | null> {
    const key = `api:${this.generateKey(url, method, body)}`;
    return this.cache.get<T>(key);
  }

  set<T>(url: string, method: string | undefined, body: any | undefined, result: T, ttl?: number): void {
    const key = `api:${this.generateKey(url, method, body)}`;
    this.cache.set(key, result, ttl || this.DEFAULT_TTL);
  }
}

class ComputationCache {
  private cache = MultiTierCache.getInstance();
  private readonly DEFAULT_TTL = 60 * 60 * 1000; // 1 hour

  generateKey(operation: string, inputs: any[]): string {
    const combined = operation + JSON.stringify(inputs);
    return createHash('md5').update(combined).digest('hex');
  }

  async get<T>(operation: string, inputs: any[]): Promise<T | null> {
    const key = `compute:${this.generateKey(operation, inputs)}`;
    return this.cache.get<T>(key);
  }

  set<T>(operation: string, inputs: any[], result: T, ttl?: number): void {
    const key = `compute:${this.generateKey(operation, inputs)}`;
    this.cache.set(key, result, ttl || this.DEFAULT_TTL);
  }
}

// Cache-aware function decorator
export function cached<T extends (...args: any[]) => Promise<any>>(
  operation: string,
  ttl: number = 30 * 60 * 1000
) {
  const computationCache = new ComputationCache();

  return function(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<T>) {
    const method = descriptor.value!;

    descriptor.value = (async function(this: any, ...args: any[]) {
      // Check cache first
      const cached = await computationCache.get(operation, args);
      if (cached !== null) {
        return cached;
      }

      // Execute function and cache result
      const result = await method.apply(this, args);
      computationCache.set(operation, args, result, ttl);
      
      return result;
    }) as T;

    return descriptor;
  };
}

// Cache warming for frequently accessed data
class CacheWarmer {
  private dbCache = new DatabaseQueryCache();
  private apiCache = new APIResponseCache();

  async warmUserData(userId: string): Promise<void> {
    const queries = [
      { query: 'SELECT * FROM user WHERE id = ?', params: [userId] },
      { query: 'SELECT * FROM dataset WHERE userId = ?', params: [userId] },
      { query: 'SELECT * FROM instance WHERE userId = ? ORDER BY createdAt DESC LIMIT 20', params: [userId] }
    ];

    await Promise.all(queries.map(async ({ query, params }) => {
      // Simulate database call (would use actual DB in production)
      const mockResult = { data: `mock-result-${query}` };
      this.dbCache.set(query, params, mockResult);
    }));

    console.info(`[Cache] Warmed cache for user: ${userId}`);
  }

  async warmFrequentQueries(): Promise<void> {
    const frequentQueries = [
      'SELECT COUNT(*) FROM user',
      'SELECT * FROM dataset WHERE status = "published" ORDER BY createdAt DESC LIMIT 10',
      'SELECT AVG(qualityScore) FROM instance WHERE createdAt > NOW() - INTERVAL 1 DAY'
    ];

    await Promise.all(frequentQueries.map(async (query) => {
      // Simulate database call
      const mockResult = { data: `mock-result-${query}` };
      this.dbCache.set(query, undefined, mockResult, 5 * 60 * 1000); // 5 minute TTL
    }));

    console.info('[Cache] Warmed frequent queries');
  }
}

// Export cache instances
export const multiTierCache = MultiTierCache.getInstance();
export const dbCache = new DatabaseQueryCache();
export const apiCache = new APIResponseCache();
export const computationCache = new ComputationCache();
export const cacheWarmer = new CacheWarmer();

// Utility functions
export function getCacheKey(prefix: string, ...parts: (string | number)[]): string {
  const combined = parts.join(':');
  return `${prefix}:${createHash('md5').update(combined).digest('hex')}`;
}

export async function withCache<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  ttl: number = 30 * 60 * 1000
): Promise<T> {
  const cached = multiTierCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  const result = await fetchFunction();
  multiTierCache.set(key, result, ttl);
  return result;
}

// Cache invalidation patterns
export const CacheInvalidation = {
  user: (userId: string) => {
    const patterns = [
      `db:*user*${userId}*`,
      `api:*/users/${userId}*`,
      `compute:*${userId}*`
    ];
    patterns.forEach(pattern => {
      console.info(`[Cache] Invalidating pattern: ${pattern}`);
      // In production, implement pattern-based invalidation
    });
  },

  dataset: (datasetId: string) => {
    const patterns = [
      `db:*dataset*${datasetId}*`,
      `api:*/datasets/${datasetId}*`,
      `compute:*${datasetId}*`
    ];
    patterns.forEach(pattern => {
      console.info(`[Cache] Invalidating pattern: ${pattern}`);
    });
  },

  instance: (instanceId: string) => {
    const patterns = [
      `db:*instance*${instanceId}*`,
      `api:*/instances/${instanceId}*`
    ];
    patterns.forEach(pattern => {
      console.info(`[Cache] Invalidating pattern: ${pattern}`);
    });
  }
};

// Performance monitoring
setInterval(() => {
  const stats = multiTierCache.getStats();
  
  if (stats.total.hitRate < 0.7) {
    console.warn(`[Cache] Low hit rate detected: ${Math.round(stats.total.hitRate * 100)}%`);
  }
  
  if (stats.total.size > 8000) {
    console.warn(`[Cache] High cache usage: ${stats.total.size} entries`);
  }
}, 10 * 60 * 1000); // Check every 10 minutes
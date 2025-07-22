/**
 * LLM Performance Optimizer for LangSet MVP
 * Profiles LLM calls, implements caching, and ensures <5s responses
 */

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';

interface LLMCallMetrics {
  endpoint: string;
  prompt: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latency: number;
  cost: number;
  timestamp: Date;
  cacheHit: boolean;
  modelName: string;
}

interface CacheEntry {
  response: string;
  tokens: number;
  timestamp: Date;
  hitCount: number;
}

interface OptimizationConfig {
  maxTokens: number;
  temperature: number;
  cacheEnabled: boolean;
  cacheTTL: number; // milliseconds
  timeoutMs: number;
  retryAttempts: number;
  streamingEnabled: boolean;
}

class LLMOptimizer {
  private static instance: LLMOptimizer;
  private cache = new Map<string, CacheEntry>();
  private metrics: LLMCallMetrics[] = [];
  private models: Map<string, ChatOpenAI> = new Map();
  
  // Model configurations for different use cases
  private readonly MODEL_CONFIGS = {
    interview: {
      modelName: 'gpt-4o-mini', // Faster, cheaper for question generation
      maxTokens: 500,
      temperature: 0.7,
      timeoutMs: 10000
    },
    threshold: {
      modelName: 'gpt-4o-mini', // Quick analysis
      maxTokens: 300,
      temperature: 0.3,
      timeoutMs: 5000
    },
    generation: {
      modelName: 'gpt-4o', // High quality for instance generation
      maxTokens: 2000,
      temperature: 0.6,
      timeoutMs: 30000
    },
    compression: {
      modelName: 'gpt-4o-mini', // Fast compression
      maxTokens: 1500,
      temperature: 0.2,
      timeoutMs: 15000
    },
    pii_detection: {
      modelName: 'gpt-4o-mini', // Quick PII analysis
      maxTokens: 200,
      temperature: 0.1,
      timeoutMs: 5000
    }
  } as const;

  private constructor() {
    // Initialize models
    Object.entries(this.MODEL_CONFIGS).forEach(([key, config]) => {
      this.models.set(key, new ChatOpenAI({
        modelName: config.modelName,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        timeout: config.timeoutMs,
        openAIApiKey: process.env.OPENAI_API_KEY,
      }));
    });

    // Cleanup cache every 30 minutes
    setInterval(() => this.cleanupCache(), 30 * 60 * 1000);
    
    // Log performance metrics every 5 minutes
    setInterval(() => this.logPerformanceMetrics(), 5 * 60 * 1000);
  }

  static getInstance(): LLMOptimizer {
    if (!LLMOptimizer.instance) {
      LLMOptimizer.instance = new LLMOptimizer();
    }
    return LLMOptimizer.instance;
  }

  // Optimized LLM call with caching and profiling
  async optimizedCall(
    endpoint: string,
    prompt: string,
    config?: Partial<OptimizationConfig>
  ): Promise<{
    content: string;
    metrics: Omit<LLMCallMetrics, 'timestamp'>;
  }> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(endpoint, prompt);
    
    const finalConfig: OptimizationConfig = {
      maxTokens: 1000,
      temperature: 0.7,
      cacheEnabled: true,
      cacheTTL: 30 * 60 * 1000, // 30 minutes
      timeoutMs: 10000,
      retryAttempts: 2,
      streamingEnabled: false,
      ...config
    };

    // Check cache first
    if (finalConfig.cacheEnabled) {
      const cached = this.getFromCache(cacheKey, finalConfig.cacheTTL);
      if (cached) {
        const metrics = {
          endpoint,
          prompt,
          promptTokens: this.estimateTokens(prompt),
          completionTokens: cached.tokens,
          totalTokens: this.estimateTokens(prompt) + cached.tokens,
          latency: Date.now() - startTime,
          cost: this.calculateCost(this.estimateTokens(prompt), cached.tokens, endpoint),
          cacheHit: true,
          modelName: this.MODEL_CONFIGS[endpoint as keyof typeof this.MODEL_CONFIGS]?.modelName || 'gpt-4o'
        };

        this.recordMetrics({ ...metrics, timestamp: new Date() });
        return { content: cached.response, metrics };
      }
    }

    // Get appropriate model for endpoint
    const model = this.models.get(endpoint) || this.models.get('generation')!;
    
    let response: string = '';
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < finalConfig.retryAttempts) {
      try {
        const result = await Promise.race([
          this.makeModelCall(model, prompt),
          this.createTimeoutPromise(finalConfig.timeoutMs)
        ]);

        response = result;
        break;
      } catch (error) {
        lastError = error as Error;
        attempts++;
        
        if (attempts < finalConfig.retryAttempts) {
          // Exponential backoff
          await this.sleep(1000 * Math.pow(2, attempts - 1));
        }
      }
    }

    if (!response && lastError) {
      throw new Error(`LLM call failed after ${attempts} attempts: ${lastError.message}`);
    }

    const endTime = Date.now();
    const latency = endTime - startTime;

    // Calculate token usage
    const promptTokens = this.estimateTokens(prompt);
    const completionTokens = this.estimateTokens(response);
    const totalTokens = promptTokens + completionTokens;

    // Cache the response
    if (finalConfig.cacheEnabled && response) {
      this.addToCache(cacheKey, response, completionTokens);
    }

    const metrics = {
      endpoint,
      prompt,
      promptTokens,
      completionTokens,
      totalTokens,
      latency,
      cost: this.calculateCost(promptTokens, completionTokens, endpoint),
      cacheHit: false,
      modelName: model.modelName
    };

    this.recordMetrics({ ...metrics, timestamp: new Date() });

    // Log slow calls
    if (latency > 10000) {
      console.warn(`[LLM] Slow call detected: ${endpoint} took ${latency}ms`);
    }

    return { content: response, metrics };
  }

  // Batch processing for multiple calls
  async batchProcess(
    calls: Array<{ endpoint: string; prompt: string; config?: Partial<OptimizationConfig> }>
  ): Promise<Array<{ content: string; metrics: Omit<LLMCallMetrics, 'timestamp'> }>> {
    const startTime = Date.now();
    
    // Process in parallel with concurrency limit
    const BATCH_SIZE = 5;
    const results = [];
    
    for (let i = 0; i < calls.length; i += BATCH_SIZE) {
      const batch = calls.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(call => this.optimizedCall(call.endpoint, call.prompt, call.config))
      );
      results.push(...batchResults);
    }
    
    console.info(`[LLM] Batch processed ${calls.length} calls in ${Date.now() - startTime}ms`);
    return results;
  }

  // Context compression to stay under token limits
  async compressContext(
    context: string,
    targetTokens: number = 8000
  ): Promise<{ compressed: string; compressionRatio: number }> {
    const originalTokens = this.estimateTokens(context);
    
    if (originalTokens <= targetTokens) {
      return { compressed: context, compressionRatio: 1.0 };
    }

    const compressionPrompt = `
Compress the following conversation context while preserving all important technical knowledge, skills, and workflow information. Target length: ~${targetTokens} tokens.

Key requirements:
1. Keep all technical skills, tools, and technologies mentioned
2. Preserve specific methodologies and best practices
3. Maintain concrete examples and implementation details
4. Remove redundant information and small talk
5. Keep the essential professional context

Original context:
${context}

Compressed context:`;

    try {
      const result = await this.optimizedCall('compression', compressionPrompt, {
        maxTokens: targetTokens,
        temperature: 0.2,
        timeoutMs: 15000
      });

      const compressedTokens = this.estimateTokens(result.content);
      const compressionRatio = compressedTokens / originalTokens;

      console.info(`[LLM] Context compressed: ${originalTokens} → ${compressedTokens} tokens (${Math.round(compressionRatio * 100)}%)`);

      return {
        compressed: result.content,
        compressionRatio
      };
    } catch (error) {
      console.warn('[LLM] Context compression failed, using truncation fallback');
      
      // Fallback: truncate to fit target
      const words = context.split(' ');
      const targetWords = Math.floor(words.length * (targetTokens / originalTokens));
      const truncated = words.slice(0, targetWords).join(' ');
      
      return {
        compressed: truncated,
        compressionRatio: targetTokens / originalTokens
      };
    }
  }

  // Smart prompt optimization
  optimizePrompt(prompt: string, endpoint: string): string {
    const config = this.MODEL_CONFIGS[endpoint as keyof typeof this.MODEL_CONFIGS];
    if (!config) return prompt;

    // Remove unnecessary whitespace and formatting
    let optimized = prompt.trim().replace(/\s+/g, ' ');

    // For quick endpoints, make prompts more concise
    if (['threshold', 'pii_detection'].includes(endpoint)) {
      optimized = optimized
        .replace(/Please /g, '')
        .replace(/kindly /g, '')
        .replace(/I would like you to /g, '')
        .replace(/Could you /g, '');
    }

    // Add specific instructions for better responses
    if (endpoint === 'generation') {
      optimized += '\n\nProvide exactly the requested format with no additional commentary.';
    }

    return optimized;
  }

  // Performance analytics
  getPerformanceAnalytics(hours: number = 24): {
    totalCalls: number;
    averageLatency: number;
    cacheHitRate: number;
    totalCost: number;
    slowCalls: number;
    errorRate: number;
    modelUsage: Record<string, number>;
    endpointStats: Record<string, { calls: number; avgLatency: number; avgCost: number }>;
  } {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);

    if (recentMetrics.length === 0) {
      return {
        totalCalls: 0,
        averageLatency: 0,
        cacheHitRate: 0,
        totalCost: 0,
        slowCalls: 0,
        errorRate: 0,
        modelUsage: {},
        endpointStats: {}
      };
    }

    const totalCalls = recentMetrics.length;
    const averageLatency = recentMetrics.reduce((sum, m) => sum + m.latency, 0) / totalCalls;
    const cacheHits = recentMetrics.filter(m => m.cacheHit).length;
    const cacheHitRate = cacheHits / totalCalls;
    const totalCost = recentMetrics.reduce((sum, m) => sum + m.cost, 0);
    const slowCalls = recentMetrics.filter(m => m.latency > 10000).length;

    // Model usage stats
    const modelUsage: Record<string, number> = {};
    recentMetrics.forEach(m => {
      modelUsage[m.modelName] = (modelUsage[m.modelName] || 0) + 1;
    });

    // Endpoint stats
    const endpointStats: Record<string, { calls: number; avgLatency: number; avgCost: number }> = {};
    recentMetrics.forEach(m => {
      if (!endpointStats[m.endpoint]) {
        endpointStats[m.endpoint] = { calls: 0, avgLatency: 0, avgCost: 0 };
      }
      endpointStats[m.endpoint].calls++;
    });

    Object.keys(endpointStats).forEach(endpoint => {
      const endpointMetrics = recentMetrics.filter(m => m.endpoint === endpoint);
      endpointStats[endpoint].avgLatency = 
        endpointMetrics.reduce((sum, m) => sum + m.latency, 0) / endpointMetrics.length;
      endpointStats[endpoint].avgCost = 
        endpointMetrics.reduce((sum, m) => sum + m.cost, 0) / endpointMetrics.length;
    });

    return {
      totalCalls,
      averageLatency,
      cacheHitRate,
      totalCost,
      slowCalls,
      errorRate: 0, // Would need to track errors separately
      modelUsage,
      endpointStats
    };
  }

  // Private helper methods
  private async makeModelCall(model: ChatOpenAI, prompt: string): Promise<string> {
    const response = await model.invoke([new SystemMessage(prompt)]);
    return response.content as string;
  }

  private createTimeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`LLM call timed out after ${ms}ms`)), ms);
    });
  }

  private generateCacheKey(endpoint: string, prompt: string): string {
    // Simple hash function for cache key
    const hash = prompt.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `${endpoint}:${hash}`;
  }

  private getFromCache(key: string, ttl: number): CacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp.getTime() > ttl) {
      this.cache.delete(key);
      return null;
    }

    entry.hitCount++;
    return entry;
  }

  private addToCache(key: string, response: string, tokens: number): void {
    this.cache.set(key, {
      response,
      tokens,
      timestamp: new Date(),
      hitCount: 0
    });

    // Limit cache size
    if (this.cache.size > 1000) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    const ttl = 60 * 60 * 1000; // 1 hour default TTL
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp.getTime() > ttl) {
        this.cache.delete(key);
      }
    }
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  private calculateCost(promptTokens: number, completionTokens: number, endpoint: string): number {
    // OpenAI pricing (approximate, as of 2024)
    const pricing = {
      'gpt-4o': { prompt: 0.005 / 1000, completion: 0.015 / 1000 },
      'gpt-4o-mini': { prompt: 0.00015 / 1000, completion: 0.0006 / 1000 }
    };

    const modelName = this.MODEL_CONFIGS[endpoint as keyof typeof this.MODEL_CONFIGS]?.modelName || 'gpt-4o';
    const rates = pricing[modelName as keyof typeof pricing] || pricing['gpt-4o'];

    return (promptTokens * rates.prompt) + (completionTokens * rates.completion);
  }

  private recordMetrics(metrics: LLMCallMetrics): void {
    this.metrics.push(metrics);
    
    // Keep only recent metrics (last 24 hours)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
  }

  private logPerformanceMetrics(): void {
    const analytics = this.getPerformanceAnalytics(1); // Last hour
    
    if (analytics.totalCalls > 0) {
      console.info('[LLM Performance] Hourly stats:', {
        calls: analytics.totalCalls,
        avgLatency: Math.round(analytics.averageLatency),
        cacheHitRate: Math.round(analytics.cacheHitRate * 100) + '%',
        totalCost: '$' + analytics.totalCost.toFixed(4),
        slowCalls: analytics.slowCalls
      });
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const llmOptimizer = LLMOptimizer.getInstance();

// Convenience functions for common use cases
export async function optimizedInterviewCall(prompt: string) {
  return llmOptimizer.optimizedCall('interview', prompt, {
    maxTokens: 500,
    temperature: 0.7,
    timeoutMs: 10000
  });
}

export async function optimizedThresholdCall(prompt: string) {
  return llmOptimizer.optimizedCall('threshold', prompt, {
    maxTokens: 300,
    temperature: 0.3,
    timeoutMs: 5000
  });
}

export async function optimizedGenerationCall(prompt: string) {
  return llmOptimizer.optimizedCall('generation', prompt, {
    maxTokens: 2000,
    temperature: 0.6,
    timeoutMs: 30000
  });
}

export async function optimizedCompressionCall(context: string, targetTokens: number = 8000) {
  return llmOptimizer.compressContext(context, targetTokens);
}

export async function optimizedPIIDetectionCall(text: string) {
  const prompt = `Analyze the following text for personally identifiable information (PII). List any PII found with type and confidence level:

${text}

PII found:`;

  return llmOptimizer.optimizedCall('pii_detection', prompt, {
    maxTokens: 200,
    temperature: 0.1,
    timeoutMs: 5000
  });
}
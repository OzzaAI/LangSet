/**
 * Redis-based Rate Limiting Implementation for LangSet MVP
 * Provides persistent rate limiting across server restarts and multiple instances
 */

import { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';
import { RedisCircuitBreaker } from './circuit-breaker';

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: NextRequest) => string;
}

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

class RedisRateLimiter {
  private static instance: RedisRateLimiter;

  private constructor() {}

  static getInstance(): RedisRateLimiter {
    if (!RedisRateLimiter.instance) {
      RedisRateLimiter.instance = new RedisRateLimiter();
    }
    return RedisRateLimiter.instance;
  }

  private getKey(req: NextRequest, config: RateLimitConfig): string {
    if (config.keyGenerator) {
      return `ratelimit:${config.keyGenerator(req)}`;
    }

    // Default key generation: IP + User ID if available
    const ip = req.ip || 
               req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               'unknown';
    
    const userId = req.headers.get('user-id') || '';
    return `ratelimit:${ip}:${userId}`;
  }

  async check(req: NextRequest, config: RateLimitConfig): Promise<RateLimitResult> {
    const key = this.getKey(req, config);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Use circuit breaker to protect Redis operations
    return await RedisCircuitBreaker.execute(async () => {
      // Use Redis pipeline for atomic operations
      const pipeline = redis.pipeline();
      
      // Remove expired entries
      pipeline.zremrangebyscore(key, 0, windowStart);
      
      // Count current requests in window
      pipeline.zcard(key);
      
      // Add current request
      pipeline.zadd(key, { score: now, member: `${now}-${Math.random()}` });
      
      // Set expiry
      pipeline.expire(key, Math.ceil(config.windowMs / 1000));
      
      const results = await pipeline.exec();
      
      if (!results || results.length < 4) {
        throw new Error('Redis pipeline failed');
      }

      const currentCount = (results[1].result as number) || 0;

      // Check if limit exceeded (before adding current request)
      if (currentCount >= config.maxRequests) {
        // Remove the request we just added since it's not allowed
        await redis.zpopmax(key);
        
        return {
          allowed: false,
          limit: config.maxRequests,
          remaining: 0,
          resetTime: now + config.windowMs
        };
      }

      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: Math.max(0, config.maxRequests - (currentCount + 1)),
        resetTime: now + config.windowMs
      };
    }).catch((error) => {
      console.error('[Redis Rate Limiter] Circuit breaker error:', error);
      
      // Fallback to allowing request if Redis fails
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs
      };
    });
  }

  async reset(req: NextRequest, config: RateLimitConfig): Promise<void> {
    const key = this.getKey(req, config);
    
    try {
      await redis.del(key);
    } catch (error) {
      console.error('[Redis Rate Limiter] Error resetting key:', error);
    }
  }

  // Get current usage for a key
  async getUsage(req: NextRequest, config: RateLimitConfig): Promise<{
    current: number;
    limit: number;
    remaining: number;
  }> {
    const key = this.getKey(req, config);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    try {
      // Remove expired entries and count current
      await redis.zremrangebyscore(key, 0, windowStart);
      const current = await redis.zcard(key);

      return {
        current,
        limit: config.maxRequests,
        remaining: Math.max(0, config.maxRequests - current)
      };
    } catch (error) {
      console.error('[Redis Rate Limiter] Error getting usage:', error);
      return {
        current: 0,
        limit: config.maxRequests,
        remaining: config.maxRequests
      };
    }
  }

  // Get global rate limit stats (admin function)
  async getGlobalStats(): Promise<{
    totalKeys: number;
    topAbusers: Array<{ key: string; count: number; }>;
  }> {
    try {
      const keys = await redis.keys('ratelimit:*');
      const totalKeys = keys.length;

      // Get counts for top keys
      const pipeline = redis.pipeline();
      keys.slice(0, 10).forEach(key => {
        pipeline.zcard(key);
      });
      
      const results = await pipeline.exec();
      
      const topAbusers = keys.slice(0, 10).map((key, index) => ({
        key: key.replace('ratelimit:', ''),
        count: (results?.[index]?.result as number) || 0
      })).sort((a, b) => b.count - a.count);

      return { totalKeys, topAbusers };
    } catch (error) {
      console.error('[Redis Rate Limiter] Error getting global stats:', error);
      return { totalKeys: 0, topAbusers: [] };
    }
  }
}

// Rate limit configurations remain the same
export const RATE_LIMIT_CONFIGS = {
  // General API endpoints
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  
  // Authentication endpoints (stricter)
  auth: {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  
  // Interview submission
  interview: {
    maxRequests: 50,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  
  // Instance generation (expensive operations)
  generation: {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  
  // Dataset submission
  submission: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  
  // File uploads
  upload: {
    maxRequests: 30,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  
  // Aggressive rate limiting for suspicious activity
  strict: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },

  // Marketplace actions (offers, transactions)
  marketplace: {
    maxRequests: 25,
    windowMs: 60 * 60 * 1000, // 1 hour
  },

  // Search operations
  search: {
    maxRequests: 200,
    windowMs: 60 * 1000, // 1 minute
  }
} as const;

// Enhanced rate limiting middleware with Redis
export function redisRateLimit(config: RateLimitConfig) {
  const limiter = RedisRateLimiter.getInstance();

  return async (req: NextRequest): Promise<RateLimitResult> => {
    const result = await limiter.check(req, config);
    
    if (!result.allowed) {
      const ip = req.ip || req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
      console.warn(`[Redis Rate Limit] Request blocked for ${ip}: ${req.url}`);
      
      // Log to analytics for abuse detection
      if (typeof window !== "undefined" && window.posthog) {
        window.posthog.capture("rate_limit_exceeded", {
          ip: ip,
          url: req.url,
          user_agent: req.headers.get('user-agent'),
          timestamp: new Date().toISOString(),
        });
      }
    }
    
    return result;
  };
}

// User-specific rate limiting
export function userRateLimit(config: RateLimitConfig) {
  return redisRateLimit({
    ...config,
    keyGenerator: (req) => {
      const userId = req.headers.get('user-id') || req.ip || 'anonymous';
      return `user:${userId}`;
    }
  });
}

// IP-based rate limiting (strict)
export function ipRateLimit(config: RateLimitConfig) {
  return redisRateLimit({
    ...config,
    keyGenerator: (req) => {
      const ip = req.ip || 
                 req.headers.get('x-forwarded-for')?.split(',')[0] || 
                 req.headers.get('x-real-ip') || 
                 'unknown';
      return `ip:${ip}`;
    }
  });
}

// Endpoint-specific rate limiting
export function endpointRateLimit(endpoint: string, config: RateLimitConfig) {
  return redisRateLimit({
    ...config,
    keyGenerator: (req) => {
      const ip = req.ip || req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
      const userId = req.headers.get('user-id') || '';
      return `endpoint:${endpoint}:${ip}:${userId}`;
    }
  });
}

// Adaptive rate limiting that increases restrictions for suspicious patterns
export class AdaptiveRateLimiter {
  private limiter = RedisRateLimiter.getInstance();
  
  async check(req: NextRequest, baseConfig: RateLimitConfig): Promise<RateLimitResult> {
    const ip = req.ip || req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const suspiciousKey = `suspicious:${ip}`;
    
    try {
      // Check if IP has been marked as suspicious in the last hour
      const suspiciousScore = await redis.get(suspiciousKey) || 0;
      
      // Adjust rate limits based on suspicious activity
      const adjustedConfig = {
        ...baseConfig,
        maxRequests: Math.max(1, Math.floor(baseConfig.maxRequests * (1 - (suspiciousScore as number) * 0.1))),
        keyGenerator: (req: NextRequest) => `adaptive:${ip}:${req.headers.get('user-id') || ''}`
      };
      
      const result = await this.limiter.check(req, adjustedConfig);
      
      // If blocked, increment suspicious score
      if (!result.allowed) {
        await redis.incr(suspiciousKey);
        await redis.expire(suspiciousKey, 3600); // 1 hour
      }
      
      return result;
    } catch (error) {
      console.error('[Adaptive Rate Limiter] Error:', error);
      return await this.limiter.check(req, baseConfig);
    }
  }
}

// Use the shared circuit breaker system instead of custom implementation

// Export singleton instances
export const redisRateLimiter = RedisRateLimiter.getInstance();
export const adaptiveRateLimiter = new AdaptiveRateLimiter();
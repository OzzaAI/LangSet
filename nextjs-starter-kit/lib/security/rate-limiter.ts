/**
 * Rate Limiting Implementation for LangSet MVP
 * Protects API endpoints from abuse and ensures fair usage
 */

import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: NextRequest) => string;
}

class RateLimiter {
  private static instance: RateLimiter;
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  private constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key);
      }
    }
  }

  private getKey(req: NextRequest, keyGenerator?: (req: NextRequest) => string): string {
    if (keyGenerator) {
      return keyGenerator(req);
    }

    // Default key generation: IP + User ID if available
    const ip = req.ip || 
               req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               'unknown';
    
    const userId = req.headers.get('user-id') || '';
    return `${ip}:${userId}`;
  }

  check(req: NextRequest, config: RateLimitConfig): {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
  } {
    const key = this.getKey(req, config.keyGenerator);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    let entry = this.store.get(key);

    // If no entry exists or it's expired, create a new one
    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 1,
        resetTime: now + config.windowMs,
        firstRequest: now
      };
      this.store.set(key, entry);

      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        resetTime: entry.resetTime
      };
    }

    // Check if within the current window
    if (entry.firstRequest >= windowStart) {
      if (entry.count >= config.maxRequests) {
        return {
          allowed: false,
          limit: config.maxRequests,
          remaining: 0,
          resetTime: entry.resetTime
        };
      }

      entry.count++;
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - entry.count,
        resetTime: entry.resetTime
      };
    }

    // Reset the window
    entry.count = 1;
    entry.resetTime = now + config.windowMs;
    entry.firstRequest = now;

    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime
    };
  }

  reset(req: NextRequest, keyGenerator?: (req: NextRequest) => string): void {
    const key = this.getKey(req, keyGenerator);
    this.store.delete(key);
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Rate limit configurations for different endpoints
export const RATE_LIMIT_CONFIGS = {
  // General API endpoints
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  
  // Authentication endpoints
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
  }
} as const;

// Main rate limiting middleware
export function rateLimit(config: RateLimitConfig) {
  const limiter = RateLimiter.getInstance();

  return (req: NextRequest) => {
    const result = limiter.check(req, config);
    
    if (!result.allowed) {
      console.warn(`[Rate Limit] Request blocked for ${req.ip}: ${req.url}`);
    }
    
    return result;
  };
}

// User-specific rate limiting (uses user ID as key)
export function userRateLimit(config: RateLimitConfig) {
  return rateLimit({
    ...config,
    keyGenerator: (req) => {
      const userId = req.headers.get('user-id') || req.ip || 'anonymous';
      return `user:${userId}`;
    }
  });
}

// IP-based rate limiting (strict)
export function ipRateLimit(config: RateLimitConfig) {
  return rateLimit({
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

// Sliding window rate limiter for more precise control
export class SlidingWindowRateLimiter {
  private requests = new Map<string, number[]>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    
    // Cleanup old requests every minute
    setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    
    for (const [key, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(ts => ts > cutoff);
      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    }
  }

  check(key: string): boolean {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    
    let timestamps = this.requests.get(key) || [];
    
    // Remove old timestamps
    timestamps = timestamps.filter(ts => ts > cutoff);
    
    if (timestamps.length >= this.maxRequests) {
      return false;
    }
    
    timestamps.push(now);
    this.requests.set(key, timestamps);
    return true;
  }

  getRemainingRequests(key: string): number {
    const timestamps = this.requests.get(key) || [];
    const now = Date.now();
    const cutoff = now - this.windowMs;
    const validTimestamps = timestamps.filter(ts => ts > cutoff);
    
    return Math.max(0, this.maxRequests - validTimestamps.length);
  }
}

// Export singleton instance
export const rateLimiter = RateLimiter.getInstance();
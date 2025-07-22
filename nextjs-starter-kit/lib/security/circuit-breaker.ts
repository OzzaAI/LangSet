/**
 * Circuit Breaker Implementation for LangSet MVP
 * Prevents cascade failures when external services are down
 * Implements three states: CLOSED, OPEN, HALF_OPEN
 */

export enum CircuitState {
  CLOSED = 'closed',      // Normal operation
  OPEN = 'open',         // Circuit is open, requests fail fast
  HALF_OPEN = 'half_open' // Testing if service is back
}

export interface CircuitBreakerConfig {
  failureThreshold: number;    // Number of failures before opening circuit
  recoveryTimeoutMs: number;   // Time to wait before attempting recovery
  monitoringWindowMs: number;  // Window to track failures
  successThreshold: number;    // Successes needed to close circuit from half-open
  timeoutMs: number;          // Request timeout
}

export interface CircuitBreakerMetrics {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  requestCount: number;
  rejectedCount: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,      // Open after 5 failures
  recoveryTimeoutMs: 60000, // Wait 1 minute before trying again
  monitoringWindowMs: 60000, // Track failures over 1 minute
  successThreshold: 3,       // Need 3 successes to close
  timeoutMs: 5000           // 5 second timeout
};

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private requestCount: number = 0;
  private rejectedCount: number = 0;
  private readonly config: CircuitBreakerConfig;
  private readonly serviceName: string;

  constructor(serviceName: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.serviceName = serviceName;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.requestCount++;
    
    // Check if circuit should be closed based on monitoring window
    this.updateStateBasedOnTimeWindow();

    if (this.state === CircuitState.OPEN) {
      // Check if enough time has passed to attempt recovery
      if (this.shouldAttemptRecovery()) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0; // Reset success count for half-open state
        console.log(`[Circuit Breaker] ${this.serviceName}: Moving to HALF_OPEN state`);
      } else {
        this.rejectedCount++;
        throw new Error(`Circuit breaker is OPEN for ${this.serviceName}. Service unavailable.`);
      }
    }

    try {
      // Execute the function with timeout
      const result = await this.executeWithTimeout(fn);
      
      this.onSuccess();
      return result;

    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Execute function with timeout protection
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${this.config.timeoutMs}ms`));
      }, this.config.timeoutMs);
    });

    return Promise.race([fn(), timeoutPromise]);
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.lastSuccessTime = new Date();
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        console.log(`[Circuit Breaker] ${this.serviceName}: CLOSED - Service recovered`);
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on successful operation
      this.failureCount = Math.max(0, this.failureCount - 1);
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.lastFailureTime = new Date();
    this.failureCount++;

    if (this.state === CircuitState.CLOSED) {
      if (this.failureCount >= this.config.failureThreshold) {
        this.state = CircuitState.OPEN;
        console.log(`[Circuit Breaker] ${this.serviceName}: OPEN - Too many failures (${this.failureCount})`);
      }
    } else if (this.state === CircuitState.HALF_OPEN) {
      // Single failure in half-open state moves back to open
      this.state = CircuitState.OPEN;
      console.log(`[Circuit Breaker] ${this.serviceName}: OPEN - Failed during recovery attempt`);
    }
  }

  /**
   * Check if enough time has passed to attempt recovery
   */
  private shouldAttemptRecovery(): boolean {
    if (!this.lastFailureTime) return true;
    
    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceLastFailure >= this.config.recoveryTimeoutMs;
  }

  /**
   * Update state based on monitoring time window
   */
  private updateStateBasedOnTimeWindow(): void {
    if (!this.lastFailureTime) return;

    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
    
    // If failures are outside monitoring window, reset failure count
    if (timeSinceLastFailure > this.config.monitoringWindowMs) {
      if (this.state === CircuitState.CLOSED && this.failureCount > 0) {
        this.failureCount = Math.max(0, this.failureCount - 1);
      }
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      requestCount: this.requestCount,
      rejectedCount: this.rejectedCount
    };
  }

  /**
   * Force circuit to open (for testing or manual intervention)
   */
  forceOpen(): void {
    this.state = CircuitState.OPEN;
    this.lastFailureTime = new Date();
    console.log(`[Circuit Breaker] ${this.serviceName}: Manually opened`);
  }

  /**
   * Force circuit to close (for testing or manual intervention)
   */
  forceClose(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    console.log(`[Circuit Breaker] ${this.serviceName}: Manually closed`);
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    this.requestCount = 0;
    this.rejectedCount = 0;
    console.log(`[Circuit Breaker] ${this.serviceName}: Reset to initial state`);
  }
}

/**
 * Circuit breaker manager for multiple services
 */
class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Get or create a circuit breaker for a service
   */
  getBreaker(serviceName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(serviceName)) {
      this.breakers.set(serviceName, new CircuitBreaker(serviceName, config));
    }
    return this.breakers.get(serviceName)!;
  }

  /**
   * Get metrics for all services
   */
  getAllMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};
    
    for (const [serviceName, breaker] of this.breakers) {
      metrics[serviceName] = breaker.getMetrics();
    }
    
    return metrics;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }
}

// Global circuit breaker manager instance
export const circuitBreakerManager = new CircuitBreakerManager();

// Pre-configured circuit breakers for common services
export const StripeCircuitBreaker = circuitBreakerManager.getBreaker('stripe', {
  failureThreshold: 3,      // Stripe should be more sensitive
  recoveryTimeoutMs: 30000, // 30 seconds recovery time
  timeoutMs: 10000         // 10 second timeout for payments
});

export const OpenAICircuitBreaker = circuitBreakerManager.getBreaker('openai', {
  failureThreshold: 5,      // OpenAI can handle more retries
  recoveryTimeoutMs: 60000, // 1 minute recovery
  timeoutMs: 30000         // 30 seconds for AI operations
});

export const DatabaseCircuitBreaker = circuitBreakerManager.getBreaker('database', {
  failureThreshold: 2,      // Database should be very sensitive
  recoveryTimeoutMs: 10000, // 10 seconds recovery
  timeoutMs: 5000          // 5 second timeout
});

export const RedisCircuitBreaker = circuitBreakerManager.getBreaker('redis', {
  failureThreshold: 3,      // Redis should be sensitive but not too strict
  recoveryTimeoutMs: 15000, // 15 seconds recovery
  timeoutMs: 3000          // 3 second timeout
});

/**
 * Utility function to create protected version of any async function
 */
export function withCircuitBreaker<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  serviceName: string,
  config?: Partial<CircuitBreakerConfig>
): T {
  const breaker = circuitBreakerManager.getBreaker(serviceName, config);
  
  return ((...args: Parameters<T>) => {
    return breaker.execute(() => fn(...args));
  }) as T;
}

/**
 * Health check endpoint data
 */
export function getCircuitBreakerHealth(): {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, CircuitBreakerMetrics & { status: 'healthy' | 'degraded' | 'unhealthy' }>;
} {
  const allMetrics = circuitBreakerManager.getAllMetrics();
  const services: Record<string, CircuitBreakerMetrics & { status: 'healthy' | 'degraded' | 'unhealthy' }> = {};
  
  let healthyCount = 0;
  let totalServices = 0;

  for (const [serviceName, metrics] of Object.entries(allMetrics)) {
    totalServices++;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (metrics.state === CircuitState.CLOSED) {
      status = 'healthy';
      healthyCount++;
    } else if (metrics.state === CircuitState.HALF_OPEN) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    services[serviceName] = { ...metrics, status };
  }

  let overall: 'healthy' | 'degraded' | 'unhealthy';
  if (totalServices === 0) {
    overall = 'healthy';
  } else if (healthyCount === totalServices) {
    overall = 'healthy';
  } else if (healthyCount > 0) {
    overall = 'degraded';
  } else {
    overall = 'unhealthy';
  }

  return { overall, services };
}
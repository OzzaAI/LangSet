/**
 * Monitoring Scheduler for LangSet MVP
 * Periodic health checks and alert rule evaluation
 */

import { alertingSystem } from './alerts';
import { logger } from './error-logger';
import { getSystemHealth } from './setup';
import { getCircuitBreakerHealth } from '../security/circuit-breaker';

class MonitoringScheduler {
  private static instance: MonitoringScheduler;
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  private constructor() {}

  static getInstance(): MonitoringScheduler {
    if (!MonitoringScheduler.instance) {
      MonitoringScheduler.instance = new MonitoringScheduler();
    }
    return MonitoringScheduler.instance;
  }

  /**
   * Start monitoring scheduler
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // System health checks every 30 seconds
    this.scheduleTask('system-health', this.checkSystemHealth.bind(this), 30 * 1000);
    
    // Circuit breaker checks every 15 seconds
    this.scheduleTask('circuit-breakers', this.checkCircuitBreakers.bind(this), 15 * 1000);
    
    // Performance metrics every 2 minutes
    this.scheduleTask('performance', this.checkPerformanceMetrics.bind(this), 2 * 60 * 1000);
    
    // Business metrics every 5 minutes
    this.scheduleTask('business', this.checkBusinessMetrics.bind(this), 5 * 60 * 1000);
    
    // Database health every 60 seconds
    this.scheduleTask('database', this.checkDatabaseHealth.bind(this), 60 * 1000);
    
    // Redis health every 60 seconds
    this.scheduleTask('redis', this.checkRedisHealth.bind(this), 60 * 1000);
    
    logger.info('Monitoring scheduler started', {
      component: 'monitoring',
      operation: 'scheduler_start'
    });
  }

  /**
   * Stop monitoring scheduler
   */
  stop(): void {
    if (!this.isRunning) return;
    
    this.intervals.forEach((interval) => {
      clearInterval(interval);
    });
    
    this.intervals.clear();
    this.isRunning = false;
    
    logger.info('Monitoring scheduler stopped', {
      component: 'monitoring',
      operation: 'scheduler_stop'
    });
  }

  /**
   * Schedule a monitoring task
   */
  private scheduleTask(name: string, task: () => Promise<void>, interval: number): void {
    const intervalId = setInterval(async () => {
      try {
        await task();
      } catch (error) {
        await logger.error(
          `Monitoring task failed: ${name}`,
          error instanceof Error ? error : new Error(String(error)),
          {
            component: 'monitoring',
            operation: 'scheduled_task',
            metadata: { taskName: name }
          }
        );
      }
    }, interval);
    
    this.intervals.set(name, intervalId);
    
    // Also run immediately
    setTimeout(() => task().catch(() => {}), 1000);
  }

  /**
   * Check system health and evaluate rules
   */
  private async checkSystemHealth(): Promise<void> {
    const health = await getSystemHealth();
    
    await alertingSystem.evaluateRules({
      memoryUsage: health.memory.percentage / 100,
      systemStatus: health.status
    });
  }

  /**
   * Check circuit breakers
   */
  private async checkCircuitBreakers(): Promise<void> {
    const circuitHealth = getCircuitBreakerHealth();
    
    // Check if any circuit breaker is open
    const hasOpenCircuits = Object.values(circuitHealth.services).some(
      service => service.status === 'unhealthy'
    );
    
    await alertingSystem.evaluateRules({
      circuitBreakerOpen: hasOpenCircuits,
      circuitBreakerStatus: circuitHealth.overall
    });
  }

  /**
   * Check performance metrics
   */
  private async checkPerformanceMetrics(): Promise<void> {
    // Mock performance data - replace with real metrics in production
    const errorRate = Math.random() * 0.1; // 0-10%
    const responseTime = Math.random() * 3000 + 200; // 200-3200ms
    
    await alertingSystem.evaluateRules({
      errorRate,
      responseTime
    });
  }

  /**
   * Check business metrics
   */
  private async checkBusinessMetrics(): Promise<void> {
    try {
      // Get real business metrics from database
      const { db } = await import("@/db/drizzle");
      const { user, transaction } = await import("@/db/schema");
      const { eq, and, gte } = await import("drizzle-orm");
      
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      // Count authentication failures in last hour
      const authFailures = Math.floor(Math.random() * 20); // Mock data
      
      // Count payment failures
      const paymentFailures = await db
        .select()
        .from(transaction)
        .where(and(
          eq(transaction.status, 'failed'),
          gte(transaction.createdAt, oneHourAgo)
        ));
      
      const totalPayments = await db
        .select()
        .from(transaction)
        .where(gte(transaction.createdAt, oneHourAgo));
      
      const paymentFailureRate = totalPayments.length > 0 
        ? paymentFailures.length / totalPayments.length 
        : 0;
      
      await alertingSystem.evaluateRules({
        authFailures,
        paymentFailureRate
      });
    } catch (error) {
      await logger.error(
        'Failed to check business metrics',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'monitoring',
          operation: 'business_metrics'
        }
      );
    }
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<void> {
    try {
      const { db } = await import("@/db/drizzle");
      
      const start = Date.now();
      await db.execute('SELECT 1');
      const responseTime = Date.now() - start;
      
      await alertingSystem.evaluateRules({
        databaseConnectionFailed: false,
        databaseResponseTime: responseTime
      });
    } catch (error) {
      await alertingSystem.evaluateRules({
        databaseConnectionFailed: true
      });
    }
  }

  /**
   * Check Redis health
   */
  private async checkRedisHealth(): Promise<void> {
    try {
      const { Redis } = await import('@upstash/redis');
      
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
      
      const start = Date.now();
      await redis.ping();
      const responseTime = Date.now() - start;
      
      await alertingSystem.evaluateRules({
        redisConnectionFailed: false,
        redisResponseTime: responseTime
      });
    } catch (error) {
      await alertingSystem.evaluateRules({
        redisConnectionFailed: true
      });
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    isRunning: boolean;
    activeTasks: string[];
    uptime: number;
  } {
    return {
      isRunning: this.isRunning,
      activeTasks: Array.from(this.intervals.keys()),
      uptime: process.uptime()
    };
  }
}

// Export singleton
export const monitoringScheduler = MonitoringScheduler.getInstance();

/**
 * Initialize monitoring on application startup
 */
export function startMonitoring(): void {
  // Only start in production or when explicitly enabled
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_MONITORING === 'true') {
    monitoringScheduler.start();
  }
}

/**
 * Stop monitoring on application shutdown
 */
export function stopMonitoring(): void {
  monitoringScheduler.stop();
}

export default monitoringScheduler;
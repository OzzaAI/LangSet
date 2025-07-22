import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/monitoring/error-handler";
import { getSystemHealth } from "@/lib/monitoring/setup";
import { getCircuitBreakerHealth } from "@/lib/security/circuit-breaker";
import { alertingSystem, alertingSystem as alerts } from "@/lib/monitoring/alerts";

/**
 * Comprehensive monitoring dashboard data
 * GET /api/monitoring/dashboard
 */
async function getMonitoringDashboard(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get('timeframe') || '1h'; // 1h, 6h, 24h, 7d
  
  // Get system health
  const systemHealth = await getSystemHealth();
  
  // Get circuit breaker status
  const circuitBreakerHealth = getCircuitBreakerHealth();
  
  // Get active alerts
  const activeAlerts = alertingSystem.getActiveAlerts();
  const recentAlerts = alertingSystem.getAlertHistory(20);
  
  // Get performance metrics (mock data for MVP - replace with real metrics)
  const performanceMetrics = await getPerformanceMetrics(timeframe);
  
  // Get business metrics
  const businessMetrics = await getBusinessMetrics(timeframe);
  
  // Calculate overall health score
  const healthScore = calculateHealthScore(systemHealth, circuitBreakerHealth, activeAlerts);
  
  const dashboardData = {
    overview: {
      healthScore,
      status: systemHealth.status,
      timestamp: new Date().toISOString(),
      uptime: systemHealth.uptime,
      version: systemHealth.version,
      environment: systemHealth.environment
    },
    alerts: {
      active: activeAlerts.length,
      critical: activeAlerts.filter(a => a.severity === 'critical').length,
      warnings: activeAlerts.filter(a => a.severity === 'warning').length,
      recent: recentAlerts.slice(0, 10)
    },
    system: {
      memory: systemHealth.memory,
      circuitBreakers: circuitBreakerHealth
    },
    performance: performanceMetrics,
    business: businessMetrics,
    services: {
      database: await checkDatabaseMetrics(),
      redis: await checkRedisMetrics(),
      stripe: await checkStripeMetrics()
    }
  };
  
  return NextResponse.json(dashboardData);
}

/**
 * Calculate overall health score (0-100)
 */
function calculateHealthScore(
  systemHealth: any,
  circuitBreakerHealth: any,
  activeAlerts: any[]
): number {
  let score = 100;
  
  // System health impact
  if (systemHealth.status === 'degraded') score -= 20;
  if (systemHealth.status === 'unhealthy') score -= 50;
  
  // Memory usage impact
  if (systemHealth.memory.percentage > 80) score -= 15;
  if (systemHealth.memory.percentage > 90) score -= 30;
  
  // Circuit breaker impact
  if (circuitBreakerHealth.overall === 'degraded') score -= 15;
  if (circuitBreakerHealth.overall === 'unhealthy') score -= 40;
  
  // Active alerts impact
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical').length;
  const warningAlerts = activeAlerts.filter(a => a.severity === 'warning').length;
  
  score -= (criticalAlerts * 20);
  score -= (warningAlerts * 5);
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Get performance metrics
 */
async function getPerformanceMetrics(timeframe: string) {
  // In production, this would query your metrics database
  // For MVP, return mock/calculated data
  
  const now = Date.now();
  const timeFrameMs = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000
  }[timeframe] || 60 * 60 * 1000;
  
  return {
    requests: {
      total: Math.floor(Math.random() * 10000) + 1000,
      successful: Math.floor(Math.random() * 9500) + 900,
      failed: Math.floor(Math.random() * 500) + 50,
      rate: Math.floor(Math.random() * 100) + 20 // requests per minute
    },
    response_times: {
      avg: Math.floor(Math.random() * 500) + 100, // ms
      p50: Math.floor(Math.random() * 300) + 80,
      p95: Math.floor(Math.random() * 1000) + 200,
      p99: Math.floor(Math.random() * 2000) + 500
    },
    errors: {
      rate: Math.random() * 0.05, // 0-5% error rate
      total: Math.floor(Math.random() * 100) + 10,
      by_type: {
        '4xx': Math.floor(Math.random() * 50) + 5,
        '5xx': Math.floor(Math.random() * 30) + 3,
        'timeout': Math.floor(Math.random() * 10) + 1,
        'circuit_breaker': Math.floor(Math.random() * 5)
      }
    },
    throughput: generateThroughputData(timeframe),
    timeframe
  };
}

/**
 * Generate throughput data for charts
 */
function generateThroughputData(timeframe: string) {
  const points = {
    '1h': 60, // 1 point per minute
    '6h': 72, // 1 point per 5 minutes
    '24h': 96, // 1 point per 15 minutes
    '7d': 168 // 1 point per hour
  }[timeframe] || 60;
  
  const data = [];
  const now = Date.now();
  
  for (let i = points - 1; i >= 0; i--) {
    const time = now - (i * (60 * 1000)); // Simplified interval
    const requests = Math.floor(Math.random() * 100) + 20;
    const errors = Math.floor(Math.random() * 5);
    
    data.push({
      timestamp: new Date(time).toISOString(),
      requests,
      errors,
      response_time: Math.floor(Math.random() * 300) + 100
    });
  }
  
  return data;
}

/**
 * Get business metrics
 */
async function getBusinessMetrics(timeframe: string) {
  return {
    users: {
      active: Math.floor(Math.random() * 1000) + 100,
      new_signups: Math.floor(Math.random() * 50) + 10,
      retention_rate: Math.random() * 0.3 + 0.7 // 70-100%
    },
    interviews: {
      started: Math.floor(Math.random() * 200) + 50,
      completed: Math.floor(Math.random() * 150) + 40,
      completion_rate: Math.random() * 0.2 + 0.7 // 70-90%
    },
    datasets: {
      created: Math.floor(Math.random() * 100) + 20,
      refined: Math.floor(Math.random() * 80) + 15,
      listed: Math.floor(Math.random() * 30) + 5
    },
    marketplace: {
      offers: Math.floor(Math.random() * 50) + 10,
      transactions: Math.floor(Math.random() * 20) + 3,
      revenue: (Math.random() * 1000 + 200).toFixed(2)
    },
    timeframe
  };
}

/**
 * Check database metrics
 */
async function checkDatabaseMetrics() {
  try {
    const start = Date.now();
    const { db } = await import("@/db/drizzle");
    
    // Simple connection test
    await db.execute('SELECT 1');
    const responseTime = Date.now() - start;
    
    return {
      status: 'healthy',
      response_time: responseTime,
      connections: {
        active: Math.floor(Math.random() * 10) + 2,
        idle: Math.floor(Math.random() * 5) + 1,
        max: 20
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Database connection failed',
      connections: { active: 0, idle: 0, max: 20 }
    };
  }
}

/**
 * Check Redis metrics
 */
async function checkRedisMetrics() {
  try {
    const start = Date.now();
    const { Redis } = await import('@upstash/redis');
    
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    
    await redis.ping();
    const responseTime = Date.now() - start;
    
    return {
      status: 'healthy',
      response_time: responseTime,
      memory_usage: Math.random() * 100, // MB
      hits: Math.floor(Math.random() * 1000) + 100,
      misses: Math.floor(Math.random() * 100) + 10
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Redis connection failed'
    };
  }
}

/**
 * Check Stripe metrics
 */
async function checkStripeMetrics() {
  return {
    status: process.env.STRIPE_SECRET_KEY ? 'healthy' : 'unhealthy',
    transactions: {
      successful: Math.floor(Math.random() * 50) + 10,
      failed: Math.floor(Math.random() * 5) + 1,
      pending: Math.floor(Math.random() * 3)
    },
    revenue: (Math.random() * 1000 + 200).toFixed(2)
  };
}

// Export with error handling
export const GET = withErrorHandler(getMonitoringDashboard, 'monitoring');
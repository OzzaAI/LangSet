import { NextRequest, NextResponse } from "next/server";
import { getSystemHealth } from "@/lib/monitoring/setup";
import { getCircuitBreakerHealth } from "@/lib/security/circuit-breaker";
import { withErrorHandler } from "@/lib/monitoring/error-handler";

/**
 * System health check endpoint
 * GET /api/health/system
 */
async function getHealthStatus(request: NextRequest) {
  // Get basic system health
  const systemHealth = await getSystemHealth();
  
  // Get circuit breaker health
  const circuitBreakerHealth = getCircuitBreakerHealth();
  
  // Determine overall health status
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = systemHealth.status;
  
  // Degrade status if circuit breakers are having issues
  if (circuitBreakerHealth.overall === 'unhealthy') {
    overallStatus = 'unhealthy';
  } else if (circuitBreakerHealth.overall === 'degraded' && overallStatus === 'healthy') {
    overallStatus = 'degraded';
  }
  
  const healthData = {
    status: overallStatus,
    timestamp: systemHealth.timestamp,
    system: {
      uptime: systemHealth.uptime,
      memory: systemHealth.memory,
      environment: systemHealth.environment,
      version: systemHealth.version
    },
    services: {
      circuitBreakers: circuitBreakerHealth
    },
    checks: {
      database: await checkDatabaseHealth(),
      redis: await checkRedisHealth(),
      external: await checkExternalServices()
    }
  };
  
  // Set appropriate HTTP status
  const httpStatus = overallStatus === 'healthy' ? 200 : 503;
  
  return NextResponse.json(healthData, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}

/**
 * Check database connectivity
 */
async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
}> {
  try {
    const start = Date.now();
    
    // Import database dynamically to avoid circular dependencies
    const { db } = await import("@/db/drizzle");
    
    // Simple query to test connectivity
    await db.execute('SELECT 1');
    
    const responseTime = Date.now() - start;
    
    return {
      status: responseTime < 1000 ? 'healthy' : 'unhealthy',
      responseTime
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
}

/**
 * Check Redis connectivity
 */
async function checkRedisHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
}> {
  try {
    const start = Date.now();
    
    // Import Redis dynamically
    const { Redis } = await import('@upstash/redis');
    
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    
    // Simple ping test
    const result = await redis.ping();
    const responseTime = Date.now() - start;
    
    return {
      status: result === 'PONG' && responseTime < 1000 ? 'healthy' : 'unhealthy',
      responseTime
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Redis connection failed'
    };
  }
}

/**
 * Check external services
 */
async function checkExternalServices(): Promise<{
  stripe: { status: 'healthy' | 'unhealthy'; error?: string };
  openai: { status: 'healthy' | 'unhealthy'; error?: string };
}> {
  const results = {
    stripe: { status: 'healthy' as const },
    openai: { status: 'healthy' as const }
  };
  
  // Check Stripe (simplified - just verify env vars exist)
  if (!process.env.STRIPE_SECRET_KEY) {
    results.stripe = {
      status: 'unhealthy',
      error: 'Stripe configuration missing'
    };
  }
  
  // Check OpenAI (simplified - just verify env vars exist)
  if (!process.env.OPENAI_API_KEY) {
    results.openai = {
      status: 'unhealthy',
      error: 'OpenAI configuration missing'
    };
  }
  
  return results;
}

/**
 * Detailed health check with more information
 * GET /api/health/system?detailed=true
 */
async function getDetailedHealth(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const detailed = searchParams.get('detailed') === 'true';
  
  if (!detailed) {
    return getHealthStatus(request);
  }
  
  const basicHealth = await getHealthStatus(request);
  const basicData = await basicHealth.json();
  
  // Add detailed information
  const detailedData = {
    ...basicData,
    detailed: {
      process: {
        pid: process.pid,
        ppid: process.ppid,
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        argv: process.argv.slice(2) // Hide sensitive command line args
      },
      memory: {
        ...process.memoryUsage(),
        external: process.memoryUsage().external,
        arrayBuffers: process.memoryUsage().arrayBuffers
      },
      cpu: process.cpuUsage(),
      resourceUsage: process.resourceUsage()
    }
  };
  
  return NextResponse.json(detailedData, {
    status: basicHealth.status,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}

// Export with error handling
export const GET = withErrorHandler(getDetailedHealth, 'health');
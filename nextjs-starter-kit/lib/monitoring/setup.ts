/**
 * Monitoring and Error Logging Setup for LangSet MVP
 * Initialize global error handlers and monitoring systems
 */

import { setupGlobalErrorHandlers, setupGracefulShutdown } from './error-handler';
import { logger } from './error-logger';

/**
 * Initialize all monitoring systems
 */
export function initializeMonitoring(): void {
  // Setup global error handlers
  setupGlobalErrorHandlers();
  
  // Setup graceful shutdown
  setupGracefulShutdown();
  
  // Log startup
  logger.info('LangSet monitoring systems initialized', {
    component: 'startup',
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION || '1.0.0'
  });
  
  // Log environment info
  logger.debug('Environment configuration', {
    component: 'startup',
    metadata: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      uptime: process.uptime()
    }
  });
}

/**
 * Health check data for monitoring
 */
export async function getSystemHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  environment: string;
  version: string;
}> {
  const memUsage = process.memoryUsage();
  const totalMem = memUsage.heapTotal;
  const usedMem = memUsage.heapUsed;
  const memPercentage = (usedMem / totalMem) * 100;
  
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  // Simple health checks
  if (memPercentage > 90) {
    status = 'unhealthy';
  } else if (memPercentage > 70) {
    status = 'degraded';
  }
  
  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: usedMem,
      total: totalMem,
      percentage: Math.round(memPercentage * 100) / 100
    },
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0'
  };
}

/**
 * Log application startup
 */
export async function logStartup(): Promise<void> {
  const health = await getSystemHealth();
  
  await logger.info('LangSet application started', {
    component: 'startup',
    operation: 'app_start',
    metadata: {
      ...health,
      startTime: new Date().toISOString()
    }
  });
}

/**
 * Log application shutdown
 */
export async function logShutdown(): Promise<void> {
  const health = await getSystemHealth();
  
  await logger.info('LangSet application shutting down', {
    component: 'shutdown',
    operation: 'app_shutdown',
    metadata: {
      ...health,
      shutdownTime: new Date().toISOString()
    }
  });
}

export default {
  initializeMonitoring,
  getSystemHealth,
  logStartup,
  logShutdown
};
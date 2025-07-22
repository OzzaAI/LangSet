/**
 * Load Testing Utilities for LangSet MVP
 * Simulates 100 concurrent users and measures performance
 */

import { randomUUID } from 'crypto';

interface LoadTestConfig {
  concurrentUsers: number;
  testDurationMs: number;
  rampUpTimeMs: number;
  endpoints: EndpointConfig[];
}

interface EndpointConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  weight: number; // Probability of calling this endpoint
  payload?: any;
  expectedResponseTime: number; // Target response time in ms
}

interface LoadTestResult {
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  errors: Array<{ message: string; count: number }>;
}

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  timestamp: number;
}

class LoadTester {
  private baseUrl: string;
  private results: Map<string, number[]> = new Map();
  private errors: Map<string, Map<string, number>> = new Map();
  private startTime: number = 0;
  private systemMetrics: SystemMetrics[] = [];

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  // Main load test execution
  async runLoadTest(config: LoadTestConfig): Promise<Map<string, LoadTestResult>> {
    console.info(`[Load Test] Starting with ${config.concurrentUsers} users for ${config.testDurationMs}ms`);
    
    this.startTime = Date.now();
    this.results.clear();
    this.errors.clear();
    this.systemMetrics = [];

    // Start system monitoring
    const systemMonitor = this.startSystemMonitoring();

    // Create user sessions with ramp-up
    const userPromises: Promise<void>[] = [];
    const rampUpDelay = config.rampUpTimeMs / config.concurrentUsers;

    for (let i = 0; i < config.concurrentUsers; i++) {
      const delay = i * rampUpDelay;
      userPromises.push(this.simulateUser(config, delay));
    }

    // Wait for all users to complete
    await Promise.all(userPromises);
    
    // Stop system monitoring
    clearInterval(systemMonitor);

    // Calculate and return results
    return this.calculateResults(config);
  }

  // Simulate a single user session
  private async simulateUser(config: LoadTestConfig, startDelay: number): Promise<void> {
    // Wait for ramp-up delay
    await this.sleep(startDelay);

    const endTime = this.startTime + config.testDurationMs;
    const userSession = this.createUserSession();

    while (Date.now() < endTime) {
      try {
        // Select random endpoint based on weight
        const endpoint = this.selectRandomEndpoint(config.endpoints);
        
        // Execute request
        await this.executeRequest(endpoint, userSession);
        
        // Random think time between requests (100-1000ms)
        const thinkTime = Math.random() * 900 + 100;
        await this.sleep(thinkTime);
        
      } catch (error) {
        console.warn('[Load Test] User session error:', error);
      }
    }
  }

  // Execute HTTP request with timing
  private async executeRequest(endpoint: EndpointConfig, userSession: any): Promise<void> {
    const startTime = Date.now();
    const url = `${this.baseUrl}${endpoint.path}`;

    try {
      const response = await fetch(url, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userSession.token}`,
          'User-Agent': 'LangSet-LoadTest/1.0'
        },
        body: endpoint.payload ? JSON.stringify(endpoint.payload) : undefined
      });

      const responseTime = Date.now() - startTime;
      
      if (!this.results.has(endpoint.path)) {
        this.results.set(endpoint.path, []);
      }
      
      this.results.get(endpoint.path)!.push(responseTime);

      if (!response.ok) {
        this.recordError(endpoint.path, `HTTP ${response.status}: ${response.statusText}`);
      }

      // Simulate processing response
      await response.text();
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.results.get(endpoint.path)?.push(responseTime);
      this.recordError(endpoint.path, (error as Error).message);
    }
  }

  // Create mock user session
  private createUserSession(): any {
    return {
      userId: randomUUID(),
      token: 'mock-jwt-token-' + randomUUID(),
      sessionId: randomUUID(),
      createdAt: Date.now()
    };
  }

  // Select endpoint based on weight
  private selectRandomEndpoint(endpoints: EndpointConfig[]): EndpointConfig {
    const totalWeight = endpoints.reduce((sum, ep) => sum + ep.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const endpoint of endpoints) {
      random -= endpoint.weight;
      if (random <= 0) {
        return endpoint;
      }
    }
    
    return endpoints[0]; // Fallback
  }

  // Record error
  private recordError(endpoint: string, errorMessage: string): void {
    if (!this.errors.has(endpoint)) {
      this.errors.set(endpoint, new Map());
    }
    
    const endpointErrors = this.errors.get(endpoint)!;
    const currentCount = endpointErrors.get(errorMessage) || 0;
    endpointErrors.set(errorMessage, currentCount + 1);
  }

  // Calculate percentiles
  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  // Calculate final results
  private calculateResults(config: LoadTestConfig): Map<string, LoadTestResult> {
    const results = new Map<string, LoadTestResult>();
    const testDurationSec = config.testDurationMs / 1000;

    for (const [endpoint, responseTimes] of this.results.entries()) {
      const totalRequests = responseTimes.length;
      const failedRequests = this.countErrors(endpoint);
      const successfulRequests = totalRequests - failedRequests;

      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / totalRequests;
      const minResponseTime = Math.min(...responseTimes);
      const maxResponseTime = Math.max(...responseTimes);
      const p95ResponseTime = this.calculatePercentile(responseTimes, 95);
      const p99ResponseTime = this.calculatePercentile(responseTimes, 99);
      const requestsPerSecond = totalRequests / testDurationSec;
      const errorRate = failedRequests / totalRequests;

      const errors = Array.from(this.errors.get(endpoint)?.entries() || [])
        .map(([message, count]) => ({ message, count }));

      results.set(endpoint, {
        endpoint,
        totalRequests,
        successfulRequests,
        failedRequests,
        averageResponseTime: Math.round(avgResponseTime),
        minResponseTime,
        maxResponseTime,
        p95ResponseTime,
        p99ResponseTime,
        requestsPerSecond: Math.round(requestsPerSecond * 100) / 100,
        errorRate: Math.round(errorRate * 10000) / 100, // As percentage
        errors
      });
    }

    return results;
  }

  // Count errors for an endpoint
  private countErrors(endpoint: string): number {
    const endpointErrors = this.errors.get(endpoint);
    if (!endpointErrors) return 0;
    
    return Array.from(endpointErrors.values()).reduce((sum, count) => sum + count, 0);
  }

  // Start system monitoring
  private startSystemMonitoring(): NodeJS.Timeout {
    return setInterval(() => {
      const metrics: SystemMetrics = {
        cpuUsage: this.getCPUUsage(),
        memoryUsage: this.getMemoryUsage(),
        activeConnections: this.getActiveConnections(),
        timestamp: Date.now()
      };
      this.systemMetrics.push(metrics);
    }, 1000);
  }

  // Mock system metrics (in production, use actual system monitoring)
  private getCPUUsage(): number {
    return Math.random() * 100; // Mock CPU usage
  }

  private getMemoryUsage(): number {
    const used = process.memoryUsage();
    return (used.heapUsed / used.heapTotal) * 100;
  }

  private getActiveConnections(): number {
    return Math.floor(Math.random() * 1000); // Mock active connections
  }

  // Utility methods
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Generate load test report
  generateReport(results: Map<string, LoadTestResult>): string {
    let report = '# LangSet Load Test Report\n\n';
    
    report += `**Test Duration:** ${new Date().toISOString()}\n`;
    report += `**Total Endpoints:** ${results.size}\n\n`;

    // Overall summary
    const totalRequests = Array.from(results.values()).reduce((sum, r) => sum + r.totalRequests, 0);
    const totalErrors = Array.from(results.values()).reduce((sum, r) => sum + r.failedRequests, 0);
    const avgRPS = Array.from(results.values()).reduce((sum, r) => sum + r.requestsPerSecond, 0);
    const overallErrorRate = (totalErrors / totalRequests) * 100;

    report += '## Overall Performance\n';
    report += `- **Total Requests:** ${totalRequests}\n`;
    report += `- **Total RPS:** ${Math.round(avgRPS)}\n`;
    report += `- **Overall Error Rate:** ${Math.round(overallErrorRate * 100) / 100}%\n\n`;

    // Endpoint details
    report += '## Endpoint Performance\n\n';
    
    for (const [endpoint, result] of results.entries()) {
      report += `### ${endpoint}\n`;
      report += `- **Requests:** ${result.totalRequests}\n`;
      report += `- **Success Rate:** ${Math.round((result.successfulRequests / result.totalRequests) * 10000) / 100}%\n`;
      report += `- **RPS:** ${result.requestsPerSecond}\n`;
      report += `- **Avg Response Time:** ${result.averageResponseTime}ms\n`;
      report += `- **95th Percentile:** ${result.p95ResponseTime}ms\n`;
      report += `- **99th Percentile:** ${result.p99ResponseTime}ms\n`;
      
      if (result.errors.length > 0) {
        report += '- **Errors:**\n';
        result.errors.forEach(error => {
          report += `  - ${error.message}: ${error.count}\n`;
        });
      }
      report += '\n';
    }

    // Performance warnings
    report += '## Performance Analysis\n\n';
    
    const slowEndpoints = Array.from(results.entries())
      .filter(([_, result]) => result.p95ResponseTime > 5000)
      .map(([endpoint]) => endpoint);
    
    if (slowEndpoints.length > 0) {
      report += '### ⚠️ Slow Endpoints (P95 > 5s)\n';
      slowEndpoints.forEach(endpoint => report += `- ${endpoint}\n`);
      report += '\n';
    }

    const highErrorEndpoints = Array.from(results.entries())
      .filter(([_, result]) => result.errorRate > 5)
      .map(([endpoint, result]) => ({ endpoint, errorRate: result.errorRate }));
    
    if (highErrorEndpoints.length > 0) {
      report += '### ❌ High Error Rate Endpoints (>5%)\n';
      highErrorEndpoints.forEach(({ endpoint, errorRate }) => {
        report += `- ${endpoint}: ${errorRate}%\n`;
      });
    }

    return report;
  }
}

// Predefined test configurations
export const TEST_CONFIGS = {
  // Light load test
  light: {
    concurrentUsers: 10,
    testDurationMs: 5 * 60 * 1000, // 5 minutes
    rampUpTimeMs: 30 * 1000, // 30 seconds
    endpoints: [
      {
        path: '/api/auth/session',
        method: 'GET' as const,
        weight: 20,
        expectedResponseTime: 200
      },
      {
        path: '/api/dashboard',
        method: 'GET' as const,
        weight: 15,
        expectedResponseTime: 500
      },
      {
        path: '/api/datasets',
        method: 'GET' as const,
        weight: 15,
        expectedResponseTime: 800
      },
      {
        path: '/api/instances',
        method: 'GET' as const,
        weight: 10,
        expectedResponseTime: 600
      }
    ]
  },

  // MVP stress test - 100 users
  mvp: {
    concurrentUsers: 100,
    testDurationMs: 15 * 60 * 1000, // 15 minutes
    rampUpTimeMs: 2 * 60 * 1000, // 2 minutes ramp up
    endpoints: [
      {
        path: '/api/interview/langgraph/start',
        method: 'POST' as const,
        weight: 25,
        payload: { userId: 'load-test-user' },
        expectedResponseTime: 3000
      },
      {
        path: '/api/interview/langgraph/answer',
        method: 'POST' as const,
        weight: 30,
        payload: { 
          sessionId: 'test-session',
          answer: 'I work with React and Node.js for full-stack development. I use TypeScript for type safety and implement clean architecture patterns.'
        },
        expectedResponseTime: 4000
      },
      {
        path: '/api/billing/quota',
        method: 'GET' as const,
        weight: 20,
        expectedResponseTime: 500
      },
      {
        path: '/api/vector/search',
        method: 'POST' as const,
        weight: 15,
        payload: {
          query: 'React components',
          limit: 10
        },
        expectedResponseTime: 2000
      },
      {
        path: '/api/instances/refine',
        method: 'POST' as const,
        weight: 10,
        payload: {
          instanceId: 'test-instance',
          newAnswer: 'Improved answer with more details and examples.'
        },
        expectedResponseTime: 1500
      }
    ]
  },

  // Heavy load test
  heavy: {
    concurrentUsers: 200,
    testDurationMs: 30 * 60 * 1000, // 30 minutes
    rampUpTimeMs: 5 * 60 * 1000, // 5 minutes ramp up
    endpoints: [
      {
        path: '/api/interview/langgraph/start',
        method: 'POST' as const,
        weight: 20,
        payload: { userId: 'load-test-user' },
        expectedResponseTime: 3000
      },
      {
        path: '/api/interview/langgraph/answer',
        method: 'POST' as const,
        weight: 35,
        payload: { 
          sessionId: 'test-session',
          answer: 'Detailed technical response about software engineering practices, methodologies, and implementation details.'
        },
        expectedResponseTime: 5000
      },
      {
        path: '/api/datasets/create',
        method: 'POST' as const,
        weight: 15,
        payload: {
          name: 'Load Test Dataset',
          description: 'Dataset created during load testing'
        },
        expectedResponseTime: 2000
      },
      {
        path: '/api/billing/quota',
        method: 'GET' as const,
        weight: 15,
        expectedResponseTime: 300
      },
      {
        path: '/api/vector/embed',
        method: 'POST' as const,
        weight: 10,
        payload: {
          instanceId: 'test-instance',
          question: 'Test question',
          answer: 'Test answer for embedding'
        },
        expectedResponseTime: 3000
      },
      {
        path: '/api/instances/anonymize',
        method: 'POST' as const,
        weight: 5,
        payload: {
          datasetId: 'test-dataset'
        },
        expectedResponseTime: 8000
      }
    ]
  }
};

// Export load tester
export const loadTester = new LoadTester();

// Convenience function to run MVP load test
export async function runMVPLoadTest(): Promise<void> {
  console.info('[Load Test] Starting MVP load test...');
  
  const results = await loadTester.runLoadTest(TEST_CONFIGS.mvp);
  const report = loadTester.generateReport(results);
  
  console.info('[Load Test] Results:');
  console.info(report);
  
  // Check for performance issues
  const performanceIssues = [];
  
  for (const [endpoint, result] of results.entries()) {
    if (result.p95ResponseTime > 5000) {
      performanceIssues.push(`${endpoint}: P95 response time ${result.p95ResponseTime}ms > 5000ms`);
    }
    
    if (result.errorRate > 5) {
      performanceIssues.push(`${endpoint}: Error rate ${result.errorRate}% > 5%`);
    }
  }
  
  if (performanceIssues.length > 0) {
    console.warn('[Load Test] Performance issues detected:');
    performanceIssues.forEach(issue => console.warn(`  - ${issue}`));
  } else {
    console.info('[Load Test] ✅ All performance targets met!');
  }
}
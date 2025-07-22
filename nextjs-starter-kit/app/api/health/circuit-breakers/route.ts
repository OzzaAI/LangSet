import { NextRequest, NextResponse } from "next/server";
import { getCircuitBreakerHealth } from "@/lib/security/circuit-breaker";

/**
 * Health check endpoint for circuit breakers
 * GET /api/health/circuit-breakers
 */
export async function GET(request: NextRequest) {
  try {
    const health = getCircuitBreakerHealth();
    
    // Set appropriate HTTP status based on overall health
    let status = 200;
    if (health.overall === 'degraded') {
      status = 503; // Service Unavailable
    } else if (health.overall === 'unhealthy') {
      status = 503; // Service Unavailable
    }

    return NextResponse.json(
      {
        status: health.overall,
        timestamp: new Date().toISOString(),
        services: health.services
      },
      { 
        status,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );

  } catch (error) {
    console.error("Circuit breaker health check error:", error);
    
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: "Failed to get circuit breaker health status",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Reset circuit breakers (for admin use)
 * POST /api/health/circuit-breakers
 */
export async function POST(request: NextRequest) {
  try {
    const { action, service } = await request.json();
    
    // Note: In production, add proper admin authentication here
    
    if (action === 'reset_all') {
      const { circuitBreakerManager } = await import("@/lib/security/circuit-breaker");
      circuitBreakerManager.resetAll();
      
      return NextResponse.json({
        message: "All circuit breakers reset successfully",
        timestamp: new Date().toISOString()
      });
    }
    
    if (action === 'reset' && service) {
      const { circuitBreakerManager } = await import("@/lib/security/circuit-breaker");
      const breaker = circuitBreakerManager.getBreaker(service);
      breaker.reset();
      
      return NextResponse.json({
        message: `Circuit breaker for ${service} reset successfully`,
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json(
      { error: "Invalid action or missing parameters" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Circuit breaker reset error:", error);
    
    return NextResponse.json(
      { error: "Failed to reset circuit breakers" },
      { status: 500 }
    );
  }
}
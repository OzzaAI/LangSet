import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { 
  redisRateLimit, 
  RATE_LIMIT_CONFIGS, 
  rateLimiterCircuitBreaker 
} from "./lib/security/redis-rate-limiter";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Apply rate limiting to API routes
  if (pathname.startsWith("/api/")) {
    try {
      let rateLimitConfig = RATE_LIMIT_CONFIGS.api;
      
      // Apply specific rate limits based on endpoint
      if (pathname.startsWith("/api/auth")) {
        rateLimitConfig = RATE_LIMIT_CONFIGS.auth;
      } else if (pathname.includes("/interview")) {
        rateLimitConfig = RATE_LIMIT_CONFIGS.interview;
      } else if (pathname.includes("/upload")) {
        rateLimitConfig = RATE_LIMIT_CONFIGS.upload;
      } else if (pathname.includes("/offers") || pathname.includes("/sell")) {
        rateLimitConfig = RATE_LIMIT_CONFIGS.marketplace;
      } else if (pathname.includes("/search") || pathname.includes("/vector")) {
        rateLimitConfig = RATE_LIMIT_CONFIGS.search;
      }

      const rateLimitCheck = await rateLimiterCircuitBreaker.executeWithBreaker(
        () => redisRateLimit(rateLimitConfig)(request),
        () => ({ allowed: true, limit: 100, remaining: 99, resetTime: Date.now() + 60000 })
      );

      if (!rateLimitCheck.allowed) {
        const response = NextResponse.json(
          { 
            error: "Rate limit exceeded", 
            limit: rateLimitCheck.limit,
            remaining: rateLimitCheck.remaining,
            resetTime: rateLimitCheck.resetTime
          },
          { status: 429 }
        );
        
        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', rateLimitCheck.limit.toString());
        response.headers.set('X-RateLimit-Remaining', rateLimitCheck.remaining.toString());
        response.headers.set('X-RateLimit-Reset', rateLimitCheck.resetTime.toString());
        response.headers.set('Retry-After', Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000).toString());
        
        return response;
      }

      // Add rate limit headers to successful responses
      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Limit', rateLimitCheck.limit.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitCheck.remaining.toString());
      response.headers.set('X-RateLimit-Reset', rateLimitCheck.resetTime.toString());
    } catch (error) {
      console.error('[Middleware] Rate limiting error:', error);
      // Continue without rate limiting if there's an error
    }
  }

  const sessionCookie = getSessionCookie(request);

  // /api/payments/webhooks is a webhook endpoint that should be accessible without authentication
  if (pathname.startsWith("/api/payments/webhooks") || pathname.startsWith("/api/billing/stripe/webhook")) {
    return NextResponse.next();
  }

  if (sessionCookie && ["/sign-in", "/sign-up"].includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!sessionCookie && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*", 
    "/sign-in", 
    "/sign-up",
    "/api/:path*" // Include API routes for rate limiting
  ],
};

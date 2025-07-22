/**
 * CSRF Protection Implementation for LangSet MVP
 * Protects against Cross-Site Request Forgery attacks
 */

import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const CSRF_COOKIE_NAME = 'langset-csrf-token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';
const CSRF_TOKEN_EXPIRY = 24 * 60 * 60; // 24 hours in seconds

// JWT secret for CSRF tokens
const getJWTSecret = () => {
  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret';
  return new TextEncoder().encode(secret);
};

interface CSRFTokenPayload {
  sessionId: string;
  userId?: string;
  issued: number;
  expires: number;
}

/**
 * Generate a new CSRF token
 */
export async function generateCSRFToken(
  sessionId: string, 
  userId?: string
): Promise<string> {
  const payload: CSRFTokenPayload = {
    sessionId,
    userId,
    issued: Math.floor(Date.now() / 1000),
    expires: Math.floor(Date.now() / 1000) + CSRF_TOKEN_EXPIRY,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(payload.issued)
    .setExpirationTime(payload.expires)
    .sign(getJWTSecret());

  return token;
}

/**
 * Verify CSRF token
 */
export async function verifyCSRFToken(
  token: string,
  sessionId: string,
  userId?: string
): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getJWTSecret()) as { payload: CSRFTokenPayload };

    // Check expiration
    if (payload.expires * 1000 < Date.now()) {
      return false;
    }

    // Check session ID match
    if (payload.sessionId !== sessionId) {
      return false;
    }

    // Check user ID match if provided
    if (userId && payload.userId !== userId) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('[CSRF] Token verification failed:', error);
    return false;
  }
}

/**
 * Set CSRF token cookie
 */
export function setCSRFCookie(token: string): void {
  const cookieStore = cookies();
  
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be accessible to JavaScript for header setting
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CSRF_TOKEN_EXPIRY,
    path: '/',
  });
}

/**
 * Get CSRF token from cookie
 */
export function getCSRFTokenFromCookie(): string | null {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(CSRF_COOKIE_NAME);
    return token?.value || null;
  } catch (error) {
    console.error('[CSRF] Failed to get token from cookie:', error);
    return null;
  }
}

/**
 * Get CSRF token from request headers
 */
export function getCSRFTokenFromHeaders(request: NextRequest): string | null {
  return request.headers.get(CSRF_HEADER_NAME) || 
         request.headers.get('x-csrf-token') || 
         null;
}

/**
 * Validate CSRF protection for a request
 */
export async function validateCSRFProtection(
  request: NextRequest,
  sessionId: string,
  userId?: string
): Promise<boolean> {
  // Get token from headers
  const headerToken = getCSRFTokenFromHeaders(request);
  
  if (!headerToken) {
    console.warn('[CSRF] No CSRF token found in request headers');
    return false;
  }

  // Verify the token
  const isValid = await verifyCSRFToken(headerToken, sessionId, userId);
  
  if (!isValid) {
    console.warn('[CSRF] CSRF token validation failed');
    return false;
  }

  return true;
}

/**
 * CSRF protection middleware for API routes
 */
export function csrfProtection() {
  return async (
    request: NextRequest,
    sessionId: string,
    userId?: string
  ): Promise<{ protected: boolean; error?: string }> => {
    // Only protect state-changing methods
    const protectedMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    
    if (!protectedMethods.includes(request.method)) {
      return { protected: true };
    }

    // Skip CSRF for webhooks and specific endpoints
    const pathname = new URL(request.url).pathname;
    const skipCSRFPaths = [
      '/api/billing/stripe/webhook',
      '/api/auth/callback',
      '/api/upload-image', // File uploads might not include CSRF headers
    ];
    
    if (skipCSRFPaths.some(path => pathname.includes(path))) {
      return { protected: true };
    }

    const isValid = await validateCSRFProtection(request, sessionId, userId);
    
    if (!isValid) {
      return { 
        protected: false, 
        error: 'CSRF token missing or invalid' 
      };
    }

    return { protected: true };
  };
}

/**
 * Generate and set CSRF token for new sessions
 */
export async function initializeCSRFForSession(
  sessionId: string,
  userId?: string
): Promise<string> {
  const token = await generateCSRFToken(sessionId, userId);
  setCSRFCookie(token);
  return token;
}

/**
 * Refresh CSRF token (should be called periodically)
 */
export async function refreshCSRFToken(
  currentToken: string,
  sessionId: string,
  userId?: string
): Promise<string | null> {
  try {
    // Verify current token is still valid
    const isValid = await verifyCSRFToken(currentToken, sessionId, userId);
    
    if (!isValid) {
      // Generate new token if current is invalid
      return await initializeCSRFForSession(sessionId, userId);
    }

    // Check if token is near expiry (refresh if less than 1 hour remaining)
    const { payload } = await jwtVerify(currentToken, getJWTSecret()) as { payload: CSRFTokenPayload };
    const timeUntilExpiry = (payload.expires * 1000) - Date.now();
    
    if (timeUntilExpiry < 60 * 60 * 1000) { // Less than 1 hour
      const newToken = await generateCSRFToken(sessionId, userId);
      setCSRFCookie(newToken);
      return newToken;
    }

    return null; // No refresh needed
  } catch (error) {
    console.error('[CSRF] Token refresh failed:', error);
    return await initializeCSRFForSession(sessionId, userId);
  }
}

/**
 * Clear CSRF token on logout
 */
export function clearCSRFToken(): void {
  const cookieStore = cookies();
  cookieStore.delete(CSRF_COOKIE_NAME);
}

/**
 * Enhanced CSRF protection with double submit cookie pattern
 */
export class DoubleSubmitCSRF {
  private static readonly COOKIE_NAME = 'langset-csrf-cookie';
  private static readonly HEADER_NAME = 'X-CSRF-Cookie';

  static async generateTokenPair(sessionId: string): Promise<{
    cookieValue: string;
    headerValue: string;
  }> {
    const randomValue = crypto.randomUUID();
    const timestamp = Date.now();
    
    const cookieData = {
      value: randomValue,
      sessionId,
      timestamp,
    };

    const cookieToken = await new SignJWT(cookieData)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(getJWTSecret());

    return {
      cookieValue: cookieToken,
      headerValue: randomValue,
    };
  }

  static async validateDoubleSubmit(
    cookieToken: string,
    headerValue: string,
    sessionId: string
  ): Promise<boolean> {
    try {
      const { payload } = await jwtVerify(cookieToken, getJWTSecret());
      const cookieData = payload as any;

      return (
        cookieData.value === headerValue &&
        cookieData.sessionId === sessionId &&
        Date.now() - cookieData.timestamp < 24 * 60 * 60 * 1000 // 24 hours
      );
    } catch {
      return false;
    }
  }
}

// Export default CSRF protection instance
export const defaultCSRFProtection = csrfProtection();
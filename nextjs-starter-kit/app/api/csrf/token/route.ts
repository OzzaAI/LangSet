import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { initializeCSRFForSession, refreshCSRFToken, getCSRFTokenFromCookie } from "@/lib/security/csrf-protection";

/**
 * GET /api/csrf/token - Get CSRF token for authenticated users
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user already has a valid CSRF token
    const existingToken = getCSRFTokenFromCookie();
    
    let csrfToken: string;
    
    if (existingToken) {
      // Try to refresh the existing token
      const refreshedToken = await refreshCSRFToken(
        existingToken,
        session.session.id,
        session.session.userId
      );
      
      if (refreshedToken) {
        csrfToken = refreshedToken;
      } else {
        csrfToken = existingToken; // Token is still valid, no refresh needed
      }
    } else {
      // Generate new token
      csrfToken = await initializeCSRFForSession(
        session.session.id,
        session.session.userId
      );
    }

    return NextResponse.json({
      success: true,
      csrfToken,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    });

  } catch (error) {
    console.error("[CSRF Token API] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate CSRF token" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/csrf/token - Refresh CSRF token
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { currentToken } = await request.json();

    let csrfToken: string;

    if (currentToken) {
      // Refresh existing token
      const refreshedToken = await refreshCSRFToken(
        currentToken,
        session.session.id,
        session.session.userId
      );
      
      if (refreshedToken) {
        csrfToken = refreshedToken;
      } else {
        // Generate new token if refresh failed
        csrfToken = await initializeCSRFForSession(
          session.session.id,
          session.session.userId
        );
      }
    } else {
      // Generate new token
      csrfToken = await initializeCSRFForSession(
        session.session.id,
        session.session.userId
      );
    }

    return NextResponse.json({
      success: true,
      csrfToken,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

  } catch (error) {
    console.error("[CSRF Token Refresh API] Error:", error);
    return NextResponse.json(
      { error: "Failed to refresh CSRF token" },
      { status: 500 }
    );
  }
}
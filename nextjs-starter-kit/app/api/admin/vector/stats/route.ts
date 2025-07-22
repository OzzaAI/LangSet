import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getVectorStatistics, adminSearchInstances } from "@/lib/pinecone/vector-service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // TODO: Add admin role check here
    // For MVP, we'll allow any authenticated user to access stats
    console.log(`[Admin Vector API] Stats request from user: ${session.session.userId}`);

    const statistics = await getVectorStatistics();

    return NextResponse.json({
      statistics,
      timestamp: new Date().toISOString(),
      generatedBy: session.session.userId
    });

  } catch (error) {
    console.error("[Admin Vector API] Stats error:", error);
    return NextResponse.json(
      { 
        error: "Failed to get vector statistics",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Admin search functionality
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // TODO: Add admin role check
    console.log(`[Admin Vector API] Search request from user: ${session.session.userId}`);

    const { query, filters = {}, options = {} } = await request.json();
    
    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    const searchResults = await adminSearchInstances(query, filters, {
      limit: options.limit || 50,
      includeAggregations: options.includeAggregations !== false
    });

    return NextResponse.json({
      query,
      filters,
      results: searchResults,
      timestamp: new Date().toISOString(),
      searchedBy: session.session.userId
    });

  } catch (error) {
    console.error("[Admin Vector API] Search error:", error);
    return NextResponse.json(
      { 
        error: "Admin search failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
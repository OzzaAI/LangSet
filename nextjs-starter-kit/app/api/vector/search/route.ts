import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { findSimilarInstances, findDatasetOverlaps, suggestDatasetBundles } from "@/lib/pinecone/vector-service";

export async function POST(request: NextRequest) {
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

    const { query, type, options = {} } = await request.json();
    
    if (!query || !type) {
      return NextResponse.json(
        { error: "Query and type are required" },
        { status: 400 }
      );
    }

    console.log(`[Vector Search] ${type} search for user: ${session.session.userId}`);

    switch (type) {
      case "similar_instances": {
        const results = await findSimilarInstances(query, {
          topK: options.limit || 10,
          threshold: options.threshold || 0.7,
          filter: {
            category: options.category,
            difficulty: options.difficulty,
            minQualityScore: options.minQualityScore,
            excludeUserId: options.excludeOwnContent ? session.session.userId : undefined,
            tags: options.tags
          }
        });

        return NextResponse.json({
          type: "similar_instances",
          query,
          results,
          totalFound: results.length
        });
      }

      case "dataset_overlaps": {
        const { datasetId } = options;
        if (!datasetId) {
          return NextResponse.json(
            { error: "Dataset ID is required for overlap analysis" },
            { status: 400 }
          );
        }

        const overlaps = await findDatasetOverlaps(datasetId, {
          minSimilarity: options.minSimilarity || 0.7,
          maxResults: options.maxResults || 5,
          excludeOwnDatasets: options.excludeOwnDatasets !== false
        });

        return NextResponse.json({
          type: "dataset_overlaps",
          datasetId,
          overlaps,
          totalFound: overlaps.length
        });
      }

      case "bundle_suggestions": {
        const bundles = await suggestDatasetBundles(session.session.userId, {
          minOverlapThreshold: options.minOverlapThreshold || 0.7,
          maxBundleSize: options.maxBundleSize || 4,
          minQualityScore: options.minQualityScore || 70
        });

        return NextResponse.json({
          type: "bundle_suggestions",
          userId: session.session.userId,
          suggestions: bundles,
          totalFound: bundles.length
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown search type: ${type}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error("[Vector Search] Search error:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("Pinecone")) {
        return NextResponse.json(
          { error: "Vector search service unavailable" },
          { status: 503 }
        );
      }
      
      if (error.message.includes("quota") || error.message.includes("limit")) {
        return NextResponse.json(
          { error: "Search quota exceeded. Please try again later." },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: "Vector search failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get similar instances for a specific instance (for recommendations)
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const instanceId = searchParams.get("instanceId");
    const limit = parseInt(searchParams.get("limit") || "5");
    const threshold = parseFloat(searchParams.get("threshold") || "0.7");

    if (!instanceId) {
      return NextResponse.json(
        { error: "Instance ID is required" },
        { status: 400 }
      );
    }

    // Get the instance content to use as query
    const { db } = await import("@/db/drizzle");
    const { instance } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const sourceInstance = await db
      .select({
        question: instance.question,
        answer: instance.answer,
        datasetId: instance.datasetId
      })
      .from(instance)
      .where(eq(instance.id, instanceId))
      .limit(1);

    if (!sourceInstance[0]) {
      return NextResponse.json(
        { error: "Instance not found" },
        { status: 404 }
      );
    }

    const queryText = `Question: ${sourceInstance[0].question}\n\nAnswer: ${sourceInstance[0].answer}`;
    
    const similarInstances = await findSimilarInstances(queryText, {
      topK: limit + 5, // Get extra to filter out the source instance
      threshold,
      filter: {
        excludeUserId: session.session.userId // Exclude user's own content for recommendations
      }
    });

    // Filter out the source instance and dataset
    const recommendations = similarInstances
      .filter(inst => inst.instanceId !== instanceId && inst.datasetId !== sourceInstance[0].datasetId)
      .slice(0, limit);

    return NextResponse.json({
      instanceId,
      recommendations,
      totalFound: recommendations.length,
      searchMetadata: {
        threshold,
        excludedOwnContent: true,
        queryLength: queryText.length
      }
    });

  } catch (error) {
    console.error("[Vector Search] Recommendation error:", error);
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 }
    );
  }
}
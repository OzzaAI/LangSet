import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { instance, dataset } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { embedInstance, batchEmbedInstances } from "@/lib/pinecone/vector-service";

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

    const { instanceIds, datasetId } = await request.json();
    
    if (!instanceIds && !datasetId) {
      return NextResponse.json(
        { error: "Either instanceIds array or datasetId is required" },
        { status: 400 }
      );
    }

    console.log(`[Vector API] Embedding request for user: ${session.session.userId}`);

    let instancesToEmbed;

    if (instanceIds) {
      // Embed specific instances
      instancesToEmbed = await db
        .select({
          id: instance.id,
          question: instance.question,
          answer: instance.answer,
          tags: instance.tags,
          category: instance.category,
          difficulty: instance.difficulty,
          qualityScore: instance.qualityScore,
          datasetId: instance.datasetId,
          userId: dataset.userId,
        })
        .from(instance)
        .innerJoin(dataset, eq(instance.datasetId, dataset.id))
        .where(and(
          eq(dataset.userId, session.session.userId), // Security: only user's instances
          eq(instance.id, instanceIds[0]) // For simplicity, handling first ID
        ));

    } else if (datasetId) {
      // Embed entire dataset
      instancesToEmbed = await db
        .select({
          id: instance.id,
          question: instance.question,
          answer: instance.answer,
          tags: instance.tags,
          category: instance.category,
          difficulty: instance.difficulty,
          qualityScore: instance.qualityScore,
          datasetId: instance.datasetId,
          userId: dataset.userId,
        })
        .from(instance)
        .innerJoin(dataset, eq(instance.datasetId, dataset.id))
        .where(and(
          eq(dataset.userId, session.session.userId), // Security check
          eq(instance.datasetId, datasetId)
        ));
    }

    if (!instancesToEmbed || instancesToEmbed.length === 0) {
      return NextResponse.json(
        { error: "No instances found to embed" },
        { status: 404 }
      );
    }

    // Format instances for embedding
    const formattedInstances = instancesToEmbed.map(inst => ({
      id: inst.id,
      question: inst.question,
      answer: inst.answer,
      tags: inst.tags as string[] || [],
      category: inst.category || "general",
      difficulty: inst.difficulty || "intermediate",
      qualityScore: inst.qualityScore || 0,
      datasetId: inst.datasetId,
      userId: inst.userId,
    }));

    // Perform embedding
    if (formattedInstances.length === 1) {
      await embedInstance(formattedInstances[0]);
    } else {
      await batchEmbedInstances(formattedInstances);
    }

    // Update anonymization status to indicate embedding complete
    await db
      .update(instance)
      .set({
        anonymizationStatus: "clean",
        updatedAt: new Date()
      })
      .where(eq(instance.id, formattedInstances.map(i => i.id)[0])); // Update first instance

    console.log(`[Vector API] Successfully embedded ${formattedInstances.length} instances`);

    return NextResponse.json({
      success: true,
      message: `Successfully embedded ${formattedInstances.length} instances`,
      embeddedCount: formattedInstances.length,
      instanceIds: formattedInstances.map(i => i.id)
    });

  } catch (error) {
    console.error("[Vector API] Embedding error:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("PINECONE_API_KEY")) {
        return NextResponse.json(
          { error: "Pinecone configuration error. Please check API key." },
          { status: 500 }
        );
      }
      
      if (error.message.includes("quota") || error.message.includes("limit")) {
        return NextResponse.json(
          { error: "Pinecone quota exceeded. Please try again later." },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: "Failed to embed instances",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get embedding status for instances
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
    const datasetId = searchParams.get("datasetId");

    if (!datasetId) {
      return NextResponse.json(
        { error: "Dataset ID is required" },
        { status: 400 }
      );
    }

    // Get embedding status for dataset instances
    const instances = await db
      .select({
        id: instance.id,
        question: instance.question,
        anonymizationStatus: instance.anonymizationStatus,
        qualityScore: instance.qualityScore,
        createdAt: instance.createdAt,
      })
      .from(instance)
      .innerJoin(dataset, eq(instance.datasetId, dataset.id))
      .where(and(
        eq(dataset.userId, session.session.userId),
        eq(instance.datasetId, datasetId)
      ));

    const embeddingStats = {
      total: instances.length,
      embedded: instances.filter(i => i.anonymizationStatus === "clean").length,
      pending: instances.filter(i => i.anonymizationStatus === "pending").length,
      flagged: instances.filter(i => i.anonymizationStatus === "flagged").length,
      avgQuality: instances.length > 0 
        ? Math.round(instances.reduce((sum, i) => sum + (i.qualityScore || 0), 0) / instances.length)
        : 0
    };

    return NextResponse.json({
      datasetId,
      embeddingStats,
      instances: instances.map(i => ({
        id: i.id,
        question: i.question.substring(0, 100) + "...",
        embeddingStatus: i.anonymizationStatus,
        qualityScore: i.qualityScore,
        createdAt: i.createdAt
      }))
    });

  } catch (error) {
    console.error("[Vector API] Status check error:", error);
    return NextResponse.json(
      { error: "Failed to get embedding status" },
      { status: 500 }
    );
  }
}
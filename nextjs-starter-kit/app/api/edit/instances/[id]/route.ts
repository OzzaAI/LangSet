import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { user, instance } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateQualityScore } from "@/lib/quality-scoring";

const updateInstanceSchema = z.object({
  question: z.string().min(1, "Question is required").max(1000, "Question is too long"),
  answer: z.string().min(1, "Answer is required").max(5000, "Answer is too long"),
  tags: z.array(z.string()).max(10, "Too many tags"),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const instanceId = params.id;

    // Parse and validate the request body
    const body = await request.json();
    const validation = updateInstanceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validation.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const { question, answer, tags } = validation.data;

    // Check daily edit limit
    const currentUser = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!currentUser.length) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const today = new Date().toDateString();
    const lastEditDate = currentUser[0].lastEditDate?.toDateString();
    const dailyEditsCount = lastEditDate === today ? currentUser[0].dailyEditsCount || 0 : 0;

    if (dailyEditsCount >= 20) {
      return NextResponse.json(
        { error: "Daily edit limit reached (20/20)" },
        { status: 429 }
      );
    }

    // Check if instance exists and user has access
    const existingInstance = await db
      .select()
      .from(instance)
      .where(eq(instance.id, instanceId))
      .limit(1);

    if (!existingInstance.length) {
      return NextResponse.json(
        { error: "Instance not found" },
        { status: 404 }
      );
    }

    // Calculate quality score
    const qualityMetrics = calculateQualityScore(question, answer, tags);

    // Update the instance
    const updatedInstance = await db
      .update(instance)
      .set({
        question,
        answer,
        tags,
        qualityScore: qualityMetrics.score,
        editCount: sql`${instance.editCount} + 1`,
        lastEditedBy: session.user.id,
        lastEditedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(instance.id, instanceId))
      .returning();

    // Update user's daily edit count
    const newDailyCount = dailyEditsCount + 1;
    await db
      .update(user)
      .set({
        dailyEditsCount: newDailyCount,
        lastEditDate: new Date(),
      })
      .where(eq(user.id, session.user.id));

    // Send feedback to LLM for learning (placeholder)
    try {
      await sendLLMFeedback({
        instanceId,
        userId: session.user.id,
        originalData: existingInstance[0],
        updatedData: { question, answer, tags },
        qualityMetrics,
      });
    } catch (error) {
      console.warn("Failed to send LLM feedback:", error);
      // Don't fail the request if LLM feedback fails
    }

    // Log edit event for analytics
    if (typeof window !== "undefined" && window.posthog) {
      window.posthog.capture("instance_edited", {
        instance_id: instanceId,
        quality_score: qualityMetrics.score,
        edit_count: existingInstance[0].editCount + 1,
        daily_edits_count: newDailyCount,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Instance updated successfully",
      instance: updatedInstance[0],
      qualityMetrics,
      dailyEdits: {
        count: newDailyCount,
        limit: 20,
        remaining: Math.max(0, 20 - newDailyCount),
      },
    });

  } catch (error) {
    console.error("Error updating instance:", error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function sendLLMFeedback(data: {
  instanceId: string;
  userId: string;
  originalData: Record<string, unknown>;
  updatedData: Record<string, unknown>;
  qualityMetrics: Record<string, unknown>;
}) {
  // Placeholder for LLM feedback API
  // This would typically send the edit information to your LLM service
  // to help it learn from user corrections and improvements
  
  const feedback = {
    type: "instance_edit",
    timestamp: new Date().toISOString(),
    user_id: data.userId,
    instance_id: data.instanceId,
    changes: {
      question: {
        before: data.originalData.question,
        after: data.updatedData.question,
      },
      answer: {
        before: data.originalData.answer,
        after: data.updatedData.answer,
      },
      tags: {
        before: data.originalData.tags,
        after: data.updatedData.tags,
      },
    },
    quality_improvement: {
      score_before: data.originalData.qualityScore,
      score_after: data.qualityMetrics.score,
      suggestions: data.qualityMetrics.suggestions,
    },
  };

  // In a real implementation, you would send this to your LLM training pipeline
  console.log("LLM Feedback:", feedback);
  
  // Example API call (uncomment and modify for your LLM service):
  /*
  const response = await fetch(process.env.LLM_FEEDBACK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.LLM_API_KEY}`,
    },
    body: JSON.stringify(feedback),
  });
  
  if (!response.ok) {
    throw new Error("Failed to send LLM feedback");
  }
  */
}
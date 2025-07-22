import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { user, instance, dataset } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
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
    const dailyEditsCount = lastEditDate === today ? currentUser[0].dailyEditsCount : 0;

    // Get user's datasets
    const userDatasets = await db
      .select()
      .from(dataset)
      .where(eq(dataset.userId, session.user.id));

    if (!userDatasets.length) {
      // Create a default dataset if none exists
      const defaultDataset = {
        id: nanoid(),
        name: "My Learning Dataset",
        description: "Personal knowledge base for learning and improvement",
        userId: session.user.id,
      };

      await db.insert(dataset).values(defaultDataset);

      // Create some sample instances
      const sampleInstances = [
        {
          id: nanoid(),
          question: "What is the purpose of React hooks?",
          answer: "React hooks allow you to use state and other React features in functional components, providing a more flexible and reusable way to manage component logic.",
          tags: ["react", "hooks", "javascript", "frontend"],
          datasetId: defaultDataset.id,
        },
        {
          id: nanoid(),
          question: "How do you implement authentication in a Next.js application?",
          answer: "Authentication in Next.js can be implemented using various methods including NextAuth.js, custom JWT tokens, or third-party services like Auth0. The choice depends on your specific requirements.",
          tags: ["nextjs", "authentication", "security", "jwt"],
          datasetId: defaultDataset.id,
        },
        {
          id: nanoid(),
          question: "What are the benefits of using TypeScript?",
          answer: "TypeScript provides static type checking, better IDE support, improved code documentation, easier refactoring, and helps catch errors at compile time rather than runtime.",
          tags: ["typescript", "javascript", "programming", "types"],
          datasetId: defaultDataset.id,
        }
      ];

      await db.insert(instance).values(sampleInstances);
      userDatasets.push(defaultDataset);
    }

    const datasetIds = userDatasets.map(d => d.id);

    // Get instances from user's datasets with quality scoring
    const { calculateQualityScore } = await import("@/lib/quality-scoring");
    
    let instancesData = await db
      .select()
      .from(instance)
      .where(and(
        eq(instance.datasetId, datasetIds[0]) // For now, just get from first dataset
      ))
      .orderBy(desc(instance.updatedAt))
      .limit(50);

    // Calculate quality scores and add suggestions for refinement
    const instances = instancesData.map(inst => {
      const qualityMetrics = calculateQualityScore(
        inst.question, 
        inst.answer, 
        inst.tags as string[] || []
      );

      return {
        ...inst,
        qualityScore: qualityMetrics.score,
        suggestions: qualityMetrics.suggestions,
        breakdown: qualityMetrics.breakdown
      };
    });

    // Calculate refinement stats
    const totalInstances = instances.length;
    const avgQualityScore = totalInstances > 0 
      ? Math.round(instances.reduce((sum, inst) => sum + (inst.qualityScore || 0), 0) / totalInstances)
      : 0;
    
    const lowQualityCount = instances.filter(inst => (inst.qualityScore || 0) < 60).length;
    const improvementPotential = totalInstances > 0 
      ? Math.round((lowQualityCount / totalInstances) * 30) // Max 30% improvement potential
      : 0;
    
    const completedRefinements = instances.filter(inst => (inst.editCount || 0) > 0).length;

    const stats = {
      totalInstances,
      avgQualityScore,
      improvementPotential,
      completedRefinements
    };

    return NextResponse.json({
      success: true,
      instances,
      stats,
      dailyEdits: {
        count: dailyEditsCount || 0,
        limit: 20,
        remaining: Math.max(0, 20 - (dailyEditsCount || 0)),
      },
      datasets: userDatasets,
    });

  } catch (error) {
    console.error("Error fetching instances:", error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
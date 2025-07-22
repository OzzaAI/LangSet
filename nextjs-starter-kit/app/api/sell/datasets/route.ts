import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { dataset, instance } from "@/db/schema";
import { eq, sql, avg, count, sum } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

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

    // Get user's datasets with aggregated instance data
    const datasets = await db
      .select({
        id: dataset.id,
        name: dataset.name,
        description: dataset.description,
        createdAt: dataset.createdAt,
        instanceCount: sql<number>`COALESCE(${count(instance.id)}, 0)`,
        averageQualityScore: sql<number>`COALESCE(${avg(instance.qualityScore)}, 0)`,
        totalEditCount: sql<number>`COALESCE(${sum(instance.editCount)}, 0)`,
      })
      .from(dataset)
      .leftJoin(instance, eq(dataset.id, instance.datasetId))
      .where(eq(dataset.userId, session.user.id))
      .groupBy(dataset.id, dataset.name, dataset.description, dataset.createdAt);

    // For each dataset, get sample tags and career niches from instances
    const enrichedDatasets = await Promise.all(
      datasets.map(async (ds) => {
        const instances = await db
          .select({
            tags: instance.tags,
          })
          .from(instance)
          .where(eq(instance.datasetId, ds.id))
          .limit(20); // Get sample instances for tag analysis

        // Extract unique tags from instances
        const allTags = instances.flatMap(inst => (inst.tags as string[]) || []);
        const uniqueTags = [...new Set(allTags)];

        // For now, we'll derive career niches from tags
        // In a real app, you might store this separately
        const careerNicheKeywords = {
          "Technology": ["javascript", "react", "node", "programming", "software", "web", "development", "coding"],
          "Marketing": ["marketing", "brand", "campaign", "advertising", "seo", "social media"],
          "Sales": ["sales", "customer", "crm", "pipeline", "conversion", "lead"],
          "Design": ["design", "ui", "ux", "figma", "photoshop", "creative"],
          "Engineering": ["engineering", "architecture", "system", "infrastructure", "devops"],
          "Product Management": ["product", "roadmap", "feature", "requirements", "agile", "scrum"],
        };

        const careerNiches: string[] = [];
        for (const [niche, keywords] of Object.entries(careerNicheKeywords)) {
          const hasKeyword = keywords.some(keyword => 
            uniqueTags.some(tag => tag.toLowerCase().includes(keyword.toLowerCase()))
          );
          if (hasKeyword) {
            careerNiches.push(niche);
          }
        }

        return {
          ...ds,
          tags: uniqueTags.slice(0, 10), // Limit to 10 most relevant tags
          careerNiches: careerNiches.length > 0 ? careerNiches : ["General"],
          instanceCount: Number(ds.instanceCount),
          averageQualityScore: Number(ds.averageQualityScore),
          totalEditCount: Number(ds.totalEditCount),
        };
      })
    );

    // Filter out datasets with no instances (can't sell empty datasets)
    const sellableDatasets = enrichedDatasets.filter(ds => ds.instanceCount > 0);

    return NextResponse.json({
      success: true,
      datasets: sellableDatasets,
    });

  } catch (error) {
    console.error("Error fetching datasets:", error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
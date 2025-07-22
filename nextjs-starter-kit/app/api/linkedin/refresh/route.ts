import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { account, user } from "@/db/schema";
import { fetchLinkedInProfile, calculateCredibilityScore } from "@/lib/linkedin-api";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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

    // Get LinkedIn account for the user
    const accounts = await db
      .select()
      .from(account)
      .where(eq(account.userId, session.user.id))
      .where(eq(account.providerId, "linkedin"));

    const linkedinAccount = accounts[0];
    if (!linkedinAccount?.accessToken) {
      return NextResponse.json(
        { error: "No LinkedIn account connected" },
        { status: 400 }
      );
    }

    // Fetch updated LinkedIn profile data
    const linkedinProfile = await fetchLinkedInProfile(linkedinAccount.accessToken);
    if (!linkedinProfile) {
      return NextResponse.json(
        { error: "Failed to fetch LinkedIn profile. Your token may have expired." },
        { status: 400 }
      );
    }

    // Calculate updated credibility score
    const credibilityScore = calculateCredibilityScore(linkedinProfile);

    // Update user with fresh LinkedIn profile and credibility score
    await db
      .update(user)
      .set({
        linkedinProfile: linkedinProfile,
        credibilityScore: credibilityScore,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id));

    return NextResponse.json({
      success: true,
      linkedinProfile,
      credibilityScore,
      message: "LinkedIn profile refreshed successfully"
    });

  } catch (error) {
    console.error("Error refreshing LinkedIn profile:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("401") || error.message.includes("unauthorized")) {
        return NextResponse.json(
          { error: "LinkedIn authorization expired. Please reconnect your account." },
          { status: 401 }
        );
      }
      
      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          { error: "LinkedIn API rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to refresh LinkedIn profile" },
      { status: 500 }
    );
  }
}
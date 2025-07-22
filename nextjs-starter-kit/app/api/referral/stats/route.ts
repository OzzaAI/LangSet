import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
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

    // Get current user's referral code
    const currentUser = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!currentUser.length || !currentUser[0].referralCode) {
      return NextResponse.json(
        { error: "Referral code not found" },
        { status: 404 }
      );
    }

    const userReferralCode = currentUser[0].referralCode;

    // Get all users referred by this user
    const referredUsers = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.referredBy, userReferralCode));

    return NextResponse.json({
      success: true,
      referralCode: userReferralCode,
      referralPoints: currentUser[0].referralPoints || 0,
      totalReferrals: referredUsers.length,
      referredUsers: referredUsers.map(u => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      })),
    });

  } catch (error) {
    console.error("Error fetching referral stats:", error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
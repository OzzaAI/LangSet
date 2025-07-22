import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { user } from "@/db/schema";
import { validateReferralCode } from "@/lib/referral";
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

    const { referralCode } = await request.json();

    if (!referralCode || !validateReferralCode(referralCode)) {
      return NextResponse.json(
        { error: "Invalid referral code" },
        { status: 400 }
      );
    }

    // Check if referral code exists and belongs to a different user
    const referrer = await db
      .select()
      .from(user)
      .where(eq(user.referralCode, referralCode))
      .limit(1);

    if (!referrer.length) {
      return NextResponse.json(
        { error: "Referral code not found" },
        { status: 404 }
      );
    }

    if (referrer[0].id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot use your own referral code" },
        { status: 400 }
      );
    }

    // Update the current user with the referral information
    await db
      .update(user)
      .set({
        referredBy: referralCode,
      })
      .where(eq(user.id, session.user.id));

    // Increment referral points for the referrer
    await db
      .update(user)
      .set({
        referralPoints: referrer[0].referralPoints + 10, // 10 points per referral
      })
      .where(eq(user.id, referrer[0].id));

    // Log successful referral event
    if (typeof window !== "undefined" && window.posthog) {
      window.posthog.capture("referral_successful", {
        referrer_id: referrer[0].id,
        referred_user_id: session.user.id,
        referral_code: referralCode,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Referral tracked successfully",
      referrer: {
        id: referrer[0].id,
        name: referrer[0].name,
      },
    });

  } catch (error) {
    console.error("Error tracking referral:", error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
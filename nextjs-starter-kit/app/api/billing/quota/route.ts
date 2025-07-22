import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { 
  getUserQuotaStatus, 
  getUserEarningsSummary,
  updateUserQualityMultiplier,
  SUBSCRIPTION_TIERS 
} from "@/lib/billing/quota-service";

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

    const { searchParams } = new URL(request.url);
    const includeEarnings = searchParams.get("includeEarnings") === "true";

    console.log(`[Quota API] Getting quota status for user: ${session.session.userId}`);

    // Get quota status
    const quotaStatus = await getUserQuotaStatus(session.session.userId);
    
    const response: any = {
      quota: quotaStatus,
      subscriptionInfo: {
        currentTier: quotaStatus.tier,
        tierInfo: SUBSCRIPTION_TIERS[quotaStatus.tier],
        availableUpgrades: Object.entries(SUBSCRIPTION_TIERS)
          .filter(([key]) => key !== quotaStatus.tier)
          .map(([key, tier]) => ({
            tier: key,
            name: tier.name,
            price: tier.price,
            instanceQuota: tier.instanceQuotaDaily,
            features: tier.features
          }))
      }
    };

    // Include earnings summary if requested
    if (includeEarnings) {
      const earningsSummary = await getUserEarningsSummary(session.session.userId);
      response.earnings = earningsSummary;
      
      // Update quality multiplier based on recent performance
      await updateUserQualityMultiplier(session.session.userId);
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error("[Quota API] Error getting quota status:", error);
    return NextResponse.json(
      { 
        error: "Failed to get quota status",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

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

    const { action, instanceCount = 1 } = await request.json();

    console.log(`[Quota API] ${action} request for user: ${session.session.userId}`);

    switch (action) {
      case "check": {
        // Check if user can generate instances without consuming quota
        const quotaStatus = await getUserQuotaStatus(session.session.userId);
        const canGenerate = quotaStatus.remaining >= instanceCount;

        return NextResponse.json({
          canGenerate,
          quotaStatus,
          message: canGenerate 
            ? `You can generate ${instanceCount} instances` 
            : `Insufficient quota: ${quotaStatus.remaining} remaining, ${instanceCount} requested`
        });
      }

      case "consume": {
        // Actually consume quota for instance generation
        const { checkAndConsumeQuota } = await import("@/lib/billing/quota-service");
        const result = await checkAndConsumeQuota(session.session.userId, instanceCount);

        if (!result.allowed) {
          return NextResponse.json(
            { 
              error: result.error,
              quotaStatus: result.newQuotaStatus 
            },
            { status: 429 }
          );
        }

        return NextResponse.json({
          success: true,
          consumed: instanceCount,
          newQuotaStatus: result.newQuotaStatus,
          message: `Successfully consumed ${instanceCount} instances from quota`
        });
      }

      case "refresh_multiplier": {
        // Recalculate quality multiplier
        const newMultiplier = await updateUserQualityMultiplier(session.session.userId);
        
        return NextResponse.json({
          success: true,
          newMultiplier,
          message: "Quality multiplier updated based on recent performance"
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error("[Quota API] Error processing quota action:", error);
    return NextResponse.json(
      { 
        error: "Failed to process quota action",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
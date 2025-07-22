import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { 
  createSubscription,
  createPaymentIntent,
  getUserSubscriptionStatus,
  cancelSubscription
} from "@/lib/billing/stripe-service";
import { SUBSCRIPTION_TIERS } from "@/lib/billing/quota-service";

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

    console.log(`[Stripe API] Getting subscription status for user: ${session.session.userId}`);

    const subscriptionStatus = await getUserSubscriptionStatus(session.session.userId);

    return NextResponse.json({
      ...subscriptionStatus,
      availableTiers: Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => ({
        tier: key,
        name: tier.name,
        price: tier.price,
        instanceQuota: tier.instanceQuotaDaily,
        features: tier.features,
        stripePriceId: tier.stripePriceId
      }))
    });

  } catch (error) {
    console.error("[Stripe API] Error getting subscription status:", error);
    return NextResponse.json(
      { 
        error: "Failed to get subscription status",
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

    const { action, tier, paymentMethodId, amount, metadata } = await request.json();

    console.log(`[Stripe API] ${action} request for user: ${session.session.userId}`);

    switch (action) {
      case "create_subscription": {
        if (!tier || !SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS]) {
          return NextResponse.json(
            { error: "Valid tier is required" },
            { status: 400 }
          );
        }

        const subscription = await createSubscription(
          session.session.userId,
          tier as keyof typeof SUBSCRIPTION_TIERS,
          paymentMethodId
        );

        return NextResponse.json({
          success: true,
          subscription,
          message: `Subscription created for ${SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS].name} tier`
        });
      }

      case "create_payment_intent": {
        if (!amount || amount <= 0) {
          return NextResponse.json(
            { error: "Valid amount is required" },
            { status: 400 }
          );
        }

        const paymentIntent = await createPaymentIntent(
          session.session.userId,
          amount,
          "usd",
          metadata || {}
        );

        return NextResponse.json({
          success: true,
          paymentIntent,
          message: "Payment intent created successfully"
        });
      }

      case "cancel_subscription": {
        const { immediately = false } = await request.json();
        
        await cancelSubscription(session.session.userId, immediately);

        return NextResponse.json({
          success: true,
          message: immediately 
            ? "Subscription cancelled immediately" 
            : "Subscription will cancel at period end"
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error("[Stripe API] Error processing billing action:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("No active subscription")) {
        return NextResponse.json(
          { error: "No active subscription found" },
          { status: 404 }
        );
      }
      
      if (error.message.includes("Stripe")) {
        return NextResponse.json(
          { error: "Payment processing error. Please try again." },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: "Failed to process billing action",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
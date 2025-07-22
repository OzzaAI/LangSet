import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { offer, listing, transaction } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { calculatePlatformFee, calculateSellerAmount } from "@/lib/pricing";

const respondToOfferSchema = z.object({
  action: z.enum(["accept", "reject"]),
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

    const offerId = params.id;

    // Parse and validate the request body
    const body = await request.json();
    const validation = respondToOfferSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validation.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const { action } = validation.data;

    // Verify offer exists and user owns the listing
    const offerData = await db
      .select({
        offer: offer,
        listing: listing,
      })
      .from(offer)
      .innerJoin(listing, eq(offer.listingId, listing.id))
      .where(and(
        eq(offer.id, offerId),
        eq(listing.sellerId, session.user.id)
      ))
      .limit(1);

    if (!offerData.length) {
      return NextResponse.json(
        { error: "Offer not found or access denied" },
        { status: 404 }
      );
    }

    const { offer: offerRecord } = offerData[0];

    // Check if offer is still pending
    if (offerRecord.status !== "pending") {
      return NextResponse.json(
        { error: "Offer has already been responded to" },
        { status: 400 }
      );
    }

    // Check if offer has expired
    if (offerRecord.expiresAt && new Date(offerRecord.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Offer has expired" },
        { status: 400 }
      );
    }

    // Update offer status
    const updatedOffer = await db
      .update(offer)
      .set({
        status: action === "accept" ? "accepted" : "rejected",
        updatedAt: new Date(),
      })
      .where(eq(offer.id, offerId))
      .returning();

    // If accepted, create a mock transaction record
    if (action === "accept") {
      const platformFee = calculatePlatformFee(offerRecord.amount);
      const sellerAmount = calculateSellerAmount(offerRecord.amount);

      const transactionRecord = {
        id: nanoid(),
        amount: offerRecord.amount,
        platformFee,
        sellerAmount,
        currency: offerRecord.currency,
        status: "pending" as const, // Would be "completed" after Stripe processing
        stripePaymentIntentId: null, // Would be populated by Stripe
        buyerId: offerRecord.buyerId,
        sellerId: session.user.id,
        listingId: offerRecord.listingId,
        offerId: offerId,
      };

      await db.insert(transaction).values(transactionRecord);

      // Log successful offer acceptance
      if (typeof window !== "undefined" && window.posthog) {
        window.posthog.capture("offer_accepted", {
          offer_id: offerId,
          listing_id: offerRecord.listingId,
          amount: offerRecord.amount,
          platform_fee: platformFee,
          seller_amount: sellerAmount,
          timestamp: new Date().toISOString(),
        });
      }

      // In a real implementation, you would:
      // 1. Create Stripe payment intent
      // 2. Send payment link to buyer
      // 3. Handle payment confirmation webhook
      // 4. Transfer funds to seller (minus platform fee)
      // 5. Grant buyer access to dataset

      console.log("Mock Stripe Integration:", {
        action: "create_payment_intent",
        amount: offerRecord.amount,
        currency: offerRecord.currency,
        buyer_id: offerRecord.buyerId,
        seller_id: session.user.id,
        platform_fee: platformFee,
        seller_receives: sellerAmount,
      });
    }

    // Log offer response event
    if (typeof window !== "undefined" && window.posthog) {
      window.posthog.capture("offer_responded", {
        offer_id: offerId,
        action: action,
        listing_id: offerRecord.listingId,
        amount: offerRecord.amount,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: `Offer ${action}ed successfully`,
      offer: updatedOffer[0],
    });

  } catch (error) {
    console.error("Error responding to offer:", error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
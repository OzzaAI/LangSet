import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { offer, listing, user, dataset } from "@/db/schema";
import { eq, desc, sql, count } from "drizzle-orm";
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

    // Get offers for user's listings
    const offers = await db
      .select({
        id: offer.id,
        amount: offer.amount,
        currency: offer.currency,
        message: offer.message,
        status: offer.status,
        expiresAt: offer.expiresAt,
        createdAt: offer.createdAt,
        updatedAt: offer.updatedAt,
        buyer: {
          id: user.id,
          name: user.name,
          email: user.email,
          credibilityScore: user.credibilityScore,
        },
        listing: {
          id: listing.id,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          isBundle: listing.isBundle,
          bundleDatasets: listing.bundleDatasets,
        },
      })
      .from(offer)
      .innerJoin(listing, eq(offer.listingId, listing.id))
      .innerJoin(user, eq(offer.buyerId, user.id))
      .where(eq(listing.sellerId, session.user.id))
      .orderBy(desc(offer.createdAt));

    // Enrich offers with dataset information
    const enrichedOffers = await Promise.all(
      offers.map(async (offerData) => {
        if (offerData.listing.isBundle && offerData.listing.bundleDatasets) {
          // Get bundle dataset details
          const bundleDatasetIds = offerData.listing.bundleDatasets as string[];
          const bundleDatasets = await db
            .select({
              id: dataset.id,
              name: dataset.name,
            })
            .from(dataset)
            .where(sql`${dataset.id} = ANY(${bundleDatasetIds})`);

          // Get instance counts for each dataset
          const datasetsWithCounts = await Promise.all(
            bundleDatasets.map(async (ds) => {
              const instanceCountResult = await db
                .select({ count: count() })
                .from(db.select().from(dataset).where(eq(dataset.id, ds.id)).as('subquery'));
              
              return {
                ...ds,
                instanceCount: instanceCountResult[0]?.count || 0,
              };
            })
          );

          return {
            ...offerData,
            listing: {
              ...offerData.listing,
              bundleDatasets: datasetsWithCounts,
            },
          };
        } else {
          // Get single dataset details
          const singleDataset = await db
            .select({
              id: dataset.id,
              name: dataset.name,
            })
            .from(dataset)
            .where(eq(dataset.id, offerData.listing.id))
            .limit(1);

          if (singleDataset.length > 0) {
            const instanceCountResult = await db
              .select({ count: count() })
              .from(db.select().from(dataset).where(eq(dataset.id, singleDataset[0].id)).as('subquery'));

            return {
              ...offerData,
              listing: {
                ...offerData.listing,
                dataset: {
                  ...singleDataset[0],
                  instanceCount: instanceCountResult[0]?.count || 0,
                },
              },
            };
          }

          return offerData;
        }
      })
    );

    // Calculate stats
    const stats = {
      total: offers.length,
      pending: offers.filter(o => o.status === "pending").length,
      accepted: offers.filter(o => o.status === "accepted").length,
      rejected: offers.filter(o => o.status === "rejected").length,
      totalValue: offers.reduce((sum, o) => sum + o.amount, 0),
      avgOffer: offers.length > 0 ? Math.round(offers.reduce((sum, o) => sum + o.amount, 0) / offers.length) : 0,
    };

    return NextResponse.json({
      success: true,
      offers: enrichedOffers,
      stats,
    });

  } catch (error) {
    console.error("Error fetching offers:", error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
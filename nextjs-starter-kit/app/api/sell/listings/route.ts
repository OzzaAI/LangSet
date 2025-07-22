import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { listing, dataset } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { generateShareableLink } from "@/lib/pricing";

const createListingSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  price: z.number().min(100, "Minimum price is $1.00").max(100000, "Maximum price is $1000.00"), // in cents
  datasetIds: z.array(z.string()).min(1, "At least one dataset is required").max(10, "Maximum 10 datasets per listing"),
  isBundle: z.boolean(),
});

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

    // Parse and validate the request body
    const body = await request.json();
    const validation = createListingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validation.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const { title, description, price, datasetIds, isBundle } = validation.data;

    // Verify user owns all datasets
    const userDatasets = await db
      .select()
      .from(dataset)
      .where(inArray(dataset.id, datasetIds))
      .where(eq(dataset.userId, session.user.id));

    if (userDatasets.length !== datasetIds.length) {
      return NextResponse.json(
        { error: "You don't have access to all specified datasets" },
        { status: 403 }
      );
    }

    // Create listing
    const listingId = nanoid();
    const shareableLink = generateShareableLink(listingId);

    const newListing = {
      id: listingId,
      title,
      description: description || null,
      price,
      currency: "USD",
      isActive: true,
      isBundle,
      bundleDatasets: isBundle ? datasetIds : null,
      shareableLink,
      views: 0,
      sellerId: session.user.id,
      datasetId: isBundle ? null : datasetIds[0], // Single dataset for non-bundles
    };

    const createdListing = await db
      .insert(listing)
      .values(newListing)
      .returning();

    // Log listing creation event
    if (typeof window !== "undefined" && window.posthog) {
      window.posthog.capture("listing_created", {
        listing_id: listingId,
        price: price,
        is_bundle: isBundle,
        dataset_count: datasetIds.length,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Listing created successfully",
      listing: createdListing[0],
    });

  } catch (error) {
    console.error("Error creating listing:", error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    // Get user's listings
    const userListings = await db
      .select()
      .from(listing)
      .where(eq(listing.sellerId, session.user.id));

    return NextResponse.json({
      success: true,
      listings: userListings,
    });

  } catch (error) {
    console.error("Error fetching listings:", error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
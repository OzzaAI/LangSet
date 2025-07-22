import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { user, dataset, instance, offer, transaction, listing } from "@/db/schema";
import { eq, and, gte, sum, count, avg, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.session.userId;
    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || '30d';

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get user data
    const userData = await db
      .select({
        totalEarnings: user.totalEarnings,
        qualityMultiplier: user.qualityMultiplier,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    // Get datasets stats
    const userDatasets = await db
      .select({
        id: dataset.id,
        name: dataset.name,
        instanceCount: dataset.instanceCount,
        averageQualityScore: dataset.averageQualityScore,
        createdAt: dataset.createdAt,
      })
      .from(dataset)
      .where(eq(dataset.userId, userId));

    const totalDatasets = userDatasets.length;
    const totalInstances = userDatasets.reduce((sum, d) => sum + (d.instanceCount || 0), 0);
    const avgQuality = userDatasets.length > 0 
      ? Math.round(userDatasets.reduce((sum, d) => sum + (d.averageQualityScore || 0), 0) / userDatasets.length)
      : 0;

    // Get transactions for earnings analysis
    const transactions = await db
      .select({
        amount: transaction.amount,
        status: transaction.status,
        createdAt: transaction.createdAt,
      })
      .from(transaction)
      .where(and(
        eq(transaction.sellerId, userId),
        eq(transaction.status, "completed")
      ));

    // Calculate monthly earnings
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthEarnings = transactions
      .filter(t => new Date(t.createdAt) >= thisMonthStart)
      .reduce((sum, t) => sum + (t.amount / 100), 0); // Convert from cents

    const lastMonthEarnings = transactions
      .filter(t => new Date(t.createdAt) >= lastMonthStart && new Date(t.createdAt) <= lastMonthEnd)
      .reduce((sum, t) => sum + (t.amount / 100), 0);

    const earningsGrowth = lastMonthEarnings > 0 
      ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100
      : thisMonthEarnings > 0 ? 100 : 0;

    // Get marketplace stats
    const userListings = await db
      .select({ id: listing.id })
      .from(listing)
      .where(eq(listing.sellerId, userId));

    const listingIds = userListings.map(l => l.id);

    let marketplaceStats = {
      totalOffers: 0,
      acceptanceRate: 0,
      avgOfferValue: 0,
      pendingOffers: 0,
    };

    if (listingIds.length > 0) {
      const offers = await db
        .select({
          amount: offer.amount,
          status: offer.status,
        })
        .from(offer)
        .where(eq(offer.listingId, listingIds[0])); // Simplified for single listing

      const totalOffers = offers.length;
      const acceptedOffers = offers.filter(o => o.status === 'accepted').length;
      const pendingOffers = offers.filter(o => o.status === 'pending').length;
      
      marketplaceStats = {
        totalOffers,
        acceptanceRate: totalOffers > 0 ? Math.round((acceptedOffers / totalOffers) * 100) : 0,
        avgOfferValue: totalOffers > 0 
          ? offers.reduce((sum, o) => sum + (o.amount / 100), 0) / totalOffers
          : 0,
        pendingOffers,
      };
    }

    // Generate trend data (simplified - in production you'd query actual historical data)
    const generateTrendData = (baseValue: number, length: number, variance: number = 0.2) => {
      return Array.from({ length }, (_, i) => {
        const randomFactor = 1 + (Math.random() - 0.5) * variance;
        const trendFactor = 1 + (i * 0.1); // Slight upward trend
        return Math.round(baseValue * randomFactor * trendFactor);
      });
    };

    const weeklyEarnings = generateTrendData(thisMonthEarnings / 4, 7, 0.3);
    const qualityTrend = generateTrendData(avgQuality, 7, 0.1);
    const datasetCreation = Array.from({ length: 7 }, () => Math.floor(Math.random() * 3));

    // Top performing datasets (mock data based on actual datasets)
    const topPerformingDatasets = userDatasets
      .sort((a, b) => (b.averageQualityScore || 0) - (a.averageQualityScore || 0))
      .slice(0, 3)
      .map(d => ({
        id: d.id,
        name: d.name,
        earnings: Math.random() * 500 + 100, // Mock earnings
        quality: d.averageQualityScore || 0,
      }));

    const analyticsData = {
      earnings: {
        total: userData[0]?.totalEarnings || 0,
        thisMonth: thisMonthEarnings,
        lastMonth: lastMonthEarnings,
        growth: Math.round(earningsGrowth * 10) / 10,
        qualityMultiplier: userData[0]?.qualityMultiplier || 1.0,
      },
      datasets: {
        total: totalDatasets,
        avgQuality,
        totalInstances,
        sold: transactions.length, // Simplified - number of completed transactions
      },
      marketplace: marketplaceStats,
      performance: {
        views: Math.floor(Math.random() * 2000) + 500, // Mock data
        impressions: Math.floor(Math.random() * 3000) + 1000,
        conversionRate: Math.round((Math.random() * 10 + 5) * 10) / 10,
        topPerformingDatasets,
      },
      trends: {
        weeklyEarnings,
        qualityTrend,
        datasetCreation,
      },
    };

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error("Error fetching analytics:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}
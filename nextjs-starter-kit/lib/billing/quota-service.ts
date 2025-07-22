import { db } from "@/db/drizzle";
import { user, instance, transaction } from "@/db/schema";
import { eq, and, gte, count, sum } from "drizzle-orm";

// Subscription tier definitions
export const SUBSCRIPTION_TIERS = {
  basic: {
    name: "Basic",
    instanceQuotaDaily: 20,
    price: 0,
    stripePriceId: null,
    features: [
      "20 instances per day",
      "Basic quality scoring",
      "Standard marketplace access"
    ]
  },
  pro: {
    name: "Pro",
    instanceQuotaDaily: 50,
    price: 19.99,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    features: [
      "50 instances per day",
      "Advanced LangGraph workflows",
      "Premium quality scoring",
      "Priority marketplace placement",
      "Vector similarity insights",
      "Auto-bundling suggestions"
    ]
  },
  enterprise: {
    name: "Enterprise",
    instanceQuotaDaily: 200,
    price: 99.99,
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    features: [
      "200 instances per day",
      "Custom LLM models",
      "Advanced analytics",
      "Dedicated support",
      "Custom integrations",
      "White-label options"
    ]
  }
} as const;

// Quality score to earnings multiplier mapping
export const QUALITY_MULTIPLIERS = {
  // 1-star quality (0-20% score)
  1: 0.5,
  // 2-star quality (21-40% score)
  2: 0.7,
  // 3-star quality (41-60% score)
  3: 1.0,
  // 4-star quality (61-80% score)
  4: 1.3,
  // 5-star quality (81-100% score)
  5: 1.5
} as const;

export interface QuotaStatus {
  current: number;
  limit: number;
  remaining: number;
  resetTime: Date;
  tier: keyof typeof SUBSCRIPTION_TIERS;
  canGenerate: boolean;
}

export interface EarningsInfo {
  qualityScore: number;
  qualityStars: number;
  baseEarnings: number;
  multiplier: number;
  finalEarnings: number;
  description: string;
}

/**
 * Check user's current quota status
 */
export async function getUserQuotaStatus(userId: string): Promise<QuotaStatus> {
  const userData = await db
    .select({
      subscriptionTier: user.subscriptionTier,
      instanceQuotaDaily: user.instanceQuotaDaily,
      instanceQuotaUsed: user.instanceQuotaUsed,
      lastQuotaReset: user.lastQuotaReset,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!userData[0]) {
    throw new Error("User not found");
  }

  const userInfo = userData[0];
  const now = new Date();
  const lastReset = userInfo.lastQuotaReset || new Date();
  
  // Check if quota needs to be reset (daily reset)
  const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
  
  let currentUsage = userInfo.instanceQuotaUsed || 0;
  let resetTime = new Date(lastReset);
  resetTime.setDate(resetTime.getDate() + 1);
  
  // Reset quota if it's a new day
  if (daysSinceReset >= 1) {
    currentUsage = 0;
    resetTime = new Date(now);
    resetTime.setDate(resetTime.getDate() + 1);
    resetTime.setHours(0, 0, 0, 0);
    
    // Update database
    await db
      .update(user)
      .set({
        instanceQuotaUsed: 0,
        lastQuotaReset: now,
        updatedAt: now
      })
      .where(eq(user.id, userId));
  }

  const tier = (userInfo.subscriptionTier as keyof typeof SUBSCRIPTION_TIERS) || "basic";
  const limit = userInfo.instanceQuotaDaily || SUBSCRIPTION_TIERS[tier].instanceQuotaDaily;
  const remaining = Math.max(0, limit - currentUsage);

  return {
    current: currentUsage,
    limit,
    remaining,
    resetTime,
    tier,
    canGenerate: remaining > 0
  };
}

/**
 * Check if user can generate instances and deduct from quota
 */
export async function checkAndConsumeQuota(
  userId: string, 
  instanceCount: number = 1
): Promise<{ allowed: boolean; newQuotaStatus: QuotaStatus; error?: string }> {
  const quotaStatus = await getUserQuotaStatus(userId);
  
  if (!quotaStatus.canGenerate || quotaStatus.remaining < instanceCount) {
    return {
      allowed: false,
      newQuotaStatus: quotaStatus,
      error: `Insufficient quota. You have ${quotaStatus.remaining} instances remaining. Resets at ${quotaStatus.resetTime.toLocaleString()}.`
    };
  }

  // Deduct from quota
  await db
    .update(user)
    .set({
      instanceQuotaUsed: quotaStatus.current + instanceCount,
      updatedAt: new Date()
    })
    .where(eq(user.id, userId));

  // Get updated status
  const newQuotaStatus = await getUserQuotaStatus(userId);

  return {
    allowed: true,
    newQuotaStatus
  };
}

/**
 * Calculate quality-based earnings multiplier
 */
export function calculateQualityMultiplier(qualityScore: number): EarningsInfo {
  // Convert quality score (0-100) to star rating (1-5)
  let qualityStars: number;
  if (qualityScore <= 20) qualityStars = 1;
  else if (qualityScore <= 40) qualityStars = 2;
  else if (qualityScore <= 60) qualityStars = 3;
  else if (qualityScore <= 80) qualityStars = 4;
  else qualityStars = 5;

  const multiplier = QUALITY_MULTIPLIERS[qualityStars as keyof typeof QUALITY_MULTIPLIERS];
  
  // Example base earnings calculation (could be more sophisticated)
  const baseEarnings = 5.0; // $5 base per instance
  const finalEarnings = baseEarnings * multiplier;

  let description = "";
  switch (qualityStars) {
    case 1:
      description = "Below average quality - 50% earnings";
      break;
    case 2:
      description = "Fair quality - 70% earnings";
      break;
    case 3:
      description = "Good quality - standard earnings";
      break;
    case 4:
      description = "High quality - 30% bonus earnings";
      break;
    case 5:
      description = "Excellent quality - 50% bonus earnings";
      break;
  }

  return {
    qualityScore,
    qualityStars,
    baseEarnings,
    multiplier,
    finalEarnings: Math.round(finalEarnings * 100) / 100,
    description
  };
}

/**
 * Update user's quality multiplier based on recent performance
 */
export async function updateUserQualityMultiplier(userId: string): Promise<number> {
  // Get user's recent instances (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentInstances = await db
    .select({
      qualityScore: instance.qualityScore,
    })
    .from(instance)
    .where(and(
      eq(instance.lastEditedBy, userId),
      gte(instance.createdAt, thirtyDaysAgo)
    ));

  if (recentInstances.length === 0) {
    return 1.0; // Default multiplier
  }

  // Calculate average quality score
  const avgQuality = recentInstances.reduce((sum, inst) => sum + (inst.qualityScore || 0), 0) / recentInstances.length;
  
  // Calculate multiplier
  const earningsInfo = calculateQualityMultiplier(avgQuality);
  const newMultiplier = earningsInfo.multiplier;

  // Update user's multiplier
  await db
    .update(user)
    .set({
      qualityMultiplier: newMultiplier,
      updatedAt: new Date()
    })
    .where(eq(user.id, userId));

  console.log(`[Quota Service] Updated quality multiplier for user ${userId}: ${newMultiplier} (avg quality: ${Math.round(avgQuality)})`);

  return newMultiplier;
}

/**
 * Get user's earnings summary
 */
export async function getUserEarningsSummary(userId: string): Promise<{
  totalEarnings: number;
  currentMultiplier: number;
  avgQualityScore: number;
  instancesSold: number;
  potentialEarnings: {
    nextSale: number;
    withBetterQuality: number;
  };
}> {
  // Get user data
  const userData = await db
    .select({
      totalEarnings: user.totalEarnings,
      qualityMultiplier: user.qualityMultiplier,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!userData[0]) {
    throw new Error("User not found");
  }

  // Get user's instances average quality
  const qualityData = await db
    .select({
      avgQuality: instance.qualityScore, // This would need to be aggregated properly
      count: count()
    })
    .from(instance)
    .where(eq(instance.lastEditedBy, userId));

  // Get sales count (this would need proper transaction tracking)
  const salesData = await db
    .select({
      count: count(),
      totalAmount: sum(transaction.amount)
    })
    .from(transaction)
    .where(eq(transaction.sellerId, userId));

  const avgQualityScore = qualityData[0]?.avgQuality || 0;
  const instancesSold = salesData[0]?.count || 0;
  const currentMultiplier = userData[0].qualityMultiplier || 1.0;

  // Calculate potential earnings
  const basePrice = 5.0;
  const nextSaleEarnings = basePrice * currentMultiplier;
  
  // If they improved to 5-star quality
  const betterQualityMultiplier = QUALITY_MULTIPLIERS[5];
  const withBetterQuality = basePrice * betterQualityMultiplier;

  return {
    totalEarnings: userData[0].totalEarnings || 0,
    currentMultiplier,
    avgQualityScore,
    instancesSold,
    potentialEarnings: {
      nextSale: Math.round(nextSaleEarnings * 100) / 100,
      withBetterQuality: Math.round(withBetterQuality * 100) / 100
    }
  };
}

/**
 * Upgrade user subscription tier
 */
export async function upgradeUserTier(
  userId: string, 
  newTier: keyof typeof SUBSCRIPTION_TIERS,
  stripeCustomerId?: string
): Promise<void> {
  const tierInfo = SUBSCRIPTION_TIERS[newTier];
  
  await db
    .update(user)
    .set({
      subscriptionTier: newTier,
      instanceQuotaDaily: tierInfo.instanceQuotaDaily,
      stripeCustomerId: stripeCustomerId || undefined,
      updatedAt: new Date()
    })
    .where(eq(user.id, userId));

  console.log(`[Quota Service] Upgraded user ${userId} to ${tierInfo.name} tier`);
}

/**
 * Enforce quota checks before instance generation
 */
export async function enforceQuotaCheck(userId: string, instanceCount: number): Promise<void> {
  const quotaCheck = await checkAndConsumeQuota(userId, instanceCount);
  
  if (!quotaCheck.allowed) {
    throw new Error(quotaCheck.error || "Quota exceeded");
  }
}

export default {
  getUserQuotaStatus,
  checkAndConsumeQuota,
  calculateQualityMultiplier,
  updateUserQualityMultiplier,
  getUserEarningsSummary,
  upgradeUserTier,
  enforceQuotaCheck,
  SUBSCRIPTION_TIERS,
  QUALITY_MULTIPLIERS
};
import { db } from "@/db/drizzle";
import { instance, user } from "@/db/schema";
import { eq, count } from "drizzle-orm";

/**
 * Progressive CTA thresholds for LangSet MVP
 * Based on Stan Store-inspired UX patterns
 */
export const INTERVIEW_THRESHOLDS = {
  // Minimum instances to unlock refine functionality
  REFINE_UNLOCK: 5,
  // Minimum instances to show advanced features
  ADVANCED_UNLOCK: 10,
  // Minimum for marketplace listing
  MARKETPLACE_UNLOCK: 15,
} as const;

export interface ProgressiveState {
  canRefine: boolean;
  canAccessAdvanced: boolean;
  canListOnMarketplace: boolean;
  instanceCount: number;
  progress: {
    refine: number;
    advanced: number;
    marketplace: number;
  };
  nextMilestone: {
    feature: string;
    remaining: number;
    total: number;
  } | null;
}

/**
 * Determines what features a user can access based on their instance completion
 */
export async function getUserProgressiveState(userId: string): Promise<ProgressiveState> {
  // Get user's total edited instances count
  const instanceResult = await db
    .select({ count: count() })
    .from(instance)
    .where(eq(instance.lastEditedBy, userId));

  const instanceCount = instanceResult[0]?.count || 0;

  const canRefine = instanceCount >= INTERVIEW_THRESHOLDS.REFINE_UNLOCK;
  const canAccessAdvanced = instanceCount >= INTERVIEW_THRESHOLDS.ADVANCED_UNLOCK;
  const canListOnMarketplace = instanceCount >= INTERVIEW_THRESHOLDS.MARKETPLACE_UNLOCK;

  // Calculate progress percentages
  const progress = {
    refine: Math.min(100, (instanceCount / INTERVIEW_THRESHOLDS.REFINE_UNLOCK) * 100),
    advanced: Math.min(100, (instanceCount / INTERVIEW_THRESHOLDS.ADVANCED_UNLOCK) * 100),
    marketplace: Math.min(100, (instanceCount / INTERVIEW_THRESHOLDS.MARKETPLACE_UNLOCK) * 100),
  };

  // Determine next milestone
  let nextMilestone: ProgressiveState["nextMilestone"] = null;
  
  if (!canRefine) {
    nextMilestone = {
      feature: "Refine Dataset",
      remaining: INTERVIEW_THRESHOLDS.REFINE_UNLOCK - instanceCount,
      total: INTERVIEW_THRESHOLDS.REFINE_UNLOCK,
    };
  } else if (!canAccessAdvanced) {
    nextMilestone = {
      feature: "Advanced Features",
      remaining: INTERVIEW_THRESHOLDS.ADVANCED_UNLOCK - instanceCount,
      total: INTERVIEW_THRESHOLDS.ADVANCED_UNLOCK,
    };
  } else if (!canListOnMarketplace) {
    nextMilestone = {
      feature: "Marketplace Listing",
      remaining: INTERVIEW_THRESHOLDS.MARKETPLACE_UNLOCK - instanceCount,
      total: INTERVIEW_THRESHOLDS.MARKETPLACE_UNLOCK,
    };
  }

  return {
    canRefine,
    canAccessAdvanced,
    canListOnMarketplace,
    instanceCount,
    progress,
    nextMilestone,
  };
}

/**
 * Get locked CTA message for Stan Store-inspired UX
 */
export function getLockedMessage(feature: string, remaining: number): string {
  const messages = {
    "Refine Dataset": `Complete ${remaining} more instances to unlock dataset refinement`,
    "Advanced Features": `Complete ${remaining} more instances to unlock advanced features`,
    "Marketplace Listing": `Complete ${remaining} more instances to list on marketplace`,
  };
  
  return messages[feature as keyof typeof messages] || `Complete ${remaining} more instances to unlock this feature`;
}

/**
 * Stan Store-inspired locked button state
 */
export interface LockedCTAProps {
  isLocked: boolean;
  lockedMessage?: string;
  progress?: number;
  onClick?: () => void;
}
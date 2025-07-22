"use client";

import { useRouter } from "next/navigation";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from "@/components/ui/glass-card";
import { LockedCTA } from "@/components/ui/locked-cta";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ProgressiveState, getLockedMessage } from "@/lib/progressive-ctas";
import { Edit3, DollarSign, Eye, TrendingUp, ArrowRight } from "lucide-react";

interface ProgressiveQuickActionsProps {
  progressiveState: ProgressiveState;
}

export function ProgressiveQuickActions({ progressiveState }: ProgressiveQuickActionsProps) {
  const router = useRouter();

  return (
    <GlassCard variant="elevated" className="p-6">
      <GlassCardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <GlassCardTitle>Quick Actions</GlassCardTitle>
            <GlassCardDescription>
              Create and monetize your knowledge datasets
            </GlassCardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-400 border-green-400/30">
              {progressiveState.instanceCount} instances completed
            </Badge>
          </div>
        </div>
      </GlassCardHeader>
      
      <GlassCardContent className="pt-0 space-y-6">
        {/* Progress Milestone */}
        {progressiveState.nextMilestone && (
          <div className="bg-gradient-to-r from-green-500/5 to-emerald-500/5 border border-green-400/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-green-400">
                Next Unlock: {progressiveState.nextMilestone.feature}
              </h4>
              <span className="text-xs text-gray-400">
                {progressiveState.nextMilestone.remaining} remaining
              </span>
            </div>
            <Progress 
              value={(progressiveState.instanceCount / progressiveState.nextMilestone.total) * 100} 
              className="h-2 bg-gray-700" 
            />
            <p className="text-xs text-gray-400 mt-2">
              Complete {progressiveState.nextMilestone.remaining} more instances to unlock {progressiveState.nextMilestone.feature.toLowerCase()}
            </p>
          </div>
        )}

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Start Editing - Always Available */}
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-400/20 rounded-lg p-4 hover:from-green-500/15 hover:to-emerald-500/15 transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <Edit3 className="h-6 w-6 text-green-400" />
              <h3 className="text-white font-medium">Start Editing</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Improve dataset quality with AI assistance
            </p>
            <Button 
              onClick={() => router.push("/edit")}
              size="sm"
              className="w-full group transition-all duration-200 hover:shadow-lg hover:scale-105"
            >
              Edit Instances
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
            </Button>
          </div>

          {/* Refine Dataset - Progressive */}
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/20 rounded-lg p-4 hover:from-blue-500/15 hover:to-cyan-500/15 transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-6 w-6 text-blue-400" />
              <h3 className="text-white font-medium">Refine Dataset</h3>
              {!progressiveState.canRefine && (
                <Badge variant="outline" className="text-xs text-orange-400 border-orange-400/30">
                  Locked
                </Badge>
              )}
            </div>
            <p className="text-gray-400 text-sm mb-4">
              {progressiveState.canRefine 
                ? "AI-powered quality enhancement" 
                : "Complete 5 instances to unlock"
              }
            </p>
            <LockedCTA
              isLocked={!progressiveState.canRefine}
              lockedMessage={progressiveState.nextMilestone?.feature === "Refine Dataset" 
                ? getLockedMessage(progressiveState.nextMilestone.feature, progressiveState.nextMilestone.remaining)
                : "Complete 5 instances to unlock dataset refinement"
              }
              progress={progressiveState.progress.refine}
              onClick={() => router.push("/refine")}
              className="w-full"
              size="sm"
            >
              Refine Quality
            </LockedCTA>
          </div>

          {/* Marketplace - Progressive */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/20 rounded-lg p-4 hover:from-purple-500/15 hover:to-pink-500/15 transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-6 w-6 text-purple-400" />
              <h3 className="text-white font-medium">Sell Datasets</h3>
              {!progressiveState.canListOnMarketplace && (
                <Badge variant="outline" className="text-xs text-orange-400 border-orange-400/30">
                  Locked
                </Badge>
              )}
            </div>
            <p className="text-gray-400 text-sm mb-4">
              {progressiveState.canListOnMarketplace 
                ? "List on marketplace and earn" 
                : "Complete 15 instances to unlock"
              }
            </p>
            <LockedCTA
              isLocked={!progressiveState.canListOnMarketplace}
              lockedMessage={progressiveState.nextMilestone?.feature === "Marketplace Listing"
                ? getLockedMessage(progressiveState.nextMilestone.feature, progressiveState.nextMilestone.remaining)
                : "Complete 15 instances to unlock marketplace listing"
              }
              progress={progressiveState.progress.marketplace}
              onClick={() => router.push("/sell")}
              className="w-full"
              size="sm"
            >
              List for Sale
            </LockedCTA>
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-700/30">
          <Button
            variant="outline"
            onClick={() => router.push("/offers")}
            className="flex items-center gap-2 hover:bg-gray-800/50"
          >
            <Eye className="h-4 w-4" />
            View Offers
          </Button>
          
          <Button
            variant="outline"
            onClick={() => router.push("/analytics")}
            className="flex items-center gap-2 hover:bg-gray-800/50"
            disabled={!progressiveState.canAccessAdvanced}
          >
            <TrendingUp className="h-4 w-4" />
            Analytics
            {!progressiveState.canAccessAdvanced && (
              <Badge variant="outline" className="text-xs ml-auto">
                10+ instances
              </Badge>
            )}
          </Button>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
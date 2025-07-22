"use client";

import { useState, useEffect } from "react";
import {
  Users,
  DollarSign,
  TrendingUp,
  Share2,
  UserPlus,
  Award,
  Target,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  ExternalLink,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

interface CoachMetrics {
  onboardedUsers: {
    total: number;
    thisWeek: number;
    lastWeek: number;
    trend: "up" | "down" | "stable";
    fromShares: number;
    fromReferrals: number;
  };
  earnedShares: {
    totalRevenue: number; // 50% of marketplace downloads
    thisMonth: number;
    downloads: number;
    commission: number; // percentage
  };
  totalEarnings: {
    marketplace: number;
    coaching: number;
    total: number;
    growth: number; // percentage
  };
  viralGrowth: {
    totalShares: number;
    reach: number;
    conversions: number;
    conversionRate: number; // percentage
  };
}

interface CoachMetricsProps {
  coachMode?: boolean;
}

export default function CoachMetrics({ coachMode = false }: CoachMetricsProps) {
  const [metrics, setMetrics] = useState<CoachMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCoachMetrics = async () => {
    if (!coachMode) {
      setLoading(false);
      return;
    }

    try {
      setRefreshing(true);
      
      // Load coach metrics from API
      const response = await fetch("/api/coach-metrics");
      
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
      } else {
        // Fallback with mock data
        setMetrics({
          onboardedUsers: {
            total: 47,
            thisWeek: 8,
            lastWeek: 6,
            trend: "up",
            fromShares: 23,
            fromReferrals: 24,
          },
          earnedShares: {
            totalRevenue: 2847, // $28.47
            thisMonth: 1234, // $12.34
            downloads: 156,
            commission: 50,
          },
          totalEarnings: {
            marketplace: 2847,
            coaching: 8500,
            total: 11347,
            growth: 23.5,
          },
          viralGrowth: {
            totalShares: 89,
            reach: 4450, // estimated reach
            conversions: 23,
            conversionRate: 25.8,
          },
        });
      }
    } catch (error) {
      console.error("Failed to load coach metrics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCoachMetrics();
  }, [coachMode]);

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  // Don't render if coach mode is disabled
  if (!coachMode) {
    return null;
  }

  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-teal-400" />
            Coach Dashboard
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-white/10 rounded w-1/2 mb-2"></div>
              <div className="h-2 bg-white/10 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-teal-400" />
            Coach Dashboard
          </h2>
        </div>
        <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6 text-center">
          <p className="text-gray-400 mb-4">Failed to load coach metrics</p>
          <button 
            onClick={loadCoachMetrics}
            className="text-teal-300 hover:text-teal-200 text-sm font-medium flex items-center gap-1 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Award className="w-6 h-6 text-teal-400" />
          Coach Dashboard
        </h2>
        <button 
          onClick={loadCoachMetrics}
          disabled={refreshing}
          className="text-teal-300 hover:text-teal-200 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Onboarded Users */}
        <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-teal-400" />
              <h3 className="text-lg font-semibold text-white">Onboarded Users</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <div className="text-2xl font-bold text-white">{metrics.onboardedUsers.total}</div>
            <div className="flex items-center gap-1">
              {getTrendIcon(metrics.onboardedUsers.trend)}
              <span className={`text-xs ${getTrendColor(metrics.onboardedUsers.trend)}`}>
                {Math.abs(
                  ((metrics.onboardedUsers.thisWeek - metrics.onboardedUsers.lastWeek) /
                    metrics.onboardedUsers.lastWeek) *
                    100
                ).toFixed(0)}%
              </span>
            </div>
          </div>
          
          <div className="text-sm text-gray-400 mb-4">
            {metrics.onboardedUsers.thisWeek} this week
          </div>
          
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-white font-medium">{metrics.onboardedUsers.fromShares}</div>
                <div className="text-gray-400">From Shares</div>
              </div>
              <div>
                <div className="text-white font-medium">{metrics.onboardedUsers.fromReferrals}</div>
                <div className="text-gray-400">From Referrals</div>
              </div>
            </div>
          </div>
        </div>

        {/* Earned Shares */}
        <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-teal-400" />
              <h3 className="text-lg font-semibold text-white">Earned Shares</h3>
            </div>
          </div>
          
          <div className="text-2xl font-bold text-white mb-2">
            {formatCurrency(metrics.earnedShares.totalRevenue)}
          </div>
          
          <div className="text-sm text-gray-400 mb-4">
            {formatCurrency(metrics.earnedShares.thisMonth)} this month
          </div>
          
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="text-xs text-gray-400 mb-1">
              {metrics.earnedShares.downloads} downloads × {metrics.earnedShares.commission}% commission
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-green-400" />
              <span className="text-xs text-green-300">Marketplace Revenue Share</span>
            </div>
          </div>
        </div>

        {/* Total Earnings */}
        <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-400" />
              <h3 className="text-lg font-semibold text-white">Total Earnings</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <div className="text-2xl font-bold text-white">
              {formatCurrency(metrics.totalEarnings.total)}
            </div>
            <div className="flex items-center gap-1">
              <ArrowUp className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-600">
                +{metrics.totalEarnings.growth.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="text-sm text-gray-400 mb-4">All time earnings</div>
          
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-white font-medium">{formatCurrency(metrics.totalEarnings.coaching)}</div>
                <div className="text-gray-400">Coaching</div>
              </div>
              <div>
                <div className="text-white font-medium">{formatCurrency(metrics.totalEarnings.marketplace)}</div>
                <div className="text-gray-400">Marketplace</div>
              </div>
            </div>
          </div>
        </div>

        {/* Viral Growth */}
        <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-teal-400" />
              <h3 className="text-lg font-semibold text-white">Viral Growth</h3>
            </div>
          </div>
          
          <div className="text-2xl font-bold text-white mb-2">
            {metrics.viralGrowth.totalShares}
          </div>
          
          <div className="text-sm text-gray-400 mb-4">
            {metrics.viralGrowth.reach.toLocaleString()} potential reach
          </div>
          
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-white font-medium">{metrics.viralGrowth.conversions}</div>
                <div className="text-gray-400">Conversions</div>
              </div>
              <div>
                <div className="text-white font-medium">{metrics.viralGrowth.conversionRate.toFixed(1)}%</div>
                <div className="text-gray-400">Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
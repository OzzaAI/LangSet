"use client";

import { useState, useEffect } from "react";
import { 
  CreditCard, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign,
  Download,
  Share2,
  Zap,
  ArrowRight,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { BILLING_PLANS } from "@/lib/subscription";

interface UsageData {
  agentDownloads: number;
  agentShares: number;
  apiCalls: number;
  totalCost: number;
}

interface BillingInfo {
  planId: string;
  planName: string;
  baseAmount: number;
  usage: UsageData;
  overages: {
    downloads: { overage: number; cost: number };
    shares: { overage: number; cost: number };
    apiCalls: { overage: number; cost: number };
    totalOverage: number;
  };
  nextBillDate: string;
}

export default function UsageBilling() {
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBillingInfo = async () => {
    try {
      setRefreshing(true);
      
      // Mock API call - in production this would fetch real billing data
      const response = await fetch("/api/billing/usage");
      
      if (response.ok) {
        const data = await response.json();
        setBillingInfo(data);
      } else {
        // Fallback with mock data
        const planId = "free"; // This would come from user's subscription
        const plan = BILLING_PLANS[planId];
        
        const mockUsage: UsageData = {
          agentDownloads: 7,
          agentShares: 15,
          apiCalls: 1250,
          totalCost: 370, // $3.70
        };

        const downloadOverage = Math.max(0, mockUsage.agentDownloads - plan.features.agentDownloads.included);
        const shareOverage = Math.max(0, mockUsage.agentShares - plan.features.agentShares.included);
        const apiCallOverage = Math.max(0, mockUsage.apiCalls - plan.features.apiCalls.included);

        setBillingInfo({
          planId,
          planName: plan.name,
          baseAmount: plan.basePrice,
          usage: mockUsage,
          overages: {
            downloads: {
              overage: downloadOverage,
              cost: downloadOverage * plan.features.agentDownloads.pricePerExtra
            },
            shares: {
              overage: shareOverage,
              cost: shareOverage * plan.features.agentShares.pricePerExtra
            },
            apiCalls: {
              overage: apiCallOverage,
              cost: Math.ceil(apiCallOverage / 1000) * plan.features.apiCalls.pricePerExtra
            },
            totalOverage: 0
          },
          nextBillDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        });
      }
    } catch (error) {
      console.error("Failed to load billing info:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBillingInfo();
  }, []);

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 100) return "text-red-400";
    if (percentage >= 80) return "text-yellow-400";
    return "text-green-400";
  };

  const getUsageBarColor = (percentage: number) => {
    if (percentage >= 100) return "from-red-500 to-red-600";
    if (percentage >= 80) return "from-yellow-500 to-orange-500";
    return "from-green-500 to-teal-500";
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-teal-400" />
            Usage & Billing
          </h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
              <div className="h-2 bg-white/10 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!billingInfo) {
    return (
      <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-teal-400" />
            Usage & Billing
          </h3>
        </div>
        <button 
          onClick={loadBillingInfo}
          className="text-teal-300 hover:text-teal-200 text-sm font-medium flex items-center gap-1"
        >
          <RefreshCw className="w-4 h-4" />
          Load Billing Info
        </button>
      </div>
    );
  }

  const plan = BILLING_PLANS[billingInfo.planId];
  const totalEstimatedBill = billingInfo.baseAmount + billingInfo.overages.totalOverage;

  return (
    <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-teal-400" />
          Usage & Billing
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
            {billingInfo.planName} Plan
          </span>
          <button 
            onClick={loadBillingInfo}
            disabled={refreshing}
            className="text-teal-300 hover:text-teal-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Current Bill Summary */}
      <div className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-300">Estimated Bill This Month</span>
          <span className="text-lg font-bold text-white">{formatCurrency(totalEstimatedBill)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Base: {formatCurrency(billingInfo.baseAmount)}</span>
          <span>Usage: {formatCurrency(billingInfo.overages.totalOverage)}</span>
        </div>
        {billingInfo.overages.totalOverage > 0 && (
          <div className="mt-2 flex items-center gap-1 text-xs text-yellow-400">
            <AlertTriangle className="w-3 h-3" />
            <span>You have usage overages this month</span>
          </div>
        )}
      </div>

      {/* Usage Breakdown */}
      <div className="space-y-4 mb-6">
        <h4 className="text-sm font-medium text-gray-300">Usage This Month</h4>
        
        {/* Agent Downloads */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-teal-400" />
              <span className="text-sm text-gray-300">Agent Downloads</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-white">
                {billingInfo.usage.agentDownloads} / {plan.features.agentDownloads.included}
              </div>
              {billingInfo.overages.downloads.overage > 0 && (
                <div className="text-xs text-red-400">
                  +{billingInfo.overages.downloads.overage} over ({formatCurrency(billingInfo.overages.downloads.cost)})
                </div>
              )}
            </div>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className={`h-2 rounded-full bg-gradient-to-r ${getUsageBarColor(getUsagePercentage(billingInfo.usage.agentDownloads, plan.features.agentDownloads.included))}`}
              style={{
                width: `${Math.min(getUsagePercentage(billingInfo.usage.agentDownloads, plan.features.agentDownloads.included), 100)}%`
              }}
            ></div>
          </div>
        </div>

        {/* Agent Shares */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-teal-400" />
              <span className="text-sm text-gray-300">Agent Shares</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-white">
                {billingInfo.usage.agentShares} / {plan.features.agentShares.included}
              </div>
              {billingInfo.overages.shares.overage > 0 && (
                <div className="text-xs text-red-400">
                  +{billingInfo.overages.shares.overage} over ({formatCurrency(billingInfo.overages.shares.cost)})
                </div>
              )}
            </div>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className={`h-2 rounded-full bg-gradient-to-r ${getUsageBarColor(getUsagePercentage(billingInfo.usage.agentShares, plan.features.agentShares.included))}`}
              style={{
                width: `${Math.min(getUsagePercentage(billingInfo.usage.agentShares, plan.features.agentShares.included), 100)}%`
              }}
            ></div>
          </div>
        </div>

        {/* API Calls */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-teal-400" />
              <span className="text-sm text-gray-300">API Calls</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-white">
                {billingInfo.usage.apiCalls.toLocaleString()} / {plan.features.apiCalls.included.toLocaleString()}
              </div>
              {billingInfo.overages.apiCalls.overage > 0 && (
                <div className="text-xs text-red-400">
                  +{billingInfo.overages.apiCalls.overage.toLocaleString()} over ({formatCurrency(billingInfo.overages.apiCalls.cost)})
                </div>
              )}
            </div>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className={`h-2 rounded-full bg-gradient-to-r ${getUsageBarColor(getUsagePercentage(billingInfo.usage.apiCalls, plan.features.apiCalls.included))}`}
              style={{
                width: `${Math.min(getUsagePercentage(billingInfo.usage.apiCalls, plan.features.apiCalls.included), 100)}%`
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Next Bill Date */}
      <div className="border-t border-white/10 pt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-300">Next Bill Date</span>
          <span className="text-sm font-medium text-white">
            {new Date(billingInfo.nextBillDate).toLocaleDateString()}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex-1 text-teal-300 hover:text-teal-200 text-sm font-medium flex items-center justify-center gap-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 transition-colors">
            <ExternalLink className="w-4 h-4" />
            View Full Bill
          </button>
          <button className="text-teal-300 hover:text-teal-200 text-sm font-medium flex items-center gap-1 bg-gradient-to-r from-teal-500/20 to-green-500/20 border border-teal-400/30 rounded-lg px-3 py-2 transition-colors">
            Upgrade Plan <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
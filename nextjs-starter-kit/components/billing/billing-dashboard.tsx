"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Crown,
  Zap,
  Star,
  TrendingUp,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ArrowUp
} from "lucide-react";

interface QuotaStatus {
  current: number;
  limit: number;
  remaining: number;
  resetTime: Date;
  tier: string;
  canGenerate: boolean;
}

interface EarningsInfo {
  totalEarnings: number;
  currentMultiplier: number;
  avgQualityScore: number;
  instancesSold: number;
  potentialEarnings: {
    nextSale: number;
    withBetterQuality: number;
  };
}

interface SubscriptionTier {
  tier: string;
  name: string;
  price: number;
  instanceQuota: number;
  features: string[];
}

export function BillingDashboard() {
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null);
  const [earningsInfo, setEarningsInfo] = useState<EarningsInfo | null>(null);
  const [availableUpgrades, setAvailableUpgrades] = useState<SubscriptionTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const response = await fetch('/api/billing/quota?includeEarnings=true');
      if (!response.ok) throw new Error('Failed to fetch billing data');

      const data = await response.json();
      setQuotaStatus(data.quota);
      setEarningsInfo(data.earnings);
      setAvailableUpgrades(data.subscriptionInfo.availableUpgrades);

    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast.error('Failed to load billing information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (tier: string) => {
    setIsUpgrading(true);
    try {
      // In a real implementation, this would integrate with Stripe
      toast.info(`Upgrade to ${tier} tier - Stripe integration needed`);
      
      // Simulate upgrade process
      setTimeout(() => {
        toast.success(`Successfully upgraded to ${tier} tier!`);
        fetchBillingData();
        setIsUpgrading(false);
      }, 2000);

    } catch (error) {
      console.error('Error upgrading subscription:', error);
      toast.error('Failed to upgrade subscription');
      setIsUpgrading(false);
    }
  };

  const getQuotaPercentage = () => {
    if (!quotaStatus) return 0;
    return (quotaStatus.current / quotaStatus.limit) * 100;
  };

  const getQuotaColor = () => {
    const percentage = getQuotaPercentage();
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 70) return "text-orange-600";
    return "text-green-600";
  };

  const getQualityStars = (score: number) => {
    if (score <= 20) return 1;
    if (score <= 40) return 2;
    if (score <= 60) return 3;
    if (score <= 80) return 4;
    return 5;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quota Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Daily Instance Quota
            <Badge variant={quotaStatus?.canGenerate ? "default" : "destructive"}>
              {quotaStatus?.tier.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {quotaStatus && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Usage Today</span>
                <span className={`text-sm font-medium ${getQuotaColor()}`}>
                  {quotaStatus.current} / {quotaStatus.limit} instances
                </span>
              </div>
              
              <Progress value={getQuotaPercentage()} className="h-3" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{quotaStatus.remaining}</div>
                  <div className="text-sm text-gray-600">Remaining</div>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-sm text-gray-600">Resets in</div>
                  <div className="text-lg font-bold text-green-600">
                    {Math.ceil((new Date(quotaStatus.resetTime).getTime() - Date.now()) / (1000 * 60 * 60))}h
                  </div>
                </div>
              </div>

              {quotaStatus.remaining <= 3 && quotaStatus.remaining > 0 && (
                <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-orange-800 dark:text-orange-200">
                    Low quota warning: Only {quotaStatus.remaining} instances remaining today
                  </span>
                </div>
              )}

              {quotaStatus.remaining === 0 && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-800 dark:text-red-200">
                    Daily quota exhausted. Consider upgrading for higher limits.
                  </span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Earnings & Quality */}
      {earningsInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Earnings & Quality Score
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  ${earningsInfo.totalEarnings.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Total Earnings</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < getQualityStars(earningsInfo.avgQualityScore)
                          ? "text-yellow-500 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <div className="text-lg font-bold text-blue-600">
                  {Math.round(earningsInfo.avgQualityScore)}%
                </div>
                <div className="text-sm text-gray-600">Avg Quality</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {earningsInfo.currentMultiplier.toFixed(1)}x
                </div>
                <div className="text-sm text-gray-600">Earnings Multiplier</div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Earnings Potential</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm">Next Sale (Current Quality)</span>
                  <span className="font-medium text-green-600">
                    ${earningsInfo.potentialEarnings.nextSale.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm">With 5-Star Quality</span>
                  <span className="font-medium text-green-600">
                    ${earningsInfo.potentialEarnings.withBetterQuality.toFixed(2)}
                    <ArrowUp className="inline h-3 w-3 ml-1" />
                  </span>
                </div>
              </div>
            </div>

            {earningsInfo.avgQualityScore < 80 && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800 dark:text-blue-200">
                  Improve your quality score to earn up to 50% more per sale!
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Subscription Upgrades */}
      {availableUpgrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              Upgrade Your Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableUpgrades.map((upgrade) => (
                <Card key={upgrade.tier} className="border-2 hover:border-primary transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{upgrade.name}</CardTitle>
                      <Badge variant="outline">{upgrade.instanceQuota}/day</Badge>
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      ${upgrade.price}
                      <span className="text-sm font-normal text-gray-600">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {upgrade.features.slice(0, 4).map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span>{feature}</span>
                        </div>
                      ))}
                      {upgrade.features.length > 4 && (
                        <div className="text-xs text-gray-500">
                          +{upgrade.features.length - 4} more features
                        </div>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => handleUpgrade(upgrade.tier)}
                      disabled={isUpgrading}
                      className="w-full"
                    >
                      {isUpgrading ? "Processing..." : `Upgrade to ${upgrade.name}`}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" onClick={fetchBillingData}>
              <Calendar className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
            
            <Button variant="outline" onClick={() => {
              fetch('/api/billing/quota', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'refresh_multiplier' })
              }).then(() => {
                toast.success("Quality multiplier refreshed");
                fetchBillingData();
              });
            }}>
              <Star className="h-4 w-4 mr-2" />
              Update Quality Score
            </Button>
            
            <Button variant="outline" onClick={() => {
              toast.info("Billing history - Feature coming soon");
            }}>
              <DollarSign className="h-4 w-4 mr-2" />
              Billing History
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
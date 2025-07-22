"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateReferralLink } from "@/lib/referral";
import { Copy, Users, Gift, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ReferralStats {
  referralCode: string;
  referralPoints: number;
  totalReferrals: number;
  referredUsers: Array<{
    id: string;
    name: string;
    email: string;
    createdAt: string;
  }>;
}

export function ReferralStats() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferralStats = async () => {
      try {
        const response = await fetch("/api/referral/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching referral stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReferralStats();
  }, []);

  const copyReferralLink = async () => {
    if (!stats?.referralCode) return;

    const referralLink = generateReferralLink(stats.referralCode);
    
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success("Referral link copied to clipboard!");
      
      // Log referral link copy event
      if (typeof window !== "undefined" && window.posthog) {
        window.posthog.capture("referral_link_copied_dashboard", {
          referral_code: stats.referralCode,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy link. Please try again.");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Referral Program</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Referral Program</CardTitle>
          <CardDescription>
            Your referral data is not available at the moment.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Referral Program
        </CardTitle>
        <CardDescription>
          Share your link and earn points when friends join LangSet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {stats.totalReferrals}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              People Referred
            </p>
          </div>
          
          <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <Gift className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {stats.referralPoints}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Points Earned
            </p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <Copy className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-lg font-bold text-purple-700 dark:text-purple-300 font-mono">
              {stats.referralCode}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your Code
            </p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Referral Link</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 dark:bg-gray-800 p-3 rounded border text-sm font-mono">
              {generateReferralLink(stats.referralCode)}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyReferralLink}
              className="shrink-0"
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
          </div>
        </div>

        {/* Recent Referrals */}
        {stats.referredUsers.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Recent Referrals</h4>
            <div className="space-y-2">
              {stats.referredUsers.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div>
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="text-xs">
                      +10 points
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {stats.referredUsers.length > 5 && (
              <p className="text-sm text-gray-500 text-center">
                And {stats.referredUsers.length - 5} more...
              </p>
            )}
          </div>
        )}

        {stats.totalReferrals === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">No referrals yet</p>
            <p className="text-sm">Start sharing your link to earn points!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
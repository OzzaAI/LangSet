"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Database,
  Users,
  Target,
  Award,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  Activity
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AnalyticsData {
  earnings: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
    qualityMultiplier: number;
  };
  datasets: {
    total: number;
    avgQuality: number;
    totalInstances: number;
    sold: number;
  };
  marketplace: {
    totalOffers: number;
    acceptanceRate: number;
    avgOfferValue: number;
    pendingOffers: number;
  };
  performance: {
    views: number;
    impressions: number;
    conversionRate: number;
    topPerformingDatasets: Array<{
      id: string;
      name: string;
      earnings: number;
      quality: number;
    }>;
  };
  trends: {
    weeklyEarnings: number[];
    qualityTrend: number[];
    datasetCreation: number[];
  };
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    loadAnalyticsData();
  }, [timeframe]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/analytics?timeframe=${timeframe}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        console.error('Failed to load analytics data');
        // Set mock data for now
        setAnalyticsData({
          earnings: {
            total: 1247.50,
            thisMonth: 342.25,
            lastMonth: 298.75,
            growth: 14.5,
            qualityMultiplier: 1.2
          },
          datasets: {
            total: 8,
            avgQuality: 78,
            totalInstances: 124,
            sold: 3
          },
          marketplace: {
            totalOffers: 15,
            acceptanceRate: 66.7,
            avgOfferValue: 125.50,
            pendingOffers: 2
          },
          performance: {
            views: 1842,
            impressions: 3205,
            conversionRate: 8.2,
            topPerformingDatasets: [
              { id: "1", name: "React Development Best Practices", earnings: 425.00, quality: 92 },
              { id: "2", name: "TypeScript Advanced Patterns", earnings: 380.50, quality: 88 },
              { id: "3", name: "Next.js Performance Optimization", earnings: 285.75, quality: 85 }
            ]
          },
          trends: {
            weeklyEarnings: [85, 120, 95, 180, 145, 210, 165],
            qualityTrend: [72, 74, 76, 78, 79, 78, 80],
            datasetCreation: [1, 0, 2, 1, 1, 2, 1]
          }
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6 animate-pulse" />
            <span>Loading analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Analytics Unavailable</h3>
          <p className="text-muted-foreground">
            Unable to load analytics data. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Track your performance, earnings, and marketplace success
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Badge
              variant={timeframe === "7d" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setTimeframe("7d")}
            >
              7 days
            </Badge>
            <Badge
              variant={timeframe === "30d" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setTimeframe("30d")}
            >
              30 days
            </Badge>
            <Badge
              variant={timeframe === "90d" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setTimeframe("90d")}
            >
              90 days
            </Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold text-[#00D26A]">
                    ${analyticsData.earnings.total.toFixed(2)}
                  </p>
                  <div className="flex items-center space-x-1 mt-1">
                    {analyticsData.earnings.growth >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm ${analyticsData.earnings.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {Math.abs(analyticsData.earnings.growth)}%
                    </span>
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-[#00D26A] opacity-60" />
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Datasets Created</p>
                  <p className="text-2xl font-bold">{analyticsData.datasets.total}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {analyticsData.datasets.totalInstances} instances
                  </p>
                </div>
                <Database className="h-8 w-8 text-blue-500 opacity-60" />
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Quality Score</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {analyticsData.datasets.avgQuality}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {analyticsData.earnings.qualityMultiplier}x multiplier
                  </p>
                </div>
                <Award className="h-8 w-8 text-yellow-500 opacity-60" />
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Marketplace</p>
                  <p className="text-2xl font-bold">{analyticsData.datasets.sold} sold</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {analyticsData.marketplace.acceptanceRate}% acceptance
                  </p>
                </div>
                <Target className="h-8 w-8 text-purple-500 opacity-60" />
              </div>
            </GlassCard>
          </div>

          {/* Trends Chart Placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold mb-4">Weekly Earnings Trend</h3>
              <div className="space-y-3">
                {analyticsData.trends.weeklyEarnings.map((earning, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">Week {index + 1}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div 
                          className="bg-[#00D26A] h-2 rounded-full"
                          style={{ width: `${(earning / Math.max(...analyticsData.trends.weeklyEarnings)) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">${earning}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quality Score Trend</h3>
              <div className="space-y-3">
                {analyticsData.trends.qualityTrend.map((quality, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">Week {index + 1}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${quality}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{quality}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </TabsContent>

        {/* Earnings Tab */}
        <TabsContent value="earnings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold mb-4">Monthly Breakdown</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">This Month</span>
                  <span className="font-bold text-[#00D26A]">
                    ${analyticsData.earnings.thisMonth.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Month</span>
                  <span className="font-medium">
                    ${analyticsData.earnings.lastMonth.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Growth</span>
                  <div className="flex items-center space-x-1">
                    {analyticsData.earnings.growth >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={analyticsData.earnings.growth >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {analyticsData.earnings.growth.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quality Multiplier</h3>
              <div className="text-center space-y-3">
                <div className="text-3xl font-bold text-yellow-500">
                  {analyticsData.earnings.qualityMultiplier}x
                </div>
                <Progress value={analyticsData.datasets.avgQuality} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  Based on {analyticsData.datasets.avgQuality}% average quality
                </p>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold mb-4">Earning Potential</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    With current quality ({analyticsData.datasets.avgQuality}%)
                  </p>
                  <p className="text-xl font-bold">
                    ${(5 * analyticsData.earnings.qualityMultiplier).toFixed(2)}/instance
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    With 90% quality (1.4x multiplier)
                  </p>
                  <p className="text-xl font-bold text-[#00D26A]">
                    ${(5 * 1.4).toFixed(2)}/instance
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>
        </TabsContent>

        {/* Marketplace Tab */}
        <TabsContent value="marketplace" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold mb-4">Offer Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Offers</span>
                  <span className="font-bold">{analyticsData.marketplace.totalOffers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Acceptance Rate</span>
                  <span className="font-bold text-green-500">
                    {analyticsData.marketplace.acceptanceRate}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Average Offer</span>
                  <span className="font-bold">
                    ${analyticsData.marketplace.avgOfferValue.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Pending</span>
                  <Badge variant="outline">
                    {analyticsData.marketplace.pendingOffers}
                  </Badge>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Performing Datasets</h3>
              <div className="space-y-3">
                {analyticsData.performance.topPerformingDatasets.map((dataset, index) => (
                  <div key={dataset.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{dataset.name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {dataset.quality}% quality
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          #{index + 1}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-[#00D26A]">
                      ${dataset.earnings.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Profile Views</p>
                  <p className="text-2xl font-bold">{analyticsData.performance.views.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500 opacity-60" />
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Impressions</p>
                  <p className="text-2xl font-bold">{analyticsData.performance.impressions.toLocaleString()}</p>
                </div>
                <Activity className="h-8 w-8 text-green-500 opacity-60" />
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold">{analyticsData.performance.conversionRate}%</p>
                </div>
                <Target className="h-8 w-8 text-purple-500 opacity-60" />
              </div>
            </GlassCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Users, Building, AlertCircle, Target, DollarSign, Activity, Brain } from 'lucide-react';

type AgencyMetrics = {
  id: string;
  name: string;
  status: 'active' | 'setup' | 'inactive';
  clientCount: number;
  websitesBuilt: number;
  conversionRate: number;
  monthlyRevenue: number;
  lastActivity: string;
  issueCount: number;
  plan: string;
  logo_url?: string;
  primary_color?: string;
};

type AggregateMetrics = {
  totalAgencies: number;
  totalClients: number;
  totalWebsites: number;
  avgConversionRate: number;
  totalRevenue: number;
  activeIssues: number;
  completedProjects: number;
  pendingTasks: number;
};

type AnalyticsData = {
  agencyMetrics: AgencyMetrics[];
  aggregateMetrics: AggregateMetrics;
  recentActivity: Array<{
    id: string;
    type: string;
    agencyName: string;
    description: string;
    timestamp: string;
  }>;
};

export default function CoachAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEnhanced, setShowEnhanced] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const sessionResponse = await authClient.getSession();
        
        if (!sessionResponse?.data?.session) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/coach/analytics');
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to load analytics');
          return;
        }

        setAnalyticsData(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return <div>No data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Toggle */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            {showEnhanced ? (
              <>
                <Brain className="h-8 w-8 text-indigo-600" />
                AI Analytics Intelligence
              </>
            ) : (
              <>
                <BarChart3 className="h-8 w-8 text-blue-600" />
                Coach Analytics Dashboard
              </>
            )}
          </h1>
          <p className="text-muted-foreground">
            {showEnhanced 
              ? 'AI-powered insights and data storytelling for your agency network' 
              : 'Comprehensive view of your agency network performance'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant={showEnhanced ? 'default' : 'outline'}
            onClick={() => setShowEnhanced(true)}
            className="gap-2"
          >
            <Brain className="w-4 h-4" />
            AI Insights
          </Button>
          <Button
            variant={!showEnhanced ? 'default' : 'outline'}
            onClick={() => setShowEnhanced(false)}
            className="gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Traditional
          </Button>
        </div>
      </div>
      
      {/* Enhanced Analytics or Traditional View */}
      {showEnhanced ? (
        <div className="text-center py-12">
          <Brain className="h-16 w-16 mx-auto text-indigo-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">AI Analytics Coming Soon</h3>
          <p className="text-gray-600">Enhanced narrative analytics with intelligent insights are being developed.</p>
        </div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Network Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analyticsData.aggregateMetrics.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.aggregateMetrics.totalClients}</div>
                <p className="text-xs text-muted-foreground">
                  Across {analyticsData.aggregateMetrics.totalAgencies} agencies
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Conversion</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.aggregateMetrics.avgConversionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  +2.1% improvement
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Issues</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{analyticsData.aggregateMetrics.activeIssues}</div>
                <p className="text-xs text-muted-foreground">
                  Require attention
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="agencies" className="space-y-4">
            <TabsList>
              <TabsTrigger value="agencies">Agency Performance</TabsTrigger>
              <TabsTrigger value="trends">Trends & Insights</TabsTrigger>
              <TabsTrigger value="issues">Issues & Support</TabsTrigger>
            </TabsList>

            <TabsContent value="agencies" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Individual Agency Metrics</CardTitle>
                  <CardDescription>
                    Performance data for each agency in your network
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.agencyMetrics.map((agency) => (
                      <div key={agency.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold"
                              style={{ backgroundColor: agency.primary_color || '#3B82F6' }}
                            >
                              {agency.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{agency.name}</h4>
                                <Badge variant={agency.status === 'active' ? 'default' : agency.status === 'setup' ? 'secondary' : 'destructive'}>
                                  {agency.status}
                                </Badge>
                                {agency.issueCount > 0 && (
                                  <Badge variant="destructive">{agency.issueCount} issues</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">Last active: {agency.lastActivity}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-4 mt-4">
                          <div>
                            <p className="text-sm font-medium">Clients</p>
                            <p className="text-2xl font-bold">{agency.clientCount}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Websites Built</p>
                            <p className="text-2xl font-bold">{agency.websitesBuilt}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Monthly Revenue</p>
                            <p className="text-2xl font-bold">${agency.monthlyRevenue.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Conversion Rate</p>
                            <div className="flex items-center gap-2">
                              <p className="text-2xl font-bold">{agency.conversionRate}%</p>
                              <Progress value={agency.conversionRate} className="flex-1" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Trends analysis coming soon</p>
              </div>
            </TabsContent>

            <TabsContent value="issues" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Active Issues Requiring Attention</CardTitle>
                  <CardDescription>
                    Agency-reported issues and support requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsData.aggregateMetrics.activeIssues === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-muted-foreground">No active issues - great work!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {analyticsData.agencyMetrics
                        .filter(agency => agency.issueCount > 0)
                        .map((agency) => (
                          <div key={agency.id} className="p-4 border rounded-lg border-orange-200 bg-orange-50">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{agency.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {agency.issueCount} active {agency.issueCount === 1 ? 'issue' : 'issues'}
                                </p>
                              </div>
                              <Button variant="outline" size="sm">
                                Review Issues
                              </Button>
                            </div>
                          </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
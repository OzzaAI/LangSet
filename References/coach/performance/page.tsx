'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users, DollarSign, Target, Award } from 'lucide-react';

// Mock data - replace with real API calls
const mockData = {
  totalAgencies: 5,
  activeClients: 23,
  monthlyRevenue: 4500,
  revenueGrowth: 12.5,
  conversionRate: 8.3,
  monthlyGoal: 6000,
  recentActivity: [
    { type: 'agency_created', message: 'New agency "Digital Marketing Pro" created', date: '2 hours ago' },
    { type: 'client_onboarded', message: '3 new clients onboarded', date: '1 day ago' },
    { type: 'revenue_milestone', message: 'Reached $4,500 monthly revenue', date: '2 days ago' },
    { type: 'performance_boost', message: 'Conversion rate improved by 2.1%', date: '3 days ago' },
  ],
  monthlyMetrics: [
    { month: 'Jan', revenue: 2800, clients: 15 },
    { month: 'Feb', revenue: 3200, clients: 18 },
    { month: 'Mar', revenue: 3800, clients: 20 },
    { month: 'Apr', revenue: 4200, clients: 22 },
    { month: 'May', revenue: 4500, clients: 23 },
  ]
};

export default function PerformancePage() {
  const progressToGoal = (mockData.monthlyRevenue / mockData.monthlyGoal) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Performance Dashboard</h1>
        <p className="text-muted-foreground">Track your coaching success and growth metrics</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agencies</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.totalAgencies}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.activeClients}</div>
            <p className="text-xs text-muted-foreground">
              +3 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${mockData.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +{mockData.revenueGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.conversionRate}%</div>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +2.1% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Goal Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Goal Progress</CardTitle>
            <CardDescription>
              Track your progress towards this month's revenue target
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Current: ${mockData.monthlyRevenue.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">Goal: ${mockData.monthlyGoal.toLocaleString()}</span>
            </div>
            <Progress value={progressToGoal} className="h-3" />
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{Math.round(progressToGoal)}% Complete</span>
              <span className="text-muted-foreground">
                ${(mockData.monthlyGoal - mockData.monthlyRevenue).toLocaleString()} remaining
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates and achievements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockData.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.date}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>
            Monthly revenue and client growth over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockData.monthlyMetrics.map((metric, index) => (
              <div key={metric.month} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="font-medium">{metric.month}</div>
                <div className="flex items-center gap-6">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Revenue: </span>
                    <span className="font-medium">${metric.revenue.toLocaleString()}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Clients: </span>
                    <span className="font-medium">{metric.clients}</span>
                  </div>
                  {index > 0 && (
                    <Badge variant={metric.revenue > mockData.monthlyMetrics[index - 1].revenue ? "default" : "secondary"}>
                      {metric.revenue > mockData.monthlyMetrics[index - 1].revenue ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {((metric.revenue - mockData.monthlyMetrics[index - 1].revenue) / mockData.monthlyMetrics[index - 1].revenue * 100).toFixed(1)}%
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
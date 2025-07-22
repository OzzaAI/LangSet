'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { 
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  Target,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Calendar
} from 'lucide-react';
import MiniTopNav from '@/components/dashboard/MiniTopNav';
import dynamic from 'next/dynamic';

// Dynamic import for charts
const Chart = dynamic(() => import('react-apexcharts'), { 
  ssr: false,
  loading: () => (
    <div className="h-64 glass-card rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-gray-300">Loading chart...</div>
    </div>
  )
});

interface AnalyticsData {
  revenue: {
    monthly: number[];
    growth: number;
    trend: 'up' | 'down';
  };
  community: {
    agencies: number;
    clients: number;
    retention: number;
    satisfaction: number;
  };
  performance: {
    topAgencies: Array<{
      name: string;
      revenue: number;
      growth: number;
      clients: number;
    }>;
    metrics: {
      avgRevenuePerAgency: number;
      avgClientsPerAgency: number;
      conversionRate: number;
    };
  };
}

export default function CoachAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('3months');
  const router = useRouter();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const sessionResponse = await authClient.getSession();
        
        if (!sessionResponse?.data?.session) {
          router.push('/login');
          return;
        }

        // Mock data - replace with actual API call
        const mockData: AnalyticsData = {
          revenue: {
            monthly: [4200, 5100, 6800, 7200, 8400, 8420],
            growth: 24.3,
            trend: 'up'
          },
          community: {
            agencies: 12,
            clients: 89,
            retention: 94,
            satisfaction: 4.8
          },
          performance: {
            topAgencies: [
              { name: 'Digital Growth Co', revenue: 2400, growth: 18, clients: 15 },
              { name: 'Scale Agency', revenue: 1800, growth: 22, clients: 12 },
              { name: 'Modern Marketing', revenue: 1600, growth: 15, clients: 10 },
              { name: 'AI Solutions', revenue: 1200, growth: 28, clients: 8 },
              { name: 'Growth Labs', revenue: 980, growth: 12, clients: 7 }
            ],
            metrics: {
              avgRevenuePerAgency: 700,
              avgClientsPerAgency: 7.4,
              conversionRate: 68
            }
          }
        };

        setAnalyticsData(mockData);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [router, timeRange]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-8 bg-white/20 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/10 h-32 rounded-lg backdrop-blur-sm"></div>
          ))}
        </div>
        <div className="bg-white/10 h-96 rounded-lg backdrop-blur-sm"></div>
      </div>
    );
  }

  if (!analyticsData) return null;

  const chartOptions = {
    chart: {
      type: 'line' as const,
      height: 350,
      toolbar: { show: false },
      background: 'transparent'
    },
    stroke: {
      curve: 'smooth' as const,
      width: 3,
      colors: ['#14b8a6']
    },
    fill: {
      type: 'gradient' as const,
      gradient: {
        shade: 'dark',
        type: 'vertical',
        shadeIntensity: 0.4,
        gradientToColors: ['rgba(20, 184, 166, 0.1)'],
        inverseColors: false,
        opacityFrom: 0.6,
        opacityTo: 0.02,
        stops: [0, 90, 100]
      }
    },
    grid: { 
      show: true,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      strokeDashArray: 2
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      labels: {
        style: {
          colors: '#94A3B8',
          fontSize: '12px'
        }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#94A3B8',
          fontSize: '12px'
        },
        formatter: function(value: number) {
          return '$' + (value / 1000).toFixed(0) + 'K';
        }
      }
    },
    tooltip: {
      theme: 'dark' as const,
      y: {
        formatter: function(value: number) {
          return '$' + value.toLocaleString();
        }
      }
    },
    colors: ['#14b8a6']
  };

  const series = [{
    name: 'Revenue',
    data: analyticsData.revenue.monthly
  }];

  return (
    <>
      <MiniTopNav
        title="Analytics & Insights"
        communityLink="https://ozza.com/coach/analytics"
      />

      {/* Time Range Selector */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
        <div className="flex gap-2">
          {['1month', '3months', '6months', '1year'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                timeRange === range
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              {range === '1month' ? '1M' : range === '3months' ? '3M' : range === '6months' ? '6M' : '1Y'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-white/5 via-white/2 to-white/5 backdrop-blur-xl border border-white/8 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-teal-400" />
            <div className={`flex items-center gap-1 text-xs ${
              analyticsData.revenue.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {analyticsData.revenue.trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {analyticsData.revenue.growth}%
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            ${analyticsData.revenue.monthly[analyticsData.revenue.monthly.length - 1].toLocaleString()}
          </div>
          <div className="text-xs text-gray-400">Monthly Revenue</div>
        </div>

        <div className="bg-gradient-to-br from-white/5 via-white/2 to-white/5 backdrop-blur-xl border border-white/8 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <div className="text-xs text-emerald-400">Active</div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{analyticsData.community.agencies}</div>
          <div className="text-xs text-gray-400">Agencies</div>
        </div>

        <div className="bg-gradient-to-br from-white/5 via-white/2 to-white/5 backdrop-blur-xl border border-white/8 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <div className="text-xs text-emerald-400">{analyticsData.community.retention}%</div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{analyticsData.community.clients}</div>
          <div className="text-xs text-gray-400">Total Clients</div>
        </div>

        <div className="bg-gradient-to-br from-white/5 via-white/2 to-white/5 backdrop-blur-xl border border-white/8 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 text-orange-400" />
            <div className="text-xs text-emerald-400">{analyticsData.performance.metrics.conversionRate}%</div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            ${analyticsData.performance.metrics.avgRevenuePerAgency}
          </div>
          <div className="text-xs text-gray-400">Avg per Agency</div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="mb-8">
        <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl overflow-hidden shadow-2xl shadow-black/40">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-400" />
              Revenue Growth Trend
            </h3>
          </div>
          <div className="p-6">
            <Chart
              options={chartOptions}
              series={series}
              type="area"
              height={350}
            />
          </div>
        </div>
      </div>

      {/* Performance Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Performing Agencies */}
        <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">Top Performing Agencies</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analyticsData.performance.topAgencies.map((agency, index) => (
                <div key={agency.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-400 w-6">#{index + 1}</span>
                    <div>
                      <div className="text-sm font-medium text-white">{agency.name}</div>
                      <div className="text-xs text-gray-400">{agency.clients} clients</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">${agency.revenue.toLocaleString()}</div>
                    <div className={`text-xs ${agency.growth > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {agency.growth > 0 ? '+' : ''}{agency.growth}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Community Health */}
        <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">Community Health</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Client Retention Rate</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-emerald-400 h-2 rounded-full" 
                    style={{width: `${analyticsData.community.retention}%`}}
                  ></div>
                </div>
                <span className="text-emerald-400 font-bold">{analyticsData.community.retention}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-300">Satisfaction Score</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-teal-400 h-2 rounded-full" 
                    style={{width: `${(analyticsData.community.satisfaction / 5) * 100}%`}}
                  ></div>
                </div>
                <span className="text-teal-400 font-bold">{analyticsData.community.satisfaction}/5</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-300">Conversion Rate</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-orange-400 h-2 rounded-full" 
                    style={{width: `${analyticsData.performance.metrics.conversionRate}%`}}
                  ></div>
                </div>
                <span className="text-orange-400 font-bold">{analyticsData.performance.metrics.conversionRate}%</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/20">
              <button 
                onClick={() => router.push('/dashboard/coach/revenue')}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500/20 to-emerald-500/20 hover:from-teal-500/30 hover:to-emerald-500/30 border border-teal-400/30 hover:border-emerald-400/50 rounded-lg px-4 py-3 text-sm font-medium text-teal-300 hover:text-emerald-200 transition-all duration-300 backdrop-blur-xl"
              >
                <DollarSign className="w-4 h-4" />
                View Revenue Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
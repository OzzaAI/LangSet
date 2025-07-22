'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { 
  DollarSign,
  TrendingUp,
  Users,
  Building2,
  Zap,
  ArrowRight,
  CreditCard,
  Clock,
  Target,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import MiniTopNav from '@/components/dashboard/MiniTopNav';

interface CoachRevenueData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  revenue: {
    thisMonth: number;
    today: number;
    lastMonth: number;
    lifetime: number;
    projected: number;
  };
  community: {
    totalAgencies: number;
    totalClients: number;
    growthRate: number;
    avgRevenuePer: number;
    topPerformers: Array<{
      name: string;
      revenue: number;
      clients: number;
    }>;
  };
  paymentInfo: {
    method: string;
    bank: string;
    nextPayout: string;
  };
}

export default function CoachRevenuePage() {
  const [revenueData, setRevenueData] = useState<CoachRevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        const sessionResponse = await authClient.getSession();
        
        if (!sessionResponse?.data?.session) {
          router.push('/login');
          return;
        }

        // Mock data for now - replace with actual API call
        const mockData: CoachRevenueData = {
          user: {
            id: '1',
            name: sessionResponse.data.session.user.name || 'Coach',
            email: sessionResponse.data.session.user.email || '',
            role: 'coach'
          },
          revenue: {
            thisMonth: 8420,
            today: 450,
            lastMonth: 6800,
            lifetime: 24750,
            projected: 12500
          },
          community: {
            totalAgencies: 12,
            totalClients: 89,
            growthRate: 24.3,
            avgRevenuePer: 700,
            topPerformers: [
              { name: 'Digital Growth Co', revenue: 2400, clients: 15 },
              { name: 'Scale Agency', revenue: 1800, clients: 12 },
              { name: 'Modern Marketing', revenue: 1600, clients: 10 }
            ]
          },
          paymentInfo: {
            method: 'Automatic',
            bank: 'Chase Bank •••• 4521',
            nextPayout: 'Tomorrow'
          }
        };

        setRevenueData(mockData);
      } catch (err) {
        console.error('Error fetching revenue data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, [router]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-8 bg-white/20 rounded w-1/4 mb-6"></div>
        <div className="bg-white/10 h-96 rounded-lg backdrop-blur-sm"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/10 h-64 rounded-lg backdrop-blur-sm"></div>
          <div className="bg-white/10 h-64 rounded-lg backdrop-blur-sm"></div>
        </div>
      </div>
    );
  }

  if (!revenueData) return null;

  const monthlyGrowth = ((revenueData.revenue.thisMonth - revenueData.revenue.lastMonth) / revenueData.revenue.lastMonth * 100);

  return (
    <>
      {/* Mini Top Nav */}
      <MiniTopNav
        title="Revenue Dashboard"
        communityLink={`https://ozza.com/coach/${revenueData.user.name.toLowerCase().replace(/\s+/g, '-')}`}
      />

      {/* Main Revenue Card */}
      <div className="mb-8">
        <div className="relative bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl overflow-hidden shadow-2xl shadow-black/40">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
            
            {/* Main Revenue Section */}
            <div className="lg:col-span-2 p-6 bg-gradient-to-br from-white/2 via-transparent to-teal-500/4 backdrop-blur-lg">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-white">Total Revenue</h3>
                <DollarSign className="w-4 h-4 text-teal-400" />
              </div>
              
              <div className="text-3xl font-bold text-white mb-6">
                ${revenueData.revenue.thisMonth.toLocaleString()}
              </div>
              
              <div className="text-sm text-gray-300 mb-4">This Month</div>
              
              {/* Community Performance → Revenue Correlation */}
              <div className="space-y-4 mt-8">
                <h4 className="text-sm font-medium text-white">Community Impact on Revenue</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-teal-400/8 via-teal-500/5 to-transparent rounded-lg p-3 backdrop-blur-3xl border border-white/8">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-3 h-3 text-teal-400" />
                      <span className="text-xs text-gray-300">Agencies</span>
                    </div>
                    <div className="text-lg font-semibold text-white">{revenueData.community.totalAgencies}</div>
                    <div className="text-xs text-gray-400">~${(revenueData.revenue.thisMonth / revenueData.community.totalAgencies).toFixed(0)} each</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-teal-400/8 via-teal-500/5 to-transparent rounded-lg p-3 backdrop-blur-3xl border border-white/8">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-3 h-3 text-teal-400" />
                      <span className="text-xs text-gray-300">Total Clients</span>
                    </div>
                    <div className="text-lg font-semibold text-white">{revenueData.community.totalClients}</div>
                    <div className="text-xs text-gray-400">Growing +{revenueData.community.growthRate}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Earnings Summary Section */}
            <div className="lg:col-span-1 bg-gradient-to-br from-emerald-500/4 via-transparent to-teal-500/3 border-l border-white/10 backdrop-blur-sm">
              {/* Today's Performance */}
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="text-sm text-gray-300 mb-2">Today's Earnings</div>
                  <div className="text-2xl font-bold text-white">
                    ${revenueData.revenue.today.toLocaleString()}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-teal-400/8 via-teal-500/5 to-transparent rounded-lg p-4 mb-6 backdrop-blur-3xl border border-white/8">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-teal-400" />
                      <span className="font-medium text-white text-sm">Growth</span>
                    </div>
                    <span className="text-lg font-bold text-teal-400">
                      +{monthlyGrowth.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-300">vs last month</span>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-gradient-to-br from-teal-400/8 via-teal-500/5 to-transparent rounded-lg p-4 mb-6 backdrop-blur-3xl border border-white/8">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-teal-400" />
                      <span className="font-semibold text-white text-sm">Payment Style</span>
                    </div>
                    <span className="bg-teal-500/25 text-teal-300 px-2 py-1 rounded-full text-xs font-medium border border-teal-500/40 backdrop-blur-sm">
                      {revenueData.paymentInfo.method}
                    </span>
                  </div>
                </div>

                {/* Boost Revenue CTA */}
                <div className="pt-4 border-t border-white/20">
                  <button
                    onClick={() => router.push('/dashboard/coach/revenue/boost')}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500/20 to-pink-500/20 hover:from-orange-500/30 hover:to-pink-500/30 border border-orange-400/30 hover:border-pink-400/50 rounded-lg px-4 py-3 text-sm font-bold text-orange-300 hover:text-pink-200 shadow-lg hover:shadow-orange-500/25 transition-all duration-300 backdrop-blur-xl"
                  >
                    <Sparkles className="w-4 h-4" />
                    Boost Revenue
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Bank Info */}
                <div className="mt-4 flex items-center gap-2 text-xs text-gray-300 bg-white/8 rounded-lg p-3 border border-white/25 backdrop-blur-lg">
                  <CreditCard className="w-3 h-3" />
                  <span>Transfers to {revenueData.paymentInfo.bank}</span>
                  <Clock className="w-3 h-3 ml-auto" />
                  <span>{revenueData.paymentInfo.nextPayout}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Community Revenue Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Growth Potential */}
        <div className="overflow-hidden rounded-lg glass-card-primary">
          <div className="glass-section-header p-4">
            <h3 className="text-base font-semibold leading-6 text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-teal-400" />
              Revenue Growth Opportunities
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <div className="text-sm font-medium text-white">Add 3 more agencies</div>
                  <div className="text-xs text-gray-400">Based on current avg</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-teal-400">+${(revenueData.community.avgRevenuePer * 3).toLocaleString()}</div>
                  <div className="text-xs text-gray-500">monthly</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <div className="text-sm font-medium text-white">Improve client retention</div>
                  <div className="text-xs text-gray-400">Help agencies keep clients longer</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-teal-400">+${(revenueData.revenue.thisMonth * 0.15).toFixed(0)}</div>
                  <div className="text-xs text-gray-500">potential</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Agencies */}
        <div className="overflow-hidden rounded-lg glass-card-success">
          <div className="glass-section-header p-4">
            <h3 className="text-base font-semibold leading-6 text-white">
              Top Revenue Contributors
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {revenueData.community.topPerformers.map((agency, index) => (
                <div key={agency.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-400">#{index + 1}</span>
                    <div>
                      <div className="text-sm font-medium text-white">{agency.name}</div>
                      <div className="text-xs text-gray-400">{agency.clients} clients</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">${agency.revenue.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">monthly</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
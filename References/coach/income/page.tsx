'use client';

import { useRouter } from 'next/navigation';
import { 
  DollarSign,
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
  BarChart3,
  Sparkles
} from 'lucide-react';
import MiniTopNav from '@/components/dashboard/MiniTopNav';
import CombinedRevenueCard from '@/components/analytics/CombinedRevenueCard';
import AIHelper from '@/components/dashboard/AIHelper';

export default function CoachIncomePage() {
  const router = useRouter();

  return (
    <>
      {/* Mini Top Nav */}
      <MiniTopNav
        title="Income"
        communityLink="https://ozza.com/coach/income"
      />

      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-teal-400" />
            Income Dashboard
          </h1>
          <p className="text-gray-400 mt-2">Track your earnings and optimize your revenue streams</p>
        </div>
        
        {/* Boost Earnings Button */}
        <button 
          onClick={() => router.push('/dashboard/coach/income/boost')}
          className="bg-gradient-to-r from-orange-500/20 to-pink-500/20 hover:from-orange-500/30 hover:to-pink-500/30 border border-orange-400/30 hover:border-pink-400/50 rounded-xl px-6 py-3 text-sm font-bold text-orange-300 hover:text-pink-200 shadow-lg hover:shadow-orange-500/25 transition-all duration-300 backdrop-blur-xl flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Boost Earnings
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Earnings Breakdown Component */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-teal-400" />
          Earnings Breakdown
        </h2>
        
        {/* Your Beautiful Revenue Component */}
        <CombinedRevenueCard 
          monthlyEarnings={8420}
          todaysEarnings={450}
          weeklyEarnings={1580}
          lifetimeEarnings={24750}
        />
      </div>

      {/* Community Analytics Link */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              Community Analytics
            </h3>
            <button 
              onClick={() => router.push('/dashboard/coach/income/community-analytics')}
              className="text-emerald-300 hover:text-emerald-200 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-gray-300 mb-4">
            Community growth directly impacts your income potential. Track how your network expansion drives revenue.
          </p>
          
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-xl font-bold text-white">12</div>
                <div className="text-xs text-gray-400">Active Agencies</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white">89</div>
                <div className="text-xs text-gray-400">Total Clients</div>
              </div>
            </div>
            <div className="text-xs text-emerald-400 font-medium">
              +24% growth this month
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Products
            </h3>
            <button 
              onClick={() => router.push('/dashboard/coach/income/products')}
              className="text-amber-300 hover:text-amber-200 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-gray-300 mb-4">
            Upsell your community with templates, courses, and premium resources.
          </p>
          
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="text-center">
              <div className="text-gray-400 text-sm mb-2">Coming Soon</div>
              <div className="text-xs text-gray-500">
                Enhanced product marketplace for coaches
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Helper */}
      <AIHelper context="income dashboard" />
    </>
  );
}
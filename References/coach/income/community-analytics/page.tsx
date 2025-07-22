'use client';

import { Users, TrendingUp, DollarSign, BarChart3, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import MiniTopNav from '@/components/dashboard/MiniTopNav';
import AIHelper from '@/components/dashboard/AIHelper';

export default function CommunityAnalyticsPage() {
  const router = useRouter();

  return (
    <>
      <MiniTopNav
        title="Community Analytics"
        communityLink="https://ozza.com/coach/community-analytics"
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
          <Users className="w-8 h-8 text-emerald-400" />
          Community Analytics
        </h1>
        <p className="text-gray-400">
          Track how community growth drives income. Engaged communities create higher revenue potential.
        </p>
      </div>

      {/* Community to Revenue Correlation */}
      <div className="mb-8">
        <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            Community-Revenue Impact
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="text-2xl font-bold text-emerald-400 mb-1">87%</div>
              <div className="text-sm text-gray-400">Revenue Correlation</div>
              <div className="text-xs text-gray-500 mt-1">Strong positive link</div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="text-2xl font-bold text-white mb-1">$700</div>
              <div className="text-sm text-gray-400">Avg Revenue/Agency</div>
              <div className="text-xs text-emerald-400 mt-1">+12% this month</div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="text-2xl font-bold text-white mb-1">7.4</div>
              <div className="text-sm text-gray-400">Avg Clients/Agency</div>
              <div className="text-xs text-emerald-400 mt-1">+0.8 this month</div>
            </div>
          </div>
          
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
            <h3 className="text-emerald-300 font-medium mb-2">Growth Strategy Insight</h3>
            <p className="text-gray-300 text-sm mb-3">
              Your community engagement directly drives revenue. Agencies with 10+ active clients generate 40% more revenue on average.
            </p>
            <button 
              onClick={() => router.push('/dashboard/coach/webapp/management')}
              className="text-emerald-300 hover:text-emerald-200 text-sm font-medium flex items-center gap-1"
            >
              Improve Community Engagement <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-400" />
            Revenue Optimization
          </h3>
          
          <div className="space-y-3">
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <h4 className="text-white font-medium text-sm mb-1">Focus on Agency Growth</h4>
              <p className="text-gray-400 text-xs mb-2">
                Agencies with 15+ clients show 60% higher retention and revenue
              </p>
              <button 
                onClick={() => router.push('/dashboard/coach/webapp/analytics')}
                className="text-teal-300 hover:text-teal-200 text-xs font-medium"
              >
                View Agency Performance →
              </button>
            </div>
            
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <h4 className="text-white font-medium text-sm mb-1">Community Engagement</h4>
              <p className="text-gray-400 text-xs mb-2">
                Active communities generate 3x more referrals and higher LTV
              </p>
              <button 
                onClick={() => router.push('/dashboard/coach/webapp/management')}
                className="text-teal-300 hover:text-teal-200 text-xs font-medium"
              >
                Boost Engagement →
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400" />
            Investment Opportunities
          </h3>
          
          <p className="text-gray-300 text-sm mb-4">
            Ready to accelerate growth? Our revenue share program can amplify your earnings.
          </p>
          
          <div className="bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-orange-400/20 rounded-lg p-4">
            <div className="text-orange-300 font-medium text-sm mb-2">Boost Your Revenue Share</div>
            <div className="text-gray-300 text-xs mb-3">
              Invest in your community's growth and earn up to 70/30 revenue splits
            </div>
            <button 
              onClick={() => router.push('/dashboard/coach/income/boost')}
              className="bg-gradient-to-r from-orange-500/20 to-pink-500/20 hover:from-orange-500/30 hover:to-pink-500/30 border border-orange-400/30 rounded-lg px-4 py-2 text-xs font-medium text-orange-300 transition-all duration-300"
            >
              Explore Investment Tiers
            </button>
          </div>
        </div>
      </div>

      {/* AI Helper */}
      <AIHelper context="community analytics" />
    </>
  );
}
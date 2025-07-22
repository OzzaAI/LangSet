'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Calculator,
  TrendingUp,
  Users,
  Sparkles,
  CheckCircle,
  DollarSign,
  Target,
  Zap,
  Building2,
  ArrowRight,
  Info
} from 'lucide-react';
import MiniTopNav from '@/components/dashboard/MiniTopNav';

interface InvestmentTier {
  id: string;
  name: string;
  investment: number;
  newSplit: string;
  originalSplit: string;
  description: string;
  popular?: boolean;
}

const investmentTiers: InvestmentTier[] = [
  {
    id: 'tier1',
    name: 'Growth Accelerator',
    investment: 2500,
    newSplit: '60/40',
    originalSplit: '50/50',
    description: 'Perfect for coaches ready to invest in their community growth'
  },
  {
    id: 'tier2',
    name: 'Scale Partner',
    investment: 5000,
    newSplit: '65/35',
    originalSplit: '50/50',
    description: 'For serious coaches committed to building a thriving network',
    popular: true
  },
  {
    id: 'tier3',
    name: 'Elite Investor',
    investment: 10000,
    newSplit: '70/30',
    originalSplit: '50/50',
    description: 'Maximum revenue share for coaches scaling to enterprise levels'
  }
];

export default function BoostRevenuePage() {
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<InvestmentTier | null>(null);
  const [currentMonthlyRevenue] = useState(8420); // This would come from props/context
  const [projectedAgencies] = useState(15); // This would be calculated

  const calculateROI = (tier: InvestmentTier) => {
    const currentShare = 0.5; // 50%
    const newShare = parseInt(tier.newSplit.split('/')[0]) / 100;
    const additionalShare = newShare - currentShare;
    const additionalMonthlyRevenue = currentMonthlyRevenue * additionalShare;
    const monthsToBreakEven = Math.ceil(tier.investment / additionalMonthlyRevenue);
    const maxReturn = tier.investment * 5; // 5x cap
    const monthsToMaxReturn = Math.ceil(maxReturn / additionalMonthlyRevenue);
    
    return {
      additionalMonthlyRevenue,
      monthsToBreakEven,
      maxReturn,
      monthsToMaxReturn
    };
  };

  return (
    <>
      {/* Mini Top Nav */}
      <MiniTopNav
        title="Boost Revenue"
        communityLink="https://ozza.com/coach/boost"
      />

      {/* Back Navigation */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Revenue Dashboard
        </button>
      </div>

      {/* Header Section */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-4 flex items-center justify-center gap-3">
          <Sparkles className="w-8 h-8 text-orange-400" />
          Boost Your Revenue Share
        </h1>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Invest in your community's success and earn a higher percentage of revenue. 
          Your investment directly funds platform improvements that benefit everyone.
        </p>
      </div>

      {/* Investment Tiers */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Target className="w-5 h-5 text-teal-400" />
          Investment Tiers
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {investmentTiers.map((tier) => {
            const roi = calculateROI(tier);
            const isSelected = selectedTier?.id === tier.id;
            
            return (
              <div
                key={tier.id}
                onClick={() => setSelectedTier(tier)}
                className={`relative cursor-pointer rounded-xl border backdrop-blur-xl transition-all duration-300 ${
                  tier.popular 
                    ? 'border-orange-400/50 bg-gradient-to-br from-orange-500/10 via-pink-500/5 to-orange-500/10' 
                    : 'border-white/20 bg-gradient-to-br from-white/5 via-white/2 to-white/5'
                } ${
                  isSelected 
                    ? 'scale-105 border-orange-400/70 shadow-lg shadow-orange-500/25' 
                    : 'hover:border-white/30 hover:bg-white/10'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white mb-2">{tier.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{tier.description}</p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Investment</span>
                      <span className="text-white font-bold">${tier.investment.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Revenue Split</span>
                      <div className="text-right">
                        <span className="text-gray-500 line-through text-sm">{tier.originalSplit}</span>
                        <span className="text-teal-400 font-bold ml-2">{tier.newSplit}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Additional Monthly</span>
                      <span className="text-emerald-400 font-bold">+${roi.additionalMonthlyRevenue.toFixed(0)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Break Even</span>
                      <span className="text-white">{roi.monthsToBreakEven} months</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-400 mb-4">
                    5x return cap: ${roi.maxReturn.toLocaleString()} over {roi.monthsToMaxReturn} months
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Calculator Section */}
      {selectedTier && (
        <div className="mb-12">
          <div className="bg-gradient-to-br from-white/5 via-white/2 to-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-teal-400" />
              Investment Calculator - {selectedTier.name}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="text-sm text-gray-400 mb-1">Your Investment</div>
                  <div className="text-2xl font-bold text-white">${selectedTier.investment.toLocaleString()}</div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="text-sm text-gray-400 mb-1">Additional Monthly Revenue</div>
                  <div className="text-2xl font-bold text-emerald-400">+${calculateROI(selectedTier).additionalMonthlyRevenue.toFixed(0)}</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="text-sm text-gray-400 mb-1">Break Even Timeline</div>
                  <div className="text-2xl font-bold text-white">{calculateROI(selectedTier).monthsToBreakEven} months</div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="text-sm text-gray-400 mb-1">Total Return (5x cap)</div>
                  <div className="text-2xl font-bold text-teal-400">${calculateROI(selectedTier).maxReturn.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Why This Works Section */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Info className="w-5 h-5 text-teal-400" />
          Why This Investment Works
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Benefits for Coach */}
          <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent backdrop-blur-xl border border-emerald-500/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Why It's Good for You
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-white font-medium">Higher Revenue Share</div>
                  <div className="text-gray-400 text-sm">Keep more of what your community generates</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-white font-medium">Platform Investment</div>
                  <div className="text-gray-400 text-sm">Your money funds direct improvements to your tools</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-white font-medium">Growth Partnership</div>
                  <div className="text-gray-400 text-sm">Become an investor in the platform's success</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-white font-medium">Capped Risk</div>
                  <div className="text-gray-400 text-sm">5x return limit protects our sustainability</div>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits for Ozza */}
          <div className="bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-400" />
              Why It's Good for Ozza
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-white font-medium">Platform Development</div>
                  <div className="text-gray-400 text-sm">Funds go directly to product improvements</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-white font-medium">Team Expansion</div>
                  <div className="text-gray-400 text-sm">Hire more developers and support staff</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-white font-medium">Innovation Speed</div>
                  <div className="text-gray-400 text-sm">Adapt faster to AI agency community changes</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-white font-medium">Community Focus</div>
                  <div className="text-gray-400 text-sm">Listen and respond to user needs quickly</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {selectedTier && (
        <div className="text-center">
          <div className="bg-gradient-to-br from-orange-500/10 via-pink-500/5 to-orange-500/10 backdrop-blur-xl border border-orange-400/30 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4">Ready to Boost Your Revenue?</h3>
            <p className="text-gray-300 mb-6">
              Invest ${selectedTier.investment.toLocaleString()} in your community's future and start earning {selectedTier.newSplit} revenue share.
            </p>
            
            <button className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-orange-500/25 flex items-center gap-2 mx-auto">
              <DollarSign className="w-5 h-5" />
              Invest ${selectedTier.investment.toLocaleString()}
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <div className="text-xs text-gray-400 mt-4">
              * Investment terms subject to current platform agreement
            </div>
          </div>
        </div>
      )}
    </>
  );
}
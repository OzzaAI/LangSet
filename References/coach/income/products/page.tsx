'use client';

import { Zap, Plus, Package, TrendingUp } from 'lucide-react';
import MiniTopNav from '@/components/dashboard/MiniTopNav';
import AIHelper from '@/components/dashboard/AIHelper';

export default function ProductsPage() {
  return (
    <>
      <MiniTopNav
        title="Products"
        communityLink="https://ozza.com/coach/products"
      />

      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Package className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-3">Products Marketplace</h1>
          <p className="text-gray-400 mb-8">
            Upsell your community with templates, courses, and premium resources. Create additional revenue streams beyond coaching.
          </p>
          
          <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-5 h-5 text-amber-400" />
              <span className="text-white font-medium">Coming Soon</span>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              We're building a comprehensive product marketplace where you can:
            </p>
            <ul className="text-left text-sm text-gray-400 space-y-2">
              <li>• Sell templates and resources</li>
              <li>• Create online courses</li>
              <li>• Offer premium community access</li>
              <li>• Set up subscription products</li>
            </ul>
          </div>
        </div>
      </div>

      {/* AI Helper */}
      <AIHelper context="products marketplace" />
    </>
  );
}
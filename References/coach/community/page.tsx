'use client';

import MiniTopNav from '@/components/dashboard/MiniTopNav';
import { Users, Building2, TrendingUp, MessageSquare } from 'lucide-react';

export default function CommunityPage() {
  return (
    <>
      <MiniTopNav
        title="Community Management"
        communityLink="https://ozza.com/coach/community"
      />

      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Community Management</h3>
        <p className="text-gray-300 mb-8">Manage your coaching network and community engagement</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/5 rounded-lg p-6 border border-white/10">
            <Building2 className="w-8 h-8 text-teal-400 mb-3" />
            <h4 className="text-white font-medium mb-2">Agencies</h4>
            <p className="text-gray-400 text-sm">Manage your agency network</p>
          </div>
          
          <div className="bg-white/5 rounded-lg p-6 border border-white/10">
            <Users className="w-8 h-8 text-emerald-400 mb-3" />
            <h4 className="text-white font-medium mb-2">Clients</h4>
            <p className="text-gray-400 text-sm">Overview of all clients</p>
          </div>
          
          <div className="bg-white/5 rounded-lg p-6 border border-white/10">
            <MessageSquare className="w-8 h-8 text-blue-400 mb-3" />
            <h4 className="text-white font-medium mb-2">Engagement</h4>
            <p className="text-gray-400 text-sm">Community interaction metrics</p>
          </div>
          
          <div className="bg-white/5 rounded-lg p-6 border border-white/10">
            <TrendingUp className="w-8 h-8 text-orange-400 mb-3" />
            <h4 className="text-white font-medium mb-2">Growth</h4>
            <p className="text-gray-400 text-sm">Community growth insights</p>
          </div>
        </div>
      </div>
    </>
  );
}
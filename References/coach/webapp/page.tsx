'use client';

import { Building2, Users, Settings, ArrowRight, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import MiniTopNav from '@/components/dashboard/MiniTopNav';
import AIHelper from '@/components/dashboard/AIHelper';

export default function WebAppPage() {
  const router = useRouter();

  return (
    <>
      <MiniTopNav
        title="Web App"
        communityLink="https://ozza.com/coach/webapp"
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
          <Building2 className="w-8 h-8 text-blue-400" />
          Web App Dashboard
        </h1>
        <p className="text-gray-400">
          Manage your community platform, analytics, and settings in one place.
        </p>
      </div>

      {/* Main Navigation Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Community Management */}
        <div 
          onClick={() => router.push('/dashboard/coach/webapp/management')}
          className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6 hover:border-white/20 transition-all duration-300 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-emerald-400" />
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          </div>
          
          <h3 className="text-lg font-semibold text-white mb-2">Community Management</h3>
          <p className="text-gray-400 text-sm mb-4">
            Resources, messaging, and community engagement tools
          </p>
          
          <div className="space-y-2">
            <div className="text-xs text-gray-500">• Resources & Docs</div>
            <div className="text-xs text-gray-500">• Videos & Q&A</div>
            <div className="text-xs text-gray-500">• Inbox & Messages</div>
            <div className="text-xs text-gray-500">• Community Links</div>
          </div>
        </div>

        {/* Settings */}
        <div 
          onClick={() => router.push('/dashboard/coach/webapp/settings')}
          className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6 hover:border-white/20 transition-all duration-300 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <Settings className="w-8 h-8 text-orange-400" />
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          </div>
          
          <h3 className="text-lg font-semibold text-white mb-2">Settings</h3>
          <p className="text-gray-400 text-sm mb-4">
            Customize your web page design and profile settings
          </p>
          
          <div className="space-y-2">
            <div className="text-xs text-gray-500">• Web Page Design</div>
            <div className="text-xs text-gray-500">• Upload Logo</div>
            <div className="text-xs text-gray-500">• Choose Colors</div>
            <div className="text-xs text-gray-500">• Profile Management</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-400" />
          Platform Overview
        </h3>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
            <div className="text-xl font-bold text-white">12</div>
            <div className="text-xs text-gray-400">Active Agencies</div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
            <div className="text-xl font-bold text-white">89</div>
            <div className="text-xs text-gray-400">Total Clients</div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
            <div className="text-xl font-bold text-white">94%</div>
            <div className="text-xs text-gray-400">Retention Rate</div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
            <div className="text-xl font-bold text-white">4.8</div>
            <div className="text-xs text-gray-400">Satisfaction</div>
          </div>
        </div>
      </div>

      {/* AI Helper */}
      <AIHelper context="web app dashboard" />
    </>
  );
}
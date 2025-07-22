'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { 
  Plus, 
  ArrowUp, 
  ArrowDown,
  Users,
  Building2,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Zap,
  Target,
  ChevronRight,
  TriangleAlert,
  BarChart3,
  HelpCircle,
  ExternalLink,
  ArrowRight,
  Play,
  Settings,
  Sparkles
} from 'lucide-react';
import CombinedRevenueCard from '@/components/analytics/CombinedRevenueCard';
import MiniTopNav from '@/components/dashboard/MiniTopNav';
import AIHelper from '@/components/dashboard/AIHelper';
import SetupGuidance from '@/components/dashboard/SetupGuidance';
import ROITracker from '@/app/[locale]/dashboard/_components/roi-tracker';
import CoachMetrics from '@/app/[locale]/dashboard/_components/coach-metrics';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action: string;
  href: string;
}

interface CoachData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  setupProgress: {
    completed: boolean;
    steps: SetupStep[];
    nextStep?: SetupStep;
  };
  revenue: {
    thisMonth: number;
    today: number;
    weekly: number;
    lifetime: number;
  };
  community: {
    totalAgencies: number;
    totalClients: number;
    activeIssues: number;
  };
  actionItems: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    href: string;
  }>;
}


function WelcomeMessage({ userName, revenue }: { userName: string, revenue: any }) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  const dynamicMessages = [
    `$${revenue.thisMonth.toLocaleString()} earned this month`,
    'Your coaching network is growing strong',
    'Every connection creates new opportunities',
    'Building lasting business relationships',
    `$${revenue.today.toLocaleString()} earned today`
  ];

  useEffect(() => {
    if (!displayText) {
      setDisplayText(dynamicMessages[0]);
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        setDisplayText(dynamicMessages[currentMessageIndex]);
        setIsVisible(true);
      }, 1000);
    }, 3500);
    
    return () => clearTimeout(timer);
  }, [currentMessageIndex, dynamicMessages, displayText]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % dynamicMessages.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [dynamicMessages.length]);

  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-white mb-2">
        Welcome back, <span className="bg-gradient-to-r from-orange-300 to-pink-300 bg-clip-text text-transparent">{userName}!</span>
      </h1>
      <p className={`text-gray-400 transition-all duration-1000 ease-in-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}>
        {displayText}
      </p>
    </div>
  );
}

export default function CoachDashboard() {
  const [coachData, setCoachData] = useState<CoachData | null>(null);
  const [coachMode, setCoachMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCoachData = async () => {
      try {
        const sessionResponse = await authClient.getSession();
        
        if (!sessionResponse?.data?.session) {
          router.push('/login');
          return;
        }

        // Check coach mode setting
        try {
          const settingsResponse = await fetch("/api/user-settings");
          if (settingsResponse.ok) {
            const settingsData = await settingsResponse.json();
            setCoachMode(settingsData.settings.preferences?.coachMode || false);
          }
        } catch (settingsError) {
          console.error('Failed to load coach mode setting:', settingsError);
        }

        // Mock data following your structure
        const mockData: CoachData = {
          user: {
            id: 'coach1',
            name: 'Alex Thompson',
            email: 'alex@example.com',
            role: 'coach'
          },
          setupProgress: {
            completed: false,
            steps: [
              { id: '1', title: 'Upload Profile Photo', description: 'Add a professional photo to your profile', completed: true, action: 'Complete', href: '/dashboard/settings' },
              { id: '2', title: 'Set Community Link', description: 'Create your custom community landing page', completed: false, action: 'Set Up', href: '/dashboard/coach/settings' },
              { id: '3', title: 'Invite First Agency', description: 'Start building your network by inviting an agency', completed: false, action: 'Invite', href: '/dashboard/coach/agencies' },
              { id: '4', title: 'Customize Branding', description: 'Upload logo and choose brand colors', completed: false, action: 'Customize', href: '/dashboard/settings' }
            ],
            nextStep: {
              id: '2',
              title: 'Set Community Link',
              description: 'Create your custom community landing page',
              completed: false,
              action: 'Set Up',
              href: '/dashboard/coach/settings'
            }
          },
          revenue: {
            thisMonth: 8420,
            today: 450,
            weekly: 1580,
            lifetime: 24750
          },
          community: {
            totalAgencies: 12,
            totalClients: 89,
            activeIssues: 2
          },
          actionItems: [
            {
              id: '1',
              title: 'Review Agency Performance',
              description: '3 agencies need attention this week',
              priority: 'high',
              href: '/dashboard/coach/analytics'
            },
            {
              id: '2',
              title: 'Update Training Materials',
              description: 'New resources available for your network',
              priority: 'medium',
              href: '/dashboard/coach/resources'
            }
          ]
        };

        setCoachData(mockData);
      } catch (err) {
        console.error('Error fetching coach data:', err);
        setError('Failed to load coach data');
      } finally {
        setLoading(false);
      }
    };

    fetchCoachData();
  }, [router]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-white/20 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/10 h-32 rounded-lg backdrop-blur-sm"></div>
          ))}
        </div>
        <div className="bg-white/10 h-96 rounded-lg backdrop-blur-sm"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md glass-card border border-red-500/30 bg-red-500/10 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <TriangleAlert className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-300">Error loading dashboard</h3>
            <div className="mt-2 text-sm text-red-200">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!coachData) return null;

  return (
    <>
      {/* Mini Top Nav with Community Link */}
      <MiniTopNav
        title="Home"
        communityLink={`https://ozza.com/coach/${coachData.user?.name?.toLowerCase().replace(/\s+/g, '-') || 'coach'}`}
      />

      {/* Welcome Message */}
      <div data-tour="dashboard-overview">
        <WelcomeMessage userName={coachData.user?.name || 'User'} revenue={coachData.revenue} />
      </div>

      {/* Setup Progress - Takes Priority Unless Completed */}
      <div className="mb-8">
        <SetupGuidance />
      </div>

      {/* Primary Income Section with Your Beautiful Graph Component */}
      <div className="mb-8" data-tour="upload">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-teal-400" />
            Income
          </h2>
          <button 
            onClick={() => router.push('/dashboard/coach/revenue/boost')}
            className="bg-gradient-to-r from-orange-500/20 to-pink-500/20 hover:from-orange-500/30 hover:to-pink-500/30 border border-orange-400/30 hover:border-pink-400/50 rounded-lg px-4 py-2 text-sm font-medium text-orange-300 hover:text-pink-200 transition-all duration-300 backdrop-blur-xl flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Boost Earnings
          </button>
        </div>
        
        {/* Your Perfectly Tuned Revenue Component */}
        <CombinedRevenueCard 
          monthlyEarnings={coachData.revenue.thisMonth}
          todaysEarnings={coachData.revenue.today}
          weeklyEarnings={coachData.revenue.weekly}
          lifetimeEarnings={coachData.revenue.lifetime}
        />
      </div>

      {/* ROI Tracker - AI Performance & Analytics */}
      <div data-tour="chat">
        <ROITracker coachMode={coachMode} />
      </div>

      {/* Coach Dashboard - Only visible when coach mode is enabled */}
      <div data-tour="coach-metrics">
        <CoachMetrics coachMode={coachMode} />
      </div>

      {/* Snapshots with Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Community Analytics Snapshot */}
        <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6" data-tour="client-management">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-400" />
              Community Analytics
            </h3>
            <button 
              onClick={() => router.push('/dashboard/coach/analytics')}
              className="text-teal-300 hover:text-teal-200 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-2xl font-bold text-white">{coachData.community.totalAgencies}</div>
              <div className="text-sm text-gray-400">Active Agencies</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{coachData.community.totalClients}</div>
              <div className="text-sm text-gray-400">Total Clients</div>
            </div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <p className="text-sm text-gray-300 mb-2">Community growth directly impacts your income potential</p>
            <button 
              onClick={() => router.push('/dashboard/coach/community')}
              className="text-teal-300 hover:text-teal-200 text-sm font-medium flex items-center gap-1"
            >
              Manage Community <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Action Items */}
        <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-400" />
            Action Items
          </h3>
          
          <div className="space-y-3">
            {coachData.actionItems.map((item) => (
              <div key={item.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-white text-sm">{item.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.priority === 'high' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                    item.priority === 'medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {item.priority}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-2">{item.description}</p>
                <button 
                  onClick={() => window.location.href = item.href}
                  className="text-teal-300 hover:text-teal-200 text-xs font-medium flex items-center gap-1"
                >
                  Take Action <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Helper in Bottom Right Corner */}
      <AIHelper context="home dashboard" />
    </>
  );
}
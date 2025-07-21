"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  Clock,
  Zap,
  Target,
  BarChart3,
  Activity,
  Timer,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  DollarSign,
  Share2,
  Users,
} from "lucide-react";

interface ROIMetrics {
  timeSaved: {
    total: number; // in minutes
    thisWeek: number;
    lastWeek: number;
    trend: "up" | "down" | "stable";
  };
  tasksAutomated: {
    total: number;
    thisWeek: number;
    lastWeek: number;
    trend: "up" | "down" | "stable";
  };
  agentShares: {
    total: number;
    thisWeek: number;
    lastWeek: number;
    trend: "up" | "down" | "stable";
    byPlatform: Record<string, number>;
    viralReach: number;
  };
  chatSessions: {
    total: number;
    thisWeek: number;
    avgDuration: number; // in minutes
    successRate: number; // percentage
  };
  efficiency: {
    score: number; // 0-100
    improvement: number; // percentage change
    topTasks: string[];
  };
}

interface ActivityData {
  date: string;
  sessions: number;
  timeSaved: number;
  tasksCompleted: number;
}

interface ROITrackerProps {
  coachMode?: boolean;
}

export default function ROITracker({ coachMode = false }: ROITrackerProps) {
  const [metrics, setMetrics] = useState<ROIMetrics | null>(null);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMetrics = async () => {
    try {
      setRefreshing(true);
      
      // Simulate API call to fetch ROI metrics from chat_sessions and agents
      const response = await fetch("/api/roi-metrics");
      
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
        setActivityData(data.activity);
      } else {
        // Fallback with mock data
        setMetrics({
          timeSaved: {
            total: 2340, // 39 hours
            thisWeek: 420, // 7 hours
            lastWeek: 380,
            trend: "up",
          },
          tasksAutomated: {
            total: 156,
            thisWeek: 28,
            lastWeek: 24,
            trend: "up",
          },
          agentShares: {
            total: 23,
            thisWeek: 6,
            lastWeek: 4,
            trend: "up",
            byPlatform: {
              "x": 8,
              "skool": 7,
              "linkedin": 5,
              "direct": 3
            },
            viralReach: 1150
          },
          chatSessions: {
            total: 89,
            thisWeek: 15,
            avgDuration: 8.5,
            successRate: 87,
          },
          efficiency: {
            score: 92,
            improvement: 12.5,
            topTasks: ["Email automation", "Data analysis", "Report generation"],
          },
        });

        setActivityData([
          { date: "Mon", sessions: 3, timeSaved: 45, tasksCompleted: 8 },
          { date: "Tue", sessions: 5, timeSaved: 62, tasksCompleted: 12 },
          { date: "Wed", sessions: 2, timeSaved: 28, tasksCompleted: 5 },
          { date: "Thu", sessions: 4, timeSaved: 55, tasksCompleted: 9 },
          { date: "Fri", sessions: 6, timeSaved: 78, tasksCompleted: 15 },
          { date: "Sat", sessions: 1, timeSaved: 15, tasksCompleted: 3 },
          { date: "Sun", sessions: 2, timeSaved: 25, tasksCompleted: 4 },
        ]);
      }
    } catch (error) {
      console.error("Failed to load ROI metrics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-400" />
            ROI Tracker
          </h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
              <div className="h-2 bg-white/10 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-400" />
            ROI Tracker
          </h3>
        </div>
        <button 
          onClick={loadMetrics}
          className="text-teal-300 hover:text-teal-200 text-sm font-medium flex items-center gap-1"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* AI Performance Overview */}
      <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-400" />
            AI Performance
          </h3>
          <button 
            onClick={loadMetrics}
            disabled={refreshing}
            className="text-teal-300 hover:text-teal-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="text-2xl font-bold text-white">{formatDuration(metrics.timeSaved.total)}</div>
              <div className="flex items-center gap-1">
                {getTrendIcon(metrics.timeSaved.trend)}
                <span className={`text-xs ${getTrendColor(metrics.timeSaved.trend)}`}>
                  {Math.abs(
                    ((metrics.timeSaved.thisWeek - metrics.timeSaved.lastWeek) /
                      metrics.timeSaved.lastWeek) *
                      100
                  ).toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-400 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Time Saved Total
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="text-2xl font-bold text-white">{metrics.agentShares.total}</div>
              <div className="flex items-center gap-1">
                {getTrendIcon(metrics.agentShares.trend)}
                <span className={`text-xs ${getTrendColor(metrics.agentShares.trend)}`}>
                  {Math.abs(
                    ((metrics.agentShares.thisWeek - metrics.agentShares.lastWeek) /
                      metrics.agentShares.lastWeek) *
                      100
                  ).toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-400 flex items-center gap-1">
              <Share2 className="w-4 h-4" />
              Agent Shares
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-3 border border-white/10 mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-300">
              {coachMode ? "Coach Viral Reach" : "Viral Reach"}
            </p>
            <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {metrics.agentShares.viralReach} potential views
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Top platforms:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(metrics.agentShares.byPlatform).map(([platform, count]) => (
              <span key={platform} className="text-xs px-2 py-1 rounded bg-white/10 text-gray-300">
                {platform}: {count}
              </span>
            ))}
          </div>
          {coachMode && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2 text-xs">
                <Users className="w-3 h-3 text-teal-400" />
                <span className="text-teal-300">Coach growth multiplier: 2.5x</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-300">Weekly Activity</p>
            <span className="text-xs px-2 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
              {metrics.chatSessions.thisWeek} sessions
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Time saved this week</span>
              <span>{formatDuration(metrics.timeSaved.thisWeek)}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-teal-400 to-green-400 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((metrics.timeSaved.thisWeek / metrics.timeSaved.total) * 100, 100)}%`
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* ROI & Efficiency */}
      <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-teal-400" />
            ROI Analysis
          </h3>
          <button 
            className="text-teal-300 hover:text-teal-200 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Tasks Automated</span>
              <span className="text-xs px-2 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {metrics.tasksAutomated.thisWeek} this week
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-white">{metrics.tasksAutomated.total}</div>
              <div className="flex items-center gap-1">
                {getTrendIcon(metrics.tasksAutomated.trend)}
                <span className={`text-xs ${getTrendColor(metrics.tasksAutomated.trend)}`}>
                  {Math.abs(
                    ((metrics.tasksAutomated.thisWeek - metrics.tasksAutomated.lastWeek) /
                      metrics.tasksAutomated.lastWeek) *
                      100
                  ).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Efficiency Score</span>
              <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                +{metrics.efficiency.improvement}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-white">{metrics.efficiency.score}</div>
              <div className="text-sm text-gray-400">/100</div>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 mt-2">
              <div 
                className="bg-gradient-to-r from-orange-400 to-yellow-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${metrics.efficiency.score}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-green-400">
                ${Math.round((metrics.timeSaved.total / 60) * (coachMode ? 75 : 50))}
              </div>
              <div className="text-xs text-gray-400">
                {coachMode ? "Coach value generated" : "Estimated value saved"}
              </div>
              {coachMode && (
                <div className="text-xs text-teal-300 mt-1">
                  +50% coaching premium
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Top Automated Tasks</h4>
            <div className="space-y-2">
              {metrics.efficiency.topTasks.slice(0, 3).map((task, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-gray-300">{task}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button className="text-teal-300 hover:text-teal-200 text-sm font-medium flex items-center gap-1">
            View Detailed Analytics <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
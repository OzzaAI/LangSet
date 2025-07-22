import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { user, dataset } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SectionCards } from "./_components/section-cards";
import { ChartAreaInteractive } from "./_components/chart-interactive";
import { ReferralStats } from "./_components/referral-stats";
import MetricsGrid from "@/components/dashboard/metrics-grid";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from "@/components/ui/glass-card";

export default async function Dashboard() {
  const result = await auth.api.getSession({
    headers: await headers(), // you need to pass the headers object.
  });

  if (!result?.session?.userId) {
    redirect("/sign-in");
  }

  // Check if user profile is complete
  const userData = await db
    .select()
    .from(user)
    .where(eq(user.id, result.session.userId))
    .limit(1);

  const currentUser = userData[0];
  
  // Redirect to profile completion if profile is not complete
  if (!currentUser?.profileComplete) {
    redirect("/dashboard/profile");
  }

  // Get user metrics
  const userDatasets = await db
    .select({
      id: dataset.id,
      name: dataset.name,
      instanceCount: dataset.instanceCount,
      averageQualityScore: dataset.averageQualityScore,
    })
    .from(dataset)
    .where(eq(dataset.creatorId, result.session.userId));

  // Calculate metrics
  const totalDatasets = userDatasets.length;
  const totalInstances = userDatasets.reduce((sum, d) => sum + (d.instanceCount || 0), 0);
  const avgQuality = userDatasets.length > 0 
    ? Math.round(userDatasets.reduce((sum, d) => sum + (d.averageQualityScore || 0), 0) / userDatasets.length)
    : 0;

  const metrics = [
    {
      id: "datasets",
      title: "Datasets Created",
      value: totalDatasets,
      subtitle: "Total datasets",
      trend: { direction: "up" as const, value: 12.5, label: "This month" },
      icon: "database" as const,
    },
    {
      id: "instances", 
      title: "Data Instances",
      value: totalInstances,
      subtitle: "Total instances created",
      trend: { direction: "up" as const, value: 8.2, label: "This week" },
      icon: "trending" as const,
    },
    {
      id: "quality",
      title: "Quality Score", 
      value: `${avgQuality}%`,
      subtitle: "Average quality",
      trend: { direction: "up" as const, value: 4.1, label: "Improving" },
      icon: "target" as const,
    },
    {
      id: "earnings",
      title: "Estimated Value",
      value: `$${(totalDatasets * 150).toLocaleString()}`,
      subtitle: "Potential earnings",
      trend: { direction: "up" as const, value: 15.3, label: "Based on quality" },
      icon: "dollar" as const,
      variant: "primary" as const,
    },
  ];

  return (
    <div className="min-h-screen" style={{backgroundColor: '#2dd14a'}}>
      <section className="flex flex-col items-start justify-start p-6 w-full">
        <div className="w-full max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex flex-col items-start justify-center gap-2 mb-6">
              <h1 className="text-3xl font-black tracking-tight text-white">
                Welcome back, <span className="text-white/90 font-bold">{currentUser.name || 'User'}</span>!
              </h1>
              <p className="text-white/80 text-lg font-medium">
                Your knowledge is becoming valuable data. Keep creating, keep earning.
              </p>
            </div>

            {/* Metrics Overview */}
            <MetricsGrid metrics={metrics} columns={4} className="mb-8" />
          </div>

          {/* Main Content Grid */}
          <div className="@container/main flex flex-1 flex-col gap-6">
            {/* Enhanced Section Cards */}
            <GlassCard className="p-6">
              <GlassCardHeader className="pb-4">
                <GlassCardTitle className="flex items-center gap-2">
                  📊 Performance Overview
                </GlassCardTitle>
                <GlassCardDescription>
                  Track your progress and earnings across all datasets
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="pt-0">
                <SectionCards />
              </GlassCardContent>
            </GlassCard>

            {/* Charts and Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle>Analytics</GlassCardTitle>
                  <GlassCardDescription>
                    Dataset performance and growth trends
                  </GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent>
                  <ChartAreaInteractive />
                </GlassCardContent>
              </GlassCard>

              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle>Referral Program</GlassCardTitle>
                  <GlassCardDescription>
                    Share LangSet and earn from referrals
                  </GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent>
                  <ReferralStats />
                </GlassCardContent>
              </GlassCard>
            </div>

            {/* Quick Actions */}
            <GlassCard variant="elevated" className="p-6">
              <GlassCardHeader className="pb-4">
                <GlassCardTitle>Quick Actions</GlassCardTitle>
                <GlassCardDescription>
                  Get started with creating and monetizing your knowledge
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-teal-400/20 rounded-lg p-4 hover:from-green-500/15 hover:to-emerald-500/15 transition-all duration-300 cursor-pointer">
                    <div className="text-green-400 text-2xl mb-2">📝</div>
                    <h3 className="text-white font-medium mb-1">Start Editing</h3>
                    <p className="text-gray-400 text-sm">Improve dataset quality with AI assistance</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-400/20 rounded-lg p-4 hover:from-green-500/15 hover:to-emerald-500/15 transition-all duration-300 cursor-pointer">
                    <div className="text-green-400 text-2xl mb-2">💰</div>
                    <h3 className="text-white font-medium mb-1">Sell Datasets</h3>
                    <p className="text-gray-400 text-sm">Set prices and start earning</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/20 rounded-lg p-4 hover:from-purple-500/15 hover:to-pink-500/15 transition-all duration-300 cursor-pointer">
                    <div className="text-purple-400 text-2xl mb-2">🤝</div>
                    <h3 className="text-white font-medium mb-1">View Offers</h3>
                    <p className="text-gray-400 text-sm">Manage incoming buyer offers</p>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>
        </div>
      </section>
    </div>
  );
}
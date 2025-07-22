import { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import GlassSidebar from "@/components/dashboard/glass-sidebar";
import Chatbot from "./_components/chatbot";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Get session and user data for the sidebar
  const result = await auth.api.getSession({
    headers: await headers(),
  });

  let currentUser = null;
  if (result?.session?.userId) {
    const userData = await db
      .select()
      .from(user)
      .where(eq(user.id, result.session.userId))
      .limit(1);
    
    currentUser = userData[0];
  }

  return (
    <div className="flex h-screen overflow-hidden w-full bg-gradient-to-br from-slate-900 via-gray-900 to-black">
      {/* New Glassmorphism Sidebar */}
      <GlassSidebar 
        user={currentUser ? {
          name: currentUser.name || 'User',
          email: currentUser.email || '',
          role: 'user'
        } : undefined}
      />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {/* Enhanced Top Navigation */}
        <div className="sticky top-0 z-40 bg-black/20 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                Dashboard
              </h2>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Theme toggle and other nav items could go here */}
              <div className="text-sm text-gray-400">
                {currentUser?.name && `Welcome, ${currentUser.name}`}
              </div>
            </div>
          </div>
        </div>
        
        {/* Page Content */}
        <div className="flex-1">
          {children}
        </div>
      </main>
      
      {/* Enhanced Chatbot */}
      <Chatbot />
    </div>
  );
}
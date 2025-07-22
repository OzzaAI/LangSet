"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home,
  Database,
  Edit,
  DollarSign,
  MessageSquare,
  Settings,
  User,
  Menu,
  TrendingUp,
  ChevronRight,
  BarChart3,
  Sparkles
} from "lucide-react";
import { NavItem } from "@/components/ui/nav-item";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user?: {
    name: string;
    email: string;
    role?: string;
    avatar?: string;
  };
  className?: string;
}

const navigationItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: User,
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    label: "Refine",
    href: "/refine",
    icon: Sparkles,
  },
  {
    label: "Edit Mode",
    href: "/edit",
    icon: Edit,
  },
  {
    label: "Marketplace",
    href: "/sell",
    icon: DollarSign,
  },
  {
    label: "Offers",
    href: "/offers",
    icon: TrendingUp,
  },
  {
    label: "Chat",
    href: "/dashboard/chat",
    icon: MessageSquare,
  },
];

const bottomItems = [
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function GlassSidebar({ user, className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <div 
        className={cn(
          "hidden lg:flex flex-col h-screen border-r transition-all duration-300",
          "bg-gradient-to-b from-black/40 to-gray-900/30 backdrop-blur-xl border-white/10",
          isCollapsed ? "w-16" : "w-64",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center font-semibold hover:cursor-pointer group transition-all duration-200",
              isCollapsed && "justify-center"
            )}
          >
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 group-hover:from-green-500/30 group-hover:to-emerald-500/30 transition-colors duration-200 backdrop-blur-sm border border-green-400/20">
              <Database className="h-5 w-5 text-green-400" />
            </div>
            {!isCollapsed && (
              <span className="ml-3 text-lg tracking-tight bg-gradient-to-r from-green-200 to-emerald-200 bg-clip-text text-transparent">
                LangSet.ai
              </span>
            )}
          </Link>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-400 hover:text-white hover:bg-white/10"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col h-full justify-between">
          <div className="space-y-2 p-4">
            {!isCollapsed && (
              <div className="px-2 py-1 mb-4">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Navigation
                </h2>
              </div>
            )}
            
            {navigationItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={isCollapsed ? "" : item.label}
                isActive={pathname === item.href}
                variant="sidebar"
                className={cn(
                  isCollapsed && "justify-center px-2",
                  !isCollapsed && "justify-start"
                )}
              />
            ))}
          </div>

          {/* Bottom Section */}
          <div className="border-t border-white/10 bg-black/20">
            {/* User Profile */}
            {user && (
              <div className={cn(
                "p-4 border-b border-white/10",
                isCollapsed && "p-2"
              )}>
                <div className={cn(
                  "flex items-center gap-3",
                  isCollapsed && "justify-center"
                )}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-sm font-medium">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Navigation */}
            <div className="p-4 space-y-2">
              {bottomItems.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={isCollapsed ? "" : item.label}
                  isActive={pathname === item.href}
                  variant="sidebar"
                  className={cn(
                    isCollapsed && "justify-center px-2",
                    !isCollapsed && "justify-start"
                  )}
                />
              ))}
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-black/20 backdrop-blur-sm border border-white/10 hover:bg-white/10"
        >
          <Menu className="h-5 w-5 text-white" />
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          
          {/* Mobile Sidebar */}
          <div className="relative flex flex-col w-64 h-full bg-gradient-to-b from-black/90 to-gray-900/90 backdrop-blur-xl border-r border-white/10 shadow-2xl">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
              <Link
                href="/dashboard"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center font-semibold hover:cursor-pointer group transition-all duration-200"
              >
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 group-hover:from-green-500/30 group-hover:to-emerald-500/30 transition-colors duration-200 backdrop-blur-sm border border-green-400/20">
                  <Database className="h-5 w-5 text-green-400" />
                </div>
                <span className="ml-3 text-lg tracking-tight bg-gradient-to-r from-green-200 to-emerald-200 bg-clip-text text-transparent">
                  LangSet.ai
                </span>
              </Link>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileOpen(false)}
                className="text-gray-400 hover:text-white hover:bg-white/10"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex flex-col h-full justify-between overflow-y-auto">
              <div className="space-y-2 p-4">
                <div className="px-2 py-1 mb-4">
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Navigation
                  </h2>
                </div>
                
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 w-full rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200",
                      "hover:bg-white/10 active:bg-white/20",
                      pathname === item.href
                        ? "bg-gradient-to-r from-green-500/20 to-emerald-500/10 text-green-400 border border-green-500/20"
                        : "text-gray-300 hover:text-white"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* Mobile Bottom Section */}
              <div className="border-t border-white/10 bg-black/20">
                {/* Mobile User Profile */}
                {user && (
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-medium">
                        {user.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {user.email}
                        </p>
                        {user.role && (
                          <p className="text-xs text-green-400 font-medium">
                            {user.role}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Mobile Bottom Navigation */}
                <div className="p-4 space-y-2">
                  {bottomItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 w-full rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200",
                        "hover:bg-white/10 active:bg-white/20",
                        pathname === item.href
                          ? "bg-gradient-to-r from-green-500/20 to-emerald-500/10 text-green-400 border border-green-500/20"
                          : "text-gray-300 hover:text-white"
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
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
  ChevronRight
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

      {/* Mobile Menu Button - Could be implemented later */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          className="bg-black/20 backdrop-blur-sm border border-white/10 hover:bg-white/10"
        >
          <Menu className="h-5 w-5 text-white" />
        </Button>
      </div>
    </>
  );
}
"use client";

import {
  Banknote,
  HomeIcon,
  LucideIcon,
  MessageCircleIcon,
  Settings,
  Upload,
  Users,
  Globe,
  TrendingUp,
  Building,
  BarChart3,
  FolderKanban,
  Clock,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PortalType } from "../../../lib/constants";
import Image from "next/image";
import { useHoverPrefetch } from "@/hooks/use-hover-prefetch";
import { cn } from "@/lib/utils";
import { NavItem } from "@/components/ui/nav-item";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export default function DashboardSideBar({ portalType }: { portalType: PortalType }) {
  const pathname = usePathname();
  const router = useRouter();

  const getNavItems = (): NavItem[] => {
    switch (portalType) {
      case 'coach':
        return [
          {
            label: "Overview",
            href: `/dashboard/${portalType}`,
            icon: HomeIcon,
          },
          {
            label: "My Agencies",
            href: `/dashboard/${portalType}/agencies`,
            icon: Building,
          },
          {
            label: "Performance",
            href: `/dashboard/${portalType}/performance`,
            icon: TrendingUp,
          },
          {
            label: "Training Materials",
            href: `/dashboard/${portalType}/training`,
            icon: Upload,
          },
        ];
      
      case 'agency':
        return [
          {
            label: "Overview",
            href: `/dashboard/${portalType}`,
            icon: HomeIcon,
          },
          {
            label: "Projects",
            href: `/dashboard/${portalType}/projects`,
            icon: FolderKanban,
          },
          {
            label: "Clients",
            href: `/dashboard/${portalType}/clients`,
            icon: Users,
          },
          {
            label: "Time Tracking",
            href: `/dashboard/${portalType}/time`,
            icon: Clock,
          },
          {
            label: "Files",
            href: `/dashboard/${portalType}/files`,
            icon: FileText,
          },
          {
            label: "Analytics",
            href: `/dashboard/${portalType}/analytics`,
            icon: BarChart3,
          },
        ];
      
      case 'client':
        return [
          {
            label: "Overview",
            href: `/dashboard/${portalType}`,
            icon: HomeIcon,
          },
          {
            label: "My Website",
            href: `/dashboard/${portalType}/website`,
            icon: Globe,
          },
          {
            label: "Analytics",
            href: `/dashboard/${portalType}/analytics`,
            icon: BarChart3,
          },
          {
            label: "Support",
            href: `/dashboard/${portalType}/support`,
            icon: MessageCircleIcon,
          },
        ];
      
      default:
        return [
          {
            label: "Overview",
            href: `/dashboard/${portalType}`,
            icon: HomeIcon,
          },
          {
            label: "Chat",
            href: `/dashboard/${portalType}/chat`,
            icon: MessageCircleIcon,
          },
          {
            label: "Upload",
            href: `/dashboard/${portalType}/upload`,
            icon: Upload,
          },
          {
            label: "Payment Gated",
            href: `/dashboard/${portalType}/payment`,
            icon: Banknote,
          },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-[1024px]:block hidden w-64 border-r border-white/10 h-full bg-gradient-to-b from-black/40 to-gray-900/30 backdrop-blur-xl">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center border-b border-white/10 px-6 bg-black/20">
          <Link
            prefetch={true}
            className="flex items-center font-semibold hover:cursor-pointer group transition-all duration-200"
            href={`/dashboard/${portalType}`}
          >
            <div className="p-2 rounded-lg bg-white/10 group-hover:bg-white/15 transition-colors duration-200 backdrop-blur-sm">
              <Image src="/ozza-logo.svg" alt="Ozza Logo" width={20} height={20} />
            </div>
            <span className="ml-3 text-lg tracking-tight text-gray-200">Ozza</span>
          </Link>
        </div>

        <nav className="flex flex-col h-full justify-between items-start w-full">
          <div className="w-full space-y-2 p-4">
            <div className="px-2 py-1 mb-4">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {portalType ? `${portalType.charAt(0).toUpperCase() + portalType.slice(1)} Portal` : 'Dashboard'}
              </h2>
            </div>
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={pathname === item.href}
                prefetch={true}
              />
            ))}
          </div>

          <div className="flex flex-col gap-2 w-full p-4 border-t border-white/10 bg-black/20">
            <NavItem
              href={`/dashboard/${portalType}/settings`}
              icon={Settings}
              label="Settings"
              isActive={pathname === `/dashboard/${portalType}/settings`}
              prefetch={true}
            />
          </div>
        </nav>
      </div>
    </div>
  );
}

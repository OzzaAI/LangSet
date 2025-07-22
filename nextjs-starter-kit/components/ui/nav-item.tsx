"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  prefetch?: boolean;
  className?: string;
  variant?: "default" | "sidebar" | "compact";
}

export function NavItem({ 
  href, 
  icon: Icon, 
  label, 
  isActive = false, 
  prefetch = false,
  className,
  variant = "default"
}: NavItemProps) {
  const variants = {
    default: cn(
      "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
      "hover:bg-white/10 hover:scale-105 hover:shadow-sm",
      isActive 
        ? "bg-gradient-to-r from-teal-500/20 to-blue-500/20 text-teal-300 border border-teal-400/30 shadow-lg shadow-teal-500/10" 
        : "text-gray-300 hover:text-white"
    ),
    sidebar: cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
      "hover:bg-white/8 hover:translate-x-1",
      isActive 
        ? "bg-gradient-to-r from-teal-500/15 to-blue-500/15 text-teal-200 border-l-2 border-teal-400 bg-white/5" 
        : "text-gray-400 hover:text-gray-200"
    ),
    compact: cn(
      "flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-200",
      "hover:bg-white/5 hover:scale-105",
      isActive 
        ? "bg-teal-500/10 text-teal-300" 
        : "text-gray-400 hover:text-gray-200"
    )
  };

  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={cn(variants[variant], className)}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}
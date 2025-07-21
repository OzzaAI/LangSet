"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import UserProfile from "@/components/user-profile";
import { PortalType } from "@/lib/constants";

export default function DashboardTopNav({
  children,
  portalType, // eslint-disable-line @typescript-eslint/no-unused-vars
}: {
  children: React.ReactNode;
  portalType: PortalType;
}) {
  return (
    <div className="flex flex-col">
      <header className="flex h-16 items-center gap-6 border-b bg-background/80 backdrop-blur-sm px-6 sticky top-0 z-50">
        <Link href="/dashboard" className="lg:hidden">
          <div className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors duration-200">
            <Image src="/ozza-logo.svg" alt="Ozza Logo" width={20} height={20} />
          </div>
        </Link>
        
        <nav className="hidden md:flex gap-2">
          <Link href="/dashboard">
            <Button variant="ghost" className="transition-all duration-200 hover:scale-105 hover:shadow-sm">
              Dashboard
            </Button>
          </Link>
          <Link href="/dashboard/settings">
            <Button variant="ghost" className="transition-all duration-200 hover:scale-105 hover:shadow-sm">
              Settings
            </Button>
          </Link>
        </nav>
        
        <div className="flex justify-center items-center gap-3 ml-auto">
          <div className="hidden sm:block text-sm text-muted-foreground font-medium">
            {portalType ? `${portalType.charAt(0).toUpperCase() + portalType.slice(1)} Portal` : 'Dashboard'}
          </div>
          <UserProfile />
        </div>
      </header>
      
      <div className="flex-1 bg-gradient-to-br from-background via-background to-muted/20">
        {children}
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Lock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface LockedCTAProps {
  isLocked: boolean;
  children: React.ReactNode;
  lockedMessage?: string;
  progress?: number;
  onClick?: () => void;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
}

export function LockedCTA({
  isLocked,
  children,
  lockedMessage,
  progress,
  onClick,
  className,
  variant = "default",
  size = "default",
  disabled = false,
  ...props
}: LockedCTAProps) {
  if (isLocked) {
    return (
      <div className={cn("relative group", className)}>
        <Button
          variant="outline"
          size={size}
          disabled={true}
          className={cn(
            "relative overflow-hidden",
            "border-dashed border-gray-300 dark:border-gray-600",
            "text-gray-400 dark:text-gray-500",
            "hover:bg-gray-50 dark:hover:bg-gray-800",
            "cursor-not-allowed"
          )}
          {...props}
        >
          <Lock className="h-4 w-4 mr-2" />
          {children}
        </Button>
        
        {/* Stan Store-inspired tooltip */}
        <div className={cn(
          "absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2",
          "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900",
          "px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          "pointer-events-none z-10",
          "shadow-lg border border-gray-200 dark:border-gray-700"
        )}>
          {lockedMessage || "Feature locked"}
          {progress !== undefined && (
            <div className="mt-2">
              <Progress value={progress} className="h-1 w-32 bg-gray-700" />
              <div className="text-xs mt-1 text-gray-300 dark:text-gray-600">
                {Math.round(progress)}% complete
              </div>
            </div>
          )}
          {/* Arrow pointing down */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group transition-all duration-200",
        "hover:shadow-lg hover:scale-105",
        className
      )}
      {...props}
    >
      {children}
      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
    </Button>
  );
}
"use client";

import { 
  TrendingUp, 
 
  Minus,
  DollarSign,
  Users,
  Database,
  Target,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardDescription } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";

interface MetricData {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    direction: "up" | "down" | "stable";
    value: number;
    label?: string;
  };
  icon: "dollar" | "users" | "database" | "target" | "trending";
  variant?: "default" | "elevated" | "primary";
}

interface MetricsGridProps {
  metrics: MetricData[];
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

const iconMap = {
  dollar: DollarSign,
  users: Users,
  database: Database,
  target: Target,
  trending: TrendingUp,
};

const getTrendIcon = (direction: "up" | "down" | "stable") => {
  switch (direction) {
    case "up":
      return <ArrowUp className="h-3 w-3 text-green-400" />;
    case "down":
      return <ArrowDown className="h-3 w-3 text-red-400" />;
    default:
      return <Minus className="h-3 w-3 text-gray-400" />;
  }
};

const getTrendColor = (direction: "up" | "down" | "stable") => {
  switch (direction) {
    case "up":
      return "text-green-400 bg-green-500/10 border-green-500/20";
    case "down":
      return "text-red-400 bg-red-500/10 border-red-500/20";
    default:
      return "text-gray-400 bg-gray-500/10 border-gray-500/20";
  }
};

const getIconColor = (icon: string) => {
  switch (icon) {
    case "dollar":
      return "text-green-400";
    case "users":
      return "text-blue-400";
    case "database":
      return "text-purple-400";
    case "target":
      return "text-orange-400";
    default:
      return "text-green-400";
  }
};

export default function MetricsGrid({ 
  metrics, 
  columns = 4,
  className = ""
}: MetricsGridProps) {
  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
  }[columns];

  return (
    <div className={`grid ${gridClass} gap-6 ${className}`}>
      {metrics.map((metric) => {
        const IconComponent = iconMap[metric.icon] || TrendingUp;
        
        return (
          <GlassCard key={metric.id} variant={metric.variant || "default"} className="hover:scale-105 transition-transform duration-300">
            <GlassCardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconComponent className={`h-5 w-5 ${getIconColor(metric.icon)}`} />
                  <GlassCardDescription className="text-xs font-medium uppercase tracking-wider">
                    {metric.title}
                  </GlassCardDescription>
                </div>
                {metric.trend && (
                  <Badge 
                    variant="outline" 
                    className={`${getTrendColor(metric.trend.direction)} border text-xs`}
                  >
                    {getTrendIcon(metric.trend.direction)}
                    {metric.trend.value > 0 && metric.trend.direction !== "stable" && 
                      (metric.trend.direction === "up" ? "+" : "-")
                    }
                    {Math.abs(metric.trend.value)}%
                  </Badge>
                )}
              </div>
            </GlassCardHeader>
            
            <GlassCardContent className="pt-0">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-white tabular-nums">
                  {typeof metric.value === "number" 
                    ? metric.value.toLocaleString() 
                    : metric.value
                  }
                </div>
                
                {metric.subtitle && (
                  <div className="text-sm text-gray-400">
                    {metric.subtitle}
                  </div>
                )}
                
                {metric.trend?.label && (
                  <div className="text-xs text-gray-500">
                    {metric.trend.label}
                  </div>
                )}
              </div>
            </GlassCardContent>
          </GlassCard>
        );
      })}
    </div>
  );
}
import * as React from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  label: string
  value: string | number
  icon: IconSvgElement
  iconColor?: string
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatsCard({
  label,
  value,
  icon,
  iconColor = "text-muted-foreground",
  description,
  trend,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 bg-card border border-border rounded-lg",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center size-10 rounded-lg bg-muted/50",
          iconColor
        )}
      >
        <HugeiconsIcon icon={icon} className="size-5" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-2xl font-semibold text-foreground tabular-nums">
            {value}
          </p>
          {trend && (
            <span
              className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}
            >
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

interface StatsCardGroupProps {
  children: React.ReactNode
  className?: string
}

export function StatsCardGroup({ children, className }: StatsCardGroupProps) {
  return (
    <div
      className={cn(
        "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  )
}

interface CompactStatsCardProps {
  label: string
  value: string | number
  icon: IconSvgElement
  iconColor?: string
  className?: string
}

export function CompactStatsCard({
  label,
  value,
  icon,
  iconColor = "text-muted-foreground",
  className,
}: CompactStatsCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-lg",
        className
      )}
    >
      <div className={cn("flex items-center justify-center", iconColor)}>
        <HugeiconsIcon icon={icon} className="size-4" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-sm font-semibold text-foreground tabular-nums">{value}</p>
    </div>
  )
}

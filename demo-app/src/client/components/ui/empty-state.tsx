import * as React from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface EmptyStateProps {
  icon?: IconSvgElement
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
    >
      {icon && (
        <div className="flex items-center justify-center size-14 rounded-full bg-muted/50 mb-4">
          <HugeiconsIcon
            icon={icon}
            className="size-7 text-muted-foreground"
            strokeWidth={1.5}
          />
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-4" size="sm">
          {action.label}
        </Button>
      )}
    </div>
  )
}

interface EmptyStateCompactProps {
  icon?: IconSvgElement
  message: string
  className?: string
}

export function EmptyStateCompact({
  icon,
  message,
  className,
}: EmptyStateCompactProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 py-8 text-muted-foreground",
        className
      )}
    >
      {icon && (
        <HugeiconsIcon icon={icon} className="size-4" strokeWidth={2} />
      )}
      <span className="text-sm">{message}</span>
    </div>
  )
}

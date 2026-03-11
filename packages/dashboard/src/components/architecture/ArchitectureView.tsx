import { useRef, useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  DatabaseIcon,
  HardDriveIcon,
  FolderIcon,
  StackIcon,
  QueueIcon,
  KeyIcon,
  type Icon,
} from "@phosphor-icons/react"
import { cn } from "@cloudflare/kumo"
import type { BindingsResponse } from "@/lib/api"

export interface BindingGroup {
  key: string
  label: string
  icon: Icon
  color: string
  path: string
  items: { name: string; detail?: string }[]
}

export function getBindingGroups(bindings: BindingsResponse["bindings"]): BindingGroup[] {
  const groups: BindingGroup[] = []

  if (bindings.d1?.length) {
    groups.push({
      key: "d1",
      label: "D1 Databases",
      icon: DatabaseIcon,
      color: "#f6821f",
      path: "/d1",
      items: bindings.d1.map((d) => ({ name: d.binding, detail: d.database_name })),
    })
  }
  if (bindings.kv?.length) {
    groups.push({
      key: "kv",
      label: "KV Namespaces",
      icon: HardDriveIcon,
      color: "#2b7de9",
      path: "/kv",
      items: bindings.kv.map((k) => ({ name: k.binding })),
    })
  }
  if (bindings.r2?.length) {
    groups.push({
      key: "r2",
      label: "R2 Buckets",
      icon: FolderIcon,
      color: "#16a34a",
      path: "/r2",
      items: bindings.r2.map((r) => ({ name: r.binding, detail: r.bucket_name })),
    })
  }
  if (bindings.durableObjects?.length) {
    groups.push({
      key: "do",
      label: "Durable Objects",
      icon: StackIcon,
      color: "#9333ea",
      path: "/do",
      items: bindings.durableObjects.map((d) => ({ name: d.binding, detail: d.class_name })),
    })
  }
  if (bindings.queues?.producers?.length) {
    groups.push({
      key: "queues",
      label: "Queues",
      icon: QueueIcon,
      color: "#dc2626",
      path: "/queues",
      items: bindings.queues.producers.map((q) => ({ name: q.binding, detail: q.queue })),
    })
  }
  if (bindings.vars?.length) {
    groups.push({
      key: "vars",
      label: "Env Variables",
      icon: KeyIcon,
      color: "#737373",
      path: "/",
      items: bindings.vars.map((v) => ({
        name: v.key,
        detail: v.isSecret ? "secret" : undefined,
      })),
    })
  }

  return groups
}

interface Line {
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
}

export function ArchitectureDiagram({
  workerName,
  groups,
}: {
  workerName: string
  groups: BindingGroup[]
}) {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const workerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [lines, setLines] = useState<Line[]>([])

  const computeLines = useCallback(() => {
    const container = containerRef.current
    const worker = workerRef.current
    if (!container || !worker) return

    const containerRect = container.getBoundingClientRect()
    const workerRect = worker.getBoundingClientRect()
    const workerCenterX = workerRect.left + workerRect.width / 2 - containerRect.left
    const workerCenterY = workerRect.top + workerRect.height / 2 - containerRect.top

    const newLines: Line[] = []
    cardRefs.current.forEach((el, key) => {
      const group = groups.find((g) => g.key === key)
      if (!group) return
      const rect = el.getBoundingClientRect()
      // Connect to the left edge center of the card
      const cardX = rect.left - containerRect.left
      const cardY = rect.top + rect.height / 2 - containerRect.top

      newLines.push({
        x1: workerCenterX,
        y1: workerCenterY,
        x2: cardX,
        y2: cardY,
        color: group.color,
      })
    })
    setLines(newLines)
  }, [groups])

  useEffect(() => {
    computeLines()
    window.addEventListener("resize", computeLines)
    return () => window.removeEventListener("resize", computeLines)
  }, [computeLines])

  // Recompute after cards render
  useEffect(() => {
    const timer = setTimeout(computeLines, 50)
    return () => clearTimeout(timer)
  }, [groups, computeLines])

  if (groups.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-kumo-subtle text-sm">
        No bindings configured
      </div>
    )
  }

  // Split groups into left and right columns
  const half = Math.ceil(groups.length / 2)
  const leftGroups = groups.slice(0, half)
  const rightGroups = groups.slice(half)

  return (
    <div ref={containerRef} className="relative w-full">
      {/* SVG connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        <defs>
          <style>{`
            @keyframes arch-dash-flow {
              to { stroke-dashoffset: -20; }
            }
          `}</style>
        </defs>
        {lines.map((line, i) => {
          // Horizontal bezier curve
          const midX = (line.x1 + line.x2) / 2
          return (
            <g key={i}>
              <path
                d={`M ${line.x1} ${line.y1} C ${midX} ${line.y1}, ${midX} ${line.y2}, ${line.x2} ${line.y2}`}
                fill="none"
                stroke={line.color}
                strokeWidth="2"
                strokeOpacity="0.15"
              />
              <path
                d={`M ${line.x1} ${line.y1} C ${midX} ${line.y1}, ${midX} ${line.y2}, ${line.x2} ${line.y2}`}
                fill="none"
                stroke={line.color}
                strokeWidth="2"
                strokeOpacity="0.4"
                strokeDasharray="6 14"
                style={{ animation: "arch-dash-flow 1.5s linear infinite" }}
              />
              <circle cx={line.x2} cy={line.y2} r="4" fill={line.color} opacity="0.5" />
            </g>
          )
        })}
      </svg>

      {/* 3-column layout: left bindings | worker | right bindings */}
      <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-x-12 min-h-80" style={{ zIndex: 1 }}>
        {/* Left column */}
        <div className="flex flex-col gap-4 items-end">
          {leftGroups.map((group) => (
            <BindingCard
              key={group.key}
              group={group}
              ref={(el) => {
                if (el) cardRefs.current.set(group.key, el)
                else cardRefs.current.delete(group.key)
              }}
              onClick={() => group.path !== "/" && navigate(group.path)}
            />
          ))}
        </div>

        {/* Center: Worker node */}
        <div
          ref={workerRef}
          className="flex flex-col items-center justify-center rounded-2xl bg-[#f6821f] px-8 py-5 shadow-lg shadow-orange-500/10"
        >
          <span className="text-white font-semibold text-sm">Worker</span>
          <span className="text-white/75 text-xs mt-0.5">{workerName}</span>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4 items-start">
          {rightGroups.map((group) => (
            <BindingCard
              key={group.key}
              group={group}
              ref={(el) => {
                if (el) cardRefs.current.set(group.key, el)
                else cardRefs.current.delete(group.key)
              }}
              onClick={() => group.path !== "/" && navigate(group.path)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

import { forwardRef } from "react"

const BindingCard = forwardRef<
  HTMLDivElement,
  { group: BindingGroup; onClick: () => void }
>(({ group, onClick }, ref) => {
  const IconComponent = group.icon
  const isClickable = group.path !== "/"
  const visibleItems = group.items.slice(0, 4)
  const overflow = group.items.length - 4

  return (
    <div
      ref={ref}
      onClick={isClickable ? onClick : undefined}
      className={cn(
        "w-56 rounded-lg border border-kumo-line bg-kumo-base overflow-hidden transition-shadow",
        isClickable && "cursor-pointer hover:shadow-md hover:border-kumo-line-strong"
      )}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 border-b border-kumo-line"
        style={{ background: `linear-gradient(90deg, ${group.color}15, ${group.color}05)` }}
      >
        <IconComponent size={16} color={group.color} weight="duotone" />
        <span className="text-xs font-medium text-kumo-default flex-1">{group.label}</span>
        <span className="text-[10px] text-kumo-subtle tabular-nums">{group.items.length}</span>
      </div>

      {/* Items */}
      <div className="px-3 py-2 space-y-1">
        {visibleItems.map((item) => (
          <div key={item.name} className="flex items-center gap-2 min-w-0">
            <span
              className="size-1.5 rounded-full shrink-0"
              style={{ backgroundColor: group.color, opacity: 0.5 }}
            />
            <span className="text-[11px] font-mono text-kumo-default truncate">
              {item.name}
            </span>
            {item.detail && (
              <span className="text-[10px] text-kumo-subtle truncate ml-auto shrink-0 max-w-20">
                {item.detail}
              </span>
            )}
          </div>
        ))}
        {overflow > 0 && (
          <span className="text-[10px] text-kumo-subtle pl-3.5">+{overflow} more</span>
        )}
      </div>
    </div>
  )
})

BindingCard.displayName = "BindingCard"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowRightIcon,
  ChartBarIcon,
} from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { Text, cn } from "@cloudflare/kumo"
import { bindingsApi } from "@/lib/api"
import { DataTableLoading } from "@/components/ui/data-table"
import { LandingPage } from "@/components/landing/LandingPage"
import { ArchitectureDiagram, getBindingGroups } from "@/components/architecture/ArchitectureView"

export function Home() {
  const queryClient = useQueryClient()
  const { data: bindings, isLoading, error } = useQuery({
    queryKey: ["bindings"],
    queryFn: bindingsApi.getAll,
  })

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ["bindings"] })
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <DataTableLoading />
      </div>
    )
  }

  if (error) {
    return <LandingPage onRetry={handleRetry} />
  }

  const totalD1 = bindings?.bindings.d1?.length ?? 0
  const totalKV = bindings?.bindings.kv?.length ?? 0
  const totalR2 = bindings?.bindings.r2?.length ?? 0
  const totalDO = bindings?.bindings.durableObjects?.length ?? 0
  const totalQueues = bindings?.bindings.queues?.producers?.length ?? 0
  const totalBindings = totalD1 + totalKV + totalR2 + totalDO + totalQueues

  const groups = bindings ? getBindingGroups(bindings.bindings) : []

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <Text variant="heading1" as="h1">Overview</Text>
          <p className="text-sm text-kumo-strong mt-1">
            Local dashboard for {bindings?.name ?? "your Worker"}
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-px rounded-lg border border-kumo-line bg-kumo-line overflow-hidden mb-6">
          <StatCell label="D1 Databases" value={totalD1} />
          <StatCell label="KV Namespaces" value={totalKV} />
          <StatCell label="R2 Buckets" value={totalR2} />
          <StatCell label="Durable Objects" value={totalDO} />
          <StatCell label="Total Bindings" value={totalBindings} />
        </div>

        {/* Architecture Diagram */}
        {groups.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-medium text-kumo-default mb-3">Architecture</h2>
            <div className="rounded-lg border border-kumo-line bg-kumo-base overflow-hidden px-6 py-8">
              <ArchitectureDiagram
                workerName={bindings?.name ?? "Worker"}
                groups={groups}
              />
            </div>
            <p className="text-[11px] text-kumo-subtle mt-2">
              Click on a binding group to explore it
            </p>
          </section>
        )}

        {/* Quick Links */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-kumo-default mb-3">Quick Links</h2>
          <div className="rounded-lg border border-kumo-line overflow-hidden">
            <Link
              to="/analytics"
              className="group flex items-center gap-4 px-4 py-3 bg-kumo-base hover:bg-kumo-tint/40 transition-colors"
            >
              <ChartBarIcon size={18} className="text-kumo-strong shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-kumo-default">Analytics Explorer</span>
                <span className="ml-2 text-xs text-kumo-subtle">
                  Query and visualize Analytics Engine data
                </span>
              </div>
              <ArrowRightIcon
                size={14}
                className="text-kumo-subtle group-hover:text-kumo-default transition-colors shrink-0"
              />
            </Link>
          </div>
        </section>

        {/* Environment Variables */}
        {bindings?.bindings.vars && bindings.bindings.vars.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-kumo-default mb-3">
              Environment Variables
              <span className="ml-2 text-xs font-normal text-kumo-subtle">
                {bindings.bindings.vars.length}
              </span>
            </h2>
            <div className="rounded-lg border border-kumo-line overflow-hidden">
              {bindings.bindings.vars.map((v, i) => (
                <div
                  key={v.key}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 bg-kumo-base text-xs font-mono",
                    i > 0 && "border-t border-kumo-line"
                  )}
                >
                  <span className="text-kumo-default font-medium min-w-28">{v.key}</span>
                  <span className="text-kumo-subtle">=</span>
                  <span className={cn(
                    "truncate",
                    v.isSecret ? "text-kumo-inactive italic" : "text-kumo-default"
                  )}>
                    {v.isSecret ? "••••••••" : `"${v.value}"`}
                  </span>
                  {v.isSecret && (
                    <span className="ml-auto text-[10px] text-kumo-subtle border border-kumo-line rounded px-1.5 py-0.5 shrink-0">
                      secret
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-kumo-base px-4 py-4">
      <p className="text-xs text-kumo-strong">{label}</p>
      <p className="text-2xl font-semibold text-kumo-default mt-1 tabular-nums">{value}</p>
    </div>
  )
}

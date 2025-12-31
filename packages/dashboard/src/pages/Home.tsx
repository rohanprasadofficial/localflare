import { useQuery, useQueryClient } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Database02Icon,
  HardDriveIcon,
  Folder01Icon,
  Layers01Icon,
  TaskDone01Icon,
  Settings02Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import { Link } from "react-router-dom"
import { bindingsApi } from "@/lib/api"
import { PageHeader } from "@/components/ui/page-header"
import { StatsCard, StatsCardGroup } from "@/components/ui/stats-card"
import { DataTableLoading } from "@/components/ui/data-table"
import { LandingPage } from "@/components/landing/LandingPage"
import { cn } from "@/lib/utils"

const services = [
  {
    key: "d1",
    title: "D1 Databases",
    description: "SQLite databases at the edge",
    icon: Database02Icon,
    colorClass: "text-d1",
    bgClass: "bg-d1/10",
    path: "/d1",
    getCount: (bindings: { d1: unknown[] }) => bindings.d1?.length ?? 0,
    getItems: (bindings: { d1: { binding: string }[] }) => bindings.d1?.map(d => d.binding) ?? [],
  },
  {
    key: "kv",
    title: "KV Namespaces",
    description: "Key-value storage",
    icon: HardDriveIcon,
    colorClass: "text-kv",
    bgClass: "bg-kv/10",
    path: "/kv",
    getCount: (bindings: { kv: unknown[] }) => bindings.kv?.length ?? 0,
    getItems: (bindings: { kv: { binding: string }[] }) => bindings.kv?.map(k => k.binding) ?? [],
  },
  {
    key: "r2",
    title: "R2 Buckets",
    description: "Object storage",
    icon: Folder01Icon,
    colorClass: "text-r2",
    bgClass: "bg-r2/10",
    path: "/r2",
    getCount: (bindings: { r2: unknown[] }) => bindings.r2?.length ?? 0,
    getItems: (bindings: { r2: { binding: string }[] }) => bindings.r2?.map(r => r.binding) ?? [],
  },
  {
    key: "do",
    title: "Durable Objects",
    description: "Stateful serverless",
    icon: Layers01Icon,
    colorClass: "text-do",
    bgClass: "bg-do/10",
    path: "/do",
    getCount: (bindings: { durableObjects: unknown[] }) => bindings.durableObjects?.length ?? 0,
    getItems: (bindings: { durableObjects: { binding: string }[] }) => bindings.durableObjects?.map(d => d.binding) ?? [],
  },
  {
    key: "queues",
    title: "Queues",
    description: "Message queues",
    icon: TaskDone01Icon,
    colorClass: "text-queues",
    bgClass: "bg-queues/10",
    path: "/queues",
    getCount: (bindings: { queues: { producers: unknown[] } }) => bindings.queues?.producers?.length ?? 0,
    getItems: (bindings: { queues: { producers: { binding: string }[] } }) => bindings.queues?.producers?.map(q => q.binding) ?? [],
  },
]

export function Home() {
  const queryClient = useQueryClient()
  const { data: bindings, isLoading, error } = useQuery({
    queryKey: ["bindings"],
    queryFn: bindingsApi.getAll,
    retry: false,
  })

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ["bindings"] })
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <DataTableLoading />
      </div>
    )
  }

  if (error) {
    return <LandingPage onRetry={handleRetry} />
  }

  // Calculate totals
  const totalD1 = bindings?.bindings.d1?.length ?? 0
  const totalKV = bindings?.bindings.kv?.length ?? 0
  const totalR2 = bindings?.bindings.r2?.length ?? 0
  const totalDO = bindings?.bindings.durableObjects?.length ?? 0
  const totalQueues = bindings?.bindings.queues?.producers?.length ?? 0
  const totalBindings = totalD1 + totalKV + totalR2 + totalDO + totalQueues

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 border-b border-border">
        <PageHeader
          title="Overview"
          description={`Local dashboard for ${bindings?.name ?? "your Worker"}`}
        />

        {/* Stats */}
        <StatsCardGroup className="mt-6">
          <StatsCard
            icon={Database02Icon}
            iconColor="text-d1"
            label="D1 Databases"
            value={totalD1}
          />
          <StatsCard
            icon={HardDriveIcon}
            iconColor="text-kv"
            label="KV Namespaces"
            value={totalKV}
          />
          <StatsCard
            icon={Folder01Icon}
            iconColor="text-r2"
            label="R2 Buckets"
            value={totalR2}
          />
          <StatsCard
            icon={Settings02Icon}
            iconColor="text-muted-foreground"
            label="Total Bindings"
            value={totalBindings}
          />
        </StatsCardGroup>
      </div>

      <div className="p-6">
        <h2 className="text-base font-semibold mb-4">Services</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const count = service.getCount(bindings?.bindings as any)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const items = service.getItems(bindings?.bindings as any)

            if (count === 0) return null

            return (
              <Link key={service.key} to={service.path}>
                <div className="group border border-border rounded-lg bg-card hover:border-primary/50 hover:shadow-sm transition-all">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", service.bgClass)}>
                          <HugeiconsIcon
                            icon={service.icon}
                            className={cn("size-5", service.colorClass)}
                            strokeWidth={2}
                          />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">{service.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {count} {count === 1 ? "binding" : "bindings"}
                          </p>
                        </div>
                      </div>
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        className="size-4 text-muted-foreground group-hover:text-foreground transition-colors"
                        strokeWidth={2}
                      />
                    </div>
                    {items.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex flex-wrap gap-1.5">
                          {items.slice(0, 3).map((item) => (
                            <span
                              key={item}
                              className="text-xs font-mono px-2 py-0.5 bg-muted rounded"
                            >
                              {item}
                            </span>
                          ))}
                          {items.length > 3 && (
                            <span className="text-xs text-muted-foreground px-2 py-0.5">
                              +{items.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}

          {/* Environment Variables - not clickable */}
          {bindings?.bindings.vars && bindings.bindings.vars.length > 0 && (
            <div className="border border-border rounded-lg bg-card">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <HugeiconsIcon
                        icon={Settings02Icon}
                        className="size-5 text-muted-foreground"
                        strokeWidth={2}
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">Environment Variables</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {bindings.bindings.vars.length} variable(s)
                      </p>
                    </div>
                  </div>
                </div>
                {bindings.bindings.vars.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex flex-wrap gap-1.5">
                      {bindings.bindings.vars.slice(0, 3).map((v) => (
                        <span
                          key={v.key}
                          className="text-xs font-mono px-2 py-0.5 bg-muted rounded"
                        >
                          {v.key}
                        </span>
                      ))}
                      {bindings.bindings.vars.length > 3 && (
                        <span className="text-xs text-muted-foreground px-2 py-0.5">
                          +{bindings.bindings.vars.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

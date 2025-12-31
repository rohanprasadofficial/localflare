import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
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
import { PageHeader } from "@/components/ui/page-header"
import { StatsCard, StatsCardGroup } from "@/components/ui/stats-card"
import { DataTableLoading } from "@/components/ui/data-table"
import { cn } from "@/lib/utils"
import { d1Api, kvApi, r2Api } from "@/lib/api"

const services = [
  {
    key: "d1",
    title: "D1 Database",
    description: "SQLite database with users and posts",
    icon: Database02Icon,
    colorClass: "text-d1",
    bgClass: "bg-d1/10",
    path: "/d1",
  },
  {
    key: "kv",
    title: "KV Store",
    description: "Key-value storage for caching",
    icon: HardDriveIcon,
    colorClass: "text-kv",
    bgClass: "bg-kv/10",
    path: "/kv",
  },
  {
    key: "r2",
    title: "R2 Storage",
    description: "Object storage for files",
    icon: Folder01Icon,
    colorClass: "text-r2",
    bgClass: "bg-r2/10",
    path: "/r2",
  },
  {
    key: "do",
    title: "Durable Objects",
    description: "Stateful counter demo",
    icon: Layers01Icon,
    colorClass: "text-do",
    bgClass: "bg-do/10",
    path: "/do",
  },
  {
    key: "queues",
    title: "Queues",
    description: "Message queue for async tasks",
    icon: TaskDone01Icon,
    colorClass: "text-queues",
    bgClass: "bg-queues/10",
    path: "/queues",
  },
]

export default function Home() {
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: d1Api.getUsers,
  })

  const { data: kvKeys, isLoading: kvLoading } = useQuery({
    queryKey: ["kv-keys"],
    queryFn: () => kvApi.listKeys(),
  })

  const { data: files, isLoading: filesLoading } = useQuery({
    queryKey: ["files"],
    queryFn: () => r2Api.listFiles(),
  })

  const isLoading = usersLoading || kvLoading || filesLoading

  if (isLoading) {
    return (
      <div className="p-6">
        <DataTableLoading />
      </div>
    )
  }

  const totalD1 = users?.length ?? 0
  const totalKV = kvKeys?.keys?.length ?? 0
  const totalR2 = files?.objects?.length ?? 0
  const totalBindings = totalD1 + totalKV + totalR2 + 2 // +2 for DO and Queues

  const getServiceInfo = (key: string) => {
    switch (key) {
      case "d1":
        return { count: totalD1, items: ["users", "posts"] }
      case "kv":
        return { count: totalKV, items: kvKeys?.keys?.slice(0, 3).map(k => k.name) ?? [] }
      case "r2":
        return { count: totalR2, items: files?.objects?.slice(0, 3).map(f => f.key) ?? [] }
      case "do":
        return { count: 1, items: ["Counter DO"] }
      case "queues":
        return { count: 1, items: ["task-queue"] }
      default:
        return { count: 0, items: [] }
    }
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 border-b border-border">
        <PageHeader
          title="Overview"
          description="Localflare Playground - Test and explore Cloudflare Workers bindings locally"
        />

        {/* Stats */}
        <StatsCardGroup className="mt-6">
          <StatsCard
            icon={Database02Icon}
            iconColor="text-d1"
            label="D1 Records"
            value={totalD1}
          />
          <StatsCard
            icon={HardDriveIcon}
            iconColor="text-kv"
            label="KV Keys"
            value={totalKV}
          />
          <StatsCard
            icon={Folder01Icon}
            iconColor="text-r2"
            label="R2 Objects"
            value={totalR2}
          />
          <StatsCard
            icon={Settings02Icon}
            iconColor="text-muted-foreground"
            label="Total Items"
            value={totalBindings}
          />
        </StatsCardGroup>
      </div>

      <div className="p-6">
        <h2 className="text-base font-semibold mb-4">Services</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const info = getServiceInfo(service.key)

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
                            {info.count} {info.count === 1 ? "item" : "items"}
                          </p>
                        </div>
                      </div>
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        className="size-4 text-muted-foreground group-hover:text-foreground transition-colors"
                        strokeWidth={2}
                      />
                    </div>
                    {info.items.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex flex-wrap gap-1.5">
                          {info.items.slice(0, 3).map((item) => (
                            <span
                              key={item}
                              className="text-xs font-mono px-2 py-0.5 bg-muted rounded"
                            >
                              {item}
                            </span>
                          ))}
                          {info.items.length > 3 && (
                            <span className="text-xs text-muted-foreground px-2 py-0.5">
                              +{info.items.length - 3} more
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
        </div>

        {/* Quick Start Guide */}
        <div className="mt-8 border border-border rounded-lg bg-card overflow-hidden">
          <div className="px-4 py-3 bg-muted/50 border-b border-border">
            <h3 className="text-sm font-semibold">Quick Start</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              This playground demonstrates all Localflare-supported Cloudflare bindings
            </p>
          </div>
          <div className="p-4 space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">D1 Database:</strong> Pre-populated with users and posts tables. Try adding or deleting records.
            </p>
            <p>
              <strong className="text-foreground">KV Store:</strong> Create, read, update, and delete key-value pairs with optional TTL.
            </p>
            <p>
              <strong className="text-foreground">R2 Storage:</strong> Upload, download, and manage files in object storage.
            </p>
            <p>
              <strong className="text-foreground">Durable Objects:</strong> Test the counter DO with increment, decrement, and reset operations.
            </p>
            <p>
              <strong className="text-foreground">Queues:</strong> Send messages to the task queue and see them processed.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

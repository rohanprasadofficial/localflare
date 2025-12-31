import { useState } from "react"
import { NavLink } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  Database02Icon,
  HardDriveIcon,
  Folder01Icon,
  Layers01Icon,
  TaskDone01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Home01Icon,
} from "@hugeicons/core-free-icons"
import { d1Api, kvApi, r2Api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

interface NavItem {
  icon: IconSvgElement
  label: string
  path: string
  colorClass: string
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: "Storage",
    items: [
      {
        icon: Database02Icon,
        label: "D1 Database",
        path: "/d1",
        colorClass: "text-d1",
      },
      {
        icon: HardDriveIcon,
        label: "KV Store",
        path: "/kv",
        colorClass: "text-kv",
      },
      {
        icon: Folder01Icon,
        label: "R2 Storage",
        path: "/r2",
        colorClass: "text-r2",
      },
    ],
  },
  {
    title: "Compute",
    items: [
      {
        icon: Layers01Icon,
        label: "Durable Objects",
        path: "/do",
        colorClass: "text-do",
      },
      {
        icon: TaskDone01Icon,
        label: "Queues",
        path: "/queues",
        colorClass: "text-queues",
      },
    ],
  },
]

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: d1Api.getUsers,
  })

  const { data: kvKeys } = useQuery({
    queryKey: ["kv-keys"],
    queryFn: () => kvApi.listKeys(),
  })

  const { data: files } = useQuery({
    queryKey: ["files"],
    queryFn: () => r2Api.listFiles(),
  })

  const getBindingCount = (path: string): number => {
    switch (path) {
      case "/d1":
        return users?.length ?? 0
      case "/kv":
        return kvKeys?.keys?.length ?? 0
      case "/r2":
        return files?.objects?.length ?? 0
      case "/do":
        return 1
      case "/queues":
        return 1
      default:
        return 0
    }
  }

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200",
        isCollapsed ? "w-16" : "w-60"
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3">
        {!isCollapsed && (
          <NavLink to="/" className="flex items-center gap-2.5 min-w-0">
            <svg
              className="size-8 shrink-0"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="100" height="100" rx="20" className="fill-primary" />
              <path d="M20 75 L20 45 L32 45 L32 75 Z" fill="white" />
              <path d="M38 75 L38 30 L50 30 L50 75 Z" fill="white" />
              <path d="M56 75 L56 55 L68 55 L68 75 Z" fill="white" />
              <path d="M74 75 L74 20 L86 20 L86 75 Z" fill="white" />
            </svg>
            <div className="min-w-0">
              <span className="text-sm font-semibold text-sidebar-foreground">
                Localflare
              </span>
              <p className="text-xs text-muted-foreground truncate">
                Playground
              </p>
            </div>
          </NavLink>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
        >
          <HugeiconsIcon
            icon={isCollapsed ? ArrowRight01Icon : ArrowLeft01Icon}
            size={16}
            strokeWidth={2}
          />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="p-2">
          {/* Home link */}
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors mb-2",
                isCollapsed && "justify-center px-2",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )
            }
          >
            <HugeiconsIcon icon={Home01Icon} className="size-4 shrink-0" strokeWidth={2} />
            {!isCollapsed && <span>Overview</span>}
          </NavLink>

          {/* Nav groups */}
          {navGroups.map((group) => (
            <div key={group.title} className="mt-4">
              {!isCollapsed && (
                <div className="px-2.5 mb-2">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.title}
                  </span>
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const count = getBindingCount(item.path)
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors",
                          isCollapsed && "justify-center px-2",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <HugeiconsIcon
                            icon={item.icon}
                            className={cn(
                              "size-4 shrink-0",
                              isActive ? item.colorClass : ""
                            )}
                            strokeWidth={2}
                          />
                          {!isCollapsed && (
                            <>
                              <span className="flex-1 truncate">{item.label}</span>
                              {count > 0 && (
                                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-md tabular-nums">
                                  {count}
                                </span>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-2 border-t border-sidebar-border">
        {!isCollapsed && (
          <p className="px-2.5 text-[10px] text-muted-foreground">
            Localflare Playground v0.1.2
          </p>
        )}
      </div>
    </aside>
  )
}

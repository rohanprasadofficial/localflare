import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  HardDriveIcon,
  Delete02Icon,
  Add01Icon,
  Key01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PageHeader } from "@/components/ui/page-header"
import { StatsCard, StatsCardGroup } from "@/components/ui/stats-card"
import { SearchInput } from "@/components/ui/search-input"
import { DataTableLoading } from "@/components/ui/data-table"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"
import { kvApi, type KVKey } from "@/lib/api"

export default function KVExplorer() {
  const queryClient = useQueryClient()
  const [prefix, setPrefix] = useState("")
  const [newKey, setNewKey] = useState({ key: "", value: "", ttl: "" })
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const { data: keys, isLoading } = useQuery({
    queryKey: ["kv-keys", prefix],
    queryFn: () => kvApi.listKeys(prefix || undefined),
  })

  const { data: selectedValue } = useQuery({
    queryKey: ["kv-value", selectedKey],
    queryFn: () => kvApi.getValue(selectedKey!),
    enabled: !!selectedKey,
  })

  const setValueMutation = useMutation({
    mutationFn: () =>
      kvApi.setValue(
        newKey.key,
        newKey.value,
        newKey.ttl ? parseInt(newKey.ttl) : undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kv-keys"] })
      setNewKey({ key: "", value: "", ttl: "" })
      setShowAddForm(false)
    },
  })

  const deleteKeyMutation = useMutation({
    mutationFn: kvApi.deleteKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kv-keys"] })
      if (selectedKey) {
        setSelectedKey(null)
      }
    },
  })

  const handleSetValue = (e: React.FormEvent) => {
    e.preventDefault()
    if (newKey.key && newKey.value) {
      setValueMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <DataTableLoading />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <PageHeader
          icon={HardDriveIcon}
          iconColor="text-kv"
          title="KV Store"
          description="Key-value storage for caching and configuration"
          actions={
            <Button size="sm" onClick={() => setShowAddForm(true)}>
              <HugeiconsIcon icon={Add01Icon} className="size-4 mr-1.5" strokeWidth={2} />
              Add Key
            </Button>
          }
        />

        {/* Stats */}
        <StatsCardGroup className="mt-6">
          <StatsCard
            icon={Key01Icon}
            iconColor="text-kv"
            label="Keys"
            value={keys?.keys?.length ?? 0}
          />
        </StatsCardGroup>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Key List */}
        <div className="w-64 border-r border-border flex flex-col bg-muted/30">
          <div className="p-3 border-b border-border">
            <SearchInput
              value={prefix}
              onChange={setPrefix}
              placeholder="Filter by prefix..."
            />
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {keys?.keys?.length === 0 ? (
                <p className="text-sm text-muted-foreground px-2 py-4 text-center">
                  No keys found
                </p>
              ) : (
                keys?.keys?.map((key: KVKey) => (
                  <button
                    key={key.name}
                    onClick={() => setSelectedKey(key.name)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between gap-2 transition-colors",
                      selectedKey === key.name
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <HugeiconsIcon
                        icon={Key01Icon}
                        className={cn("size-4 shrink-0", selectedKey === key.name && "text-kv")}
                        strokeWidth={2}
                      />
                      <span className="truncate font-mono text-xs">{key.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteKeyMutation.mutate(key.name)
                      }}
                      disabled={deleteKeyMutation.isPending}
                    >
                      <HugeiconsIcon
                        icon={Delete02Icon}
                        className="size-3 text-destructive"
                        strokeWidth={2}
                      />
                    </Button>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {showAddForm ? (
            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-lg space-y-4 p-4 border border-border rounded-lg bg-card">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={2} />
                  Add New Key
                </h3>
                <form onSubmit={handleSetValue} className="space-y-4">
                  <div>
                    <Label htmlFor="key">Key</Label>
                    <Input
                      id="key"
                      placeholder="my-key"
                      value={newKey.key}
                      onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
                      className="mt-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="value">Value</Label>
                    <textarea
                      id="value"
                      value={newKey.value}
                      onChange={(e) => setNewKey({ ...newKey, value: e.target.value })}
                      placeholder="Enter value..."
                      className="mt-1.5 w-full min-h-32 p-3 rounded-md border border-input bg-background font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ttl">TTL (seconds, optional)</Label>
                    <Input
                      id="ttl"
                      type="number"
                      placeholder="3600"
                      value={newKey.ttl}
                      onChange={(e) => setNewKey({ ...newKey, ttl: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={setValueMutation.isPending}>
                      Save Key
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          ) : selectedKey && selectedValue ? (
            <div className="flex-1 overflow-auto p-6">
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-center justify-between">
                  <h4 className="font-mono text-sm font-medium">{selectedKey}</h4>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteKeyMutation.mutate(selectedKey)}
                    disabled={deleteKeyMutation.isPending}
                  >
                    <HugeiconsIcon icon={Delete02Icon} className="size-4 mr-1.5" strokeWidth={2} />
                    Delete
                  </Button>
                </div>
                <div className="p-4 bg-card">
                  <pre className="p-4 rounded-md bg-muted font-mono text-xs whitespace-pre-wrap break-all max-h-96 overflow-auto">
                    {selectedValue.value}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Key01Icon}
              title="Select a key"
              description="Choose a key from the sidebar to view its value"
            />
          )}
        </div>
      </div>
    </div>
  )
}

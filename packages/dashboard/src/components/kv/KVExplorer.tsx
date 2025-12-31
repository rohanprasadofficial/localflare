import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  HardDriveIcon,
  Key01Icon,
  Add01Icon,
  Delete02Icon,
  Copy01Icon,
} from "@hugeicons/core-free-icons"
import { kvApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PageHeader } from "@/components/ui/page-header"
import { StatsCard, StatsCardGroup } from "@/components/ui/stats-card"
import { SearchInput } from "@/components/ui/search-input"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"

// Try to parse and format JSON
function formatValue(value: unknown): { formatted: string; isJson: boolean } {
  if (typeof value !== "string") {
    return { formatted: JSON.stringify(value, null, 2), isJson: true }
  }

  try {
    const parsed = JSON.parse(value)
    return { formatted: JSON.stringify(parsed, null, 2), isJson: true }
  } catch {
    return { formatted: value, isJson: false }
  }
}

export function KVExplorer() {
  const [selectedNs, setSelectedNs] = useState<string | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [searchPrefix, setSearchPrefix] = useState("")
  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)

  const queryClient = useQueryClient()

  const { data: namespaces, isLoading: loadingNamespaces } = useQuery({
    queryKey: ["kv-namespaces"],
    queryFn: kvApi.list,
  })

  const { data: keys, isLoading: loadingKeys } = useQuery({
    queryKey: ["kv-keys", selectedNs, searchPrefix],
    queryFn: () =>
      selectedNs ? kvApi.getKeys(selectedNs, searchPrefix || undefined) : null,
    enabled: !!selectedNs,
  })

  const { data: keyValue, isLoading: loadingValue } = useQuery({
    queryKey: ["kv-value", selectedNs, selectedKey],
    queryFn: () =>
      selectedNs && selectedKey ? kvApi.getValue(selectedNs, selectedKey) : null,
    enabled: !!selectedNs && !!selectedKey,
  })

  const setValueMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => {
      if (!selectedNs) throw new Error("No namespace selected")
      return kvApi.setValue(selectedNs, key, value)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kv-keys", selectedNs] })
      setNewKey("")
      setNewValue("")
      setShowAddForm(false)
    },
  })

  const deleteKeyMutation = useMutation({
    mutationFn: (key: string) => {
      if (!selectedNs) throw new Error("No namespace selected")
      return kvApi.deleteKey(selectedNs, key)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kv-keys", selectedNs] })
      setSelectedKey(null)
    },
  })

  const formattedValue = useMemo(() => {
    if (!keyValue?.value) return null
    return formatValue(keyValue.value)
  }, [keyValue?.value])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (loadingNamespaces) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading namespaces...</div>
      </div>
    )
  }

  if (!namespaces?.namespaces.length) {
    return (
      <div className="p-6">
        <PageHeader
          icon={HardDriveIcon}
          iconColor="text-kv"
          title="KV Namespaces"
          description="Manage your Workers KV key-value storage"
        />
        <EmptyState
          icon={HardDriveIcon}
          title="No KV namespaces configured"
          description="Add a KV namespace binding to your wrangler.toml to get started"
          className="mt-8"
        />
      </div>
    )
  }

  const keyCount = keys?.keys?.length ?? 0

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <PageHeader
          icon={HardDriveIcon}
          iconColor="text-kv"
          title="KV Namespaces"
          description="Manage your Workers KV key-value storage"
          actions={
            selectedNs && (
              <Button size="sm" onClick={() => setShowAddForm(true)}>
                <HugeiconsIcon icon={Add01Icon} className="size-4 mr-1.5" strokeWidth={2} />
                Add Key
              </Button>
            )
          }
        />

        {/* Stats */}
        <StatsCardGroup className="mt-6">
          <StatsCard
            icon={HardDriveIcon}
            iconColor="text-kv"
            label="Namespaces"
            value={namespaces.namespaces.length}
          />
          <StatsCard
            icon={Key01Icon}
            iconColor="text-muted-foreground"
            label="Keys"
            value={keyCount}
            description={selectedNs ? `in ${selectedNs}` : "Select a namespace"}
          />
        </StatsCardGroup>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Namespace List */}
        <div className="w-56 border-r border-border flex flex-col bg-muted/30">
          <div className="p-3 border-b border-border">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Namespaces
            </span>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {namespaces.namespaces.map((ns) => (
                <button
                  key={ns.binding}
                  onClick={() => {
                    setSelectedNs(ns.binding)
                    setSelectedKey(null)
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors",
                    selectedNs === ns.binding
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <HugeiconsIcon
                    icon={HardDriveIcon}
                    className={cn("size-4", selectedNs === ns.binding && "text-kv")}
                    strokeWidth={2}
                  />
                  {ns.binding}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Keys List */}
        <div className="w-72 border-r border-border flex flex-col bg-muted/10">
          {selectedNs ? (
            <>
              <div className="p-3 border-b border-border">
                <SearchInput
                  value={searchPrefix}
                  onChange={setSearchPrefix}
                  placeholder="Filter by prefix..."
                  className="h-8"
                />
              </div>
              <ScrollArea className="flex-1">
                {loadingKeys ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">Loading keys...</div>
                ) : keys?.keys?.length ? (
                  <div className="p-2 space-y-0.5">
                    {keys.keys.map((key) => (
                      <button
                        key={key.name}
                        onClick={() => setSelectedKey(key.name)}
                        className={cn(
                          "w-full text-left px-3 py-2.5 rounded-md transition-colors group",
                          selectedKey === key.name
                            ? "bg-sidebar-accent"
                            : "hover:bg-muted"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <HugeiconsIcon
                            icon={Key01Icon}
                            className={cn(
                              "size-3.5 flex-shrink-0",
                              selectedKey === key.name ? "text-kv" : "text-muted-foreground"
                            )}
                            strokeWidth={2}
                          />
                          <span
                            className={cn(
                              "font-mono text-xs truncate",
                              selectedKey === key.name ? "font-medium" : "text-muted-foreground"
                            )}
                          >
                            {key.name}
                          </span>
                        </div>
                        {key.expiration && (
                          <div className="mt-1 ml-5.5 text-[10px] text-muted-foreground">
                            Expires: {new Date(Number(key.expiration) * 1000).toLocaleDateString()}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      {searchPrefix ? "No keys match your search" : "No keys in this namespace"}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setShowAddForm(true)}
                    >
                      <HugeiconsIcon icon={Add01Icon} className="size-4 mr-1.5" strokeWidth={2} />
                      Add Key
                    </Button>
                  </div>
                )}
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <p className="text-sm text-muted-foreground text-center">
                Select a namespace
              </p>
            </div>
          )}
        </div>

        {/* Value Panel */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          {showAddForm ? (
            <div className="p-6">
              <div className="max-w-xl space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={2} />
                  Add New Key
                </h3>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Key</label>
                  <Input
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="my-key"
                    className="mt-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Value</label>
                  <textarea
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="Enter value (plain text or JSON)..."
                    className="mt-1.5 w-full min-h-48 p-3 rounded-md border border-input bg-background font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      setValueMutation.mutate({ key: newKey, value: newValue })
                    }
                    disabled={!newKey || !newValue || setValueMutation.isPending}
                  >
                    Save Key
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : selectedKey ? (
            <div className="flex flex-col h-full">
              {/* Key Header */}
              <div className="px-6 py-4 border-b border-border flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={Key01Icon} className="size-4 text-kv flex-shrink-0" strokeWidth={2} />
                    <h3 className="font-mono text-sm font-semibold truncate">{selectedKey}</h3>
                  </div>
                  {keyValue?.metadata != null && (
                    <p className="text-xs text-muted-foreground mt-1 ml-6">
                      Metadata: {JSON.stringify(keyValue.metadata)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(formattedValue?.formatted || "")}
                  >
                    <HugeiconsIcon icon={Copy01Icon} className="size-4 mr-1.5" strokeWidth={2} />
                    Copy
                  </Button>
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
              </div>

              {/* Value Display */}
              <div className="flex-1 overflow-auto p-6">
                {loadingValue ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    Loading value...
                  </div>
                ) : formattedValue ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Value</span>
                      {formattedValue.isJson && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-medium">
                          JSON
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <pre
                        className={cn(
                          "p-4 rounded-lg border border-border font-mono text-sm whitespace-pre-wrap break-all overflow-auto max-h-[calc(100vh-400px)]",
                          formattedValue.isJson ? "bg-muted/50" : "bg-muted/30"
                        )}
                      >
                        {formattedValue.isJson ? (
                          <JsonHighlight json={formattedValue.formatted} />
                        ) : (
                          formattedValue.formatted
                        )}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">No value</div>
                )}
              </div>
            </div>
          ) : selectedNs ? (
            <EmptyState
              icon={Key01Icon}
              title="Select a key"
              description="Choose a key from the list to view its value"
            />
          ) : (
            <EmptyState
              icon={HardDriveIcon}
              title="Select a namespace"
              description="Choose a namespace from the sidebar to browse keys"
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Simple JSON syntax highlighting component
function JsonHighlight({ json }: { json: string }) {
  const highlighted = json
    .replace(/"([^"]+)":/g, '<span class="text-purple-400">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="text-green-400">"$1"</span>')
    .replace(/: (\d+)/g, ': <span class="text-orange-400">$1</span>')
    .replace(/: (true|false)/g, ': <span class="text-blue-400">$1</span>')
    .replace(/: (null)/g, ': <span class="text-gray-400">$1</span>')

  return <span dangerouslySetInnerHTML={{ __html: highlighted }} />
}

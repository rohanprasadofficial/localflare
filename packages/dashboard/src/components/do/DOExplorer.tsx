import { useEffect, useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Layers01Icon,
  PlayIcon,
  PlusSignIcon,
  RotateClockwiseIcon,
  ArrowLeft01Icon,
  Database01Icon,
} from "@hugeicons/core-free-icons"
import { doApi, bindingsApi, type DurableObject, type DOStorageInstance, type D1Column } from "@/lib/api"
import { PageHeader } from "@/components/ui/page-header"
import { StatsCard, StatsCardGroup } from "@/components/ui/stats-card"
import { DataTable, DataTableLoading, type Column } from "@/components/ui/data-table"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

function formatKVValue(value: unknown): string {
  if (typeof value !== "string") {
    return JSON.stringify(value, null, 2)
  }

  try {
    const parsed = JSON.parse(value)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return value
  }
}

export function DOExplorer() {
  const [selectedBinding, setSelectedBinding] = useState<string>("")
  const [selectedInstance, setSelectedInstance] = useState<DOStorageInstance | null>(null)
  const [fetchInstance, setFetchInstance] = useState<{ binding: string; id: string } | null>(null)
  const [requestPath, setRequestPath] = useState("/")
  const [requestMethod, setRequestMethod] = useState("GET")
  const [requestBody, setRequestBody] = useState("")
  const [response, setResponse] = useState<string | null>(null)
  const [responseStatus, setResponseStatus] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<"data" | "query" | "kv">("data")
  const [selectedTable, setSelectedTable] = useState<string>("")
  const [queryText, setQueryText] = useState("")
  const [queryResults, setQueryResults] = useState<unknown[] | null>(null)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const limit = 50
  const kvLimit = 100

  // Create instance dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newInstanceName, setNewInstanceName] = useState("")

  const { data: bindings, isLoading: isLoadingBindings } = useQuery({
    queryKey: ["bindings"],
    queryFn: bindingsApi.getAll,
  })

  const durableObjects = (bindings?.bindings.durableObjects ?? []) as unknown as DurableObject[]

  // Load storage instances for the selected binding
  const {
    data: storageData,
    isLoading: isLoadingStorage,
    refetch: refetchStorage,
    error: storageError,
  } = useQuery({
    queryKey: ["do-storage-instances", selectedBinding],
    queryFn: () => doApi.getStorageInstances(selectedBinding),
    enabled: !!selectedBinding,
  })

  // Load schema for selected instance
  const { data: schemaData } = useQuery({
    queryKey: ["do-storage-schema", selectedInstance?.binding, selectedInstance?.id],
    queryFn: () => doApi.getStorageSchema(selectedInstance!.binding, selectedInstance!.id),
    enabled: !!selectedInstance,
  })

  // Load table info
  const { data: tableInfo } = useQuery({
    queryKey: ["do-storage-table-info", selectedInstance?.binding, selectedInstance?.id, selectedTable],
    queryFn: () => doApi.getStorageTableInfo(selectedInstance!.binding, selectedInstance!.id, selectedTable),
    enabled: !!selectedInstance && !!selectedTable,
  })

  // Load rows for selected table
  const { data: rowsData, isLoading: isLoadingRows } = useQuery({
    queryKey: [
      "do-storage-rows",
      selectedInstance?.binding,
      selectedInstance?.id,
      selectedTable,
      offset,
    ],
    queryFn: () =>
      doApi.getStorageRows(
        selectedInstance!.binding,
        selectedInstance!.id,
        selectedTable,
        limit,
        offset,
      ),
    enabled: !!selectedInstance && !!selectedTable,
  })

  const { data: kvData, isLoading: isLoadingKV } = useQuery({
    queryKey: ["do-storage-kv", selectedInstance?.binding, selectedInstance?.id],
    queryFn: () => doApi.getStorageKV(selectedInstance!.binding, selectedInstance!.id, kvLimit, 0),
    enabled: !!selectedInstance && activeTab === "kv",
  })

  const createInstanceMutation = useMutation({
    mutationFn: async ({ binding, name }: { binding: string; name?: string }) => {
      const result = await doApi.getId(binding, { name })
      return { binding, id: result.id }
    },
    onSuccess: () => {
      refetchStorage()
      setCreateDialogOpen(false)
      setNewInstanceName("")
    },
  })

  const fetchMutation = useMutation({
    mutationFn: async ({
      binding,
      id,
      path,
      method,
      body,
    }: {
      binding: string
      id: string
      path: string
      method: string
      body?: string
    }) => {
      const options: RequestInit = { method }
      if (body && method !== "GET" && method !== "HEAD") {
        options.body = body
      }
      const response = await doApi.fetch(binding, id, path, options)
      const text = await response.text()
      return { status: response.status, body: text }
    },
    onSuccess: (data) => {
      setResponse(data.body)
      setResponseStatus(data.status)
    },
    onError: (error) => {
      setResponse(String(error))
      setResponseStatus(500)
    },
  })

  const queryMutation = useMutation({
    mutationFn: async () => {
      if (!selectedInstance || !queryText.trim()) return
      return doApi.executeStorageQuery(selectedInstance.binding, selectedInstance.id, queryText)
    },
    onSuccess: (data) => {
      if (data?.results) {
        setQueryResults(data.results)
        setQueryError(null)
      } else if (data?.meta) {
        setQueryResults([{ changes: data.meta.changes }])
        setQueryError(null)
      }
    },
    onError: (error) => {
      setQueryError(String(error))
      setQueryResults(null)
    },
  })

  const doColumns: Column<Record<string, unknown>>[] = [
    {
      key: "binding",
      header: "Binding",
      render: (value) => (
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Layers01Icon} className="size-4 text-do" strokeWidth={2} />
          <span className="font-medium text-sm">{String(value)}</span>
        </div>
      ),
    },
    {
      key: "class_name",
      header: "Class Name",
      render: (value) => <span className="font-mono text-xs">{String(value)}</span>,
    },
    {
      key: "script_name",
      header: "Script",
      render: (value) =>
        value ? (
          <span className="text-xs text-muted-foreground">{String(value)}</span>
        ) : (
          <span className="text-xs text-muted-foreground italic">Local</span>
        ),
    },
  ]

  useEffect(() => {
    if (!durableObjects.length) return
    if (selectedBinding && durableObjects.some((d) => d.name === selectedBinding)) return
    setSelectedBinding(durableObjects[0].name)
  }, [durableObjects, selectedBinding])

  if (isLoadingBindings) {
    return (
      <div className="p-6">
        <DataTableLoading />
      </div>
    )
  }

  if (!durableObjects.length) {
    return (
      <div className="p-6">
        <PageHeader
          icon={Layers01Icon}
          iconColor="text-do"
          title="Durable Objects"
          description="Manage your Durable Objects classes"
        />
        <EmptyState
          icon={Layers01Icon}
          title="No Durable Objects configured"
          description="Add a Durable Object binding to your wrangler.toml to get started"
          className="mt-8"
        />
      </div>
    )
  }

  // ── Instance detail view (storage browser) ──────────────────────
  if (selectedInstance) {
    const tables = schemaData?.tables ?? []
    const columns: Column<Record<string, unknown>>[] = tableInfo
      ? tableInfo.columns.map((col: D1Column) => ({
          key: col.name,
          header: col.name,
          render: (value: unknown) => {
            if (value === null) return <span className="text-muted-foreground italic">NULL</span>
            if (typeof value === "object") return <span className="font-mono text-xs">{JSON.stringify(value)}</span>
            return <span className="text-sm">{String(value)}</span>
          },
        }))
      : []

    const kvColumns: Column<Record<string, unknown>>[] = [
      {
        key: "key",
        header: "Key",
        render: (value: unknown) => <span className="font-mono text-xs">{String(value)}</span>,
      },
      {
        key: "value",
        header: "Value",
        render: (value: unknown) => (
          <pre className="font-mono text-xs whitespace-pre-wrap break-all max-w-[640px]">
            {formatKVValue(value)}
          </pre>
        ),
      },
    ]

    return (
      <div className="h-full flex flex-col">
        {/* Header with back button */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedInstance(null)
                setSelectedTable("")
                setQueryResults(null)
                setQueryError(null)
              }}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold">
                {selectedInstance.className} Instance
              </h2>
              <p className="text-xs text-muted-foreground font-mono">
                {selectedInstance.id}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar: tables */}
          <div className="w-56 border-r border-border bg-muted/30">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tables</h3>
            </div>
            <ScrollArea className="h-[calc(100vh-230px)]">
              <div className="p-2">
                {tables.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-2 py-3">No tables found</p>
                ) : (
                  <div className="space-y-1">
                    {tables.map((t: { name: string }) => (
                      <button
                        key={t.name}
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                          selectedTable === t.name
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                        onClick={() => {
                          setSelectedTable(t.name)
                          setOffset(0)
                          setActiveTab("data")
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <HugeiconsIcon icon={Database01Icon} className="size-3.5" />
                          {t.name}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Main area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "data" | "query" | "kv")} className="flex-1 flex flex-col">
              <div className="border-b border-border px-4 bg-muted/30">
                <TabsList className="h-11 bg-transparent p-0 gap-4">
                  <TabsTrigger
                    value="data"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-11 px-0"
                  >
                    Data
                  </TabsTrigger>
                  <TabsTrigger
                    value="query"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-11 px-0"
                  >
                    SQL Query
                  </TabsTrigger>
                  <TabsTrigger
                    value="kv"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-11 px-0"
                  >
                    KV Storage
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="data" className="flex-1 m-0 overflow-auto p-4">
                {!selectedTable ? (
                  <EmptyState
                    icon={Database01Icon}
                    title="Select a table"
                    description="Choose a table from the sidebar to view its data"
                  />
                ) : isLoadingRows ? (
                  <DataTableLoading />
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">
                        {selectedTable}
                        {tableInfo && (
                          <span className="text-muted-foreground ml-2">
                            ({tableInfo.rowCount} rows)
                          </span>
                        )}
                      </h3>
                    </div>
                    <DataTable
                      columns={columns}
                      data={rowsData?.rows ?? []}
                      emptyIcon={Database01Icon}
                      emptyTitle="No rows"
                      emptyDescription="This table is empty"
                    />
                    {/* Pagination */}
                    {tableInfo && tableInfo.rowCount > limit && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Showing {offset + 1}-{Math.min(offset + limit, tableInfo.rowCount)} of{" "}
                          {tableInfo.rowCount}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={offset === 0}
                            onClick={() => setOffset(Math.max(0, offset - limit))}
                          >
                            Previous
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={offset + limit >= tableInfo.rowCount}
                            onClick={() => setOffset(offset + limit)}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="query" className="flex-1 m-0 overflow-auto p-4 space-y-4">
                <div className="space-y-2">
                  <Label>SQL Query</Label>
                  <Textarea
                    placeholder="SELECT * FROM my_table LIMIT 10"
                    value={queryText}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQueryText(e.target.value)}
                    className="font-mono text-sm"
                    rows={4}
                  />
                  <Button
                    onClick={() => queryMutation.mutate()}
                    disabled={queryMutation.isPending || !queryText.trim()}
                  >
                    <HugeiconsIcon icon={PlayIcon} className="size-4 mr-2" />
                    {queryMutation.isPending ? "Running..." : "Execute"}
                  </Button>
                </div>
                {queryError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive font-mono">{queryError}</p>
                  </div>
                )}
                {queryResults && (
                  <div className="space-y-2">
                    <Label>Results ({queryResults.length} rows)</Label>
                    <pre className="bg-muted p-3 rounded-lg text-sm font-mono overflow-auto max-h-96 whitespace-pre-wrap">
                      {JSON.stringify(queryResults, null, 2)}
                    </pre>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="kv" className="flex-1 m-0 overflow-auto p-4 space-y-4">
                {isLoadingKV ? (
                  <DataTableLoading />
                ) : (kvData?.entries?.length ?? 0) === 0 ? (
                  <EmptyState
                    icon={Database01Icon}
                    title="No key-value entries"
                    description="No DurableObjectStorage key-values found for this instance"
                  />
                ) : (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">
                      Key-Value Entries
                      <span className="text-muted-foreground ml-2">({kvData?.meta.total ?? 0})</span>
                    </h3>
                    <DataTable
                      columns={kvColumns}
                      data={kvData?.entries as unknown as Record<string, unknown>[]}
                      emptyIcon={Database01Icon}
                      emptyTitle="No key-value entries"
                      emptyDescription="No DurableObjectStorage key-values found"
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    )
  }

  // ── Main view (classes + instances) ─────────────────────────────
  const instances = storageData?.instances ?? []

  const instanceColumns: Column<DOStorageInstance>[] = [
    {
      key: "id",
      header: "Instance ID",
      render: (value) => (
        <span className="font-mono text-xs">{String(value).slice(0, 24)}...</span>
      ),
    },
    {
      key: "className",
      header: "Class",
      render: (value) => <span className="font-mono text-xs">{String(value)}</span>,
    },
  ]

  const handleCreateInstance = () => {
    if (!selectedBinding) return
    createInstanceMutation.mutate({
      binding: selectedBinding,
      name: newInstanceName || undefined,
    })
  }

  const handleSendRequest = () => {
    if (!fetchInstance) return
    fetchMutation.mutate({
      binding: fetchInstance.binding,
      id: fetchInstance.id,
      path: requestPath,
      method: requestMethod,
      body: requestBody,
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <PageHeader
          icon={Layers01Icon}
          iconColor="text-do"
          title="Durable Objects"
          description="Manage and interact with your Durable Objects"
        />
        <StatsCardGroup className="mt-6">
          <StatsCard icon={Layers01Icon} iconColor="text-do" label="DO Classes" value={durableObjects.length} />
          <StatsCard
            icon={Layers01Icon}
            iconColor="text-muted-foreground"
            label="Instances (on disk)"
            value={instances.length}
          />
        </StatsCardGroup>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* DO Classes Table */}
        <div>
          <h3 className="text-sm font-medium mb-3">Configured Classes</h3>
          <DataTable
            columns={doColumns}
            data={durableObjects as unknown as Record<string, unknown>[]}
            emptyIcon={Layers01Icon}
            emptyTitle="No Durable Objects"
            emptyDescription="Configure Durable Objects in your wrangler.toml"
          />
        </div>

        {/* Storage Instances Section */}
        <div className="border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-medium">Storage Instances</h3>
              {durableObjects.length > 1 && (
                <Select value={selectedBinding} onValueChange={setSelectedBinding}>
                  <SelectTrigger className="w-48 h-8">
                    <SelectValue placeholder="Select binding" />
                  </SelectTrigger>
                  <SelectContent>
                    {durableObjects.map((d) => (
                      <SelectItem key={d.name} value={d.name}>
                        {d.name} ({d.class_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => refetchStorage()}
                disabled={isLoadingStorage}
              >
                <HugeiconsIcon
                  icon={RotateClockwiseIcon}
                  className={`size-4 ${isLoadingStorage ? "animate-spin" : ""}`}
                />
              </Button>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <HugeiconsIcon icon={PlusSignIcon} className="size-4 mr-2" />
                    Create Instance
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Durable Object Instance</DialogTitle>
                    <DialogDescription>
                      Get or create a Durable Object instance. Use a name for deterministic IDs.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Binding</Label>
                      <Select value={selectedBinding} onValueChange={setSelectedBinding}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a DO binding" />
                        </SelectTrigger>
                        <SelectContent>
                          {durableObjects.map((d) => (
                            <SelectItem key={d.name} value={d.name}>
                              {d.name} ({d.class_name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Instance Name</Label>
                      <Input
                        placeholder="e.g., default, user-123, my-counter"
                        value={newInstanceName}
                        onChange={(e) => setNewInstanceName(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Same name always returns the same DO instance. Leave empty for a unique ID.
                      </p>
                    </div>
                    {createInstanceMutation.isError && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-sm text-destructive">{String(createInstanceMutation.error)}</p>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateInstance}
                      disabled={!selectedBinding || createInstanceMutation.isPending}
                    >
                      {createInstanceMutation.isPending ? "Creating..." : "Create"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {isLoadingStorage ? (
            <DataTableLoading />
          ) : storageError ? (
            <p className="text-sm text-destructive text-center py-4">
              Failed to load storage instances: {String(storageError)}
            </p>
          ) : instances.length > 0 ? (
            <DataTable
              columns={instanceColumns}
              data={instances}
              emptyIcon={Layers01Icon}
              emptyTitle="No instances"
              emptyDescription="Create a DO instance to interact with it"
              onRowClick={(row) => setSelectedInstance(row)}
              rowKey={(row) => `${row.binding}-${row.id}`}
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No instances found on disk. Use your app to create DO instances, then refresh.
            </p>
          )}
        </div>

        {/* Fetch Request Section */}
        <div className="border border-border rounded-lg p-4">
          <h3 className="text-sm font-medium mb-4">Send Request to DO Instance</h3>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Select
                value={fetchInstance ? `${fetchInstance.binding}:${fetchInstance.id}` : ""}
                onValueChange={(v) => {
                  const [binding, id] = v.split(":")
                  setFetchInstance({ binding, id })
                }}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select instance" />
                </SelectTrigger>
                <SelectContent>
                  {instances.map((inst) => (
                    <SelectItem key={inst.id} value={`${inst.binding}:${inst.id}`}>
                      {inst.id.slice(0, 16)}... ({inst.className})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={requestMethod} onValueChange={setRequestMethod}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="/path"
                value={requestPath}
                onChange={(e) => setRequestPath(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSendRequest} disabled={fetchMutation.isPending || !fetchInstance}>
                <HugeiconsIcon icon={PlayIcon} className="size-4 mr-2" />
                {fetchMutation.isPending ? "Sending..." : "Send"}
              </Button>
            </div>

            {requestMethod !== "GET" && requestMethod !== "HEAD" && (
              <div className="space-y-2">
                <Label>Request Body</Label>
                <Textarea
                  placeholder='{"key": "value"}'
                  value={requestBody}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRequestBody(e.target.value)}
                  className="font-mono text-sm"
                  rows={4}
                />
              </div>
            )}

            {response !== null && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Response</Label>
                  <Badge
                    variant={responseStatus && responseStatus >= 200 && responseStatus < 300 ? "secondary" : "destructive"}
                    className="h-auto py-0.5"
                  >
                    {responseStatus}
                  </Badge>
                </div>
                <pre className="bg-muted p-3 rounded-lg text-sm font-mono overflow-auto max-h-64 whitespace-pre-wrap">
                  {response}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

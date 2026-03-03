import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { StackIcon, PlayIcon, PlusIcon, ArrowsClockwiseIcon } from "@phosphor-icons/react"
import { doApi, bindingsApi, type DurableObject } from "@/lib/api"
import { DataTable, DataTableLoading, type Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

import { type DOInstance } from "@/lib/api"

export function DOExplorer() {
  const [selectedBinding, setSelectedBinding] = useState<string>("")
  const [selectedInstance, setSelectedInstance] = useState<DOInstance | null>(null)
  const [requestPath, setRequestPath] = useState("/")
  const [requestMethod, setRequestMethod] = useState("GET")
  const [requestBody, setRequestBody] = useState("")
  const [response, setResponse] = useState<string | null>(null)
  const [responseStatus, setResponseStatus] = useState<number | null>(null)

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newInstanceName, setNewInstanceName] = useState("")

  const { data: bindings, isLoading: isLoadingBindings } = useQuery({
    queryKey: ["bindings"],
    queryFn: bindingsApi.getAll,
  })

  const { data: existingInstances, isLoading: isLoadingInstances, refetch: refetchInstances } = useQuery({
    queryKey: ["do-instances"],
    queryFn: doApi.getInstances,
  })

  const isLoading = isLoadingBindings || isLoadingInstances
  const instances: DOInstance[] = existingInstances?.instances ?? []

  const createInstanceMutation = useMutation({
    mutationFn: async ({ binding, name }: { binding: string; name?: string }) => {
      const result = await doApi.getId(binding, { name })
      return { binding, id: result.id }
    },
    onSuccess: (data) => {
      refetchInstances()
      const doBindings = bindings?.bindings.durableObjects ?? []
      setSelectedInstance({
        binding: data.binding,
        id: data.id,
        class_name: doBindings.find(d => d.name === data.binding)?.class_name ?? "",
      })
      setCreateDialogOpen(false)
      setNewInstanceName("")
    },
  })

  const fetchMutation = useMutation({
    mutationFn: async ({ binding, id, path, method, body }: { binding: string; id: string; path: string; method: string; body?: string }) => {
      const options: RequestInit = { method }
      if (body && method !== "GET" && method !== "HEAD") options.body = body
      const response = await doApi.fetch(binding, id, path, options)
      const text = await response.text()
      return { status: response.status, body: text }
    },
    onSuccess: (data) => { setResponse(data.body); setResponseStatus(data.status) },
    onError: (error) => { setResponse(String(error)); setResponseStatus(500) },
  })

  const doColumns: Column<Record<string, unknown>>[] = [
    {
      key: "binding",
      header: "Binding",
      render: (value) => (
        <div className="flex items-center gap-2">
          <StackIcon size={16} className="text-do" />
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
          <span className="text-xs text-kumo-strong">{String(value)}</span>
        ) : (
          <span className="text-xs text-kumo-strong italic">Local</span>
        ),
    },
  ]

  const instanceColumns: Column<DOInstance>[] = [
    {
      key: "binding",
      header: "Binding",
      render: (value) => <span className="font-medium text-sm">{String(value)}</span>,
    },
    {
      key: "class_name",
      header: "Class",
      render: (value) => <span className="font-mono text-xs">{String(value)}</span>,
    },
    {
      key: "id",
      header: "ID",
      render: (value) => (
        <span className="font-mono text-xs text-kumo-strong">{String(value).slice(0, 16)}...</span>
      ),
    },
  ]

  if (isLoading) {
    return <div className="p-8"><DataTableLoading /></div>
  }

  const durableObjects = (bindings?.bindings.durableObjects ?? []) as unknown as DurableObject[]

  if (!durableObjects.length) {
    return (
      <div className="p-8 max-w-3xl">
        <h1 className="text-2xl font-semibold text-kumo-default">Durable Objects</h1>
        <p className="text-sm text-kumo-strong mt-1">Manage your Durable Objects classes</p>
        <div className="mt-8 rounded-lg border border-kumo-line p-8 text-center">
          <StackIcon size={32} className="text-kumo-subtle mx-auto mb-3" />
          <p className="text-sm text-kumo-default font-medium">No Durable Objects configured</p>
          <p className="text-xs text-kumo-strong mt-1">Add a Durable Object binding to your wrangler.toml to get started</p>
        </div>
      </div>
    )
  }

  const handleCreateInstance = () => {
    if (!selectedBinding) return
    createInstanceMutation.mutate({ binding: selectedBinding, name: newInstanceName || undefined })
  }

  const handleSendRequest = () => {
    if (!selectedInstance) return
    fetchMutation.mutate({ binding: selectedInstance.binding, id: selectedInstance.id, path: requestPath, method: requestMethod, body: requestBody })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-kumo-line">
        <h1 className="text-2xl font-semibold text-kumo-default">Durable Objects</h1>
        <p className="text-sm text-kumo-strong mt-1">Manage and interact with your Durable Objects</p>

        <div className="grid grid-cols-2 gap-px rounded-lg border border-kumo-line bg-kumo-line overflow-hidden mt-5 max-w-sm">
          <div className="bg-kumo-base px-4 py-3">
            <p className="text-xs text-kumo-strong">DO Classes</p>
            <p className="text-xl font-semibold text-kumo-default mt-0.5 tabular-nums">{durableObjects.length}</p>
          </div>
          <div className="bg-kumo-base px-4 py-3">
            <p className="text-xs text-kumo-strong">Active Instances</p>
            <p className="text-xl font-semibold text-kumo-default mt-0.5 tabular-nums">{instances.length}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* DO Classes Table */}
        <div>
          <h3 className="text-sm font-medium mb-3">Configured Classes</h3>
          <DataTable
            columns={doColumns}
            data={durableObjects as unknown as Record<string, unknown>[]}
            emptyIcon={StackIcon}
            emptyTitle="No Durable Objects"
            emptyDescription="Configure Durable Objects in your wrangler.toml"
          />
        </div>

        {/* Instances Section */}
        <div className="border border-kumo-line rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">DO Instances (from storage)</h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => refetchInstances()}
                disabled={isLoadingInstances}
              >
                <ArrowsClockwiseIcon size={16} className={isLoadingInstances ? 'animate-spin' : ''} />
              </Button>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <PlusIcon size={16} className="mr-2" />
                    Create Instance
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Durable Object Instance</DialogTitle>
                  <DialogDescription>
                    Get or create a Durable Object instance. Use a name for deterministic IDs (e.g., "user-123").
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
                    <p className="text-xs text-kumo-strong">
                      Same name always returns the same DO instance. Leave empty to generate a unique ID.
                    </p>
                  </div>
                  {createInstanceMutation.isError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-sm text-red-500">{String(createInstanceMutation.error)}</p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateInstance} disabled={!selectedBinding || createInstanceMutation.isPending}>
                    {createInstanceMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          {instances.length > 0 ? (
            <DataTable
              columns={instanceColumns}
              data={instances}
              emptyIcon={StackIcon}
              emptyTitle="No instances"
              emptyDescription="Create a DO instance to interact with it"
              onRowClick={(row) => setSelectedInstance(row)}
              rowKey={(row) => `${row.binding}-${row.id}`}
            />
          ) : (
            <p className="text-sm text-kumo-strong text-center py-4">
              No instances found. Click "Create Instance" to get started or use your app to create DO instances.
            </p>
          )}
        </div>

        {/* Fetch Request Section */}
        {selectedInstance && (
          <div className="border border-kumo-line rounded-lg p-4">
            <h3 className="text-sm font-medium mb-4">
              Send Request to: <span className="text-do">{selectedInstance.id.slice(0, 16)}...</span>
            </h3>
            <div className="space-y-4">
              <div className="flex gap-2">
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
                <Input placeholder="/path" value={requestPath} onChange={(e) => setRequestPath(e.target.value)} className="flex-1" />
                <Button onClick={handleSendRequest} disabled={fetchMutation.isPending}>
                  <PlayIcon size={16} className="mr-2" />
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
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      responseStatus && responseStatus >= 200 && responseStatus < 300
                        ? "bg-green-500/20 text-green-500"
                        : "bg-red-500/20 text-red-500"
                    }`}>
                      {responseStatus}
                    </span>
                  </div>
                  <pre className="bg-kumo-fill p-3 rounded-lg text-sm font-mono overflow-auto max-h-64 whitespace-pre-wrap">
                    {response}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

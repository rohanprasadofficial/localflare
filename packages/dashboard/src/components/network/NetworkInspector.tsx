import { useState, useEffect, useRef, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  TrashIcon,
  PauseIcon,
  PlayIcon,
  GlobeIcon,
  ArrowRightIcon,
  XIcon,
} from "@phosphor-icons/react"
import { requestsApi, getApiBase, type CapturedRequest } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@cloudflare/kumo"

const methodColors: Record<string, string> = {
  GET: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  POST: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  PUT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  PATCH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  OPTIONS: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  HEAD: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
}

const statusColors = (status: number): string => {
  if (status >= 500) return "text-red-600"
  if (status >= 400) return "text-orange-600"
  if (status >= 300) return "text-blue-600"
  if (status >= 200) return "text-green-600"
  return "text-kumo-strong"
}

export function NetworkInspector() {
  const queryClient = useQueryClient()
  const [requests, setRequests] = useState<CapturedRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<CapturedRequest | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [filter, setFilter] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Fetch initial requests
  const { data: initialData, isLoading } = useQuery({
    queryKey: ["requests"],
    queryFn: requestsApi.getAll,
  })

  // Load initial data
  useEffect(() => {
    if (initialData?.requests) {
      setRequests(initialData.requests)
    }
  }, [initialData])

  const clearMutation = useMutation({
    mutationFn: requestsApi.clear,
    onSuccess: () => {
      setRequests([])
      setSelectedRequest(null)
      queryClient.invalidateQueries({ queryKey: ["requests"] })
    },
  })

  // Connect to SSE stream
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const eventSource = new EventSource(`${getApiBase()}/logs/stream`)
    eventSourceRef.current = eventSource

    eventSource.addEventListener("request", (event) => {
      if (isPaused) return

      try {
        const request = JSON.parse(event.data) as CapturedRequest
        setRequests((prev) => {
          // Update existing request or add new one
          const existingIndex = prev.findIndex(r => r.id === request.id)
          if (existingIndex >= 0) {
            const updated = [...prev]
            updated[existingIndex] = request
            return updated
          }
          const newRequests = [...prev, request]
          return newRequests.length > 500 ? newRequests.slice(-500) : newRequests
        })
      } catch {
        // Ignore parse errors
      }
    })

    eventSource.onerror = () => {
      setTimeout(connect, 2000)
    }
  }, [isPaused])

  useEffect(() => {
    connect()
    return () => {
      eventSourceRef.current?.close()
    }
  }, [connect])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current && !selectedRequest) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [requests, selectedRequest])

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    })
  }

  const filteredRequests = requests.filter(req => {
    if (!filter) return true
    const searchLower = filter.toLowerCase()
    return (
      req.path.toLowerCase().includes(searchLower) ||
      req.method.toLowerCase().includes(searchLower) ||
      (req.response?.status?.toString() || "").includes(searchLower)
    )
  })

  const formatHeaders = (headers: Record<string, string>) => {
    return Object.entries(headers).map(([key, value]) => (
      <div key={key} className="flex gap-2 py-1">
        <span className="text-kumo-strong font-medium">{key}:</span>
        <span className="break-all">{value}</span>
      </div>
    ))
  }

  const formatBody = (body?: string) => {
    if (!body) return <span className="text-kumo-strong">No body</span>

    // Try to parse and format JSON
    try {
      const parsed = JSON.parse(body)
      return (
        <pre className="text-xs bg-kumo-fill p-3 rounded-md overflow-auto max-h-64">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      )
    } catch {
      return (
        <pre className="text-xs bg-kumo-fill p-3 rounded-md overflow-auto max-h-64 whitespace-pre-wrap">
          {body}
        </pre>
      )
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-kumo-line">
        <h1 className="text-2xl font-semibold text-kumo-default">Network Inspector</h1>
        <p className="text-sm text-kumo-strong mt-1">Monitor HTTP requests to your worker</p>

        <div className="mt-4 flex items-center gap-2">
          <Button
            variant={isPaused ? "default" : "outline"}
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? <PlayIcon size={16} className="mr-1.5" /> : <PauseIcon size={16} className="mr-1.5" />}
            {isPaused ? "Resume" : "Pause"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending}
          >
            <TrashIcon size={16} className="mr-1.5" />
            Clear
          </Button>

          <div className="flex-1">
            <input
              type="text"
              placeholder="Filter requests..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full max-w-xs px-3 py-1.5 text-sm border border-kumo-line rounded-md bg-kumo-base"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-kumo-strong">
            <span
              className={cn(
                "size-2 rounded-full",
                isPaused ? "bg-yellow-500" : "bg-green-500"
              )}
            />
            {isPaused ? "Paused" : "Recording"}
            <span className="text-kumo-inactive">
              ({filteredRequests.length} requests)
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Request list */}
        <div className={cn(
          "border-r border-kumo-line overflow-hidden flex flex-col",
          selectedRequest ? "w-1/2" : "w-full"
        )}>
          <ScrollArea ref={scrollRef} className="flex-1">
            <div className="text-sm">
              {isLoading ? (
                <div className="text-kumo-strong text-center py-20">
                  Loading requests...
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-kumo-strong text-center py-20">
                  <GlobeIcon
                    size={40}
                    className="mx-auto opacity-30"
                  />
                  <p className="mt-4 text-sm">No requests captured yet</p>
                  <p className="text-xs mt-1 opacity-60">
                    Make requests to your worker to see them here
                  </p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-kumo-tint/50 sticky top-0">
                    <tr className="text-xs text-kumo-strong">
                      <th className="py-2 px-3 text-left font-medium">Time</th>
                      <th className="py-2 px-3 text-left font-medium">Method</th>
                      <th className="py-2 px-3 text-left font-medium">Path</th>
                      <th className="py-2 px-3 text-left font-medium">Status</th>
                      <th className="py-2 px-3 text-right font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((req) => (
                      <tr
                        key={req.id}
                        onClick={() => setSelectedRequest(req)}
                        className={cn(
                          "cursor-pointer hover:bg-kumo-tint/50 transition-colors",
                          selectedRequest?.id === req.id && "bg-kumo-fill",
                          req.response?.status && req.response.status >= 400 && "bg-red-50 dark:bg-red-950/20"
                        )}
                      >
                        <td className="py-2 px-3 text-kumo-strong whitespace-nowrap font-mono text-xs">
                          {formatTime(req.timestamp)}
                        </td>
                        <td className="py-2 px-3">
                          <Badge className={cn("text-xs font-mono", methodColors[req.method] || methodColors.GET)}>
                            {req.method}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 font-mono text-xs truncate max-w-[300px]" title={req.path}>
                          {req.path}
                        </td>
                        <td className="py-2 px-3">
                          {req.response ? (
                            <span className={cn("font-mono text-xs font-medium", statusColors(req.response.status))}>
                              {req.response.status}
                            </span>
                          ) : (
                            <span className="text-kumo-strong text-xs">pending...</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right text-kumo-strong font-mono text-xs">
                          {req.response ? `${req.response.duration}ms` : "\u2014"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Request details */}
        {selectedRequest && (
          <div className="w-1/2 flex flex-col min-h-0">
            <div className="p-3 border-b border-kumo-line flex items-center justify-between bg-kumo-tint/30">
              <div className="flex items-center gap-2">
                <Badge className={cn("text-xs font-mono", methodColors[selectedRequest.method] || methodColors.GET)}>
                  {selectedRequest.method}
                </Badge>
                <span className="font-mono text-sm truncate max-w-[250px]">{selectedRequest.path}</span>
                {selectedRequest.response && (
                  <>
                    <ArrowRightIcon size={16} className="text-kumo-strong" />
                    <span className={cn("font-mono text-sm font-medium", statusColors(selectedRequest.response.status))}>
                      {selectedRequest.response.status} {selectedRequest.response.statusText}
                    </span>
                  </>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setSelectedRequest(null)}
              >
                <XIcon size={16} />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4 text-sm">
                {/* General Info */}
                <div>
                  <h4 className="font-medium mb-2">General</h4>
                  <div className="bg-kumo-tint/30 rounded-md p-3 space-y-1 text-xs">
                    <div className="flex gap-2">
                      <span className="text-kumo-strong font-medium">URL:</span>
                      <span className="break-all font-mono">{selectedRequest.url}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-kumo-strong font-medium">Time:</span>
                      <span>{new Date(selectedRequest.timestamp).toLocaleString()}</span>
                    </div>
                    {selectedRequest.response && (
                      <div className="flex gap-2">
                        <span className="text-kumo-strong font-medium">Duration:</span>
                        <span>{selectedRequest.response.duration}ms</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Request Headers */}
                <div>
                  <h4 className="font-medium mb-2">Request Headers</h4>
                  <div className="bg-kumo-tint/30 rounded-md p-3 text-xs">
                    {formatHeaders(selectedRequest.headers)}
                  </div>
                </div>

                {/* Request Body */}
                {selectedRequest.body && (
                  <div>
                    <h4 className="font-medium mb-2">Request Body</h4>
                    {formatBody(selectedRequest.body)}
                  </div>
                )}

                {selectedRequest.response && (
                  <>
                    {/* Response Headers */}
                    <div>
                      <h4 className="font-medium mb-2">Response Headers</h4>
                      <div className="bg-kumo-tint/30 rounded-md p-3 text-xs">
                        {formatHeaders(selectedRequest.response.headers)}
                      </div>
                    </div>

                    {/* Response Body */}
                    <div>
                      <h4 className="font-medium mb-2">Response Body</h4>
                      {formatBody(selectedRequest.response.body)}
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  )
}

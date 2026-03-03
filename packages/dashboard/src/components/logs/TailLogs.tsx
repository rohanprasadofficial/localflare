import { useState, useEffect, useRef, useCallback } from "react"
import { useMutation } from "@tanstack/react-query"
import {
  TrashIcon,
  PauseIcon,
  PlayIcon,
  TerminalIcon,
} from "@phosphor-icons/react"
import { logsApi, getApiBase, type LogEntry } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@cloudflare/kumo"

const levelColors: Record<LogEntry["level"], string> = {
  log: "text-kumo-default",
  info: "text-blue-600",
  warn: "text-yellow-600",
  error: "text-red-600",
  debug: "text-kumo-strong",
}

export function TailLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const clearMutation = useMutation({
    mutationFn: logsApi.clear,
    onSuccess: () => setLogs([]),
  })

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const eventSource = new EventSource(`${getApiBase()}/logs/stream`)
    eventSourceRef.current = eventSource

    eventSource.addEventListener("log", (event) => {
      if (isPaused) return

      try {
        const log = JSON.parse(event.data) as LogEntry
        setLogs((prev) => {
          if (prev.some((l) => l.id === log.id)) return prev
          const newLogs = [...prev, log]
          return newLogs.length > 500 ? newLogs.slice(-500) : newLogs
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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-kumo-line">
        <h1 className="text-2xl font-semibold text-kumo-default">Tail Logs</h1>
        <p className="text-sm text-kumo-strong mt-1">Real-time worker logs stream</p>

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

          <div className="ml-auto flex items-center gap-2 text-xs text-kumo-strong">
            <span
              className={cn(
                "size-2 rounded-full",
                isPaused ? "bg-yellow-500" : "bg-green-500"
              )}
            />
            {isPaused ? "Paused" : "Streaming"}
            <span className="text-kumo-inactive">
              ({logs.length} logs)
            </span>
          </div>
        </div>
      </div>

      {/* Log entries */}
      <ScrollArea ref={scrollRef} className="flex-1">
        <div className="p-4 font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-kumo-strong text-center py-20">
              <TerminalIcon
                size={40}
                className="mx-auto opacity-30"
              />
              <p className="mt-4 text-sm">Waiting for logs...</p>
              <p className="text-xs mt-1 opacity-60">
                Logs from your worker will appear here
              </p>
            </div>
          ) : (
            <table className="w-full">
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className={cn(
                      "hover:bg-kumo-tint/50",
                      log.level === "error" && "bg-red-50 dark:bg-red-950/20"
                    )}
                  >
                    <td className="py-1 pr-4 text-kumo-strong whitespace-nowrap align-top">
                      {formatTime(log.timestamp)}
                    </td>
                    <td className={cn(
                      "py-1 pr-4 whitespace-nowrap align-top font-medium",
                      levelColors[log.level]
                    )}>
                      {log.level.toUpperCase()}
                    </td>
                    <td className="py-1 text-kumo-default break-all">
                      {log.message}
                      {log.data !== undefined && (
                        <span className="text-kumo-strong ml-2">
                          {String(JSON.stringify(log.data))}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

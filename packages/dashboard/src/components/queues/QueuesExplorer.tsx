import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import {
  CheckCircleIcon,
  PaperPlaneRightIcon,
  InfoIcon,
  GearIcon,
  WarningIcon,
} from "@phosphor-icons/react"
import { queuesApi } from "@/lib/api"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DataTableLoading } from "@/components/ui/data-table"
import { cn } from "@cloudflare/kumo"

export function QueuesExplorer() {
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState('{\n  "type": "task",\n  "data": "hello"\n}')
  const [sendStatus, setSendStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' })

  const { data: queues, isLoading } = useQuery({
    queryKey: ["queues"],
    queryFn: queuesApi.list,
  })

  const sendMutation = useMutation({
    mutationFn: async ({ binding, message }: { binding: string; message: unknown }) => {
      return queuesApi.send(binding, message)
    },
    onSuccess: () => {
      setSendStatus({ type: 'success', message: 'Message sent! Check your terminal for consumer output.' })
      setTimeout(() => setSendStatus({ type: null, message: '' }), 5000)
    },
    onError: (error: Error) => {
      setSendStatus({ type: 'error', message: error.message })
    },
  })

  const handleSendMessage = () => {
    if (!selectedQueue) return

    try {
      const message = JSON.parse(messageInput)
      sendMutation.mutate({ binding: selectedQueue, message })
    } catch {
      setSendStatus({ type: 'error', message: 'Invalid JSON. Please check your message format.' })
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <DataTableLoading />
      </div>
    )
  }

  const producers = queues?.producers ?? []
  const consumers = queues?.consumers ?? []

  // Find matching consumer for selected producer
  const selectedProducer = producers.find(p => p.binding === selectedQueue)
  const matchingConsumer = consumers.find(c => c.queue === selectedProducer?.queue)

  if (!producers.length) {
    return (
      <div className="p-6">
        <div className="px-6 py-5 border-b border-kumo-line">
          <h1 className="text-2xl font-semibold text-kumo-default">Queues</h1>
          <p className="text-sm text-kumo-strong mt-1">Cloudflare Queues for async message processing</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CheckCircleIcon size={32} className="text-kumo-subtle mb-3" />
          <p className="text-sm text-kumo-default font-medium">No Queues configured</p>
          <p className="text-xs text-kumo-strong mt-1">Add a Queue binding to your wrangler.toml to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-kumo-line">
        <h1 className="text-2xl font-semibold text-kumo-default">Queues</h1>
        <p className="text-sm text-kumo-strong mt-1">Cloudflare Queues for async message processing</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-px rounded-lg border border-kumo-line bg-kumo-line overflow-hidden mt-5 max-w-400px">
          <div className="bg-kumo-base px-4 py-3">
            <p className="text-xs text-kumo-strong">Producers</p>
            <p className="text-xl font-semibold text-kumo-default mt-0.5 tabular-nums">{producers.length}</p>
          </div>
          <div className="bg-kumo-base px-4 py-3">
            <p className="text-xs text-kumo-strong">Consumers</p>
            <p className="text-xl font-semibold text-kumo-default mt-0.5 tabular-nums">{consumers.length}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Queue List */}
        <div className="w-64 border-r border-kumo-line flex flex-col bg-kumo-tint/30">
          <div className="p-3 border-b border-kumo-line">
            <span className="text-[10px] font-semibold text-kumo-strong uppercase tracking-wider">
              Producers
            </span>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {producers.map((producer) => (
                <button
                  key={producer.binding}
                  onClick={() => setSelectedQueue(producer.binding)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors",
                    selectedQueue === producer.binding
                      ? "bg-kumo-tint text-kumo-default font-medium"
                      : "text-kumo-strong hover:bg-kumo-tint hover:text-kumo-default"
                  )}
                >
                  <PaperPlaneRightIcon
                    size={16}
                    className={cn(selectedQueue === producer.binding && "text-queues")}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{producer.binding}</div>
                    <div className="text-[10px] opacity-60 truncate">{producer.queue}</div>
                  </div>
                </button>
              ))}
            </div>

            {consumers.length > 0 && (
              <>
                <div className="p-3 border-t border-b border-kumo-line mt-2">
                  <span className="text-[10px] font-semibold text-kumo-strong uppercase tracking-wider">
                    Consumers
                  </span>
                </div>
                <div className="p-2 space-y-1">
                  {consumers.map((consumer) => (
                    <div
                      key={consumer.queue}
                      className="px-3 py-2 rounded-md text-sm text-kumo-strong"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <GearIcon size={16} />
                        <span className="truncate font-medium">{consumer.queue}</span>
                      </div>
                      <div className="ml-6 text-[10px] space-y-0.5 opacity-70">
                        <div>Batch: {consumer.max_batch_size} msgs</div>
                        <div>Timeout: {consumer.max_batch_timeout}s</div>
                        <div>Retries: {consumer.max_retries}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedQueue ? (
            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-2xl space-y-6">
                {/* Send Message Form */}
                <div className="border border-kumo-line rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <PaperPlaneRightIcon size={20} className="text-queues" />
                    <h3 className="text-sm font-semibold">Send Message to {selectedQueue}</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-kumo-strong mb-1 block">Message (JSON)</label>
                      <textarea
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        className="w-full h-32 px-3 py-2 rounded-md bg-kumo-fill border border-kumo-line font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-queues/50"
                        placeholder='{"type": "task", "data": "hello"}'
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleSendMessage}
                        disabled={sendMutation.isPending}
                        className="px-4 py-2 bg-queues text-white text-sm font-medium rounded-md hover:bg-queues/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {sendMutation.isPending ? (
                          <>
                            <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <PaperPlaneRightIcon size={16} />
                            Send Message
                          </>
                        )}
                      </button>

                      {sendStatus.type && (
                        <div className={cn(
                          "flex items-center gap-2 text-sm",
                          sendStatus.type === 'success' ? "text-green-600" : "text-red-600"
                        )}>
                          {sendStatus.type === 'success' ? (
                            <CheckCircleIcon size={16} />
                          ) : (
                            <WarningIcon size={16} />
                          )}
                          <span>{sendStatus.message}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* How it works info */}
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-start gap-3">
                    <InfoIcon size={20} className="text-blue-500 mt-0.5" />
                    <div className="space-y-2 text-sm">
                      <p className="font-medium text-blue-600">How Cloudflare Queues Work</p>
                      <ol className="list-decimal list-inside space-y-1 text-blue-600/80">
                        <li><strong>Producer</strong> sends messages to the queue</li>
                        <li><strong>Queue</strong> holds messages until consumed</li>
                        <li><strong>Consumer</strong> receives batches and processes them</li>
                        <li><strong>Output</strong> appears in your <code className="bg-blue-500/20 px-1 rounded">terminal logs</code></li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Consumer Config */}
                {matchingConsumer && (
                  <div className="border border-kumo-line rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <GearIcon size={20} className="text-kumo-strong" />
                      <h3 className="text-sm font-semibold">Consumer Configuration</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-kumo-fill rounded-md">
                        <div className="text-xs text-kumo-strong">Max Batch Size</div>
                        <div className="font-mono text-sm">{matchingConsumer.max_batch_size} messages</div>
                      </div>
                      <div className="p-3 bg-kumo-fill rounded-md">
                        <div className="text-xs text-kumo-strong">Max Batch Timeout</div>
                        <div className="font-mono text-sm">{matchingConsumer.max_batch_timeout} seconds</div>
                      </div>
                      <div className="p-3 bg-kumo-fill rounded-md">
                        <div className="text-xs text-kumo-strong">Max Retries</div>
                        <div className="font-mono text-sm">{matchingConsumer.max_retries}</div>
                      </div>
                      <div className="p-3 bg-kumo-fill rounded-md">
                        <div className="text-xs text-kumo-strong">Dead Letter Queue</div>
                        <div className="font-mono text-sm">{matchingConsumer.dead_letter_queue ?? "None"}</div>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-kumo-strong">
                      Consumer waits up to {matchingConsumer.max_batch_timeout}s or {matchingConsumer.max_batch_size} messages before processing a batch.
                    </p>
                  </div>
                )}

                {/* Producer info */}
                <div className="border border-kumo-line rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <PaperPlaneRightIcon size={20} className="text-queues" />
                    <h3 className="text-sm font-semibold">Producer: {selectedQueue}</h3>
                  </div>
                  <div className="p-3 bg-kumo-fill rounded-md">
                    <div className="text-xs text-kumo-strong">Queue Name</div>
                    <div className="font-mono text-sm">{selectedProducer?.queue}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center max-w-md">
                <CheckCircleIcon size={48} className="text-kumo-subtle mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Queue</h3>
                <p className="text-sm text-kumo-strong mb-4">
                  Choose a queue from the sidebar to send messages and view configuration.
                </p>
                <div className="p-4 rounded-lg bg-kumo-tint/50 text-left text-sm">
                  <p className="font-medium mb-2">With Localflare you can:</p>
                  <ul className="space-y-1 text-kumo-strong text-xs">
                    <li>• Send messages to queues directly from the dashboard</li>
                    <li>• View queue configuration from wrangler.toml</li>
                    <li>• Display producer and consumer settings</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  TaskDone01Icon,
  Sent02Icon,
  Settings02Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PageHeader } from "@/components/ui/page-header"
import { StatsCard, StatsCardGroup } from "@/components/ui/stats-card"
import { EmptyState } from "@/components/ui/empty-state"
import { queueApi } from "@/lib/api"

interface SentMessage {
  id: number
  content: unknown
  timestamp: Date
}

export default function QueuesExplorer() {
  const [messageType, setMessageType] = useState<"text" | "json">("text")
  const [textMessage, setTextMessage] = useState("")
  const [jsonMessage, setJsonMessage] = useState('{\n  "type": "task",\n  "data": "example"\n}')
  const [sentMessages, setSentMessages] = useState<SentMessage[]>([])

  const sendMutation = useMutation({
    mutationFn: queueApi.sendMessage,
    onSuccess: (_, variables) => {
      setSentMessages((prev) => [
        { id: Date.now(), content: variables, timestamp: new Date() },
        ...prev,
      ])
      if (messageType === "text") {
        setTextMessage("")
      }
    },
  })

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault()
    if (textMessage) {
      sendMutation.mutate({ type: "text", message: textMessage })
    }
  }

  const handleSendJson = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const parsed = JSON.parse(jsonMessage)
      sendMutation.mutate(parsed)
    } catch {
      alert("Invalid JSON")
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <PageHeader
          icon={TaskDone01Icon}
          iconColor="text-queues"
          title="Queues"
          description="Message queue for async task processing"
        />

        {/* Stats */}
        <StatsCardGroup className="mt-6">
          <StatsCard
            icon={Sent02Icon}
            iconColor="text-queues"
            label="Messages Sent"
            value={sentMessages.length}
            description="This session"
          />
          <StatsCard
            icon={Settings02Icon}
            iconColor="text-muted-foreground"
            label="Queue"
            value="task-queue"
            description="Producer binding: TASKS"
          />
        </StatsCardGroup>
      </div>

      {/* Content */}
      <div className="flex-1 flex min-h-0">
        {/* Send Message Panel */}
        <div className="flex-1 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold">Send Message</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Send a message to the task-queue
            </p>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <Tabs value={messageType} onValueChange={(v) => setMessageType(v as "text" | "json")}>
              <TabsList className="mb-4">
                <TabsTrigger value="text">Text</TabsTrigger>
                <TabsTrigger value="json">JSON</TabsTrigger>
              </TabsList>

              <TabsContent value="text">
                <form onSubmit={handleSendText} className="space-y-4">
                  <div>
                    <Label htmlFor="text-message">Message</Label>
                    <Input
                      id="text-message"
                      placeholder="Enter your message..."
                      value={textMessage}
                      onChange={(e) => setTextMessage(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <Button type="submit" disabled={sendMutation.isPending || !textMessage}>
                    <HugeiconsIcon icon={Sent02Icon} className="size-4 mr-1.5" strokeWidth={2} />
                    Send Message
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="json">
                <form onSubmit={handleSendJson} className="space-y-4">
                  <div>
                    <Label htmlFor="json-message">JSON Payload</Label>
                    <textarea
                      id="json-message"
                      className="mt-1.5 w-full min-h-48 p-3 rounded-md border border-input bg-background font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                      value={jsonMessage}
                      onChange={(e) => setJsonMessage(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={sendMutation.isPending}>
                    <HugeiconsIcon icon={Sent02Icon} className="size-4 mr-1.5" strokeWidth={2} />
                    Send JSON
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Queue Config Info */}
            <div className="mt-6 p-4 border border-border rounded-lg bg-card">
              <h4 className="text-xs font-semibold mb-3">Queue Configuration</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-3 bg-muted rounded-lg">
                  <h5 className="text-xs font-medium mb-2">Producer</h5>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Binding:</span>
                      <code>TASKS</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Queue:</span>
                      <code>task-queue</code>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <h5 className="text-xs font-medium mb-2">Consumer</h5>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Batch Size:</span>
                      <code>10</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Batch Timeout:</span>
                      <code>5s</code>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Messages are processed by the queue consumer handler. Check terminal logs.
              </p>
            </div>
          </div>
        </div>

        {/* Sent Messages Panel */}
        <div className="w-80 flex flex-col bg-muted/30">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold">Sent Messages</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sentMessages.length} messages this session
            </p>
          </div>
          <ScrollArea className="flex-1">
            {sentMessages.length === 0 ? (
              <EmptyState
                icon={Sent02Icon}
                title="No messages sent"
                description="Send a message to see it here"
                className="py-8"
              />
            ) : (
              <div className="p-2 space-y-2">
                {sentMessages.map((msg) => (
                  <div key={msg.id} className="p-3 bg-card border border-border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <HugeiconsIcon
                        icon={TaskDone01Icon}
                        className="size-4 text-green-500"
                        strokeWidth={2}
                      />
                      <Badge variant="secondary" className="text-xs">
                        Sent
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-muted p-2 rounded">
                      {JSON.stringify(msg.content, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

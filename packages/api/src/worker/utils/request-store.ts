/**
 * In-memory store for captured requests and logs.
 * Uses a circular buffer to limit memory usage.
 */

export interface CapturedRequest {
  id: string
  timestamp: string
  method: string
  url: string
  path: string
  headers: Record<string, string>
  body?: string
  response?: {
    status: number
    statusText: string
    headers: Record<string, string>
    body?: string
    duration: number
  }
}

export interface LogEntry {
  id: string
  timestamp: string
  level: 'log' | 'info' | 'warn' | 'error' | 'debug'
  source: 'worker' | 'queue' | 'do' | 'system' | 'request'
  message: string
  data?: unknown
}

const MAX_REQUESTS = 500
const MAX_LOGS = 1000
const MAX_BODY_SIZE = 100 * 1024 // 100KB max body capture

// In-memory stores (per isolate instance)
let requests: CapturedRequest[] = []
let logs: LogEntry[] = []

// SSE subscribers
type Subscriber = (event: string, data: unknown) => void
let subscribers: Set<Subscriber> = new Set()

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function broadcast(event: string, data: unknown) {
  for (const subscriber of subscribers) {
    try {
      subscriber(event, data)
    } catch {
      // Subscriber may have disconnected; remove from set to prevent memory leak
      subscribers.delete(subscriber)
    }
  }
}

export const requestStore = {
  /**
   * Capture a request before proxying
   */
  startRequest(req: Request): string {
    const id = generateId()
    const url = new URL(req.url)

    const captured: CapturedRequest = {
      id,
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      path: url.pathname + url.search,
      headers: Object.fromEntries(req.headers.entries()),
    }

    requests.push(captured)

    // Trim to max size
    if (requests.length > MAX_REQUESTS) {
      requests = requests.slice(-MAX_REQUESTS)
    }

    return id
  },

  /**
   * Complete a request with response data
   */
  async completeRequest(
    id: string,
    response: Response,
    startTime: number,
    captureBody = true
  ): Promise<void> {
    const request = requests.find(r => r.id === id)
    if (!request) return

    let body: string | undefined
    if (captureBody && response.body) {
      try {
        const cloned = response.clone()
        const buffer = await cloned.arrayBuffer()
        if (buffer.byteLength <= MAX_BODY_SIZE) {
          const contentType = response.headers.get('content-type') || ''
          if (contentType.includes('application/json') ||
              contentType.includes('text/') ||
              contentType.includes('javascript')) {
            body = new TextDecoder().decode(buffer)
          } else {
            body = `[Binary data: ${buffer.byteLength} bytes]`
          }
        } else {
          body = `[Response too large: ${buffer.byteLength} bytes]`
        }
      } catch {
        body = '[Could not read body]'
      }
    }

    request.response = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body,
      duration: Date.now() - startTime,
    }

    // Broadcast the completed request
    broadcast('request', request)

    // Also add as a log entry
    const logEntry: LogEntry = {
      id: generateId(),
      timestamp: request.timestamp,
      level: response.status >= 400 ? 'error' : 'info',
      source: 'request',
      message: `${request.method} ${request.path} → ${response.status} (${request.response.duration}ms)`,
      data: {
        requestId: id,
        method: request.method,
        path: request.path,
        status: response.status,
        duration: request.response.duration,
      },
    }
    logStore.add(logEntry)
  },

  /**
   * Get all captured requests
   */
  getAll(): CapturedRequest[] {
    return [...requests]
  },

  /**
   * Get a specific request by ID
   */
  get(id: string): CapturedRequest | undefined {
    return requests.find(r => r.id === id)
  },

  /**
   * Clear all requests
   */
  clear(): void {
    requests = []
  },
}

export const logStore = {
  /**
   * Add a log entry
   */
  add(entry: LogEntry): void {
    logs.push(entry)

    // Trim to max size
    if (logs.length > MAX_LOGS) {
      logs = logs.slice(-MAX_LOGS)
    }

    // Broadcast to subscribers
    broadcast('log', entry)
  },

  /**
   * Add a simple log message
   */
  log(level: LogEntry['level'], message: string, data?: unknown, source: LogEntry['source'] = 'system'): void {
    const entry: LogEntry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      data,
    }
    this.add(entry)
  },

  /**
   * Get all logs
   */
  getAll(): LogEntry[] {
    return [...logs]
  },

  /**
   * Get recent logs with limit
   */
  getRecent(limit = 100): LogEntry[] {
    return logs.slice(-limit)
  },

  /**
   * Clear all logs
   */
  clear(): void {
    logs = []
  },
}

export const sseManager = {
  /**
   * Subscribe to events
   */
  subscribe(callback: Subscriber): () => void {
    subscribers.add(callback)
    return () => {
      subscribers.delete(callback)
    }
  },

  /**
   * Create an SSE stream response
   */
  createStream(): { response: Response; close: () => void } {
    const encoder = new TextEncoder()
    let controller: ReadableStreamDefaultController<Uint8Array> | null = null
    let unsubscribe: (() => void) | null = null

    const stream = new ReadableStream<Uint8Array>({
      start(ctrl) {
        controller = ctrl

        // Send initial connection message
        const initMsg = `event: connected\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`
        controller.enqueue(encoder.encode(initMsg))

        // Subscribe to events
        unsubscribe = sseManager.subscribe((event, data) => {
          if (controller) {
            const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
            try {
              controller.enqueue(encoder.encode(msg))
            } catch {
              // Stream may be closed
            }
          }
        })
      },
      cancel() {
        if (unsubscribe) {
          unsubscribe()
        }
      },
    })

    const response = new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

    return {
      response,
      close: () => {
        if (unsubscribe) {
          unsubscribe()
        }
        if (controller) {
          try {
            controller.close()
          } catch {
            // Already closed
          }
        }
      },
    }
  },
}

import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'

export interface LogEntry {
  id: string
  timestamp: string
  level: 'log' | 'info' | 'warn' | 'error' | 'debug'
  source: 'worker' | 'queue' | 'do' | 'system'
  message: string
  data?: unknown
}

// In-memory log buffer (circular buffer, keeps last N logs)
const MAX_LOGS = 1000
const logBuffer: LogEntry[] = []
const logListeners: Set<(log: LogEntry) => void> = new Set()

// Add a log entry
export function addLog(entry: Omit<LogEntry, 'id' | 'timestamp'>): void {
  const logEntry: LogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  }

  logBuffer.push(logEntry)

  // Keep buffer size limited
  while (logBuffer.length > MAX_LOGS) {
    logBuffer.shift()
  }

  // Notify all listeners
  logListeners.forEach((listener) => listener(logEntry))
}

// Subscribe to new logs
function subscribeToLogs(listener: (log: LogEntry) => void): () => void {
  logListeners.add(listener)
  return () => logListeners.delete(listener)
}

// Get recent logs
function getRecentLogs(limit = 100): LogEntry[] {
  return logBuffer.slice(-limit)
}

// Clear logs
function clearLogs(): void {
  logBuffer.length = 0
}

export function createLogsRoutes() {
  const app = new Hono()

  // Add initial system log
  addLog({
    level: 'info',
    source: 'system',
    message: 'Localflare API started (--studio mode)',
  })

  // Get recent logs
  app.get('/', (c) => {
    const limit = parseInt(c.req.query('limit') || '100')
    return c.json({
      logs: getRecentLogs(limit),
    })
  })

  // Stream logs via SSE
  app.get('/stream', (c) => {
    return streamSSE(c, async (stream) => {
      // Send recent logs first
      const recentLogs = getRecentLogs(50)
      for (const log of recentLogs) {
        await stream.writeSSE({
          data: JSON.stringify(log),
          event: 'log',
          id: log.id,
        })
      }

      // Subscribe to new logs
      const unsubscribe = subscribeToLogs(async (log) => {
        try {
          await stream.writeSSE({
            data: JSON.stringify(log),
            event: 'log',
            id: log.id,
          })
        } catch {
          // Client disconnected
          unsubscribe()
        }
      })

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(async () => {
        try {
          await stream.writeSSE({
            data: '',
            event: 'heartbeat',
          })
        } catch {
          clearInterval(heartbeat)
          unsubscribe()
        }
      }, 30000)

      // Wait for client disconnect
      await new Promise(() => {
        // This promise never resolves - we wait until the client disconnects
      })
    })
  })

  // Clear logs
  app.delete('/', (c) => {
    clearLogs()
    addLog({
      level: 'info',
      source: 'system',
      message: 'Logs cleared',
    })
    return c.json({ success: true })
  })

  // Manual log entry (for testing or external sources)
  app.post('/', async (c) => {
    const body = await c.req.json<{
      level?: LogEntry['level']
      source?: LogEntry['source']
      message: string
      data?: unknown
    }>()

    addLog({
      level: body.level ?? 'log',
      source: body.source ?? 'worker',
      message: body.message,
      data: body.data,
    })

    return c.json({ success: true })
  })

  return app
}

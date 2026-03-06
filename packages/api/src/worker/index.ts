/**
 * Localflare API Worker
 *
 * This worker runs alongside the user's worker in the same workerd process,
 * sharing bindings via the same binding IDs. This enables:
 *
 * - Direct access to D1, KV, R2 via native Workers APIs
 * - Queue message sending via shared queue bindings
 * - Durable Object interaction via stubs
 *
 * The CLI spawns wrangler with both configs:
 *   npx localflare  →  wrangler dev -c .localflare/wrangler.toml -c wrangler.toml
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env } from './types.js'
import { createBindingsRoutes } from './routes/bindings.js'
import { createD1Routes } from './routes/d1.js'
import { createKVRoutes } from './routes/kv.js'
import { createR2Routes } from './routes/r2.js'
import { createQueuesRoutes } from './routes/queues.js'
import { createDORoutes } from './routes/do.js'
import { createLogsRoutes } from './routes/logs.js'
import { createRequestsRoutes } from './routes/requests.js'
import { createAnalyticsRoutes } from './routes/analytics.js'
import { requestStore, logStore } from './utils/request-store.js'

const app = new Hono<{ Bindings: Env }>()

// CORS middleware - allow dashboard access
app.use(
  '*',
  cors({
    origin: [
      'https://studio.localflare.dev',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://[::1]:5173',
      'http://[::1]:5174',
    ],
    credentials: true,
  })
)

// Localflare API routes use /__localflare/ prefix to avoid conflicts with user's /api/* routes
const API_PREFIX = '/__localflare'

// Health check
app.get(`${API_PREFIX}/health`, (c) => {
  logStore.log('info', 'Health check: Localflare API is running', undefined, 'system')
  return c.json({
    status: 'ok',
    message: 'Localflare API is running with shared bindings.',
  })
})

// Mount API routes under /__localflare/ prefix
app.route(`${API_PREFIX}/bindings`, createBindingsRoutes())
app.route(`${API_PREFIX}/d1`, createD1Routes())
app.route(`${API_PREFIX}/kv`, createKVRoutes())
app.route(`${API_PREFIX}/r2`, createR2Routes())
app.route(`${API_PREFIX}/queues`, createQueuesRoutes())
app.route(`${API_PREFIX}/do`, createDORoutes())
app.route(`${API_PREFIX}/logs`, createLogsRoutes())
app.route(`${API_PREFIX}/requests`, createRequestsRoutes())
app.route(`${API_PREFIX}/analytics`, createAnalyticsRoutes())

// Proxy all other requests to user's worker (if available via service binding)
// Captures request/response for the Network inspector
app.all('*', async (c) => {
  // Check if USER_WORKER service binding exists
  const userWorker = c.env.USER_WORKER as { fetch: typeof fetch } | undefined

  if (userWorker) {
    // Start capturing this request
    const requestId = requestStore.startRequest(c.req.raw)
    const startTime = Date.now()

    try {
      // Forward request to user's worker
      const response = await userWorker.fetch(c.req.raw.clone())

      // Complete the request capture with response data
      await requestStore.completeRequest(requestId, response, startTime)

      return response
    } catch (error) {
      // Log the error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logStore.log('error', `Request failed: ${errorMessage}`, { requestId, error: errorMessage }, 'request')

      return c.json({
        error: 'Worker error',
        message: errorMessage,
      }, 500)
    }
  }

  // No user worker bound - return 404 for non-API routes
  return c.json({
    error: 'Not found',
    message: 'This route is not handled by Localflare API. User worker not bound.',
  }, 404)
})

// Export the worker
export default app

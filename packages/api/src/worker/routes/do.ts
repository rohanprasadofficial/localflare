import { Hono } from 'hono'
import type { Env } from '../types.js'
import { getManifest } from '../types.js'

/**
 * Durable Objects routes for the sidecar worker.
 *
 * Storage inspection works by proxying to a Node.js-side CLI server
 * that reads the DO SQLite files directly from disk. The URL is
 * provided via the LOCALFLARE_DO_STORAGE_URL env var.
 */
export function createDORoutes() {
  const app = new Hono<{ Bindings: Env }>()

  // ── Helpers ─────────────────────────────────────────────────────

  /** Proxy a request to the CLI DO storage server */
  async function proxyToStorageServer(
    env: Env,
    path: string,
    init?: RequestInit,
  ): Promise<Response | null> {
    const baseUrl = env.LOCALFLARE_DO_STORAGE_URL as string | undefined
    if (!baseUrl) return null
    try {
      return await fetch(`${baseUrl}${path}`, init)
    } catch {
      return null
    }
  }

  // ── Class / binding listing ───────────────────────────────────

  // List all DO classes from config
  app.get('/', async (c) => {
    const manifest = getManifest(c.env)
    return c.json({
      durableObjects: manifest.do.map((doConfig) => ({
        binding: doConfig.binding,
        class_name: doConfig.className,
      })),
    })
  })

  // ── Storage routes (proxied to CLI server) ────────────────────

  // List instances for a binding (from disk)
  app.get('/:binding/storage/instances', async (c) => {
    const binding = c.req.param('binding')
    const encodedBinding = encodeURIComponent(binding)
    const resp = await proxyToStorageServer(c.env, `/do/${encodedBinding}/instances`)
    if (resp) return resp
    return c.json(
      {
        error: 'DO storage server not available',
        hint: 'Ensure localflare started with DO bindings.',
      },
      503,
    )
  })

  // Schema for an instance
  app.get('/:binding/:instanceId/storage/schema', async (c) => {
    const { binding, instanceId } = c.req.param()
    const resp = await proxyToStorageServer(
      c.env,
      `/do/${encodeURIComponent(binding)}/${encodeURIComponent(instanceId)}/schema`,
    )
    if (resp) return resp
    return c.json({ error: 'DO storage server not available' }, 503)
  })

  // Table info for an instance
  app.get('/:binding/:instanceId/storage/tables/:table', async (c) => {
    const { binding, instanceId } = c.req.param()
    const table = c.req.param('table')
    const resp = await proxyToStorageServer(
      c.env,
      `/do/${encodeURIComponent(binding)}/${encodeURIComponent(instanceId)}/tables/${encodeURIComponent(table)}`,
    )
    if (resp) return resp
    return c.json({ error: 'DO storage server not available' }, 503)
  })

  // Paginated rows for a table in an instance
  app.get('/:binding/:instanceId/storage/tables/:table/rows', async (c) => {
    const { binding, instanceId } = c.req.param()
    const table = c.req.param('table')
    const qs = c.req.url.split('?')[1] || ''
    const path = `/do/${encodeURIComponent(binding)}/${encodeURIComponent(instanceId)}/tables/${encodeURIComponent(table)}/rows${qs ? `?${qs}` : ''}`
    const resp = await proxyToStorageServer(c.env, path)
    if (resp) return resp
    return c.json({ error: 'DO storage server not available' }, 503)
  })

  // Execute SQL query against an instance
  app.post('/:binding/:instanceId/storage/query', async (c) => {
    const { binding, instanceId } = c.req.param()
    const body = await c.req.text()
    const resp = await proxyToStorageServer(
      c.env,
      `/do/${encodeURIComponent(binding)}/${encodeURIComponent(instanceId)}/query`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      },
    )
    if (resp) return resp
    return c.json({ error: 'DO storage server not available' }, 503)
  })

  // DurableObjectStorage KV entries for an instance
  app.get('/:binding/:instanceId/storage/kv', async (c) => {
    const { binding, instanceId } = c.req.param()
    const qs = c.req.url.split('?')[1] || ''
    const path = `/do/${encodeURIComponent(binding)}/${encodeURIComponent(instanceId)}/kv${qs ? `?${qs}` : ''}`
    const resp = await proxyToStorageServer(c.env, path)
    if (resp) return resp
    return c.json({ error: 'DO storage server not available' }, 503)
  })

  // ── Instance creation / ID resolution ─────────────────────────

  // Get DO ID from name or validate existing ID
  app.post('/:binding/id', async (c) => {
    const binding = c.req.param('binding')
    const manifest = getManifest(c.env)

    const doConfig = manifest.do.find((d) => d.binding === binding)
    if (!doConfig) {
      return c.json({ error: 'Durable Object binding not found' }, 404)
    }

    const namespace = c.env[binding] as DurableObjectNamespace | undefined
    if (!namespace || typeof namespace !== 'object' || !('idFromName' in namespace)) {
      return c.json({ error: 'Durable Object namespace not available' }, 404)
    }

    try {
      const body = await c.req.json<{ name?: string; id?: string }>()

      if (body.id) {
        const doId = namespace.idFromString(body.id)
        return c.json({ id: doId.toString() })
      } else if (body.name) {
        const doId = namespace.idFromName(body.name)
        return c.json({ id: doId.toString() })
      } else {
        const doId = namespace.newUniqueId()
        return c.json({ id: doId.toString() })
      }
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    }
  })

  // ── Fetch proxy (send HTTP request to a DO instance) ──────────

  app.all('/:binding/:instanceId/fetch/*', async (c) => {
    const binding = c.req.param('binding')
    const instanceId = c.req.param('instanceId')

    const namespace = c.env[binding] as DurableObjectNamespace | undefined
    if (!namespace || typeof namespace !== 'object' || !('idFromName' in namespace)) {
      return c.json({ error: 'Durable Object namespace not available' }, 404)
    }

    try {
      let id: DurableObjectId
      try {
        id = namespace.idFromString(instanceId)
      } catch {
        id = namespace.idFromName(instanceId)
      }

      const stub = namespace.get(id)

      const path = c.req.path.split('/fetch/')[1] || ''
      const url = new URL(`https://do-stub/${path}`)

      const response = await stub.fetch(url.toString(), {
        method: c.req.method,
        headers: c.req.raw.headers,
        body: c.req.method !== 'GET' && c.req.method !== 'HEAD' ? c.req.raw.body : undefined,
      })

      return response
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    }
  })

  return app
}

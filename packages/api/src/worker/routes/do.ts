import { Hono } from 'hono'
import type { Env } from '../types.js'
import { getManifest } from '../types.js'

/**
 * Durable Objects routes for the sidecar worker.
 *
 * Note: DO storage access is limited in sidecar mode because:
 * 1. We can only get DO stubs, not access storage directly
 * 2. To list storage, the DO would need to expose an endpoint for it
 * 3. The user's DO implementation determines what's accessible
 *
 * For now, we list available DOs and provide hints on usage.
 */
export function createDORoutes() {
  const app = new Hono<{ Bindings: Env }>()

  // List all DO classes from config
  app.get('/', async (c) => {
    const manifest = getManifest(c.env)
    return c.json({
      durableObjects: manifest.do.map((doConfig) => ({
        binding: doConfig.binding,
        class_name: doConfig.className,
      })),
      hint: 'Durable Object storage inspection requires the DO to expose a storage endpoint.',
    })
  })

  // List all DO instances across all namespaces (fixes Issue #51)
  app.get('/instances', async (c) => {
    const manifest = getManifest(c.env)
    return c.json({
      instances: [],
      namespaces: manifest.do.map((doConfig) => ({
        binding: doConfig.binding,
        class_name: doConfig.className,
      })),
      hint: 'Cannot enumerate arbitrary DO instances directly without stored instance records. Use idFromName() or idFromString().',
    })
  })

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
        // Validate and return hex string ID
        const doId = namespace.idFromString(body.id)
        return c.json({ id: doId.toString() })
      } else if (body.name) {
        // Generate ID from name
        const doId = namespace.idFromName(body.name)
        return c.json({ id: doId.toString() })
      } else {
        // Generate a new unique ID
        const doId = namespace.newUniqueId()
        return c.json({ id: doId.toString() })
      }
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    }
  })

  // Get a stub for a DO instance
  app.get('/:binding/instances', async (c) => {
    const binding = c.req.param('binding')
    const manifest = getManifest(c.env)

    const doConfig = manifest.do.find((d) => d.binding === binding)
    if (!doConfig) {
      return c.json({ error: 'Durable Object binding not found' }, 404)
    }

    const namespace = c.env[binding]
    if (!namespace || typeof namespace !== 'object' || !('idFromName' in namespace)) {
      return c.json({ error: 'Durable Object namespace not available' }, 404)
    }

    // Can't list instances directly from namespace - need to track them separately
    return c.json({
      binding: doConfig.binding,
      className: doConfig.className,
      hint: 'Cannot list instances directly. Use idFromName() or idFromString() to get specific instances.',
    })
  })

  // Fetch from a DO instance (proxy through)
  app.all('/:binding/:instanceId/fetch/*', async (c) => {
    const binding = c.req.param('binding')
    const instanceId = c.req.param('instanceId')

    const namespace = c.env[binding] as DurableObjectNamespace | undefined
    if (!namespace || typeof namespace !== 'object' || !('idFromName' in namespace)) {
      return c.json({ error: 'Durable Object namespace not available' }, 404)
    }

    try {
      // Get stub - try as hex ID first, then as name
      let id: DurableObjectId
      try {
        id = namespace.idFromString(instanceId)
      } catch {
        id = namespace.idFromName(instanceId)
      }

      const stub = namespace.get(id)

      // Extract the remaining path after /fetch/
      const path = c.req.path.split('/fetch/')[1] || ''
      const url = new URL(`https://do-stub/${path}`)

      // Forward the request
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

  // Storage inspection - requires DO to have a /storage endpoint
  app.get('/:binding/:instanceId/storage', async (c) => {
    const binding = c.req.param('binding')
    const instanceId = c.req.param('instanceId')

    const namespace = c.env[binding] as DurableObjectNamespace | undefined
    if (!namespace || typeof namespace !== 'object' || !('idFromName' in namespace)) {
      return c.json({ error: 'Durable Object namespace not available' }, 404)
    }

    try {
      // Get stub
      let id: DurableObjectId
      try {
        id = namespace.idFromString(instanceId)
      } catch {
        id = namespace.idFromName(instanceId)
      }

      const stub = namespace.get(id)

      // Try to call a /storage endpoint if the DO exposes one
      const response = await stub.fetch('https://do-stub/storage', {
        method: 'GET',
      })

      if (response.ok) {
        const data = await response.json()
        return c.json(data)
      }

      return c.json({
        error: 'Storage inspection not available',
        hint: 'The Durable Object does not expose a /storage endpoint. Add a handler for GET /storage in your DO to enable this feature.',
        status: response.status,
      }, 501)
    } catch (error) {
      return c.json({
        error: String(error),
        hint: 'To inspect DO storage, add a /storage endpoint to your Durable Object that returns storage.list() results.',
      }, 500)
    }
  })

  return app
}

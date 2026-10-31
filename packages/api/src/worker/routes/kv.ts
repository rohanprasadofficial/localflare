import { Hono } from 'hono'
import type { Env } from '../types.js'
import { getManifest, isKVNamespace } from '../types.js'

export function createKVRoutes() {
  const app = new Hono<{ Bindings: Env }>()

  // Helper to get KV namespace from env
  function getKV(env: Env, binding: string): KVNamespace | null {
    const kv = env[binding]
    if (isKVNamespace(kv)) {
      return kv
    }
    return null
  }

  // List all KV namespaces
  app.get('/', async (c) => {
    const manifest = getManifest(c.env)
    return c.json({
      namespaces: manifest.kv.map((kv) => ({
        binding: kv.binding,
        id: kv.binding,
      })),
    })
  })

  // List keys in a namespace
  app.get('/:binding/keys', async (c) => {
    const kv = getKV(c.env, c.req.param('binding'))
    if (!kv) {
      return c.json({ error: 'Namespace not found' }, 404)
    }

    try {
      const prefix = c.req.query('prefix') || undefined
      const limit = Number(c.req.query('limit')) || 100
      const cursor = c.req.query('cursor') || undefined

      const result = await kv.list({
        prefix,
        limit,
        cursor,
      })

      return c.json({
        keys: result.keys.map((key) => ({
          name: key.name,
          expiration: key.expiration,
          metadata: key.metadata,
        })),
        cursor: result.cursor || undefined,
        list_complete: result.list_complete,
      })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    }
  })

  // Get a value
  app.get('/:binding/keys/:key', async (c) => {
    const kv = getKV(c.env, c.req.param('binding'))
    if (!kv) {
      return c.json({ error: 'Namespace not found' }, 404)
    }

    try {
      const key = c.req.param('key')
      const type = c.req.query('type') || 'text'

      // Get value with metadata
      const { value, metadata } = await kv.getWithMetadata(key, {
        type: type === 'json' ? 'json' : type === 'arrayBuffer' ? 'arrayBuffer' : 'text',
      })

      if (value === null) {
        return c.json({ error: 'Key not found' }, 404)
      }

      // For arrayBuffer, convert to base64 safely without call stack overflow
      let responseValue = value
      if (type === 'arrayBuffer' && value instanceof ArrayBuffer) {
        responseValue = Buffer.from(value).toString('base64')
      }

      return c.json({
        key,
        value: responseValue,
        metadata,
      })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    }
  })

  // Set a value
  app.put('/:binding/keys/:key', async (c) => {
    const kv = getKV(c.env, c.req.param('binding'))
    if (!kv) {
      return c.json({ error: 'Namespace not found' }, 404)
    }

    try {
      const key = c.req.param('key')
      const body = await c.req.json<{
        value: string
        metadata?: Record<string, unknown>
        expirationTtl?: number
        expiration?: number
      }>()

      await kv.put(key, body.value, {
        metadata: body.metadata,
        expirationTtl: body.expirationTtl,
        expiration: body.expiration,
      })

      return c.json({ success: true })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    }
  })

  // Delete a key
  app.delete('/:binding/keys/:key', async (c) => {
    const kv = getKV(c.env, c.req.param('binding'))
    if (!kv) {
      return c.json({ error: 'Namespace not found' }, 404)
    }

    try {
      const key = c.req.param('key')
      await kv.delete(key)
      return c.json({ success: true })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    }
  })

  // Bulk delete keys
  app.post('/:binding/bulk-delete', async (c) => {
    const kv = getKV(c.env, c.req.param('binding'))
    if (!kv) {
      return c.json({ error: 'Namespace not found' }, 404)
    }

    try {
      const { keys } = await c.req.json<{ keys: string[] }>()

      // Delete each key (KV doesn't have bulk delete)
      await Promise.all(keys.map((key) => kv.delete(key)))

      return c.json({ success: true, deleted: keys.length })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    }
  })

  return app
}

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { DurableObject } from 'cloudflare:workers'

// Environment types
interface Env {
  DB: D1Database
  CACHE: KVNamespace
  SESSIONS: KVNamespace
  STORAGE: R2Bucket
  TASKS: Queue
  COUNTER: DurableObjectNamespace
  ENVIRONMENT: string
  API_VERSION: string
}

// Durable Object for counting
export class Counter extends DurableObject {
  private value: number = 0

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    // Load stored value
    this.value = (await this.ctx.storage.get<number>('value')) ?? 0

    switch (url.pathname) {
      case '/increment':
        this.value++
        await this.ctx.storage.put('value', this.value)
        return Response.json({ value: this.value })

      case '/decrement':
        this.value--
        await this.ctx.storage.put('value', this.value)
        return Response.json({ value: this.value })

      case '/reset':
        this.value = 0
        await this.ctx.storage.put('value', this.value)
        return Response.json({ value: this.value })

      default:
        return Response.json({ value: this.value })
    }
  }
}

// Main worker
const app = new Hono<{ Bindings: Env }>()

app.use('/api/*', cors())

// Health check
app.get('/api', (c) => {
  return c.json({
    name: 'Localflare Playground',
    environment: c.env.ENVIRONMENT,
    apiVersion: c.env.API_VERSION,
    endpoints: {
      users: '/api/users',
      posts: '/api/posts',
      kv: '/api/kv',
      r2: '/api/files',
      queue: '/api/queue',
      counter: '/api/counter/:name',
    },
  })
})

// ============ D1 Routes ============

// Get all users
app.get('/api/users', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM users').all()
  return c.json(results)
})

// Get user by ID
app.get('/api/users/:id', async (c) => {
  const id = c.req.param('id')
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first()

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json(user)
})

// Create user
app.post('/api/users', async (c) => {
  const { email, name, role } = await c.req.json<{ email: string; name: string; role?: string }>()

  const result = await c.env.DB.prepare('INSERT INTO users (email, name, role) VALUES (?, ?, ?)')
    .bind(email, name, role ?? 'user')
    .run()

  return c.json({ success: true, id: result.meta.last_row_id })
})

// Delete user
app.delete('/api/users/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// Get all posts
app.get('/api/posts', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT posts.*, users.name as author_name
    FROM posts
    JOIN users ON posts.user_id = users.id
    ORDER BY created_at DESC
  `).all()

  return c.json(results)
})

// ============ KV Routes ============

// List all keys
app.get('/api/kv', async (c) => {
  const prefix = c.req.query('prefix') || undefined
  const list = await c.env.CACHE.list({ prefix })
  return c.json({ keys: list.keys })
})

// Get KV value
app.get('/api/kv/:key', async (c) => {
  const key = c.req.param('key')
  const value = await c.env.CACHE.get(key)

  if (value === null) {
    return c.json({ error: 'Key not found' }, 404)
  }

  return c.json({ key, value })
})

// Set KV value
app.put('/api/kv/:key', async (c) => {
  const key = c.req.param('key')
  const { value, ttl } = await c.req.json<{ value: string; ttl?: number }>()

  await c.env.CACHE.put(key, value, ttl ? { expirationTtl: ttl } : undefined)

  return c.json({ success: true, key })
})

// Delete KV value
app.delete('/api/kv/:key', async (c) => {
  const key = c.req.param('key')
  await c.env.CACHE.delete(key)
  return c.json({ success: true })
})

// ============ R2 Routes ============

// List files
app.get('/api/files', async (c) => {
  const prefix = c.req.query('prefix') || undefined
  const list = await c.env.STORAGE.list({ prefix })

  return c.json({
    objects: list.objects.map((obj) => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded,
    })),
  })
})

// Upload file
app.put('/api/files/:key', async (c) => {
  const key = c.req.param('key')
  const body = await c.req.arrayBuffer()
  const contentType = c.req.header('Content-Type') ?? 'application/octet-stream'

  await c.env.STORAGE.put(key, body, {
    httpMetadata: { contentType },
  })

  return c.json({ success: true, key })
})

// Download file
app.get('/api/files/:key', async (c) => {
  const key = c.req.param('key')
  const object = await c.env.STORAGE.get(key)

  if (!object) {
    return c.json({ error: 'File not found' }, 404)
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
    },
  })
})

// Delete file
app.delete('/api/files/:key', async (c) => {
  const key = c.req.param('key')
  await c.env.STORAGE.delete(key)
  return c.json({ success: true })
})

// ============ Queue Routes ============

// Send message to queue
app.post('/api/queue', async (c) => {
  const message = await c.req.json()

  await c.env.TASKS.send(message)

  return c.json({ success: true, message: 'Message queued' })
})

// ============ Durable Object Routes ============

// Counter operations
app.get('/api/counter/:name', async (c) => {
  const name = c.req.param('name')
  const id = c.env.COUNTER.idFromName(name)
  const stub = c.env.COUNTER.get(id)

  const response = await stub.fetch(new Request('http://counter/'))
  return response
})

app.post('/api/counter/:name/increment', async (c) => {
  const name = c.req.param('name')
  const id = c.env.COUNTER.idFromName(name)
  const stub = c.env.COUNTER.get(id)

  const response = await stub.fetch(new Request('http://counter/increment'))
  return response
})

app.post('/api/counter/:name/decrement', async (c) => {
  const name = c.req.param('name')
  const id = c.env.COUNTER.idFromName(name)
  const stub = c.env.COUNTER.get(id)

  const response = await stub.fetch(new Request('http://counter/decrement'))
  return response
})

app.post('/api/counter/:name/reset', async (c) => {
  const name = c.req.param('name')
  const id = c.env.COUNTER.idFromName(name)
  const stub = c.env.COUNTER.get(id)

  const response = await stub.fetch(new Request('http://counter/reset'))
  return response
})

// Queue consumer handler
export default {
  fetch: app.fetch,

  async queue(batch: MessageBatch<unknown>, env: Env): Promise<void> {
    console.log(`Processing ${batch.messages.length} messages`)

    for (const message of batch.messages) {
      console.log('Message:', message.body)
      // Process the message...
      message.ack()
    }
  },
}

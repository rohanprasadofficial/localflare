import { Hono } from 'hono'
import Database from 'better-sqlite3'
import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import type { WranglerStateInfo } from '../lib/types.js'

interface KVEntry {
  key: string
  blob_id: string
  expiration: number | null
  metadata: string | null
}

export function createKVRoutes(stateInfo: WranglerStateInfo) {
  const app = new Hono()

  // Helper to get database instance
  function getDatabase(binding: string): { db: Database.Database; blobDir: string } | null {
    const kvFile = stateInfo.kvNamespaces.find(
      (f) => f.binding === binding || f.filename.startsWith(binding)
    )
    const index = parseInt(binding, 10)
    const file = kvFile ?? (Number.isInteger(index) ? stateInfo.kvNamespaces[index] : stateInfo.kvNamespaces[0])

    if (!file) return null

    const db = new Database(file.path, { readonly: false })
    db.pragma('journal_mode = WAL')
    db.pragma('busy_timeout = 5000')

    // Blob directory is in the KV namespace id folder (e.g., .wrangler/state/v3/kv/<kv_id>/blobs)
    // If we have kvId from config, use it; otherwise fall back to old behavior
    let blobDir: string
    if (file.kvId) {
      // KV id from wrangler.toml - blobs are at .wrangler/state/v3/kv/<kv_id>/blobs
      blobDir = join(dirname(dirname(file.path)), file.kvId, 'blobs')
    } else {
      // Fallback: try alongside the sqlite file
      blobDir = join(dirname(file.path), 'blobs', file.filename.replace('.sqlite', ''))
    }

    return { db, blobDir }
  }

  // Get blob content
  function readBlob(blobDir: string, blobId: string): Buffer | null {
    const blobPath = join(blobDir, blobId)
    if (!existsSync(blobPath)) return null
    return readFileSync(blobPath)
  }

  // Write blob content
  function writeBlob(blobDir: string, blobId: string, data: Buffer): void {
    mkdirSync(blobDir, { recursive: true })
    const blobPath = join(blobDir, blobId)
    writeFileSync(blobPath, data)
  }

  // Delete blob
  function deleteBlob(blobDir: string, blobId: string): void {
    const blobPath = join(blobDir, blobId)
    if (existsSync(blobPath)) {
      unlinkSync(blobPath)
    }
  }

  // Generate a blob ID
  function generateBlobId(): string {
    return [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')
  }

  // List all KV namespaces
  app.get('/', async (c) => {
    return c.json({
      namespaces: stateInfo.kvNamespaces.map((f, i) => ({
        binding: f.binding ?? `namespace_${i}`,
        id: f.binding ?? f.filename.replace('.sqlite', ''),
        file: f.filename,
      })),
    })
  })

  // List keys in a namespace
  app.get('/:binding/keys', async (c) => {
    const result = getDatabase(c.req.param('binding'))
    if (!result) {
      return c.json({ error: 'Namespace not found' }, 404)
    }

    const { db, blobDir } = result

    try {
      const prefix = c.req.query('prefix') || ''
      const limit = Number(c.req.query('limit')) || 100
      const cursor = c.req.query('cursor') || ''

      let query = `SELECT key, expiration, metadata FROM _mf_entries`
      const params: (string | number)[] = []

      if (prefix) {
        query += ` WHERE key LIKE ? || '%'`
        params.push(prefix)
      }

      if (cursor) {
        query += prefix ? ' AND' : ' WHERE'
        query += ` key > ?`
        params.push(cursor)
      }

      query += ` ORDER BY key LIMIT ?`
      params.push(limit + 1) // Fetch one extra to check if there are more

      const rows = db.prepare(query).all(...params) as KVEntry[]

      const hasMore = rows.length > limit
      const keys = rows.slice(0, limit).map((row) => ({
        name: row.key,
        expiration: row.expiration,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      }))

      return c.json({
        keys,
        cursor: hasMore ? keys[keys.length - 1]?.name : undefined,
        list_complete: !hasMore,
      })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    } finally {
      db.close()
    }
  })

  // Get a value
  app.get('/:binding/keys/:key', async (c) => {
    const result = getDatabase(c.req.param('binding'))
    if (!result) {
      return c.json({ error: 'Namespace not found' }, 404)
    }

    const { db, blobDir } = result

    try {
      const key = c.req.param('key')
      const type = c.req.query('type') || 'text'

      const row = db
        .prepare(`SELECT key, blob_id, expiration, metadata FROM _mf_entries WHERE key = ?`)
        .get(key) as KVEntry | undefined

      if (!row) {
        return c.json({ error: 'Key not found' }, 404)
      }

      // Check expiration
      if (row.expiration && row.expiration < Date.now() / 1000) {
        return c.json({ error: 'Key not found' }, 404)
      }

      // Read blob
      const blobData = readBlob(blobDir, row.blob_id)
      if (!blobData) {
        return c.json({ error: 'Blob not found' }, 404)
      }

      let value: unknown
      switch (type) {
        case 'json':
          value = JSON.parse(blobData.toString('utf-8'))
          break
        case 'arrayBuffer':
          value = blobData.toString('base64')
          break
        default:
          value = blobData.toString('utf-8')
      }

      return c.json({
        key,
        value,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    } finally {
      db.close()
    }
  })

  // Set a value
  app.put('/:binding/keys/:key', async (c) => {
    const result = getDatabase(c.req.param('binding'))
    if (!result) {
      return c.json({ error: 'Namespace not found' }, 404)
    }

    const { db, blobDir } = result

    try {
      const key = c.req.param('key')
      const body = await c.req.json<{
        value: string
        metadata?: Record<string, unknown>
        expirationTtl?: number
        expiration?: number
      }>()

      // Generate blob ID and write blob
      const blobId = generateBlobId()
      const blobData = Buffer.from(body.value, 'utf-8')
      writeBlob(blobDir, blobId, blobData)

      // Calculate expiration
      let expiration: number | null = null
      if (body.expiration) {
        expiration = body.expiration
      } else if (body.expirationTtl) {
        expiration = Math.floor(Date.now() / 1000) + body.expirationTtl
      }

      // Delete old blob if exists
      const oldRow = db
        .prepare(`SELECT blob_id FROM _mf_entries WHERE key = ?`)
        .get(key) as { blob_id: string } | undefined
      if (oldRow) {
        deleteBlob(blobDir, oldRow.blob_id)
      }

      // Upsert entry
      db.prepare(
        `INSERT OR REPLACE INTO _mf_entries (key, blob_id, expiration, metadata)
         VALUES (?, ?, ?, ?)`
      ).run(key, blobId, expiration, body.metadata ? JSON.stringify(body.metadata) : null)

      return c.json({ success: true })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    } finally {
      db.close()
    }
  })

  // Delete a key
  app.delete('/:binding/keys/:key', async (c) => {
    const result = getDatabase(c.req.param('binding'))
    if (!result) {
      return c.json({ error: 'Namespace not found' }, 404)
    }

    const { db, blobDir } = result

    try {
      const key = c.req.param('key')

      // Get blob ID to delete
      const row = db
        .prepare(`SELECT blob_id FROM _mf_entries WHERE key = ?`)
        .get(key) as { blob_id: string } | undefined

      if (row) {
        deleteBlob(blobDir, row.blob_id)
        db.prepare(`DELETE FROM _mf_entries WHERE key = ?`).run(key)
      }

      return c.json({ success: true })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    } finally {
      db.close()
    }
  })

  // Bulk delete keys
  app.post('/:binding/bulk-delete', async (c) => {
    const result = getDatabase(c.req.param('binding'))
    if (!result) {
      return c.json({ error: 'Namespace not found' }, 404)
    }

    const { db, blobDir } = result

    try {
      const { keys } = await c.req.json<{ keys: string[] }>()

      for (const key of keys) {
        const row = db
          .prepare(`SELECT blob_id FROM _mf_entries WHERE key = ?`)
          .get(key) as { blob_id: string } | undefined

        if (row) {
          deleteBlob(blobDir, row.blob_id)
          db.prepare(`DELETE FROM _mf_entries WHERE key = ?`).run(key)
        }
      }

      return c.json({ success: true, deleted: keys.length })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    } finally {
      db.close()
    }
  })

  return app
}

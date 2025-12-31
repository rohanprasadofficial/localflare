import { Hono } from 'hono'
import Database from 'better-sqlite3'
import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import type { WranglerStateInfo } from '../lib/types.js'

interface R2Object {
  key: string
  blob_id: string | null
  version: string
  size: number
  etag: string
  uploaded: number
  checksums: string
  http_metadata: string
  custom_metadata: string
}

export function createR2Routes(stateInfo: WranglerStateInfo) {
  const app = new Hono()

  // Helper to get database instance
  function getDatabase(binding: string): { db: Database.Database; blobDir: string } | null {
    const r2File = stateInfo.r2Buckets.find(
      (f) => f.binding === binding || f.filename.startsWith(binding)
    )
    const index = parseInt(binding, 10)
    const file = r2File ?? (Number.isInteger(index) ? stateInfo.r2Buckets[index] : stateInfo.r2Buckets[0])

    if (!file) return null

    const db = new Database(file.path, { readonly: false })
    db.pragma('journal_mode = WAL')
    db.pragma('busy_timeout = 5000')

    // Blob directory is in the bucket name folder (e.g., .wrangler/state/v3/r2/<bucket_name>/blobs)
    // If we have bucketName from config, use it; otherwise fall back to old behavior
    let blobDir: string
    if (file.bucketName) {
      // Bucket name from wrangler.toml - blobs are at .wrangler/state/v3/r2/<bucket_name>/blobs
      blobDir = join(dirname(dirname(file.path)), file.bucketName, 'blobs')
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

  // List all R2 buckets
  app.get('/', async (c) => {
    return c.json({
      buckets: stateInfo.r2Buckets.map((f, i) => ({
        binding: f.binding ?? `bucket_${i}`,
        bucket_name: f.binding ?? f.filename.replace('.sqlite', ''),
        file: f.filename,
      })),
    })
  })

  // List objects in a bucket
  app.get('/:binding/objects', async (c) => {
    const result = getDatabase(c.req.param('binding'))
    if (!result) {
      return c.json({ error: 'Bucket not found' }, 404)
    }

    const { db } = result

    try {
      const prefix = c.req.query('prefix') || ''
      const limit = Number(c.req.query('limit')) || 100
      const cursor = c.req.query('cursor') || ''
      const delimiter = c.req.query('delimiter')

      let query = `SELECT key, version, size, etag, uploaded, checksums, http_metadata, custom_metadata FROM _mf_objects`
      const params: (string | number)[] = []

      const conditions: string[] = []

      if (prefix) {
        conditions.push(`key LIKE ? || '%'`)
        params.push(prefix)
      }

      if (cursor) {
        conditions.push(`key > ?`)
        params.push(cursor)
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`
      }

      query += ` ORDER BY key LIMIT ?`
      params.push(limit + 1)

      const rows = db.prepare(query).all(...params) as R2Object[]

      const hasMore = rows.length > limit
      const objects = rows.slice(0, limit).map((row) => ({
        key: row.key,
        size: row.size,
        etag: row.etag,
        httpEtag: `"${row.etag}"`,
        uploaded: new Date(row.uploaded).toISOString(),
        checksums: JSON.parse(row.checksums || '{}'),
        customMetadata: JSON.parse(row.custom_metadata || '{}'),
      }))

      // Handle delimiter for prefix-based listing
      let delimitedPrefixes: string[] = []
      if (delimiter && prefix) {
        const prefixSet = new Set<string>()
        for (const obj of objects) {
          const remaining = obj.key.slice(prefix.length)
          const delimIndex = remaining.indexOf(delimiter)
          if (delimIndex !== -1) {
            prefixSet.add(prefix + remaining.slice(0, delimIndex + 1))
          }
        }
        delimitedPrefixes = Array.from(prefixSet)
      }

      return c.json({
        objects: delimiter ? objects.filter((o) => !o.key.slice(prefix.length).includes(delimiter)) : objects,
        truncated: hasMore,
        cursor: hasMore ? objects[objects.length - 1]?.key : undefined,
        delimitedPrefixes,
      })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    } finally {
      db.close()
    }
  })

  // Get object metadata (HEAD)
  app.get('/:binding/objects/:key{.+}/meta', async (c) => {
    const result = getDatabase(c.req.param('binding'))
    if (!result) {
      return c.json({ error: 'Bucket not found' }, 404)
    }

    const { db } = result

    try {
      const key = c.req.param('key')

      const row = db
        .prepare(
          `SELECT key, version, size, etag, uploaded, checksums, http_metadata, custom_metadata
           FROM _mf_objects WHERE key = ?`
        )
        .get(key) as R2Object | undefined

      if (!row) {
        return c.json({ error: 'Object not found' }, 404)
      }

      return c.json({
        key: row.key,
        size: row.size,
        etag: row.etag,
        httpEtag: `"${row.etag}"`,
        uploaded: new Date(row.uploaded).toISOString(),
        checksums: JSON.parse(row.checksums || '{}'),
        httpMetadata: JSON.parse(row.http_metadata || '{}'),
        customMetadata: JSON.parse(row.custom_metadata || '{}'),
      })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    } finally {
      db.close()
    }
  })

  // Get object content
  app.get('/:binding/objects/:key{.+}', async (c) => {
    const result = getDatabase(c.req.param('binding'))
    if (!result) {
      return c.json({ error: 'Bucket not found' }, 404)
    }

    const { db, blobDir } = result

    try {
      const key = c.req.param('key')

      const row = db
        .prepare(
          `SELECT key, blob_id, size, etag, http_metadata FROM _mf_objects WHERE key = ?`
        )
        .get(key) as R2Object | undefined

      if (!row || !row.blob_id) {
        return c.json({ error: 'Object not found' }, 404)
      }

      const blobData = readBlob(blobDir, row.blob_id)
      if (!blobData) {
        return c.json({ error: 'Blob not found' }, 404)
      }

      const httpMetadata = JSON.parse(row.http_metadata || '{}')
      const headers = new Headers()
      headers.set('Content-Type', httpMetadata.contentType || 'application/octet-stream')
      headers.set('ETag', `"${row.etag}"`)
      headers.set('Content-Length', String(row.size))

      if (httpMetadata.contentDisposition) {
        headers.set('Content-Disposition', httpMetadata.contentDisposition)
      }

      return new Response(blobData, { headers })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    } finally {
      db.close()
    }
  })

  // Upload object
  app.put('/:binding/objects/:key{.+}', async (c) => {
    const result = getDatabase(c.req.param('binding'))
    if (!result) {
      return c.json({ error: 'Bucket not found' }, 404)
    }

    const { db, blobDir } = result

    try {
      const key = c.req.param('key')
      const contentType = c.req.header('Content-Type') || 'application/octet-stream'
      const body = await c.req.arrayBuffer()
      const data = Buffer.from(body)

      // Generate blob ID and write blob
      const blobId = generateBlobId()
      writeBlob(blobDir, blobId, data)

      // Calculate etag (MD5)
      const etag = createHash('md5').update(data).digest('hex')

      // Extract custom metadata from headers
      const customMetadata: Record<string, string> = {}
      for (const [headerKey, value] of Object.entries(c.req.header())) {
        if (headerKey.toLowerCase().startsWith('x-amz-meta-')) {
          const metaKey = headerKey.slice(11)
          customMetadata[metaKey] = value
        }
      }

      // Delete old blob if exists
      const oldRow = db
        .prepare(`SELECT blob_id FROM _mf_objects WHERE key = ?`)
        .get(key) as { blob_id: string } | undefined
      if (oldRow?.blob_id) {
        deleteBlob(blobDir, oldRow.blob_id)
      }

      // Upsert object
      const version = generateBlobId()
      db.prepare(
        `INSERT OR REPLACE INTO _mf_objects
         (key, blob_id, version, size, etag, uploaded, checksums, http_metadata, custom_metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        key,
        blobId,
        version,
        data.length,
        etag,
        Date.now(),
        JSON.stringify({ md5: etag }),
        JSON.stringify({ contentType }),
        JSON.stringify(customMetadata)
      )

      return c.json({
        success: true,
        key,
        size: data.length,
        etag,
      })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    } finally {
      db.close()
    }
  })

  // Delete object
  app.delete('/:binding/objects/:key{.+}', async (c) => {
    const result = getDatabase(c.req.param('binding'))
    if (!result) {
      return c.json({ error: 'Bucket not found' }, 404)
    }

    const { db, blobDir } = result

    try {
      const key = c.req.param('key')

      // Get blob ID to delete
      const row = db
        .prepare(`SELECT blob_id FROM _mf_objects WHERE key = ?`)
        .get(key) as { blob_id: string } | undefined

      if (row?.blob_id) {
        deleteBlob(blobDir, row.blob_id)
      }
      db.prepare(`DELETE FROM _mf_objects WHERE key = ?`).run(key)

      return c.json({ success: true })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    } finally {
      db.close()
    }
  })

  // Bulk delete objects
  app.post('/:binding/bulk-delete', async (c) => {
    const result = getDatabase(c.req.param('binding'))
    if (!result) {
      return c.json({ error: 'Bucket not found' }, 404)
    }

    const { db, blobDir } = result

    try {
      const { keys } = await c.req.json<{ keys: string[] }>()

      for (const key of keys) {
        const row = db
          .prepare(`SELECT blob_id FROM _mf_objects WHERE key = ?`)
          .get(key) as { blob_id: string } | undefined

        if (row?.blob_id) {
          deleteBlob(blobDir, row.blob_id)
        }
        db.prepare(`DELETE FROM _mf_objects WHERE key = ?`).run(key)
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

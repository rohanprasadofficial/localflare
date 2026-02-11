/**
 * DO Storage Server
 *
 * A Node.js-side Hono server that reads Durable Object SQLite files
 * from `.wrangler/state/v3/do/` on disk using `node:sqlite`.
 *
 * The API worker (running inside workerd) cannot access these files,
 * so it proxies DO storage requests to this server.
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve, type ServerType } from '@hono/node-server'
import { readdirSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'
import { deserialize } from 'node:v8'
import type { LocalflareManifest } from 'localflare-core'

import { DatabaseSync } from 'node:sqlite'

export interface DOStorageConfig {
  persistPath: string
  manifest: LocalflareManifest
}

/** Escape identifier for safe SQL usage */
function escapeIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`
}

/**
 * Resolve the directory on disk for a given DO binding.
 *
 * wrangler persists DO storage at:
 *   {persistPath}/v3/do/{workerName}-{className}/{instanceId}.sqlite
 *
 * We match directories whose name ends with `-{className}`.
 */
function findDODir(config: DOStorageConfig, binding: string): string | null {
  const doConfig = config.manifest.do.find((d) => d.binding === binding)
  if (!doConfig) return null

  const doStateDir = join(config.persistPath, 'v3', 'do')
  if (!existsSync(doStateDir)) return null

  const suffix = `-${doConfig.className}`
  const dirs = readdirSync(doStateDir, { withFileTypes: true }).filter(
    (d) => d.isDirectory() && d.name.endsWith(suffix),
  )

  if (dirs.length === 0) return null

  const exactName = `${config.manifest.name}-${doConfig.className}`
  const exactMatch = dirs.find((d) => d.name === exactName)
  if (exactMatch) {
    return join(doStateDir, exactMatch.name)
  }

  if (dirs.length === 1) {
    return join(doStateDir, dirs[0].name)
  }

  const sortedNames = dirs.map((d) => d.name).sort((a, b) => a.localeCompare(b))
  return join(doStateDir, sortedNames[0])
}

/** List .sqlite files in a directory, returning instance IDs (filenames without extension) */
function listInstances(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.sqlite'))
    .map((f) => basename(f, '.sqlite'))
    .sort((a, b) => a.localeCompare(b))
}

/** Open a SQLite database for an instance. Caller must close it. */
function openInstanceDb(
  config: DOStorageConfig,
  binding: string,
  instanceId: string,
): DatabaseSync | null {
  const dir = findDODir(config, binding)
  if (!dir) return null

  const dbPath = join(dir, `${instanceId}.sqlite`)
  if (!existsSync(dbPath)) return null

  return new DatabaseSync(dbPath, { open: true })
}

function decodeKvBlob(value: unknown): unknown {
  if (!(value instanceof Uint8Array)) {
    return value
  }

  try {
    return deserialize(Buffer.from(value))
  } catch {
    return value
  }
}

function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback
  }
  return Math.floor(parsed)
}

export function createDOStorageApp(config: DOStorageConfig) {
  const app = new Hono()

  app.use(
    '*',
    cors({
      origin: '*',
    }),
  )

  // ── List instances ────────────────────────────────────────────────
  app.get('/do/:binding/instances', (c) => {
    const binding = c.req.param('binding')
    const doConfig = config.manifest.do.find((d) => d.binding === binding)
    if (!doConfig) {
      return c.json({ error: `Unknown DO binding: ${binding}` }, 404)
    }

    const dir = findDODir(config, binding)
    if (!dir) {
      return c.json({
        instances: [],
        binding,
        className: doConfig.className,
      })
    }

    const ids = listInstances(dir)

    const instances = ids.map((id) => ({
      id,
      binding,
      className: doConfig.className,
    }))

    return c.json({ instances, binding, className: doConfig.className })
  })

  // ── DurableObjectStorage KV entries (_cf_KV) ─────────────────────
  app.get('/do/:binding/:instanceId/kv', (c) => {
    const { binding, instanceId } = c.req.param()
    const db = openInstanceDb(config, binding, instanceId)
    if (!db) {
      return c.json({ error: 'Instance not found' }, 404)
    }

    try {
      const limit = Math.min(readPositiveInt(c.req.query('limit'), 100), 1000)
      const offset = readPositiveInt(c.req.query('offset'), 0)
      const prefix = c.req.query('prefix')

      const kvTable = db
        .prepare(
          `SELECT name FROM sqlite_master
           WHERE type='table' AND name='_cf_KV'
           LIMIT 1`,
        )
        .get() as { name: string } | undefined

      if (!kvTable) {
        return c.json({
          entries: [],
          meta: { limit, offset, total: 0 },
        })
      }

      const whereClause = prefix ? 'WHERE key LIKE ?' : ''
      const countSql = `SELECT COUNT(*) as cnt FROM _cf_KV ${whereClause}`
      const total = prefix
        ? ((db.prepare(countSql).get(`${prefix}%`) as { cnt: number } | undefined)?.cnt ?? 0)
        : ((db.prepare(countSql).get() as { cnt: number } | undefined)?.cnt ?? 0)

      const rowsSql = `SELECT key, value FROM _cf_KV ${whereClause} ORDER BY key LIMIT ${limit} OFFSET ${offset}`
      const rows = prefix
        ? (db.prepare(rowsSql).all(`${prefix}%`) as Array<{ key: string; value: unknown }>)
        : (db.prepare(rowsSql).all() as Array<{ key: string; value: unknown }>)

      const entries = rows.map((row) => ({
        key: row.key,
        value: decodeKvBlob(row.value),
      }))

      return c.json({
        entries,
        meta: { limit, offset, total },
      })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    } finally {
      db.close()
    }
  })

  // ── Schema ────────────────────────────────────────────────────────
  app.get('/do/:binding/:instanceId/schema', (c) => {
    const { binding, instanceId } = c.req.param()
    const db = openInstanceDb(config, binding, instanceId)
    if (!db) {
      return c.json({ error: 'Instance not found' }, 404)
    }

    try {
      const tables = db
        .prepare(
          `SELECT name, sql FROM sqlite_master
           WHERE type='table'
             AND name NOT LIKE 'sqlite_%'
             AND name NOT LIKE '_cf_%'
           ORDER BY name`,
        )
        .all()

      return c.json({ tables })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    } finally {
      db.close()
    }
  })

  // ── Table info (columns, keys, row count) ─────────────────────────
  app.get('/do/:binding/:instanceId/tables/:table', (c) => {
    const { binding, instanceId } = c.req.param()
    const table = c.req.param('table')
    const db = openInstanceDb(config, binding, instanceId)
    if (!db) {
      return c.json({ error: 'Instance not found' }, 404)
    }

    try {
      const escapedTable = escapeIdentifier(table)

      const columns = db.prepare(`PRAGMA table_info(${escapedTable})`).all() as Array<{
        cid: number
        name: string
        type: string
        notnull: number
        dflt_value: unknown
        pk: number
      }>

      const countRow = db.prepare(`SELECT COUNT(*) as count FROM ${escapedTable}`).get() as
        | { count: number }
        | undefined

      const indexes = db.prepare(`PRAGMA index_list(${escapedTable})`).all()
      const foreignKeys = db.prepare(`PRAGMA foreign_key_list(${escapedTable})`).all()

      const primaryKeys = columns
        .filter((col) => col.pk > 0)
        .sort((a, b) => a.pk - b.pk)
        .map((col) => col.name)

      return c.json({
        table,
        columns,
        primaryKeys,
        indexes,
        foreignKeys,
        rowCount: countRow?.count ?? 0,
      })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    } finally {
      db.close()
    }
  })

  // ── Paginated rows ────────────────────────────────────────────────
  app.get('/do/:binding/:instanceId/tables/:table/rows', (c) => {
    const { binding, instanceId } = c.req.param()
    const table = c.req.param('table')
    const db = openInstanceDb(config, binding, instanceId)
    if (!db) {
      return c.json({ error: 'Instance not found' }, 404)
    }

    try {
      const escapedTable = escapeIdentifier(table)
      const limit = Math.min(readPositiveInt(c.req.query('limit'), 50), 1000)
      const offset = readPositiveInt(c.req.query('offset'), 0)
      const sortColumn = c.req.query('sort')
      const sortDirection = c.req.query('dir')?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'

      let sql = `SELECT * FROM ${escapedTable}`
      if (sortColumn) {
        sql += ` ORDER BY ${escapeIdentifier(sortColumn)} ${sortDirection}`
      }
      sql += ` LIMIT ${limit} OFFSET ${offset}`

      const rows = db.prepare(sql).all()

      return c.json({
        rows,
        meta: { limit, offset },
      })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    } finally {
      db.close()
    }
  })

  // ── Execute SQL query ─────────────────────────────────────────────
  app.post('/do/:binding/:instanceId/query', async (c) => {
    const { binding, instanceId } = c.req.param()
    const db = openInstanceDb(config, binding, instanceId)
    if (!db) {
      return c.json({ error: 'Instance not found' }, 404)
    }

    try {
      const { sql, params = [] } = await c.req.json<{ sql: string; params?: unknown[] }>()
      if (!sql) {
        return c.json({ error: 'SQL query is required' }, 400)
      }

      const trimmedSql = sql.trim().toUpperCase()
      const isRead =
        trimmedSql.startsWith('SELECT') ||
        trimmedSql.startsWith('PRAGMA') ||
        trimmedSql.startsWith('EXPLAIN')

      const stmt = db.prepare(sql)
      const sqlParams = params as Array<string | number | bigint | Uint8Array | null>

      if (isRead) {
        const rows = sqlParams.length > 0 ? stmt.all(...sqlParams) : stmt.all()
        return c.json({
          success: true,
          results: rows,
          rowCount: rows.length,
          meta: { changes: 0 },
        })
      } else {
        const result = sqlParams.length > 0 ? stmt.run(...sqlParams) : stmt.run()
        return c.json({
          success: true,
          meta: {
            changes: result.changes,
            last_row_id: result.lastInsertRowid,
          },
        })
      }
    } catch (error) {
      return c.json({ error: String(error), success: false }, 500)
    } finally {
      db.close()
    }
  })

  return app
}

/** Find an available port by briefly binding to port 0 */
export async function getAvailablePort(): Promise<number> {
  const { createServer } = await import('node:net')
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.listen(0, () => {
      const addr = server.address()
      if (!addr || typeof addr === 'string') {
        server.close()
        return reject(new Error('Could not determine port'))
      }
      const port = addr.port
      server.close(() => resolve(port))
    })
    server.on('error', reject)
  })
}

/** Start the DO storage Hono server. Returns a handle to close it. */
export function startDOStorageServer(
  config: DOStorageConfig,
  port: number,
): ServerType {
  const app = createDOStorageApp(config)
  return serve({ fetch: app.fetch, port })
}

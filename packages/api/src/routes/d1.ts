import { Hono } from 'hono'
import Database from 'better-sqlite3'
import type { WranglerStateInfo } from '../lib/types.js'

export function createD1Routes(stateInfo: WranglerStateInfo) {
  const app = new Hono()

  // Helper to get database instance
  function getDatabase(binding: string): Database.Database | null {
    const dbFile = stateInfo.d1Databases.find(
      (f) => f.binding === binding || f.filename.startsWith(binding)
    )
    // If no match by binding, try by index (binding could be the index)
    const index = parseInt(binding, 10)
    const file = dbFile ?? (Number.isInteger(index) ? stateInfo.d1Databases[index] : stateInfo.d1Databases[0])

    if (!file) return null

    const db = new Database(file.path, { readonly: false })
    db.pragma('journal_mode = WAL')
    db.pragma('busy_timeout = 5000')
    return db
  }

  // List all D1 databases
  app.get('/', async (c) => {
    return c.json({
      databases: stateInfo.d1Databases.map((f, i) => ({
        binding: f.binding ?? `database_${i}`,
        database_name: f.binding ?? f.filename.replace('.sqlite', ''),
        file: f.filename,
      })),
    })
  })

  // Get schema for a database
  app.get('/:binding/schema', async (c) => {
    const db = getDatabase(c.req.param('binding'))
    if (!db) {
      return c.json({ error: 'Database not found' }, 404)
    }

    try {
      const tables = db
        .prepare(
          `SELECT name, sql FROM sqlite_master
           WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name NOT LIKE '_mf_%'
           ORDER BY name`
        )
        .all()

      return c.json({ tables })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    } finally {
      db.close()
    }
  })

  // Get table info (columns)
  app.get('/:binding/tables/:table', async (c) => {
    const db = getDatabase(c.req.param('binding'))
    if (!db) {
      return c.json({ error: 'Database not found' }, 404)
    }

    try {
      const tableName = c.req.param('table')
      const columns = db.prepare(`PRAGMA table_info("${tableName}")`).all()
      const countResult = db.prepare(`SELECT COUNT(*) as count FROM "${tableName}"`).get() as { count: number }

      return c.json({
        table: tableName,
        columns,
        rowCount: countResult?.count ?? 0,
      })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    } finally {
      db.close()
    }
  })

  // Query data from a table with pagination
  app.get('/:binding/tables/:table/rows', async (c) => {
    const db = getDatabase(c.req.param('binding'))
    if (!db) {
      return c.json({ error: 'Database not found' }, 404)
    }

    try {
      const tableName = c.req.param('table')
      const limit = Number(c.req.query('limit')) || 100
      const offset = Number(c.req.query('offset')) || 0

      const rows = db
        .prepare(`SELECT * FROM "${tableName}" LIMIT ? OFFSET ?`)
        .all(limit, offset)

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

  // Execute arbitrary SQL query
  app.post('/:binding/query', async (c) => {
    const db = getDatabase(c.req.param('binding'))
    if (!db) {
      return c.json({ error: 'Database not found' }, 404)
    }

    try {
      const { sql, params = [] } = await c.req.json<{ sql: string; params?: unknown[] }>()

      if (!sql) {
        return c.json({ error: 'SQL query is required' }, 400)
      }

      // Determine if it's a read or write query
      const isRead = sql.trim().toUpperCase().startsWith('SELECT')

      if (isRead) {
        const stmt = db.prepare(sql)
        const results = params.length > 0 ? stmt.all(...params) : stmt.all()
        return c.json({
          success: true,
          results,
          meta: { changes: 0 },
        })
      } else {
        const stmt = db.prepare(sql)
        const result = params.length > 0 ? stmt.run(...params) : stmt.run()
        return c.json({
          success: true,
          meta: { changes: result.changes },
        })
      }
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    } finally {
      db.close()
    }
  })

  // Insert a row
  app.post('/:binding/tables/:table/rows', async (c) => {
    const db = getDatabase(c.req.param('binding'))
    if (!db) {
      return c.json({ error: 'Database not found' }, 404)
    }

    try {
      const tableName = c.req.param('table')
      const data = await c.req.json<Record<string, unknown>>()

      const columns = Object.keys(data)
      const values = Object.values(data)
      const placeholders = columns.map(() => '?').join(', ')

      const sql = `INSERT INTO "${tableName}" (${columns.map((col) => `"${col}"`).join(', ')}) VALUES (${placeholders})`
      const result = db.prepare(sql).run(...values)

      return c.json({
        success: true,
        meta: { changes: result.changes, lastInsertRowid: result.lastInsertRowid },
      })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    } finally {
      db.close()
    }
  })

  // Update a row
  app.put('/:binding/tables/:table/rows/:id', async (c) => {
    const db = getDatabase(c.req.param('binding'))
    if (!db) {
      return c.json({ error: 'Database not found' }, 404)
    }

    try {
      const tableName = c.req.param('table')
      const id = c.req.param('id')
      const data = await c.req.json<Record<string, unknown>>()

      const setClause = Object.keys(data)
        .map((col) => `"${col}" = ?`)
        .join(', ')
      const values = [...Object.values(data), id]

      const sql = `UPDATE "${tableName}" SET ${setClause} WHERE id = ?`
      const result = db.prepare(sql).run(...values)

      return c.json({
        success: true,
        meta: { changes: result.changes },
      })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    } finally {
      db.close()
    }
  })

  // Delete a row
  app.delete('/:binding/tables/:table/rows/:id', async (c) => {
    const db = getDatabase(c.req.param('binding'))
    if (!db) {
      return c.json({ error: 'Database not found' }, 404)
    }

    try {
      const tableName = c.req.param('table')
      const id = c.req.param('id')

      const result = db.prepare(`DELETE FROM "${tableName}" WHERE id = ?`).run(id)

      return c.json({
        success: true,
        meta: { changes: result.changes },
      })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    } finally {
      db.close()
    }
  })

  return app
}

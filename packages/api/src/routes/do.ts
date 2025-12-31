import { Hono } from 'hono'
import Database from 'better-sqlite3'
import type { WranglerStateInfo } from '../lib/types.js'

interface DOInstance {
  id: string
  className: string
  binding?: string
  hasStorage: boolean
}

export function createDORoutes(stateInfo: WranglerStateInfo) {
  const app = new Hono()

  // List all DO classes discovered from state files
  app.get('/', (c) => {
    // Group files by class name
    const classMap = new Map<string, { binding?: string; instances: number }>()

    for (const doFile of stateInfo.durableObjects) {
      const className = doFile.className || 'unknown'
      if (!classMap.has(className)) {
        classMap.set(className, {
          binding: doFile.binding,
          instances: 0,
        })
      }
      // Each SQLite file represents one instance
      classMap.get(className)!.instances++
    }

    const durableObjects = Array.from(classMap.entries()).map(([className, info]) => ({
      class_name: className,
      name: info.binding || className,
      instances: info.instances,
    }))

    return c.json({ durableObjects })
  })

  // List all DO instances
  app.get('/instances', (c) => {
    const instances: DOInstance[] = []

    for (const doFile of stateInfo.durableObjects) {
      // Extract instance ID from filename (usually the hex ID)
      const instanceId = doFile.filename.replace('.sqlite', '')

      instances.push({
        id: instanceId,
        className: doFile.className || 'unknown',
        binding: doFile.binding,
        hasStorage: true,
      })
    }

    return c.json({ instances })
  })

  // Get storage data for a specific DO instance
  app.get('/:classOrBinding/:instanceId/storage', (c) => {
    const { classOrBinding, instanceId } = c.req.param()

    // Find the DO file
    const doFile = stateInfo.durableObjects.find(
      f =>
        (f.className === classOrBinding || f.binding === classOrBinding) &&
        f.filename.replace('.sqlite', '') === instanceId
    )

    if (!doFile) {
      return c.json({ error: 'Durable Object instance not found' }, 404)
    }

    try {
      const db = new Database(doFile.path, { readonly: true })

      // Get all keys from the storage table
      // DO storage uses a simple key-value structure
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all() as { name: string }[]

      // Find the storage table (usually _mf_entries or similar)
      const storageTable = tables.find(
        t => t.name === '_mf_entries' || t.name.includes('storage')
      )

      if (!storageTable) {
        db.close()
        return c.json({
          keys: [],
          message: 'No storage data found for this instance',
        })
      }

      const entries = db
        .prepare(`SELECT key, value FROM ${storageTable.name} LIMIT 1000`)
        .all() as { key: string; value: Buffer }[]

      db.close()

      const storage = entries.map((entry) => {
        let value: unknown = null
        try {
          // Try to parse as JSON
          value = JSON.parse(entry.value.toString('utf-8'))
        } catch {
          // Return as string or base64 if binary
          const str = entry.value.toString('utf-8')
          if (/^[\x20-\x7E\s]*$/.test(str)) {
            value = str
          } else {
            value = entry.value.toString('base64')
          }
        }

        return {
          key: entry.key,
          value,
        }
      })

      return c.json({ storage })
    } catch (error) {
      return c.json(
        { error: `Failed to read DO storage: ${error}` },
        500
      )
    }
  })

  // Note: Actually calling DO methods requires a running worker
  // This is just for viewing storage state
  app.all('/:classOrBinding/:instanceId/fetch/*', (c) => {
    return c.json(
      {
        error:
          'Durable Object fetch requires a running worker. This API only provides storage inspection.',
        hint: 'Run `wrangler dev` to interact with Durable Objects.',
      },
      501
    )
  })

  return app
}

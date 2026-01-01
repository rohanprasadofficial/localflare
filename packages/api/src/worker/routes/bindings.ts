import { Hono } from 'hono'
import type { Env } from '../types.js'
import { getManifest } from '../types.js'

export function createBindingsRoutes() {
  const app = new Hono<{ Bindings: Env }>()

  // Get all bindings discovered from manifest
  // Format matches dashboard's BindingsResponse type
  app.get('/', async (c) => {
    const manifest = getManifest(c.env)

    return c.json({
      name: manifest.name || 'worker',
      bindings: {
        d1: manifest.d1.map((db) => ({
          type: 'd1',
          binding: db.binding,
          database_name: db.database_name,
        })),
        kv: manifest.kv.map((kv) => ({
          type: 'kv',
          binding: kv.binding,
        })),
        r2: manifest.r2.map((r2) => ({
          type: 'r2',
          binding: r2.binding,
          bucket_name: r2.bucket_name,
        })),
        durableObjects: manifest.do.map((doConfig) => ({
          type: 'durable_object',
          name: doConfig.binding,
          binding: doConfig.binding,
          class_name: doConfig.className,
        })),
        queues: {
          producers: manifest.queues.producers.map((p) => ({
            type: 'queue_producer',
            binding: p.binding,
            queue: p.queue,
          })),
          consumers: manifest.queues.consumers.map((consumer) => ({
            type: 'queue_consumer',
            queue: consumer.queue,
          })),
        },
        vars: [], // No vars exposed in sidecar mode
      },
    })
  })

  return app
}

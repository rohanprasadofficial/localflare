import { Hono } from 'hono'
import type { WranglerConfig, DiscoveredBindings, WranglerStateInfo } from '../lib/types.js'

export function createBindingsRoutes(
  config: WranglerConfig | null,
  bindings: DiscoveredBindings | null,
  stateInfo: WranglerStateInfo
) {
  const app = new Hono()

  // Get all discovered bindings summary
  app.get('/', async (c) => {
    // If we have config bindings, use them
    if (bindings) {
      return c.json({
        name: config?.name ?? 'unknown',
        bindings: {
          d1: bindings.d1.map((d) => ({
            type: 'D1',
            binding: d.binding,
            database_name: d.database_name,
          })),
          kv: bindings.kv.map((k) => ({
            type: 'KV',
            binding: k.binding,
          })),
          r2: bindings.r2.map((r) => ({
            type: 'R2',
            binding: r.binding,
            bucket_name: r.bucket_name,
          })),
          durableObjects: bindings.durableObjects.map((d) => ({
            type: 'DurableObject',
            name: d.name,
            binding: d.name,
            class_name: d.class_name,
            script_name: d.script_name,
          })),
          queues: {
            producers: bindings.queues.producers.map((q) => ({
              type: 'Queue',
              binding: q.binding,
              queue: q.queue,
            })),
            consumers: bindings.queues.consumers.map((q) => ({
              type: 'QueueConsumer',
              queue: q.queue,
            })),
          },
          vars: Object.entries(bindings.vars).map(([key, value]) => ({
            type: 'Var',
            key,
            value: value.length > 50 ? value.slice(0, 50) + '...' : value,
          })),
        },
      })
    }

    // If no config, derive bindings from discovered state files
    return c.json({
      name: 'unknown',
      bindings: {
        d1: stateInfo.d1Databases.map((f, i) => ({
          type: 'D1',
          binding: f.binding ?? `database_${i}`,
          database_name: f.binding ?? f.filename.replace('.sqlite', ''),
        })),
        kv: stateInfo.kvNamespaces.map((f, i) => ({
          type: 'KV',
          binding: f.binding ?? `namespace_${i}`,
        })),
        r2: stateInfo.r2Buckets.map((f, i) => ({
          type: 'R2',
          binding: f.binding ?? `bucket_${i}`,
          bucket_name: f.binding ?? f.filename.replace('.sqlite', ''),
        })),
        durableObjects: [],
        queues: {
          producers: [],
          consumers: [],
        },
        vars: [],
      },
    })
  })

  return app
}

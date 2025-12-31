import { Hono } from 'hono'
import type { DiscoveredBindings } from '../lib/types.js'

export function createQueuesRoutes(bindings: DiscoveredBindings | null) {
  const app = new Hono()

  // List all queues (from config)
  app.get('/', (c) => {
    const producers = bindings?.queues.producers || []
    const consumers = bindings?.queues.consumers || []

    return c.json({
      producers: producers.map((p) => ({
        binding: p.binding,
        queue: p.queue,
      })),
      consumers: consumers.map((consumer) => ({
        queue: consumer.queue,
        max_batch_size: consumer.max_batch_size ?? 10,
        max_batch_timeout: consumer.max_batch_timeout ?? 5,
        max_retries: consumer.max_retries ?? 3,
        dead_letter_queue: consumer.dead_letter_queue,
      })),
      hint: bindings
        ? undefined
        : 'No wrangler config found. Queue bindings could not be discovered.',
    })
  })

  // Send message - requires running worker
  app.post('/:binding/send', (c) => {
    return c.json(
      {
        error:
          'Sending queue messages requires a running worker with queue bindings.',
        hint: 'Run `wrangler dev` and use the non-studio mode to send queue messages.',
      },
      501
    )
  })

  // Bulk send - requires running worker
  app.post('/:binding/send-batch', (c) => {
    return c.json(
      {
        error:
          'Sending queue messages requires a running worker with queue bindings.',
        hint: 'Run `wrangler dev` and use the non-studio mode to send queue messages.',
      },
      501
    )
  })

  return app
}

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import { dirname } from 'node:path'

import { findWranglerConfig, parseWranglerConfig, discoverBindings } from './lib/config.js'
import { findWranglerState, discoverWranglerState } from './lib/wrangler-state.js'
import { createD1Routes } from './routes/d1.js'
import { createKVRoutes } from './routes/kv.js'
import { createR2Routes } from './routes/r2.js'
import { createBindingsRoutes } from './routes/bindings.js'
import { createLogsRoutes } from './routes/logs.js'
import { createDORoutes } from './routes/do.js'
import { createQueuesRoutes } from './routes/queues.js'
import type { ApiServerOptions, WranglerConfig, DiscoveredBindings, WranglerStateInfo } from './lib/types.js'

export interface CreateApiAppOptions {
  config: WranglerConfig | null
  bindings: DiscoveredBindings | null
  stateInfo: WranglerStateInfo
}

export function createApiApp(options: CreateApiAppOptions) {
  const { config, bindings, stateInfo } = options
  const app = new Hono()

  // Middleware
  app.use(
    '*',
    cors({
      origin: [
        'https://studio.localflare.dev',
        'http://localhost:5173',
        'http://localhost:5174',
      ],
      credentials: true,
    })
  )
  app.use('*', logger())


  app.get('/', (c) => {
    return c.json({
      message: 'Welcome to the Localflare API server!',
      endpoints: [
        '/api/health',
        '/api/bindings',
        '/api/d1',
        '/api/kv',
        '/api/r2',
        '/api/logs',
        '/api/queues',
        '/api/do',
      ],
    })
  })


  // Health check
  app.get('/api/health', (c) => {
    return c.json({
      status: 'ok',
      mode: 'studio',
      statePath: stateInfo.statePath,
      databases: stateInfo.d1Databases.length,
      kvNamespaces: stateInfo.kvNamespaces.length,
      r2Buckets: stateInfo.r2Buckets.length,
      durableObjects: stateInfo.durableObjects.length,
    })
  })

  // Mount API routes
  app.route('/api/bindings', createBindingsRoutes(config, bindings, stateInfo))
  app.route('/api/d1', createD1Routes(stateInfo))
  app.route('/api/kv', createKVRoutes(stateInfo))
  app.route('/api/r2', createR2Routes(stateInfo))
  app.route('/api/logs', createLogsRoutes())

  // Queues route (can list from config, but sending requires running worker)
  app.route('/api/queues', createQueuesRoutes(bindings))

  app.route('/api/do', createDORoutes(stateInfo))

  return app
}

export async function startApiServer(options: ApiServerOptions = {}): Promise<void> {
  const { port = 8788 } = options

  // Find and parse config (optional in no-config mode)
  let config: WranglerConfig | null = null
  let bindings: DiscoveredBindings | null = null
  let configDir = process.cwd()

  if (options.configPath) {
    try {
      config = parseWranglerConfig(options.configPath)
      bindings = discoverBindings(config)
      configDir = dirname(options.configPath)
    } catch (error) {
      console.warn(`Warning: Could not parse config: ${error}`)
    }
  } else {
    // Try to auto-detect config
    const configPath = findWranglerConfig(process.cwd())
    if (configPath) {
      try {
        config = parseWranglerConfig(configPath)
        bindings = discoverBindings(config)
        configDir = dirname(configPath)
      } catch (error) {
        console.warn(`Warning: Could not parse auto-detected config: ${error}`)
      }
    }
  }

  // Find wrangler state directory
  const statePath = options.statePath ?? findWranglerState(configDir)

  if (!statePath) {
    throw new Error(
      'Could not find .wrangler/state/v3 directory.\n' +
        'Make sure you have run `wrangler dev` at least once to create the state directory.'
    )
  }

  // Discover state files
  const stateInfo = discoverWranglerState(statePath, bindings ?? undefined)

  if (
    stateInfo.d1Databases.length === 0 &&
    stateInfo.kvNamespaces.length === 0 &&
    stateInfo.r2Buckets.length === 0
  ) {
    console.warn('Warning: No D1, KV, or R2 state files found. The dashboard may be empty.')
    console.warn('Run `wrangler dev` and make some requests to create state files.')
  }

  const app = createApiApp({ config, bindings, stateInfo })

  serve(
    {
      fetch: app.fetch,
      port,
    },
    (info) => {
      console.log(`📊 Localflare API running at http://localhost:${info.port}`)
      console.log(`📁 Reading state from: ${statePath}`)
      if (config?.name) {
        console.log(`📦 Project: ${config.name}`)
      }
    }
  )
}

// Re-export types and utilities
export type { ApiServerOptions, WranglerConfig, DiscoveredBindings, WranglerStateInfo }
export { findWranglerConfig, parseWranglerConfig, discoverBindings } from './lib/config.js'
export { findWranglerState, discoverWranglerState } from './lib/wrangler-state.js'

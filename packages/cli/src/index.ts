import { cac } from 'cac'
import pc from 'picocolors'
import { LocalFlare, findWranglerConfig, WRANGLER_CONFIG_FILES } from 'localflare-core'
import { startDashboardServer } from 'localflare-server'
import { startApiServer, findWranglerState } from 'localflare-api'
import { existsSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import open from 'open'

// Find the dashboard dist folder
function getDashboardPath(): string | undefined {
  try {
    const require = createRequire(import.meta.url)
    const dashboardPkg = require.resolve('localflare-dashboard/package.json')
    return join(dirname(dashboardPkg), 'dist')
  } catch {
    return undefined
  }
}

const cli = cac('localflare')

cli
  .command('[configPath]', 'Start Localflare development server')
  .option('-p, --port <port>', 'Worker port', { default: 8787 })
  .option('-d, --dashboard-port <port>', 'Dashboard port', { default: 8788 })
  .option('--persist <path>', 'Persistence directory', { default: '.localflare' })
  .option('-v, --verbose', 'Verbose output')
  .option('--studio', 'Read .wrangler/state directly (no bundling, works with all frameworks)')
  .option('--dev', 'Open local dashboard (localhost:5174) instead of studio.localflare.dev')
  .option('--no-open', 'Do not open browser automatically')
  .action(async (configPath: string | undefined, options) => {
    console.log('')
    console.log(pc.bold(pc.cyan('  ⚡ Localflare')))
    console.log(pc.dim('  Local Cloudflare Development Dashboard'))
    console.log('')

    // ========== NEW MODE: --studio (reads .wrangler/state directly) ==========
    if (options.studio) {
      const port = Number(options.dashboardPort)

      // Find wrangler config (optional, but helpful for binding names)
      let resolvedConfig: string | undefined
      if (configPath) {
        resolvedConfig = resolve(configPath)
        if (!existsSync(resolvedConfig)) {
          console.log(pc.yellow(`  ⚠ Config file not found: ${configPath}`))
          console.log(pc.dim(`    Will discover bindings from state files.`))
          resolvedConfig = undefined
        }
      } else {
        resolvedConfig = findWranglerConfig(process.cwd()) ?? undefined
      }

      if (resolvedConfig) {
        console.log(pc.dim(`  Config: ${resolvedConfig}`))
      }

      // Find .wrangler/state directory
      const searchDir = resolvedConfig ? dirname(resolvedConfig) : process.cwd()
      const statePath = findWranglerState(searchDir)

      if (!statePath) {
        console.log(pc.red(`  ✗ Could not find .wrangler/state/v3 directory`))
        console.log(pc.dim(`    Make sure you have run \`wrangler dev\` at least once.`))
        console.log('')
        process.exit(1)
      }

      console.log(pc.dim(`  State:  ${statePath}`))
      console.log('')

      try {
        // Start the API server
        await startApiServer({
          configPath: resolvedConfig,
          statePath,
          port,
        })

        console.log('')
        console.log(pc.green('  ✓ Localflare API is running!'))
        console.log('')
        console.log(`  ${pc.dim('API:')}        ${pc.cyan(`http://localhost:${port}`)}`)

        // Open browser
        const dashboardUrl = options.dev
          ? `http://localhost:5174?port=${port}`
          : `https://studio.localflare.dev?port=${port}`

        console.log(`  ${pc.dim('Dashboard:')}  ${pc.cyan(dashboardUrl)}`)
        console.log('')
        console.log(pc.dim('  💡 Make sure wrangler dev is running for live data'))
        console.log(pc.dim('  Press Ctrl+C to stop'))
        console.log('')

        if (options.open !== false) {
          await open(dashboardUrl)
        }

        // Handle shutdown
        const shutdown = () => {
          console.log('')
          console.log(pc.dim('  Shutting down...'))
          process.exit(0)
        }

        process.on('SIGINT', shutdown)
        process.on('SIGTERM', shutdown)

      } catch (error) {
        console.log(pc.red(`  ✗ Failed to start Localflare API`))
        console.log(pc.dim(`    ${error}`))
        console.log('')
        process.exit(1)
      }

      return
    }

    // ========== OLD MODE: Bundles worker and runs Miniflare (default) ==========
    let resolvedConfig: string

    if (configPath) {
      // User specified a config path
      resolvedConfig = resolve(configPath)
      if (!existsSync(resolvedConfig)) {
        console.log(pc.red(`  ✗ Could not find ${configPath}`))
        console.log(pc.dim(`    Make sure the file exists.`))
        console.log('')
        process.exit(1)
      }
    } else {
      // Auto-detect wrangler config file
      const detectedConfig = findWranglerConfig(process.cwd())
      if (!detectedConfig) {
        console.log(pc.red(`  ✗ Could not find wrangler config file`))
        console.log(pc.dim(`    Looking for: ${WRANGLER_CONFIG_FILES.join(', ')}`))
        console.log(pc.dim(`    Make sure you're in a Cloudflare Worker project directory.`))
        console.log('')
        console.log(pc.yellow(`  💡 Tip: Use --studio to read .wrangler/state directly`))
        console.log(pc.dim(`    This works with TanStack, Remix, and other frameworks.`))
        console.log('')
        process.exit(1)
      }
      resolvedConfig = detectedConfig
    }

    console.log(pc.dim(`  Config: ${resolvedConfig}`))
    console.log('')

    try {
      // Initialize LocalFlare
      const localflare = new LocalFlare({
        configPath: resolvedConfig,
        port: Number(options.port),
        dashboardPort: Number(options.dashboardPort),
        persistPath: options.persist,
        verbose: options.verbose,
      })

      // Start the worker
      await localflare.start()

      // Start the dashboard server
      const dashboardPath = getDashboardPath()
      await startDashboardServer({
        localflare,
        port: Number(options.dashboardPort),
        staticPath: dashboardPath,
      })

      console.log('')
      console.log(pc.green('  ✓ Localflare is running!'))
      console.log('')
      console.log(`  ${pc.dim('Worker:')}     ${pc.cyan(`http://localhost:${options.port}`)}`)
      console.log(`  ${pc.dim('Dashboard:')}  ${pc.cyan(`http://localhost:${options.dashboardPort}`)}`)
      console.log('')
      console.log(pc.dim('  Press Ctrl+C to stop'))
      console.log('')

      // Handle shutdown
      const shutdown = async () => {
        console.log('')
        console.log(pc.dim('  Shutting down...'))
        await localflare.stop()
        process.exit(0)
      }

      process.on('SIGINT', shutdown)
      process.on('SIGTERM', shutdown)

    } catch (error) {
      console.log(pc.red(`  ✗ Failed to start Localflare`))
      console.log(pc.dim(`    ${error}`))
      console.log('')
      console.log(pc.yellow(`  💡 Tip: If using TanStack/Remix/Astro, try --studio mode:`))
      console.log(pc.dim(`    npx localflare --studio`))
      console.log('')
      process.exit(1)
    }
  })

cli.help()
cli.version('0.2.0')

cli.parse()

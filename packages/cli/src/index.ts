import { cac } from 'cac'
import pc from 'picocolors'
import { spawn } from 'node:child_process'
import { findWranglerConfig, WRANGLER_CONFIG_FILES, resolveAllConfigs } from 'localflare-core'
import { existsSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import open from 'open'
import { setupLocalflareDir, formatBindings } from './shadow-config.js'
import { startTui, type TuiInstance } from './tui/index.js'

const cli = cac('localflare')

// Parse raw args to extract passthrough args after '--'
// Usage: npx localflare [options] -- [wrangler options]
const rawArgs = process.argv.slice(2)
const dashDashIndex = rawArgs.indexOf('--')
const wranglerPassthrough = dashDashIndex >= 0 ? rawArgs.slice(dashDashIndex + 1) : []

cli
  .command('[configPath]', 'Start Localflare development server')
  .option('-p, --port <port>', 'Worker port', { default: 8787 })
  .option('-v, --verbose', 'Verbose output')
  .option('--dev', 'Open local dashboard (localhost:5174) instead of studio.localflare.dev')
  .option('--no-open', 'Do not open browser automatically')
  .option('--no-tui', 'Disable TUI, use simple console output')
  .option(
    '--persist-to <path>',
    'Persistence directory for D1/KV/R2 data (default: .wrangler/state)',
  )
  .action(async (configPath: string | undefined, options) => {
    console.log('')
    console.log(pc.bold(pc.cyan('  ⚡ Localflare')))
    console.log(pc.dim('  Local Cloudflare Development Dashboard'))
    console.log('')

    const workerPort = Number(options.port)

    // Find wrangler config (required)
    let resolvedConfig: string
    if (configPath) {
      resolvedConfig = resolve(configPath)
      if (!existsSync(resolvedConfig)) {
        console.log(pc.red(`  ✗ Could not find ${configPath}`))
        console.log(pc.dim(`    Make sure the file exists.`))
        console.log('')
        process.exit(1)
      }
    } else {
      const detectedConfig = findWranglerConfig(process.cwd())
      if (!detectedConfig) {
        console.log(pc.red(`  ✗ Could not find wrangler config file`))
        console.log(pc.dim(`    Looking for: ${WRANGLER_CONFIG_FILES.join(', ')}`))
        console.log(pc.dim(`    Make sure you're in a Cloudflare Worker project directory.`))
        console.log('')
        process.exit(1)
      }
      resolvedConfig = detectedConfig
    }

    // Discover all referenced worker configs via script_name
    const allConfigs = resolveAllConfigs(resolvedConfig)

    console.log(pc.dim(`  👀 Detected: ${resolvedConfig}`))
    if (allConfigs.length > 1) {
      for (const c of allConfigs.slice(1)) {
        console.log(pc.dim(`  👀 Discovered: ${c.path} (${c.config.name || 'unnamed'})`))
      }
    }

    try {
      // Setup .localflare directory with shadow config (merged from all configs)
      const { shadowConfigPath, manifest } = setupLocalflareDir(allConfigs, true)

      // Display linked bindings
      const bindingLines = formatBindings(manifest)
      if (bindingLines.length > 0) {
        console.log(pc.dim(`  🔗 Linking bindings:`))
        for (const line of bindingLines) {
          console.log(pc.dim(line))
        }
      } else {
        console.log(pc.yellow(`  ⚠ No bindings found in wrangler.toml`))
      }

      console.log('')
      console.log(pc.dim(`  🚀 Starting Development Environment...`))
      console.log('')

      // Spawn wrangler dev with all configs
      // localflare-api is PRIMARY (first) - handles /__localflare/* and proxies rest to user's worker
      // user's workers are SECONDARY - accessed via service binding
      // --persist-to ensures all workers share the same state directory
      const persistPath = options.persistTo
        ? resolve(options.persistTo)
        : join(dirname(resolvedConfig), '.wrangler', 'state')

      // Build wrangler args with all config paths
      // Use passthrough args (after --) for any wrangler-specific options
      const configFlags = allConfigs.flatMap((c) => ['-c', c.path])
      const wranglerArgs = [
        'wrangler', 'dev',
        '-c', shadowConfigPath,  // Localflare API (primary - gets the port)
        ...configFlags,          // User's workers (secondary - via service binding)
        '--persist-to', persistPath,
        '--port', String(workerPort),
        ...wranglerPassthrough,  // Pass through any args after '--'
      ]

      // Show passthrough args if any
      if (wranglerPassthrough.length > 0 && options.verbose) {
        console.log(pc.dim(`  📦 Wrangler args: ${wranglerPassthrough.join(' ')}`))
        console.log('')
      }

      const wranglerProcess = spawn('npx', wranglerArgs, {
        cwd: dirname(resolvedConfig),
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true,
      })

      let started = false
      let tui: TuiInstance | null = null

      // Dashboard URL for browser and TUI
      const dashboardUrl = options.dev
        ? `http://localhost:5174?port=${workerPort}`
        : `https://studio.localflare.dev?port=${workerPort}`

      // Get worker name from manifest
      const workerName = manifest.name

      // Check if we have a proper TTY for TUI (ink requires raw mode)
      const isTTY = process.stdout.isTTY && process.stdin.isTTY
      const useTui = isTTY && options.tui !== false

      // Start TUI only if we have a TTY and --no-tui wasn't passed
      if (useTui) {
        tui = startTui({
          workerPort,
          dashboardUrl,
          workerName,
          onExit: () => {
            wranglerProcess.kill('SIGTERM')
          },
        })
      }

      // Process stdout
      wranglerProcess.stdout?.on('data', (data: Buffer) => {
        const output = data.toString()

        // Detect when wrangler is ready
        if (!started && (output.includes('Ready') || output.includes('Listening'))) {
          started = true

          if (tui) {
            tui.setStarted(true)
          } else {
            // Console fallback when no TUI
            console.log(pc.green('  ✓ Development environment is running!'))
            console.log('')
            console.log(`  ${pc.dim('YOUR APP:')}   ${pc.cyan(`http://localhost:${workerPort}`)}`)
            console.log(`  ${pc.dim('API:')}        ${pc.cyan(`http://localhost:${workerPort}/__localflare/*`)}`)
            console.log('')
            console.log(`  ${pc.dim('Open:')}       ${pc.cyan(dashboardUrl)}`)
            console.log('')
            console.log(pc.dim('  Press Ctrl+C to stop'))
            console.log('')
          }

          if (options.open !== false) {
            open(dashboardUrl)
          }
        }

        // Route output
        if (tui) {
          tui.addOutput(output)
        } else if (started) {
          // Console fallback: filter localflare noise
          const isLocalflareNoise =
            output.includes('/__localflare/') ||
            output.includes('localflare-api has access') ||
            output.includes('env.LOCALFLARE_MANIFEST') ||
            output.includes('env.USER_WORKER') ||
            output.includes('Reloading local server') ||
            (output.includes('Binding') && output.includes('Resource') && output.includes('Mode'))

          if (!isLocalflareNoise) {
            process.stdout.write(output)
          }
        } else if (options.verbose) {
          process.stdout.write(output)
        }
      })

      // Process stderr
      wranglerProcess.stderr?.on('data', (data: Buffer) => {
        const output = data.toString()
        if (tui) {
          tui.addOutput(output)
        } else if (options.verbose) {
          process.stderr.write(pc.dim(output))
        }
      })

      // Handle wrangler exit
      wranglerProcess.on('close', (code) => {
        tui?.unmount()
        if (code !== 0 && code !== null) {
          console.log('')
          console.log(pc.red(`  ✗ Wrangler exited with code ${code}`))
          console.log('')
          console.log(pc.yellow(`  💡 Tip: Try running 'wrangler dev' directly to debug`))
          console.log('')
        }
        process.exit(code ?? 0)
      })

      // Handle shutdown
      const shutdown = () => {
        tui?.unmount()
        wranglerProcess.kill('SIGTERM')
      }

      process.on('SIGINT', shutdown)
      process.on('SIGTERM', shutdown)

    } catch (error) {
      console.log(pc.red(`  ✗ Failed to start Localflare`))
      console.log(pc.dim(`    ${error}`))
      console.log('')
      process.exit(1)
    }
  })

// Attach command - run localflare-api alongside an existing wrangler dev
cli
  .command('attach [configPath]', 'Run Localflare API alongside an existing wrangler dev server')
  .option('-p, --port <port>', 'Port for Localflare API', { default: 8788 })
  .option('--dev', 'Open local dashboard (localhost:5174) instead of studio.localflare.dev')
  .option('--no-open', 'Do not open browser automatically')
  .option(
    '--persist-to <path>',
    'Persistence directory for D1/KV/R2 data (default: .wrangler/state)',
  )
  .action(async (configPath: string | undefined, options) => {
    console.log('')
    console.log(pc.bold(pc.cyan('  ⚡ Localflare')))
    console.log(pc.dim('  Attach Mode - Run alongside existing wrangler dev'))
    console.log('')

    const apiPort = Number(options.port)

    // Find wrangler config
    let resolvedConfig: string
    if (configPath) {
      resolvedConfig = resolve(configPath)
      if (!existsSync(resolvedConfig)) {
        console.log(pc.red(`  ✗ Could not find ${configPath}`))
        process.exit(1)
      }
    } else {
      const detectedConfig = findWranglerConfig(process.cwd())
      if (!detectedConfig) {
        console.log(pc.red(`  ✗ Could not find wrangler config file`))
        console.log(pc.dim(`    Looking for: ${WRANGLER_CONFIG_FILES.join(', ')}`))
        process.exit(1)
      }
      resolvedConfig = detectedConfig
    }

    // Discover all referenced worker configs via script_name
    const allConfigs = resolveAllConfigs(resolvedConfig)

    console.log(pc.dim(`  👀 Detected: ${resolvedConfig}`))
    if (allConfigs.length > 1) {
      for (const c of allConfigs.slice(1)) {
        console.log(pc.dim(`  👀 Discovered: ${c.path} (${c.config.name || 'unnamed'})`))
      }
    }

    try {
      // Setup .localflare directory (but don't add service binding - standalone mode)
      const { shadowConfigPath, manifest } = setupLocalflareDir(allConfigs, false) // isPrimary=false

      // Display bindings
      const bindingLines = formatBindings(manifest)
      if (bindingLines.length > 0) {
        console.log(pc.dim(`  🔗 Bindings:`))
        for (const line of bindingLines) {
          console.log(pc.dim(line))
        }
      }

      console.log('')
      console.log(pc.dim(`  🚀 Starting Localflare API on port ${apiPort}...`))
      console.log('')

      // --persist-to ensures both workers share the same state directory
      const persistPath = options.persistTo
        ? resolve(options.persistTo)
        : join(dirname(resolvedConfig), '.wrangler', 'state')

      // Include discovered worker configs so DO stubs, workflows, etc. resolve
      const configFlags = allConfigs.flatMap((c) => ['-c', c.path])
      const wranglerArgs = [
        'wrangler', 'dev',
        '-c', shadowConfigPath,
        ...configFlags,
        '--persist-to', persistPath,
        '--port', String(apiPort),
      ]

      const wranglerProcess = spawn('npx', wranglerArgs, {
        cwd: dirname(resolvedConfig),
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true,
      })

      let started = false

      // Dashboard URL points to localflare-api port
      const dashboardUrl = options.dev
        ? `http://localhost:5174?port=${apiPort}`
        : `https://studio.localflare.dev?port=${apiPort}`

      wranglerProcess.stdout?.on('data', (data: Buffer) => {
        const output = data.toString()

        // Detect ready
        if (!started && (output.includes('Ready') || output.includes('has access to the following bindings'))) {
          started = true
          console.log(pc.green('  ✓ Localflare API is running!'))
          console.log('')
          console.log(`  ${pc.dim('API:')}        ${pc.cyan(`http://localhost:${apiPort}/__localflare/*`)}`)
          console.log(`  ${pc.dim('Dashboard:')}  ${pc.cyan(dashboardUrl)}`)
          console.log('')
          console.log(pc.yellow('  📋 Your main worker should be running separately (wrangler dev, pnpm dev, etc.)'))
          console.log(pc.yellow('     Both share the same .wrangler/state directory for D1/KV/R2 access'))
          console.log('')
          console.log(pc.dim('  Press Ctrl+C to stop'))
          console.log('')

          if (options.open !== false) {
            open(dashboardUrl)
          }
        }
      })

      wranglerProcess.stderr?.on('data', (data: Buffer) => {
        const output = data.toString()
        // Only show errors, not info logs
        if (output.includes('ERROR') || output.includes('error')) {
          process.stderr.write(pc.red(output))
        }
      })

      wranglerProcess.on('close', (code) => {
        if (code !== 0 && code !== null) {
          console.log(pc.red(`  ✗ Localflare API exited with code ${code}`))
        }
        process.exit(code ?? 0)
      })

      // Handle shutdown
      const shutdown = () => {
        wranglerProcess.kill('SIGTERM')
      }
      process.on('SIGINT', shutdown)
      process.on('SIGTERM', shutdown)

    } catch (error) {
      console.log(pc.red(`  ✗ Failed to start Localflare`))
      console.log(pc.dim(`    ${error}`))
      process.exit(1)
    }
  })

cli.help((sections) => {
  // Add examples section
  sections.push({
    title: 'Examples',
    body: `  # Basic usage (in a Cloudflare Worker project)
  $ localflare

  # Custom port
  $ localflare --port 9000

  # Attach mode: Run Localflare API separately (for custom dev workflows)
  # Terminal 1: Your dev server (wrangler dev, pnpm dev, opennext dev, etc.)
  # Terminal 2: localflare attach --port 8788
  $ localflare attach
  $ localflare attach --port 8788

  # Pass wrangler options after '--'
  $ localflare -- --env staging
  $ localflare -- --env production --remote

  # Combine localflare and wrangler options
  $ localflare --port 9000 --no-open -- --env staging`,
  })
  return sections
})
cli.version('0.2.0')

cli.parse()

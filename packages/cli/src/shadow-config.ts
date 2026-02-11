/**
 * Shadow Config Generator for Sidecar Architecture
 *
 * Generates a wrangler.toml for the Localflare API worker that mirrors
 * the user's bindings. This allows both workers to share the same
 * binding instances in workerd.
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync, cpSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { createRequire } from 'node:module'
import { type WranglerConfig, type LocalflareManifest } from 'localflare-core'

/**
 * Convert Windows paths to POSIX-style (forward slashes)
 * This is needed because TOML interprets backslashes as escape sequences
 */
function toPosixPath(filePath: string): string {
  return filePath.split('\\').join('/')
}

export type { LocalflareManifest }

/**
 * Find the pre-built worker from localflare-api package
 */
export function getApiWorkerPath(): string {
  const require = createRequire(import.meta.url)
  // main in localflare-api already points to dist/worker/index.js
  return require.resolve('localflare-api')
}

/**
 * Check if a var value looks like a secret (common patterns)
 */
function looksLikeSecret(key: string, value: string): boolean {
  const secretPatterns = [
    /secret/i,
    /password/i,
    /api[_-]?key/i,
    /token/i,
    /auth/i,
    /private/i,
    /credential/i,
  ]
  // Check key name
  if (secretPatterns.some(pattern => pattern.test(key))) {
    return true
  }
  // Check if value looks like a token/key (long alphanumeric strings)
  if (value.length > 20 && /^[A-Za-z0-9_-]+$/.test(value)) {
    return true
  }
  return false
}

/**
 * Create manifest from a single wrangler config
 */
export function createManifest(config: WranglerConfig): LocalflareManifest {
  return {
    name: config.name || 'worker',
    d1: (config.d1_databases || []).map((db) => ({
      binding: db.binding,
      database_name: db.database_name,
    })),
    kv: (config.kv_namespaces || []).map((kv) => ({
      binding: kv.binding,
    })),
    r2: (config.r2_buckets || []).map((r2) => ({
      binding: r2.binding,
      bucket_name: r2.bucket_name,
    })),
    queues: {
      producers: (config.queues?.producers || []).map((p) => ({
        binding: p.binding,
        queue: p.queue,
      })),
      consumers: (config.queues?.consumers || []).map((c) => ({
        queue: c.queue,
        max_batch_size: c.max_batch_size,
        max_batch_timeout: c.max_batch_timeout,
        max_retries: c.max_retries,
        dead_letter_queue: c.dead_letter_queue,
      })),
    },
    do: (config.durable_objects?.bindings || []).map((d) => ({
      binding: d.name,
      className: d.class_name,
    })),
    vars: Object.entries(config.vars || {}).map(([key, value]) => ({
      key,
      value,
      isSecret: looksLikeSecret(key, value),
    })),
    workers: [],
  }
}

/**
 * Create a merged manifest from multiple worker configs.
 * Deduplicates bindings by binding name, with earlier configs taking priority.
 */
export function createMergedManifest(
  configs: { path: string; config: WranglerConfig }[],
): LocalflareManifest {
  if (configs.length === 0) {
    throw new Error('At least one config is required')
  }

  const primary = configs[0]
  const manifest: LocalflareManifest = {
    name: primary.config.name || 'worker',
    d1: [],
    kv: [],
    r2: [],
    queues: { producers: [], consumers: [] },
    do: [],
    vars: [],
    workers: configs.map((c) => ({
      name: c.config.name || 'worker',
      configPath: c.path,
    })),
  }

  const seenD1 = new Set<string>()
  const seenKV = new Set<string>()
  const seenR2 = new Set<string>()
  const seenQueueProducers = new Set<string>()
  const seenQueueConsumers = new Set<string>()
  const seenDO = new Set<string>()
  const seenVars = new Set<string>()

  for (const { config } of configs) {
    for (const db of config.d1_databases || []) {
      if (!seenD1.has(db.binding)) {
        seenD1.add(db.binding)
        manifest.d1.push({ binding: db.binding, database_name: db.database_name })
      }
    }
    for (const kv of config.kv_namespaces || []) {
      if (!seenKV.has(kv.binding)) {
        seenKV.add(kv.binding)
        manifest.kv.push({ binding: kv.binding })
      }
    }
    for (const r2 of config.r2_buckets || []) {
      if (!seenR2.has(r2.binding)) {
        seenR2.add(r2.binding)
        manifest.r2.push({ binding: r2.binding, bucket_name: r2.bucket_name })
      }
    }
    for (const p of config.queues?.producers || []) {
      if (!seenQueueProducers.has(p.binding)) {
        seenQueueProducers.add(p.binding)
        manifest.queues.producers.push({ binding: p.binding, queue: p.queue })
      }
    }
    for (const c of config.queues?.consumers || []) {
      if (!seenQueueConsumers.has(c.queue)) {
        seenQueueConsumers.add(c.queue)
        manifest.queues.consumers.push({
          queue: c.queue,
          max_batch_size: c.max_batch_size,
          max_batch_timeout: c.max_batch_timeout,
          max_retries: c.max_retries,
          dead_letter_queue: c.dead_letter_queue,
        })
      }
    }
    for (const d of config.durable_objects?.bindings || []) {
      if (!seenDO.has(d.name)) {
        seenDO.add(d.name)
        manifest.do.push({ binding: d.name, className: d.class_name })
      }
    }
    for (const [key, value] of Object.entries(config.vars || {})) {
      if (!seenVars.has(key)) {
        seenVars.add(key)
        manifest.vars.push({ key, value, isSecret: looksLikeSecret(key, value) })
      }
    }
  }

  return manifest
}

/**
 * Build a lookup of which worker name defines each DO class (has no script_name itself).
 * Used so the shadow config references the correct script_name for each DO binding.
 */
function buildDOClassOwnerMap(
  configs: { path: string; config: WranglerConfig }[],
): Map<string, string> {
  const map = new Map<string, string>()
  for (const { config } of configs) {
    const workerName = config.name || 'user-worker'
    for (const binding of config.durable_objects?.bindings || []) {
      // A binding that has no script_name defines the class locally
      if (!binding.script_name && !map.has(binding.class_name)) {
        map.set(binding.class_name, workerName)
      }
    }
  }
  return map
}

/**
 * Generate shadow wrangler.toml with merged bindings from multiple configs.
 * When isPrimary=true, this worker runs as the primary and proxies to user's worker.
 */
export function generateShadowConfig(
  configs: { path: string; config: WranglerConfig }[],
  apiWorkerPath: string,
  isPrimary: boolean = false,
): string {
  const primary = configs[0]
  const manifest = createMergedManifest(configs)
  const userWorkerName = primary.config.name || 'user-worker'

  let toml = `# Auto-generated by Localflare CLI
# DO NOT EDIT - This file is regenerated each time localflare runs

name = "localflare-api"
main = "${toPosixPath(apiWorkerPath)}"
compatibility_date = "2024-12-01"

[vars]
LOCALFLARE_MANIFEST = '${JSON.stringify(manifest)}'

`

  // If running as primary, add service binding to user's worker
  if (isPrimary) {
    toml += `# Service binding to user's worker (for proxying non-API requests)
[[services]]
binding = "USER_WORKER"
service = "${userWorkerName}"

`
  }

  // Merge D1 databases (deduplicated)
  const seenD1 = new Set<string>()
  for (const { config } of configs) {
    for (const db of config.d1_databases || []) {
      if (seenD1.has(db.binding)) continue
      seenD1.add(db.binding)
      toml += `[[d1_databases]]
binding = "${db.binding}"
database_name = "${db.database_name}"
database_id = "${db.database_id}"
${db.preview_database_id ? `preview_database_id = "${db.preview_database_id}"\n` : ''}`
    }
  }

  // Merge KV namespaces (deduplicated)
  const seenKV = new Set<string>()
  for (const { config } of configs) {
    for (const kv of config.kv_namespaces || []) {
      if (seenKV.has(kv.binding)) continue
      seenKV.add(kv.binding)
      toml += `[[kv_namespaces]]
binding = "${kv.binding}"
id = "${kv.id}"
${kv.preview_id ? `preview_id = "${kv.preview_id}"\n` : ''}`
    }
  }

  // Merge R2 buckets (deduplicated)
  const seenR2 = new Set<string>()
  for (const { config } of configs) {
    for (const r2 of config.r2_buckets || []) {
      if (seenR2.has(r2.binding)) continue
      seenR2.add(r2.binding)
      toml += `[[r2_buckets]]
binding = "${r2.binding}"
bucket_name = "${r2.bucket_name}"
${r2.remote ? 'remote = true\n' : ''}${r2.jurisdiction ? `jurisdiction = "${r2.jurisdiction}"\n` : ''}`
    }
  }

  // Merge Queue producers (deduplicated)
  const seenQueues = new Set<string>()
  for (const { config } of configs) {
    for (const producer of config.queues?.producers || []) {
      if (seenQueues.has(producer.binding)) continue
      seenQueues.add(producer.binding)
      toml += `[[queues.producers]]
binding = "${producer.binding}"
queue = "${producer.queue}"
${producer.delivery_delay ? `delivery_delay = ${producer.delivery_delay}\n` : ''}`
    }
  }

  // Merge DO bindings (deduplicated), pointing script_name to the worker that defines the class
  const doClassOwners = buildDOClassOwnerMap(configs)
  const seenDO = new Set<string>()
  for (const { config } of configs) {
    for (const doBinding of config.durable_objects?.bindings || []) {
      if (seenDO.has(doBinding.name)) continue
      seenDO.add(doBinding.name)
      // Point to the worker that defines this DO class
      const owner = doClassOwners.get(doBinding.class_name) || userWorkerName
      toml += `[[durable_objects.bindings]]
name = "${doBinding.name}"
class_name = "${doBinding.class_name}"
script_name = "${owner}"
`
    }
  }

  return toml
}

/**
 * Setup the .localflare directory with shadow config and worker
 * @param isPrimary - If true, localflare-api runs as primary worker and proxies to user's worker
 */
export function setupLocalflareDir(
  configs: { path: string; config: WranglerConfig }[],
  isPrimary: boolean = true,
): {
  shadowConfigPath: string
  manifest: LocalflareManifest
} {
  const configDir = dirname(configs[0].path)
  const localflareDir = join(configDir, '.localflare')

  // Create .localflare directory
  if (!existsSync(localflareDir)) {
    mkdirSync(localflareDir, { recursive: true })
  }

  // Get the pre-built worker path
  const apiWorkerPath = getApiWorkerPath()

  // Copy the worker to .localflare
  const localWorkerPath = join(localflareDir, 'api-worker.js')
  cpSync(apiWorkerPath, localWorkerPath)

  // Generate merged manifest
  const manifest = createMergedManifest(configs)

  // Generate shadow config with merged bindings
  const shadowConfig = generateShadowConfig(configs, localWorkerPath, isPrimary)

  // Write shadow config
  const shadowConfigPath = join(localflareDir, 'wrangler.toml')
  writeFileSync(shadowConfigPath, shadowConfig)

  // Add .localflare to .gitignore if it exists and doesn't already include it
  const gitignorePath = join(configDir, '.gitignore')
  if (existsSync(gitignorePath)) {
    const gitignore = readFileSync(gitignorePath, 'utf-8')
    if (!gitignore.includes('.localflare')) {
      writeFileSync(gitignorePath, gitignore + '\n# Localflare generated files\n.localflare/\n')
    }
  }

  return { shadowConfigPath, manifest }
}

/**
 * Format bindings for display
 */
export function formatBindings(manifest: LocalflareManifest): string[] {
  const lines: string[] = []

  for (const db of manifest.d1) {
    lines.push(`   - ${db.binding} (D1)`)
  }
  for (const kv of manifest.kv) {
    lines.push(`   - ${kv.binding} (KV)`)
  }
  for (const r2 of manifest.r2) {
    lines.push(`   - ${r2.binding} (R2)`)
  }
  for (const q of manifest.queues.producers) {
    lines.push(`   - ${q.binding} (Queue)`)
  }
  for (const d of manifest.do) {
    lines.push(`   - ${d.binding} (DO)`)
  }

  return lines
}

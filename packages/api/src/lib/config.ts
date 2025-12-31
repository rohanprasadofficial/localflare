import { readFileSync, existsSync } from 'node:fs'
import { resolve, extname } from 'node:path'
import { parse as parseToml } from 'smol-toml'
import type { WranglerConfig, DiscoveredBindings } from './types.js'

// Supported wrangler config file names in order of priority
export const WRANGLER_CONFIG_FILES = [
  'wrangler.toml',
  'wrangler.json',
  'wrangler.jsonc',
]

/**
 * Strip JSON comments (both // and /* *\/) for JSONC parsing
 */
function stripJsonComments(content: string): string {
  let result = ''
  let inString = false
  let inSingleLineComment = false
  let inMultiLineComment = false
  let i = 0

  while (i < content.length) {
    const char = content[i]
    const nextChar = content[i + 1]

    if (inSingleLineComment) {
      if (char === '\n') {
        inSingleLineComment = false
        result += char
      }
      i++
      continue
    }

    if (inMultiLineComment) {
      if (char === '*' && nextChar === '/') {
        inMultiLineComment = false
        i += 2
        continue
      }
      i++
      continue
    }

    if (inString) {
      result += char
      if (char === '\\' && i + 1 < content.length) {
        result += nextChar
        i += 2
        continue
      }
      if (char === '"') {
        inString = false
      }
      i++
      continue
    }

    if (char === '"') {
      inString = true
      result += char
      i++
      continue
    }

    if (char === '/' && nextChar === '/') {
      inSingleLineComment = true
      i += 2
      continue
    }

    if (char === '/' && nextChar === '*') {
      inMultiLineComment = true
      i += 2
      continue
    }

    result += char
    i++
  }

  return result
}

/**
 * Find wrangler config file in a directory
 * Returns the path to the first found config file, or null if none found
 */
export function findWranglerConfig(directory: string): string | null {
  for (const filename of WRANGLER_CONFIG_FILES) {
    const configPath = resolve(directory, filename)
    if (existsSync(configPath)) {
      return configPath
    }
  }
  return null
}

export function parseWranglerConfig(configPath: string): WranglerConfig {
  const fullPath = resolve(configPath)

  if (!existsSync(fullPath)) {
    throw new Error(`Wrangler config not found at: ${fullPath}`)
  }

  const content = readFileSync(fullPath, 'utf-8')
  const ext = extname(fullPath).toLowerCase()

  switch (ext) {
    case '.toml':
      return parseToml(content) as unknown as WranglerConfig
    case '.json':
      return JSON.parse(content) as WranglerConfig
    case '.jsonc':
      return JSON.parse(stripJsonComments(content)) as WranglerConfig
    default:
      // Try to detect format from content
      const trimmed = content.trim()
      if (trimmed.startsWith('{')) {
        // Looks like JSON/JSONC
        return JSON.parse(stripJsonComments(content)) as WranglerConfig
      }
      // Default to TOML
      return parseToml(content) as unknown as WranglerConfig
  }
}

export function discoverBindings(config: WranglerConfig): DiscoveredBindings {
  return {
    d1: config.d1_databases ?? [],
    kv: config.kv_namespaces ?? [],
    r2: config.r2_buckets ?? [],
    durableObjects: config.durable_objects?.bindings ?? [],
    queues: {
      producers: config.queues?.producers ?? [],
      consumers: config.queues?.consumers ?? [],
    },
    vars: config.vars ?? {},
  }
}

import { existsSync, readdirSync } from 'node:fs'
import { resolve, join, dirname } from 'node:path'
import type { WranglerStateInfo, DatabaseFile, DOFile, DiscoveredBindings } from './types.js'

/**
 * Find the .wrangler/state/v3 directory
 * Searches from the config directory upward
 */
export function findWranglerState(startDir: string): string | null {
  let currentDir = startDir

  // Search up to 5 levels up
  for (let i = 0; i < 5; i++) {
    const statePath = resolve(currentDir, '.wrangler', 'state', 'v3')
    if (existsSync(statePath)) {
      return statePath
    }

    const parentDir = dirname(currentDir)
    if (parentDir === currentDir) break // Reached root
    currentDir = parentDir
  }

  return null
}

/**
 * List all SQLite files in a directory
 */
function listSqliteFiles(dir: string): DatabaseFile[] {
  if (!existsSync(dir)) return []

  try {
    const files = readdirSync(dir)
    return files
      .filter(f => f.endsWith('.sqlite'))
      .map(filename => ({
        path: join(dir, filename),
        filename,
      }))
  } catch {
    return []
  }
}

/**
 * List all DO SQLite files in the DO directory
 * DO files are named with the class name in the directory structure
 */
function listDOFiles(statePath: string): DOFile[] {
  const doBasePath = join(statePath, 'do')
  if (!existsSync(doBasePath)) return []

  const files: DOFile[] = []

  try {
    // DO directory structure: do/<ClassName>/
    const classDirs = readdirSync(doBasePath)
    for (const classDir of classDirs) {
      const classPath = join(doBasePath, classDir)
      try {
        const sqliteFiles = readdirSync(classPath).filter(f => f.endsWith('.sqlite'))
        for (const sqliteFile of sqliteFiles) {
          files.push({
            path: join(classPath, sqliteFile),
            filename: sqliteFile,
            className: classDir,
          })
        }
      } catch {
        // Not a directory or can't read
      }
    }
  } catch {
    return []
  }

  return files
}

/**
 * Discover all SQLite database files in the wrangler state directory
 */
export function discoverWranglerState(statePath: string, bindings?: DiscoveredBindings): WranglerStateInfo {
  const d1Path = join(statePath, 'd1', 'miniflare-D1DatabaseObject')
  const kvPath = join(statePath, 'kv', 'miniflare-KVNamespaceObject')
  const r2Path = join(statePath, 'r2', 'miniflare-R2BucketObject')

  const d1Files = listSqliteFiles(d1Path)
  const kvFiles = listSqliteFiles(kvPath)
  const r2Files = listSqliteFiles(r2Path)
  const doFiles = listDOFiles(statePath)

  // Try to match files with bindings if we have the config
  // For now, use a simple heuristic: if there's only one file and one binding, match them
  if (bindings) {
    if (d1Files.length === 1 && bindings.d1.length === 1) {
      d1Files[0].binding = bindings.d1[0].binding
    } else if (d1Files.length > 0 && bindings.d1.length > 0) {
      // Multiple files - try to match by order (not ideal but works for most cases)
      d1Files.forEach((file, i) => {
        if (bindings.d1[i]) {
          file.binding = bindings.d1[i].binding
        }
      })
    }

    if (kvFiles.length === 1 && bindings.kv.length >= 1) {
      // KV files are created per-namespace, so match the first one
      kvFiles[0].binding = bindings.kv[0].binding
      kvFiles[0].kvId = bindings.kv[0].id
    } else if (kvFiles.length > 0 && bindings.kv.length > 0) {
      kvFiles.forEach((file, i) => {
        if (bindings.kv[i]) {
          file.binding = bindings.kv[i].binding
          file.kvId = bindings.kv[i].id
        }
      })
    }

    if (r2Files.length === 1 && bindings.r2.length >= 1) {
      r2Files[0].binding = bindings.r2[0].binding
      r2Files[0].bucketName = bindings.r2[0].bucket_name
    } else if (r2Files.length > 0 && bindings.r2.length > 0) {
      r2Files.forEach((file, i) => {
        if (bindings.r2[i]) {
          file.binding = bindings.r2[i].binding
          file.bucketName = bindings.r2[i].bucket_name
        }
      })
    }
  }

  // Match DO files with bindings by class name
  if (bindings && bindings.durableObjects.length > 0) {
    for (const doFile of doFiles) {
      const matchingBinding = bindings.durableObjects.find(
        b => b.class_name === doFile.className
      )
      if (matchingBinding) {
        doFile.binding = matchingBinding.name
      }
    }
  }

  return {
    statePath,
    d1Databases: d1Files,
    kvNamespaces: kvFiles,
    r2Buckets: r2Files,
    durableObjects: doFiles,
  }
}

/**
 * Get the blob storage path for a service
 * R2 and KV store large values as separate blob files
 */
export function getBlobPath(statePath: string, service: 'kv' | 'r2'): string {
  const serviceDir = service === 'kv' ? 'miniflare-KVNamespaceObject' : 'miniflare-R2BucketObject'
  return join(statePath, service, serviceDir, 'blobs')
}

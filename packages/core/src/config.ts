import { readFileSync, existsSync } from "node:fs";
import { resolve, extname } from "node:path";
import { parse as parseToml } from "toml";
import parseJsonc from "tiny-jsonc";
import type { WranglerConfig, DiscoveredBindings } from "./types.js";

// Supported wrangler config file names in order of priority
export const WRANGLER_CONFIG_FILES = [
  "wrangler.toml",
  "wrangler.json",
  "wrangler.jsonc",
];

/**
 * Find wrangler config file in a directory
 * Searches for config files in priority order: toml > json > jsonc
 * @param directory - Directory to search in
 * @returns Path to the first found config file, or null if none found
 */
export function findWranglerConfig(directory: string): string | null {
  for (const filename of WRANGLER_CONFIG_FILES) {
    const configPath = resolve(directory, filename);
    if (existsSync(configPath)) {
      return configPath;
    }
  }
  return null;
}

/**
 * Parse wrangler configuration file (TOML, JSON, or JSONC format)
 * @param configPath - Path to the configuration file
 * @returns Parsed configuration object
 * @throws Error if the file doesn't exist or cannot be parsed
 */
export function parseWranglerConfig(configPath: string): WranglerConfig {
  const fullPath = resolve(configPath);

  if (!existsSync(fullPath)) {
    throw new Error(`Wrangler config not found at: ${fullPath}`);
  }

  const content = readFileSync(fullPath, "utf-8");
  const ext = extname(fullPath).toLowerCase();

  switch (ext) {
    case ".toml":
      return parseToml(content) as WranglerConfig;
    case ".json":
    case ".jsonc":
      return parseJsonc.parse(content) as WranglerConfig;
    default: {
      // Try to detect format from content
      const trimmed = content.trim();
      if (trimmed.startsWith("{")) {
        // Looks like JSON/JSONC - use JSONC parser to handle both
        return parseJsonc.parse(content) as WranglerConfig;
      }
      // Default to TOML
      return parseToml(content) as WranglerConfig;
    }
  }
}

/**
 * Discover and extract all bindings from a wrangler configuration
 * @param config - Parsed wrangler configuration
 * @returns Discovered bindings organized by type
 */
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
  };
}

/**
 * Generate a human-readable summary of discovered bindings
 * @param bindings - Discovered bindings to summarize
 * @returns Array of summary strings, one per binding type
 */
export function getBindingSummary(bindings: DiscoveredBindings): string[] {
  const summary: string[] = [];

  if (bindings.d1.length > 0) {
    summary.push(
      `D1 Databases: ${bindings.d1.map((d) => d.binding).join(", ")}`
    );
  }
  if (bindings.kv.length > 0) {
    summary.push(
      `KV Namespaces: ${bindings.kv.map((k) => k.binding).join(", ")}`
    );
  }
  if (bindings.r2.length > 0) {
    summary.push(`R2 Buckets: ${bindings.r2.map((r) => r.binding).join(", ")}`);
  }
  if (bindings.durableObjects.length > 0) {
    summary.push(
      `Durable Objects: ${bindings.durableObjects
        .map((d) => d.name)
        .join(", ")}`
    );
  }
  if (bindings.queues.producers.length > 0) {
    summary.push(
      `Queue Producers: ${bindings.queues.producers
        .map((q) => q.binding)
        .join(", ")}`
    );
  }
  if (bindings.queues.consumers.length > 0) {
    summary.push(
      `Queue Consumers: ${bindings.queues.consumers
        .map((q) => q.queue)
        .join(", ")}`
    );
  }
  if (Object.keys(bindings.vars).length > 0) {
    summary.push(
      `Environment Variables: ${Object.keys(bindings.vars).join(", ")}`
    );
  }

  return summary;
}

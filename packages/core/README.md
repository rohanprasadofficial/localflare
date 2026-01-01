# localflare-core

Core configuration parser and utilities for [Localflare](https://www.npmjs.com/package/localflare).

[![npm version](https://img.shields.io/npm/v/localflare-core.svg)](https://www.npmjs.com/package/localflare-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

This package provides core utilities for Localflare:

- **Config Parser** - Reads and parses `wrangler.toml` / `wrangler.json` / `wrangler.jsonc` configuration files
- **Binding Discovery** - Extracts D1, KV, R2, Durable Objects, and Queue binding configurations
- **Type Definitions** - TypeScript types for wrangler configuration and Localflare manifests

## Installation

```bash
npm install localflare-core
# or
pnpm add localflare-core
```

## Usage

```typescript
import {
  parseWranglerConfig,
  findWranglerConfig,
  WRANGLER_CONFIG_FILES
} from 'localflare-core';

// Find wrangler config in current directory
const configPath = findWranglerConfig(process.cwd());
// Returns: ./wrangler.toml, ./wrangler.json, or ./wrangler.jsonc

// Parse the configuration
const config = parseWranglerConfig(configPath);

// Access binding configurations
console.log(config.d1_databases);    // D1 database bindings
console.log(config.kv_namespaces);   // KV namespace bindings
console.log(config.r2_buckets);      // R2 bucket bindings
console.log(config.durable_objects); // Durable Object bindings
console.log(config.queues);          // Queue producer/consumer config
```

## API Reference

### `findWranglerConfig(directory: string): string | null`

Searches for a wrangler configuration file in the specified directory.

```typescript
const configPath = findWranglerConfig('/path/to/project');
// Returns: '/path/to/project/wrangler.toml' or null
```

### `parseWranglerConfig(configPath: string): WranglerConfig`

Parses a wrangler configuration file (TOML, JSON, or JSONC format).

```typescript
const config = parseWranglerConfig('./wrangler.toml');
```

### `WRANGLER_CONFIG_FILES`

Array of supported config file names: `['wrangler.toml', 'wrangler.json', 'wrangler.jsonc']`

## Types

```typescript
interface WranglerConfig {
  name?: string;
  main?: string;
  compatibility_date?: string;
  d1_databases?: D1DatabaseConfig[];
  kv_namespaces?: KVNamespaceConfig[];
  r2_buckets?: R2BucketConfig[];
  durable_objects?: { bindings: DurableObjectConfig[] };
  queues?: {
    producers?: QueueProducerConfig[];
    consumers?: QueueConsumerConfig[];
  };
  vars?: Record<string, string>;
  // ... and more
}

interface LocalflareManifest {
  name: string;
  d1: { binding: string; database_name: string }[];
  kv: { binding: string }[];
  r2: { binding: string; bucket_name: string }[];
  queues: {
    producers: { binding: string; queue: string }[];
    consumers: { queue: string; max_batch_size?: number; /* ... */ }[];
  };
  do: { binding: string; className: string }[];
}
```

## Related Packages

| Package | Description |
|---------|-------------|
| [`localflare`](https://www.npmjs.com/package/localflare) | CLI tool (main package) |
| [`localflare-api`](https://www.npmjs.com/package/localflare-api) | Dashboard API worker |

## License

MIT

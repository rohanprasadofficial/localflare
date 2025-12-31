/**
 * Get the API base URL.
 * - In local dev mode (Vite): defaults to localhost:8788
 * - In production (studio.localflare.dev): reads port from URL query param
 * - In local bundled mode: uses relative /api path
 */
function getApiBase(): string {
  // Check if we're on studio.localflare.dev or localhost:5174 (Dashboard Vite dev server)
  const isHostedMode =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'studio.localflare.dev' ||
      (window.location.hostname === 'localhost' && window.location.port === '5174'))

  if (isHostedMode) {
    // Hosted mode: API is on localhost with port from URL
    const params = new URLSearchParams(window.location.search)
    const port = params.get('port') || '8788'
    return `http://localhost:${port}/api`
  }

  // Local bundled mode: API is served from same origin
  return '/api'
}

const API_BASE = getApiBase()

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// Bindings
export const bindingsApi = {
  getAll: () => fetchApi<BindingsResponse>('/bindings'),
}

// D1
export const d1Api = {
  list: () => fetchApi<{ databases: D1Database[] }>('/d1'),
  getSchema: (binding: string) => fetchApi<{ tables: D1Table[] }>(`/d1/${binding}/schema`),
  getTableInfo: (binding: string, table: string) =>
    fetchApi<{ table: string; columns: D1Column[]; rowCount: number }>(`/d1/${binding}/tables/${table}`),
  getRows: (binding: string, table: string, limit = 100, offset = 0) =>
    fetchApi<{ rows: Record<string, unknown>[]; meta: unknown }>(
      `/d1/${binding}/tables/${table}/rows?limit=${limit}&offset=${offset}`
    ),
  query: (binding: string, sql: string, params: unknown[] = []) =>
    fetchApi<{ success: boolean; results?: unknown[]; meta?: unknown }>(`/d1/${binding}/query`, {
      method: 'POST',
      body: JSON.stringify({ sql, params }),
    }),
  insertRow: (binding: string, table: string, data: Record<string, unknown>) =>
    fetchApi<{ success: boolean }>(`/d1/${binding}/tables/${table}/rows`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateRow: (binding: string, table: string, id: string, data: Record<string, unknown>) =>
    fetchApi<{ success: boolean }>(`/d1/${binding}/tables/${table}/rows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteRow: (binding: string, table: string, id: string) =>
    fetchApi<{ success: boolean }>(`/d1/${binding}/tables/${table}/rows/${id}`, {
      method: 'DELETE',
    }),
}

// KV
export const kvApi = {
  list: () => fetchApi<{ namespaces: KVNamespace[] }>('/kv'),
  getKeys: (binding: string, prefix?: string, cursor?: string, limit = 100) => {
    const params = new URLSearchParams({ limit: String(limit) })
    if (prefix) params.set('prefix', prefix)
    if (cursor) params.set('cursor', cursor)
    return fetchApi<{ keys: KVKey[]; cursor?: string; list_complete: boolean }>(
      `/kv/${binding}/keys?${params}`
    )
  },
  getValue: (binding: string, key: string, type = 'text') =>
    fetchApi<{ key: string; value: unknown; metadata?: unknown }>(
      `/kv/${binding}/keys/${encodeURIComponent(key)}?type=${type}`
    ),
  setValue: (binding: string, key: string, value: string, metadata?: unknown, ttl?: number) =>
    fetchApi<{ success: boolean }>(`/kv/${binding}/keys/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify({ value, metadata, expirationTtl: ttl }),
    }),
  deleteKey: (binding: string, key: string) =>
    fetchApi<{ success: boolean }>(`/kv/${binding}/keys/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    }),
}

// R2
export const r2Api = {
  list: () => fetchApi<{ buckets: R2Bucket[] }>('/r2'),
  getObjects: (binding: string, prefix?: string, cursor?: string, limit = 100) => {
    const params = new URLSearchParams({ limit: String(limit) })
    if (prefix) params.set('prefix', prefix)
    if (cursor) params.set('cursor', cursor)
    return fetchApi<{ objects: R2Object[]; truncated: boolean; cursor?: string }>(
      `/r2/${binding}/objects?${params}`
    )
  },
  getObjectMeta: (binding: string, key: string) =>
    fetchApi<R2Object>(`/r2/${binding}/objects/${encodeURIComponent(key)}/meta`),
  getObjectUrl: (binding: string, key: string) =>
    `${API_BASE}/r2/${binding}/objects/${encodeURIComponent(key)}`,
  getObjectContent: async (binding: string, key: string) => {
    const response = await fetch(`${API_BASE}/r2/${binding}/objects/${encodeURIComponent(key)}`)
    if (!response.ok) throw new Error('Failed to fetch object')
    return response
  },
  deleteObject: (binding: string, key: string) =>
    fetchApi<{ success: boolean }>(`/r2/${binding}/objects/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    }),
}

// Queues
export const queuesApi = {
  list: () => fetchApi<{ producers: QueueProducer[]; consumers: QueueConsumer[] }>('/queues'),
  send: (binding: string, message: unknown) =>
    fetchApi<{ success: boolean }>(`/queues/${binding}/send`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
}

// Durable Objects
export const doApi = {
  list: () => fetchApi<{ durableObjects: DurableObject[] }>('/do'),
  getInstances: () =>
    fetchApi<{ instances: DOInstance[] }>('/do/instances'),
  getId: (binding: string, options: { name?: string; id?: string }) =>
    fetchApi<{ id: string }>(`/do/${binding}/id`, {
      method: 'POST',
      body: JSON.stringify(options),
    }),
  fetch: async (binding: string, id: string, path: string, options?: RequestInit) => {
    const response = await fetch(`/api/do/${binding}/${id}/fetch${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
    return response
  },
}

export interface DOInstance extends Record<string, unknown> {
  binding: string
  class_name: string
  id: string
}

// Types
export interface BindingsResponse {
  name: string
  bindings: {
    d1: { type: string; binding: string; database_name: string }[]
    kv: { type: string; binding: string }[]
    r2: { type: string; binding: string; bucket_name: string }[]
    durableObjects: { type: string; name: string; binding: string; class_name: string; script_name?: string }[]
    queues: {
      producers: { type: string; binding: string; queue: string }[]
      consumers: { type: string; queue: string }[]
    }
    vars: { type: string; key: string; value: string }[]
  }
}

export interface D1Database {
  binding: string
  database_name: string
  database_id: string
}

export interface D1Table {
  name: string
  sql: string
}

export interface D1Column {
  cid: number
  name: string
  type: string
  notnull: number
  dflt_value: unknown
  pk: number
}

export interface KVNamespace {
  binding: string
  id: string
}

export interface KVKey {
  name: string
  expiration?: number
  metadata?: unknown
}

export interface R2Bucket {
  binding: string
  bucket_name: string
}

export interface R2Object {
  key: string
  size: number
  etag: string
  httpEtag: string
  uploaded: string
  checksums?: unknown
  customMetadata?: Record<string, string>
  httpMetadata?: {
    contentType?: string
    contentDisposition?: string
  }
}

export interface QueueProducer {
  binding: string
  queue: string
}

export interface QueueConsumer {
  queue: string
  max_batch_size: number
  max_batch_timeout: number
  max_retries: number
  dead_letter_queue?: string
}

export interface DurableObject {
  name: string
  class_name: string
  script_name?: string
}

// Logs
export interface LogEntry {
  id: string
  timestamp: string
  level: 'log' | 'info' | 'warn' | 'error' | 'debug'
  source: 'worker' | 'queue' | 'do' | 'system'
  message: string
  data?: unknown
}

export const logsApi = {
  getRecent: (limit = 100) => fetchApi<{ logs: LogEntry[] }>(`/logs?limit=${limit}`),
  clear: () => fetchApi<{ success: boolean }>('/logs', { method: 'DELETE' }),
  // SSE stream is handled separately via EventSource
}

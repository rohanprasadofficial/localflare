const API_BASE = '/api'

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

// Types
export interface User {
  id: number
  email: string
  name: string
  role: string
  created_at: string
}

export interface Post {
  id: number
  user_id: number
  title: string
  content: string
  created_at: string
  author_name?: string
}

export interface KVKey {
  name: string
  expiration?: number
  metadata?: Record<string, unknown>
}

export interface R2Object {
  key: string
  size: number
  uploaded: string
}

// D1 API
export const d1Api = {
  getUsers: () => fetchApi<User[]>('/users'),
  getUser: (id: number) => fetchApi<User>(`/users/${id}`),
  createUser: (data: { email: string; name: string; role?: string }) =>
    fetchApi<{ success: boolean; id: number }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteUser: (id: number) =>
    fetchApi<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' }),
  getPosts: () => fetchApi<Post[]>('/posts'),
}

// KV API
export const kvApi = {
  listKeys: (prefix?: string) =>
    fetchApi<{ keys: KVKey[] }>(`/kv${prefix ? `?prefix=${prefix}` : ''}`),
  getValue: (key: string) =>
    fetchApi<{ key: string; value: string }>(`/kv/${encodeURIComponent(key)}`),
  setValue: (key: string, value: string, ttl?: number) =>
    fetchApi<{ success: boolean; key: string }>(`/kv/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify({ value, ttl }),
    }),
  deleteKey: (key: string) =>
    fetchApi<{ success: boolean }>(`/kv/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    }),
}

// R2 API
export const r2Api = {
  listFiles: (prefix?: string) =>
    fetchApi<{ objects: R2Object[] }>(`/files${prefix ? `?prefix=${prefix}` : ''}`),
  uploadFile: async (key: string, file: File) => {
    const response = await fetch(`${API_BASE}/files/${encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    })
    if (!response.ok) throw new Error(`Upload failed: ${response.status}`)
    return response.json() as Promise<{ success: boolean; key: string }>
  },
  downloadFile: (key: string) => `${API_BASE}/files/${encodeURIComponent(key)}`,
  deleteFile: (key: string) =>
    fetchApi<{ success: boolean }>(`/files/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    }),
}

// Queue API
export const queueApi = {
  sendMessage: (message: unknown) =>
    fetchApi<{ success: boolean; message: string }>('/queue', {
      method: 'POST',
      body: JSON.stringify(message),
    }),
}

// Durable Objects API
export const doApi = {
  getCounter: (name: string) =>
    fetchApi<{ value: number }>(`/counter/${encodeURIComponent(name)}`),
  increment: (name: string) =>
    fetchApi<{ value: number }>(`/counter/${encodeURIComponent(name)}/increment`, {
      method: 'POST',
    }),
  decrement: (name: string) =>
    fetchApi<{ value: number }>(`/counter/${encodeURIComponent(name)}/decrement`, {
      method: 'POST',
    }),
  reset: (name: string) =>
    fetchApi<{ value: number }>(`/counter/${encodeURIComponent(name)}/reset`, {
      method: 'POST',
    }),
}

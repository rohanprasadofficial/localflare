/** Cloudflare REST API v4 client. Unwraps the CF response envelope. */
import type { CloudflareCredentials } from '../types'

const CF_API_BASE = '/cf-api'

interface CloudflareApiError {
  code: number
  message: string
}

interface CloudflareEnvelope<T> {
  success: boolean
  errors: CloudflareApiError[]
  messages: string[]
  result: T
  result_info?: {
    count?: number
    page?: number
    per_page?: number
    total_count?: number
    cursor?: string
  }
}

export interface CloudflarePagedResult<T> {
  data: T
  resultInfo?: CloudflareEnvelope<T>['result_info']
}

export class CloudflareClient {
  private readonly accountId: string
  private readonly apiToken: string

  constructor(credentials: CloudflareCredentials) {
    this.accountId = credentials.accountId
    this.apiToken = credentials.apiToken
  }

  async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${CF_API_BASE}/accounts/${this.accountId}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      const envelope = data as CloudflareEnvelope<unknown> | null
      const errorMessage = envelope?.errors?.[0]?.message
        || `Cloudflare API error: HTTP ${response.status}`
      throw new Error(errorMessage)
    }

    const data = await response.json() as CloudflareEnvelope<T>

    if (!data.success) {
      throw new Error(data.errors?.[0]?.message || 'Cloudflare API error')
    }

    return data.result
  }

  async fetchPaged<T>(endpoint: string, options?: RequestInit): Promise<CloudflarePagedResult<T>> {
    const url = `${CF_API_BASE}/accounts/${this.accountId}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      const envelope = data as CloudflareEnvelope<unknown> | null
      throw new Error(envelope?.errors?.[0]?.message || `Cloudflare API error: HTTP ${response.status}`)
    }

    const data = await response.json() as CloudflareEnvelope<T>

    if (!data.success) {
      throw new Error(data.errors?.[0]?.message || 'Cloudflare API error')
    }

    return { data: data.result, resultInfo: data.result_info }
  }

  /** Fetch raw response (for endpoints that don't return JSON envelope). */
  async fetchRaw(endpoint: string, options?: RequestInit): Promise<Response> {
    const url = `${CF_API_BASE}/accounts/${this.accountId}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`Cloudflare API error: HTTP ${response.status}`)
    }

    return response
  }

  async validate(): Promise<{ valid: boolean; email?: string }> {
    try {
      const response = await fetch(`${CF_API_BASE}/accounts/${this.accountId}/tokens/verify`, {
        headers: { 'Authorization': `Bearer ${this.apiToken}` },
      })
      const data = await response.json() as CloudflareEnvelope<{ id: string; status: string }>
      return { valid: data.success && data.result?.status === 'active' }
    } catch {
      return { valid: false }
    }
  }
}

import { AwsClient } from 'aws4fetch'
import type {
  R2DataSource,
  R2BucketInfo,
  R2ObjectInfo,
  ListObjectsOpts,
  ObjectListResult,
  UploadResult,
  CloudflareCredentials,
} from '../types'
import type { CloudflareClient } from './client'

interface CFR2Bucket {
  name: string
  creation_date: string
  location?: string
  storage_class?: string
}

interface TempCredentials {
  accessKeyId: string
  secretAccessKey: string
  sessionToken: string
  expiresAt: number
}


export class RemoteR2DataSource implements R2DataSource {
  private tempCreds: TempCredentials | null = null
  private tempCredsBucket: string | null = null
  private s3Client: AwsClient | null = null

  constructor(
    private readonly client: CloudflareClient,
    private readonly credentials: CloudflareCredentials
  ) {}

  async listBuckets(): Promise<R2BucketInfo[]> {
    const result = await this.client.fetch<{ buckets: CFR2Bucket[] }>('/r2/buckets')
    return result.buckets.map((bucket): R2BucketInfo => ({
      binding: bucket.name,
      bucket_name: bucket.name,
    }))
  }

  async listObjects(binding: string, opts?: ListObjectsOpts): Promise<ObjectListResult> {
    const s3 = await this.getS3Client(binding)

    const params = new URLSearchParams({ 'list-type': '2' })
    if (opts?.prefix) params.set('prefix', opts.prefix)
    if (opts?.cursor) params.set('continuation-token', opts.cursor)
    if (opts?.limit) params.set('max-keys', String(opts.limit))

    const url = `${this.getEndpoint()}/${binding}?${params}`
    const response = await this.proxyFetch(s3, url)
    const xml = await response.text()

    return this.parseListObjectsResponse(xml)
  }

  async getObjectMeta(binding: string, key: string): Promise<R2ObjectInfo> {
    const s3 = await this.getS3Client(binding)

    const url = `${this.getEndpoint()}/${binding}/${encodeURIComponent(key)}`
    const response = await this.proxyFetch(s3, url, { method: 'HEAD' })

    if (!response.ok) {
      throw new Error(`Failed to get object metadata: HTTP ${response.status}`)
    }

    return {
      key,
      size: parseInt(response.headers.get('content-length') || '0', 10),
      etag: response.headers.get('etag')?.replace(/"/g, '') || '',
      httpEtag: response.headers.get('etag') || '',
      uploaded: response.headers.get('last-modified') || new Date().toISOString(),
      httpMetadata: {
        contentType: response.headers.get('content-type') || undefined,
        contentDisposition: response.headers.get('content-disposition') || undefined,
      },
    }
  }

  getObjectUrl(_binding: string, _key: string): string | null {
    return null
  }

  async getObjectContent(binding: string, key: string): Promise<Response> {
    const s3 = await this.getS3Client(binding)

    const url = `${this.getEndpoint()}/${binding}/${encodeURIComponent(key)}`
    const response = await this.proxyFetch(s3, url)

    if (!response.ok) {
      throw new Error(`Failed to fetch object: HTTP ${response.status}`)
    }

    return response
  }

  async uploadObject(binding: string, key: string, file: File): Promise<UploadResult> {
    const s3 = await this.getS3Client(binding)

    const url = `${this.getEndpoint()}/${binding}/${encodeURIComponent(key)}`
    const response = await this.proxyFetch(s3, url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
    })

    if (!response.ok) {
      throw new Error(`Failed to upload object: HTTP ${response.status}`)
    }

    return {
      success: true,
      key,
      size: file.size,
      etag: response.headers.get('etag')?.replace(/"/g, '') || '',
    }
  }

  async deleteObject(binding: string, key: string): Promise<void> {
    const s3 = await this.getS3Client(binding)

    const url = `${this.getEndpoint()}/${binding}/${encodeURIComponent(key)}`
    const response = await this.proxyFetch(s3, url, { method: 'DELETE' })

    if (!response.ok) {
      throw new Error(`Failed to delete object: HTTP ${response.status}`)
    }
  }

  private getEndpoint(): string {
    return `https://${this.credentials.accountId}.r2.cloudflarestorage.com`
  }

  /**
   * Sends the request through the local Vite proxy which signs and
   * forwards to R2 server-side, bypassing browser CORS restrictions.
   */
  private async proxyFetch(_s3: AwsClient, url: string, init?: RequestInit): Promise<Response> {
    if (!this.tempCreds) {
      throw new Error('No R2 credentials available')
    }
    const method = init?.method || 'GET'
    const headers: Record<string, string> = {
      'x-r2-target-url': url,
      'x-r2-access-key-id': this.tempCreds.accessKeyId,
      'x-r2-secret-access-key': this.tempCreds.secretAccessKey,
      'x-r2-session-token': this.tempCreds.sessionToken,
    }
    if (init?.headers) {
      const h = init.headers as Record<string, string>
      if (h['Content-Type']) headers['Content-Type'] = h['Content-Type']
    }
    return fetch('/r2-s3-proxy', {
      method,
      headers,
      body: ['GET', 'HEAD'].includes(method) ? undefined : init?.body,
    })
  }

  private async getS3Client(bucket: string): Promise<AwsClient> {
    if (!this.credentials.r2AccessKeyId) {
      throw new Error(
        'R2 object operations require an R2 Access Key ID. Add one in Remote settings (Cloudflare Dashboard > R2 > Manage API Tokens).'
      )
    }

    if (this.s3Client && this.tempCreds && this.tempCredsBucket === bucket && Date.now() < this.tempCreds.expiresAt - 60_000) {
      return this.s3Client
    }

    const result = await this.client.fetch<{
      accessKeyId: string
      secretAccessKey: string
      sessionToken: string
    }>('/r2/temp-access-credentials', {
      method: 'POST',
      body: JSON.stringify({
        bucket,
        parentAccessKeyId: this.credentials.r2AccessKeyId,
        permission: 'object-read-write',
        ttlSeconds: 900,
      }),
    })

    this.tempCreds = {
      ...result,
      expiresAt: Date.now() + 900_000,
    }
    this.tempCredsBucket = bucket

    this.s3Client = new AwsClient({
      accessKeyId: result.accessKeyId,
      secretAccessKey: result.secretAccessKey,
      sessionToken: result.sessionToken,
      service: 's3',
      region: 'auto',
    })

    return this.s3Client
  }

  private parseListObjectsResponse(xml: string): ObjectListResult {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')

    const objects: R2ObjectInfo[] = []
    const contents = doc.querySelectorAll('Contents')

    for (const item of contents) {
      const key = item.querySelector('Key')?.textContent || ''
      const size = parseInt(item.querySelector('Size')?.textContent || '0', 10)
      const etag = (item.querySelector('ETag')?.textContent || '').replace(/"/g, '')
      const lastModified = item.querySelector('LastModified')?.textContent || ''

      objects.push({
        key,
        size,
        etag,
        httpEtag: `"${etag}"`,
        uploaded: lastModified,
      })
    }

    const isTruncated = doc.querySelector('IsTruncated')?.textContent === 'true'
    const nextToken = doc.querySelector('NextContinuationToken')?.textContent || undefined

    return {
      objects,
      truncated: isTruncated,
      cursor: nextToken,
    }
  }
}

export interface WranglerConfig {
  name?: string
  main?: string
  compatibility_date?: string
  compatibility_flags?: string[]
  d1_databases?: D1DatabaseConfig[]
  kv_namespaces?: KVNamespaceConfig[]
  r2_buckets?: R2BucketConfig[]
  durable_objects?: DurableObjectsConfig
  queues?: QueuesConfig
  vars?: Record<string, string>
}

export interface D1DatabaseConfig {
  binding: string
  database_name: string
  database_id: string
  migrations_dir?: string
  preview_database_id?: string
}

export interface KVNamespaceConfig {
  binding: string
  id: string
  preview_id?: string
}

export interface R2BucketConfig {
  binding: string
  bucket_name: string
  preview_bucket_name?: string
  remote?: boolean
  jurisdiction?: string
}

export interface DurableObjectsConfig {
  bindings?: DurableObjectBinding[]
}

export interface DurableObjectBinding {
  name: string
  class_name: string
  script_name?: string
}

export interface QueuesConfig {
  producers?: QueueProducerConfig[]
  consumers?: QueueConsumerConfig[]
}

export interface QueueProducerConfig {
  binding: string
  queue: string
  delivery_delay?: number
}

export interface QueueConsumerConfig {
  queue: string
  max_batch_size?: number
  max_batch_timeout?: number
  max_retries?: number
  dead_letter_queue?: string
  max_concurrency?: number
  retry_delay?: number
}

export interface DiscoveredBindings {
  d1: D1DatabaseConfig[]
  kv: KVNamespaceConfig[]
  r2: R2BucketConfig[]
  durableObjects: DurableObjectBinding[]
  queues: {
    producers: QueueProducerConfig[]
    consumers: QueueConsumerConfig[]
  }
  vars: Record<string, string>
}

export interface BindingInfo {
  type: 'D1' | 'KV' | 'R2' | 'DO' | 'Queue' | 'Var'
  name: string
  details: Record<string, unknown>
}

/**
 * Manifest passed to the Localflare API worker via environment variable.
 * Contains binding information discovered from user's wrangler.toml.
 * Used by both CLI (to generate) and API (to consume).
 */
export interface LocalflareManifest {
  name: string
  d1: { binding: string; database_name: string }[]
  kv: { binding: string }[]
  r2: { binding: string; bucket_name: string }[]
  queues: {
    producers: { binding: string; queue: string }[]
    consumers: {
      queue: string
      max_batch_size?: number
      max_batch_timeout?: number
      max_retries?: number
      dead_letter_queue?: string
    }[]
  }
  do: { binding: string; className: string }[]
}

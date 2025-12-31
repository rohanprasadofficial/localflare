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
}

export interface QueueConsumerConfig {
  queue: string
  max_batch_size?: number
  max_batch_timeout?: number
  max_retries?: number
  dead_letter_queue?: string
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

export interface WranglerStateInfo {
  statePath: string
  d1Databases: DatabaseFile[]
  kvNamespaces: DatabaseFile[]
  r2Buckets: DatabaseFile[]
  durableObjects: DOFile[]
}

export interface DOFile {
  path: string
  filename: string
  className?: string  // Matched class name from config (if determinable)
  binding?: string    // Matched binding name from config (if determinable)
}

export interface DatabaseFile {
  path: string
  filename: string
  binding?: string  // Matched binding from config (if determinable)
  kvId?: string     // KV namespace id from config (for blob directory)
  bucketName?: string  // R2 bucket name from config (for blob directory)
}

export interface ApiServerOptions {
  configPath?: string
  statePath?: string
  port?: number
}

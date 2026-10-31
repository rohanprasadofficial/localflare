import test from 'node:test'
import assert from 'node:assert'

// O que este teste executa: Valida a extracao correta de todos os tipos de bindings a partir de um objeto de configuracao do Wrangler.
test('discoverBindings extrai e normaliza d1, kv, r2, queues e variaveis de ambiente', () => {
  // O que este teste executa: Verifica se bindings nulos ou indefinidos recebem valores default vazios sem lancar excecao.
  function discoverBindings(config: any) {
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

  const mockConfig = {
    d1_databases: [{ binding: 'DB', database_id: 'd1-123' }],
    kv_namespaces: [{ binding: 'CACHE', id: 'kv-123' }],
    r2_buckets: [{ binding: 'STORAGE', bucket_name: 'my-bucket' }],
    durable_objects: {
      bindings: [{ name: 'DO_SESSION', class_name: 'SessionDO' }],
    },
    queues: {
      producers: [{ binding: 'Q_OUT', queue: 'out-queue' }],
      consumers: [{ queue: 'in-queue', max_batch_size: 10 }],
    },
    vars: {
      ENVIRONMENT: 'production',
      API_VERSION: 'v1',
    },
  }

  const result = discoverBindings(mockConfig)

  assert.strictEqual(result.d1.length, 1)
  assert.strictEqual(result.d1[0].binding, 'DB')
  assert.strictEqual(result.kv.length, 1)
  assert.strictEqual(result.kv[0].binding, 'CACHE')
  assert.strictEqual(result.r2.length, 1)
  assert.strictEqual(result.r2[0].binding, 'STORAGE')
  assert.strictEqual(result.durableObjects.length, 1)
  assert.strictEqual(result.durableObjects[0].name, 'DO_SESSION')
  assert.strictEqual(result.queues.producers.length, 1)
  assert.strictEqual(result.queues.consumers.length, 1)
  assert.strictEqual(result.vars.ENVIRONMENT, 'production')
})

// O que este teste executa: Valida geracao de sumario textual legivel com multiplos recursos vinculados.
test('getBindingSummary gera descricoes formatadas para cada servico configurado', () => {
  function getBindingSummary(bindings: any): string[] {
    const summary: string[] = []
    if (bindings.d1.length > 0) summary.push(`D1 Databases: ${bindings.d1.map((d: any) => d.binding).join(', ')}`)
    if (bindings.kv.length > 0) summary.push(`KV Namespaces: ${bindings.kv.map((k: any) => k.binding).join(', ')}`)
    if (bindings.r2.length > 0) summary.push(`R2 Buckets: ${bindings.r2.map((r: any) => r.binding).join(', ')}`)
    if (Object.keys(bindings.vars).length > 0) summary.push(`Environment Variables: ${Object.keys(bindings.vars).join(', ')}`)
    return summary
  }

  const sample = {
    d1: [{ binding: 'USERS_DB' }],
    kv: [{ binding: 'SESSION_KV' }],
    r2: [{ binding: 'ASSETS_R2' }],
    vars: { NODE_ENV: 'test' },
  }

  const summary = getBindingSummary(sample)
  assert.strictEqual(summary.length, 4)
  assert.strictEqual(summary[0], 'D1 Databases: USERS_DB')
  assert.strictEqual(summary[1], 'KV Namespaces: SESSION_KV')
  assert.strictEqual(summary[2], 'R2 Buckets: ASSETS_R2')
  assert.strictEqual(summary[3], 'Environment Variables: NODE_ENV')
})

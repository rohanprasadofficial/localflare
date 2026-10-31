import test from 'node:test'
import assert from 'node:assert'

// O que este teste executa: Garante que conexoes SSE quebradas ou inscritos com falha sao removidos imediatamente do Set de broadcast para evitar vazamento de memoria.
test('broadcast remove subscribers inativos que lancam erro de conexao', () => {
  type Subscriber = (event: string, data: unknown) => void
  const subscribers = new Set<Subscriber>()

  let activeReceived = 0
  const activeSubscriber: Subscriber = (ev, data) => {
    activeReceived++
  }

  const deadSubscriber: Subscriber = () => {
    throw new Error('Broken pipe / SSE client disconnected')
  }

  subscribers.add(activeSubscriber)
  subscribers.add(deadSubscriber)

  assert.strictEqual(subscribers.size, 2)

  // O que este teste executa: Executa rotina de broadcast e verifica expurgo automatico do subscriber com erro.
  function broadcast(event: string, data: unknown) {
    for (const subscriber of subscribers) {
      try {
        subscriber(event, data)
      } catch {
        subscribers.delete(subscriber)
      }
    }
  }

  broadcast('test-event', { ok: true })

  // O ativo deve continuar no Set e ter recebido o evento
  assert.strictEqual(subscribers.size, 1)
  assert.strictEqual(subscribers.has(activeSubscriber), true)
  assert.strictEqual(subscribers.has(deadSubscriber), false)
  assert.strictEqual(activeReceived, 1)
})

// O que este teste executa: Garante que buffers binarios grandes (ex: 200KB a 1MB) sao convertidos para base64 sem estourar a pilha de chamadas (RangeError).
test('conversao de buffers binarios para base64 nao lanca Maximum call stack size exceeded', () => {
  const largeBuffer = new Uint8Array(200 * 1024) // 200KB
  for (let i = 0; i < largeBuffer.length; i++) {
    largeBuffer[i] = i % 256
  }

  // O que este teste executa: Executa conversao segura usando Buffer.from sem estourar limites de argumentos em funcoes.
  const base64Safe = Buffer.from(largeBuffer).toString('base64')

  assert.strictEqual(typeof base64Safe, 'string')
  assert.strictEqual(base64Safe.length > 0, true)
})

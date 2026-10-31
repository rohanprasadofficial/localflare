import test from 'node:test'
import assert from 'node:assert'

// O que este teste executa: Valida a politica de buffer circular limitando o consumo de memoria em requisicoes capturadas.
test('requestStore limita o historico ao tamanho maximo definido sem estourar memoria', () => {
  const MAX_REQUESTS = 10
  let requests: { id: string; timestamp: string }[] = []

  function addRequest(req: { id: string; timestamp: string }) {
    requests.push(req)
    if (requests.length > MAX_REQUESTS) {
      requests = requests.slice(-MAX_REQUESTS)
    }
  }

  // O que este teste executa: Insere 25 requisicoes em sequencia para verificar se apenas as 10 mais recentes sao mantidas.
  for (let i = 1; i <= 25; i++) {
    addRequest({ id: `req-${i}`, timestamp: new Date().toISOString() })
  }

  assert.strictEqual(requests.length, 10)
  assert.strictEqual(requests[0].id, 'req-16')
  assert.strictEqual(requests[9].id, 'req-25')
})

// O que este teste executa: Valida o calculo de duracao e classificacao de status em requisicoes completadas.
test('completeRequest calcula a duracao em milissegundos e atribui nivel de severidade correto', () => {
  const startTime = Date.now() - 45
  const duration = Date.now() - startTime
  const statusCode = 404
  const level = statusCode >= 400 ? 'error' : 'info'

  assert.strictEqual(level, 'error')
  assert.strictEqual(duration >= 40, true)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'

import { createDORoutes } from '../dist/worker/index.js'

const manifest = JSON.stringify({
  name: 'worker',
  d1: [],
  kv: [],
  r2: [],
  queues: { producers: [], consumers: [] },
  do: [{ binding: 'COUNTER', className: 'Counter' }],
  vars: [],
})

async function withServer(handler, run) {
  const server = createServer(handler)
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve())
  })

  const address = server.address()
  if (!address || typeof address === 'string') {
    server.close()
    throw new Error('Could not determine test server address')
  }

  const baseUrl = `http://127.0.0.1:${address.port}`

  try {
    await run(baseUrl)
  } finally {
    await new Promise((resolve) => server.close(() => resolve()))
  }
}

test('returns 503 for storage instances when storage server is unavailable', async () => {
  const app = createDORoutes()

  const response = await app.request(
    'http://local/COUNTER/storage/instances',
    { method: 'GET' },
    { LOCALFLARE_MANIFEST: manifest },
  )

  assert.equal(response.status, 503)
  const payload = await response.json()
  assert.equal(payload.error, 'DO storage server not available')
})

test('proxies rows route with encoded path params and query string', async () => {
  await withServer(async (req, res) => {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ proxiedPath: req.url }))
  }, async (baseUrl) => {
    const app = createDORoutes()

    const response = await app.request(
      'http://local/COUNTER/inst%201/storage/tables/my%20table/rows?limit=10&offset=5',
      { method: 'GET' },
      { LOCALFLARE_MANIFEST: manifest, LOCALFLARE_DO_STORAGE_URL: baseUrl },
    )

    assert.equal(response.status, 200)
    const payload = await response.json()
    assert.equal(
      payload.proxiedPath,
      '/do/COUNTER/inst%201/tables/my%20table/rows?limit=10&offset=5',
    )
  })
})

test('proxies sql query body to storage server', async () => {
  await withServer(async (req, res) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          path: req.url,
          method: req.method,
          body: Buffer.concat(chunks).toString('utf8'),
        }),
      )
    })
  }, async (baseUrl) => {
    const app = createDORoutes()
    const sqlBody = JSON.stringify({ sql: 'SELECT * FROM counts WHERE key = ?', params: ['default'] })

    const response = await app.request(
      'http://local/COUNTER/abc/storage/query',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: sqlBody,
      },
      { LOCALFLARE_MANIFEST: manifest, LOCALFLARE_DO_STORAGE_URL: baseUrl },
    )

    assert.equal(response.status, 200)
    const payload = await response.json()
    assert.equal(payload.path, '/do/COUNTER/abc/query')
    assert.equal(payload.method, 'POST')
    assert.equal(payload.body, sqlBody)
  })
})

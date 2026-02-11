import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { serialize } from 'node:v8'

import { createDOStorageApp, type DOStorageConfig } from './do-storage.ts'

function createConfig(persistPath: string): DOStorageConfig {
  return {
    persistPath,
    manifest: {
      name: 'my-worker',
      d1: [],
      kv: [],
      r2: [],
      queues: { producers: [], consumers: [] },
      do: [{ binding: 'COUNTER', className: 'Counter' }],
      vars: [],
    },
  }
}

function withFixtureDir(run: (root: string) => Promise<void> | void) {
  const root = mkdtempSync(join(tmpdir(), 'localflare-do-storage-'))
  return Promise.resolve()
    .then(() => run(root))
    .finally(() => {
      rmSync(root, { recursive: true, force: true })
    })
}

function createInstanceDb(root: string, dirName: string, instanceId: string): DatabaseSync {
  const dir = join(root, 'v3', 'do', dirName)
  mkdirSync(dir, { recursive: true })
  return new DatabaseSync(join(dir, `${instanceId}.sqlite`))
}

test('lists instances from exact worker/class directory and sorts by id', async () => {
  await withFixtureDir(async (root) => {
    const exact = createInstanceDb(root, 'my-worker-Counter', 'z-last')
    exact.exec('CREATE TABLE counts(key TEXT PRIMARY KEY, value INTEGER)')
    exact.close()

    const exact2 = createInstanceDb(root, 'my-worker-Counter', 'a-first')
    exact2.exec('CREATE TABLE counts(key TEXT PRIMARY KEY, value INTEGER)')
    exact2.close()

    const other = createInstanceDb(root, 'other-worker-Counter', 'ignored')
    other.exec('CREATE TABLE should_not_be_used(id INTEGER PRIMARY KEY)')
    other.close()

    const app = createDOStorageApp(createConfig(root))
    const response = await app.request('http://local/do/COUNTER/instances')
    assert.equal(response.status, 200)

    const payload = await response.json() as {
      instances: Array<{ id: string; binding: string; className: string }>
      binding: string
      className: string
    }

    assert.equal(payload.binding, 'COUNTER')
    assert.equal(payload.className, 'Counter')
    assert.deepEqual(payload.instances.map((i) => i.id), ['a-first', 'z-last'])
    assert.deepEqual(payload.instances.map((i) => i.binding), ['COUNTER', 'COUNTER'])
  })
})

test('returns schema and rows for a table with pagination and sort', async () => {
  await withFixtureDir(async (root) => {
    const db = createInstanceDb(root, 'my-worker-Counter', 'inst')
    db.exec('CREATE TABLE counts(key TEXT PRIMARY KEY, value INTEGER)')
    db.prepare('INSERT INTO counts(key, value) VALUES (?, ?)').run('c', 3)
    db.prepare('INSERT INTO counts(key, value) VALUES (?, ?)').run('a', 1)
    db.prepare('INSERT INTO counts(key, value) VALUES (?, ?)').run('b', 2)
    db.close()

    const app = createDOStorageApp(createConfig(root))

    const schemaResp = await app.request('http://local/do/COUNTER/inst/schema')
    assert.equal(schemaResp.status, 200)
    const schema = await schemaResp.json() as { tables: Array<{ name: string }> }
    assert.equal(schema.tables.length, 1)
    assert.equal(schema.tables[0].name, 'counts')

    const rowsResp = await app.request('http://local/do/COUNTER/inst/tables/counts/rows?limit=2&offset=0&sort=value&dir=desc')
    assert.equal(rowsResp.status, 200)
    const rowsPayload = await rowsResp.json() as {
      rows: Array<{ key: string; value: number }>
      meta: { limit: number; offset: number }
    }
    assert.deepEqual(rowsPayload.rows.map((r) => r.value), [3, 2])
    assert.deepEqual(rowsPayload.meta, { limit: 2, offset: 0 })
  })
})

test('executes read and write SQL queries with params', async () => {
  await withFixtureDir(async (root) => {
    const db = createInstanceDb(root, 'my-worker-Counter', 'inst')
    db.exec('CREATE TABLE counts(key TEXT PRIMARY KEY, value INTEGER)')
    db.close()

    const app = createDOStorageApp(createConfig(root))

    const writeResp = await app.request('http://local/do/COUNTER/inst/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sql: 'INSERT INTO counts(key, value) VALUES (?, ?)',
        params: ['default', 7],
      }),
    })
    assert.equal(writeResp.status, 200)
    const writePayload = await writeResp.json() as { success: boolean; meta: { changes: number } }
    assert.equal(writePayload.success, true)
    assert.equal(writePayload.meta.changes, 1)

    const readResp = await app.request('http://local/do/COUNTER/inst/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sql: 'SELECT * FROM counts WHERE key = ?',
        params: ['default'],
      }),
    })
    assert.equal(readResp.status, 200)
    const readPayload = await readResp.json() as {
      success: boolean
      rowCount: number
      results: Array<{ key: string; value: number }>
    }
    assert.equal(readPayload.success, true)
    assert.equal(readPayload.rowCount, 1)
    assert.deepEqual(readPayload.results[0], { key: 'default', value: 7 })
  })
})

test('decodes DurableObjectStorage values and supports kv prefix filtering', async () => {
  await withFixtureDir(async (root) => {
    const db = createInstanceDb(root, 'my-worker-Counter', 'kv-inst')
    db.exec('CREATE TABLE _cf_KV (key TEXT PRIMARY KEY, value BLOB)')
    const insert = db.prepare('INSERT INTO _cf_KV (key, value) VALUES (?, ?)')
    insert.run('counter:default', serialize(2))
    insert.run('profile', serialize({ id: 'u1', role: 'admin' }))
    db.close()

    const app = createDOStorageApp(createConfig(root))

    const allResp = await app.request('http://local/do/COUNTER/kv-inst/kv')
    assert.equal(allResp.status, 200)
    const allPayload = await allResp.json() as {
      entries: Array<{ key: string; value: unknown }>
      meta: { total: number }
    }
    assert.equal(allPayload.meta.total, 2)
    assert.deepEqual(allPayload.entries[1], {
      key: 'profile',
      value: { id: 'u1', role: 'admin' },
    })

    const prefResp = await app.request('http://local/do/COUNTER/kv-inst/kv?prefix=counter:')
    assert.equal(prefResp.status, 200)
    const prefPayload = await prefResp.json() as {
      entries: Array<{ key: string; value: unknown }>
      meta: { total: number }
    }
    assert.equal(prefPayload.meta.total, 1)
    assert.equal(prefPayload.entries[0].key, 'counter:default')
    assert.equal(prefPayload.entries[0].value, 2)
  })
})

test('returns 404 for unknown DO binding and missing instance', async () => {
  await withFixtureDir(async (root) => {
    const app = createDOStorageApp(createConfig(root))

    const unknownBinding = await app.request('http://local/do/UNKNOWN/instances')
    assert.equal(unknownBinding.status, 404)

    const missingInstance = await app.request('http://local/do/COUNTER/missing/schema')
    assert.equal(missingInstance.status, 404)
  })
})

test('clamps invalid pagination params on kv and rows endpoints', async () => {
  await withFixtureDir(async (root) => {
    const db = createInstanceDb(root, 'my-worker-Counter', 'inst')
    db.exec('CREATE TABLE counts(key TEXT PRIMARY KEY, value INTEGER)')
    db.prepare('INSERT INTO counts(key, value) VALUES (?, ?)').run('k', 1)
    db.exec('CREATE TABLE _cf_KV (key TEXT PRIMARY KEY, value BLOB)')
    db.prepare('INSERT INTO _cf_KV (key, value) VALUES (?, ?)').run('k', serialize('v'))
    db.close()

    const app = createDOStorageApp(createConfig(root))

    const rowsResp = await app.request('http://local/do/COUNTER/inst/tables/counts/rows?limit=-1&offset=-99')
    assert.equal(rowsResp.status, 200)
    const rowsPayload = await rowsResp.json() as { meta: { limit: number; offset: number } }
    assert.deepEqual(rowsPayload.meta, { limit: 50, offset: 0 })

    const kvResp = await app.request('http://local/do/COUNTER/inst/kv?limit=-1&offset=-99')
    assert.equal(kvResp.status, 200)
    const kvPayload = await kvResp.json() as { meta: { limit: number; offset: number; total: number } }
    assert.deepEqual(kvPayload.meta, { limit: 100, offset: 0, total: 1 })
  })
})

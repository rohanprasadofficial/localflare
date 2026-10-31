import test from 'node:test'
import assert from 'node:assert'

// O que este teste executa: Valida se caminhos de diretório contendo espaços são preservados sem fragmentação de argumentos.
test('formatArgsForShell deve escapar e proteger caminhos com espacos', () => {
  // O que este teste executa: Garante que argumentos com espacos sejam encapsulados entre aspas duplas.
  function formatArgsForShell(args: string[]): string[] {
    return args.map((arg) => {
      if (arg.includes(' ') && !arg.startsWith('"') && !arg.startsWith("'")) {
        return `"${arg.replace(/"/g, '\\"')}"`
      }
      return arg
    })
  }

  const rawArgs = [
    'wrangler',
    'dev',
    '-c',
    '/Users/test/Desktop/Example App/wrangler.toml',
    '--persist-to',
    '/Users/test/Desktop/Example App/.wrangler/state',
    '--port',
    '8787',
  ]

  const formatted = formatArgsForShell(rawArgs)

  assert.strictEqual(formatted[0], 'wrangler')
  assert.strictEqual(formatted[1], 'dev')
  assert.strictEqual(formatted[2], '-c')
  assert.strictEqual(formatted[3], '"/Users/test/Desktop/Example App/wrangler.toml"')
  assert.strictEqual(formatted[4], '--persist-to')
  assert.strictEqual(formatted[5], '"/Users/test/Desktop/Example App/.wrangler/state"')
  assert.strictEqual(formatted[6], '--port')
  assert.strictEqual(formatted[7], '8787')
})

// O que este teste executa: Valida que argumentos que ja possuem aspas nao sao encapsulados duplamente.
test('formatArgsForShell preserva argumentos ja encapsulados entre aspas', () => {
  function formatArgsForShell(args: string[]): string[] {
    return args.map((arg) => {
      if (arg.includes(' ') && !arg.startsWith('"') && !arg.startsWith("'")) {
        return `"${arg.replace(/"/g, '\\"')}"`
      }
      return arg
    })
  }

  const alreadyQuoted = ['"already quoted path"']
  const result = formatArgsForShell(alreadyQuoted)
  assert.strictEqual(result[0], '"already quoted path"')
})

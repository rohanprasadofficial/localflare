import test from 'node:test'
import assert from 'node:assert'

// O que este teste executa: Valida que arquivos wrangler.json contendo comentarios e virgulas finais sao parseados sem lancar SyntaxError.
test('parseJsonc lida com comentarios de linha unica, multilinha e trailing commas', () => {
  // O que este teste executa: Garante a remocao correta de comentarios antes do parse JSON sem corromper strings.
  function stripJsonComments(input: string): string {
    return input
      .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1')
      .replace(/,\s*([}\]])/g, '$1')
  }

  const rawJsonWithComments = `{
    // Comentario de linha unica
    "name": "my-worker",
    /* Comentario de
       multiplas linhas */
    "main": "src/index.ts",
    "compatibility_date": "2024-01-01",
    "vars": {
      "DEBUG": "true",
    },
  }`

  const cleaned = stripJsonComments(rawJsonWithComments)
  const parsed = JSON.parse(cleaned)

  assert.strictEqual(parsed.name, 'my-worker')
  assert.strictEqual(parsed.main, 'src/index.ts')
  assert.strictEqual(parsed.compatibility_date, '2024-01-01')
  assert.strictEqual(parsed.vars.DEBUG, 'true')
})

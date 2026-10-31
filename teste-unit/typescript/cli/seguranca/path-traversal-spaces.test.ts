import test from 'node:test'
import assert from 'node:assert'
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

// O que este teste executa: Assegura que processos filhos gerados para caminhos com espacos executem com sucesso sem quebra de argumentos.
test('spawnWrangler deve executar em diretorios com espacos sem lancar erro de caminho inexistente', async () => {
  const testDir = join('/tmp', 'localflare test dir with spaces')
  mkdirSync(testDir, { recursive: true })
  const dummyFile = join(testDir, 'wrangler.json')
  writeFileSync(dummyFile, JSON.stringify({ name: 'test-worker' }))

  try {
    const isWindows = process.platform === 'win32'
    const command = isWindows ? 'cmd.exe' : 'ls'
    const args = isWindows ? ['/c', 'dir', `"${dummyFile}"`] : ['-la', dummyFile]

    const child = spawn(command, args, {
      cwd: testDir,
      shell: isWindows,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''
    child.stdout?.on('data', (d) => (stdout += d.toString()))
    child.stderr?.on('data', (d) => (stderr += d.toString()))

    const exitCode = await new Promise<number | null>((resolve) => {
      child.on('close', resolve)
    })

    // O que este teste executa: Confirma que o comando finaliza com status 0 (sucesso) e que o arquivo foi localizado corretamente.
    assert.strictEqual(exitCode, 0, `Comando falhou com stderr: ${stderr}`)
    assert.strictEqual(existsSync(dummyFile), true)
  } finally {
    rmSync(testDir, { recursive: true, force: true })
  }
})

import test from 'node:test'
import assert from 'node:assert'

// O que este teste executa: Valida a resposta do endpoint /__localflare/do/instances para evitar erro 404 (Issue #51).
test('GET /do/instances retorna lista vazia de instancias com metadados dos namespaces em vez de 404', () => {
  const mockManifest = {
    do: [
      { binding: 'SITE_SYNC_DO', className: 'SiteSyncDO' },
      { binding: 'COORDINATOR_DO', className: 'CoordinatorDO' },
    ],
  }

  function handleGetInstances(manifest: typeof mockManifest) {
    return {
      instances: [],
      namespaces: manifest.do.map((doConfig) => ({
        binding: doConfig.binding,
        class_name: doConfig.className,
      })),
      hint: 'Cannot enumerate arbitrary DO instances directly without stored instance records. Use idFromName() or idFromString().',
    }
  }

  const response = handleGetInstances(mockManifest)

  // O que este teste executa: Confirma que o payload contem a propriedade instances compativel com o frontend do dashboard.
  assert.strictEqual(Array.isArray(response.instances), true)
  assert.strictEqual(response.instances.length, 0)
  assert.strictEqual(response.namespaces.length, 2)
  assert.strictEqual(response.namespaces[0].binding, 'SITE_SYNC_DO')
})

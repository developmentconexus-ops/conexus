import assert from 'node:assert/strict'
import { join } from 'node:path'
import { test } from 'node:test'
import { unstable_dev } from 'wrangler'
import { SESSION } from './test-edge.ts'

const CLONE = join(import.meta.dirname, '..', 'clone')

// The node doubles of the other tests never clone `props`; workerd does, and refuses a plain object
// of functions (decision 0047, result 4), so this one runs the dispatch path in workerd.
test('versão no ar: o connectors de props atravessa a clonagem do workerd e responde', async () => {
  const worker = await unstable_dev(join(CLONE, 'worker.ts'), {
    config: join(CLONE, 'wrangler.jsonc'),
    local: true,
    logLevel: 'none',
    experimental: { disableExperimentalWarning: true },
  })
  try {
    const response = await worker.fetch('/', {
      headers: { Cookie: `__Host-conexus-app=${SESSION}` },
    })
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { answer: { kind: 'NOT_GRANTED' }, connections: [] })
  } finally {
    await worker.stop()
  }
})

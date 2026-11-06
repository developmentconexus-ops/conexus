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
    assert.deepEqual(await response.json(), {
      answer: { kind: 'OK', value: { rows: [] } },
      connections: { kind: 'OK', names: ['matriz'] },
    })
  } finally {
    await worker.stop()
  }
})

// The tool's `data` is a `ToolData` entrypoint: it crosses the clone into the tool, and a read the
// version did not declare rejects across workerd's RPC with its code, which the host answers.
test('ferramenta salva: o data de props atravessa a clonagem, lê, e a recusa volta com o código', async () => {
  const worker = await unstable_dev(join(CLONE, 'worker.ts'), {
    config: join(CLONE, 'wrangler.jsonc'),
    local: true,
    logLevel: 'none',
    experimental: { disableExperimentalWarning: true },
  })
  try {
    const call = { call: crypto.randomUUID() }
    const path = `/tool/${crypto.randomUUID()}`
    const read = await worker.fetch(path, {
      method: 'POST',
      body: JSON.stringify({ ...call, input: { operation: 'pedidos' } }),
    })
    assert.deepEqual(await read.json(), { kind: 'OK', value: { total: 3 } })
    const refused = await worker.fetch(path, {
      method: 'POST',
      body: JSON.stringify({ ...call, input: { operation: 'clientes' } }),
    })
    assert.deepEqual(await refused.json(), { kind: 'FAILED', reason: 'NOT_DECLARED' })
  } finally {
    await worker.stop()
  }
})

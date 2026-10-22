import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { AppProps, Db } from './index.ts'
import { serveApp } from './index.ts'

const MANIFEST = {
  contract: 1,
  entry: 'worker.js',
  operations: {
    escrever: {
      input: {
        type: 'object',
        properties: { texto: { type: 'string', minLength: 1 } },
        required: ['texto'],
      },
      output: { type: 'object', properties: { id: { type: 'integer' } }, required: ['id'] },
    },
  },
  migrations: [],
  assets: [],
}

const DB: Db = {
  query: async () => ({ rows: [{ id: 7 }] }),
  batch: async () => ({ results: [] }),
}
const CALLER = { personId: 'p', personName: 'Ana', projectId: 'j', projectName: 'Pedidos' }
const PROPS: AppProps = { caller: CALLER, db: DB }

function call(app: ReturnType<typeof serveApp>, path: string, body: unknown, method = 'POST') {
  const init: RequestInit = { method }
  if (method === 'POST') init.body = typeof body === 'string' ? body : JSON.stringify(body)
  return app.fetch(new Request(`https://app.example/${path}`, init), {}, { props: PROPS })
}

const app = serveApp({
  manifest: MANIFEST,
  handlers: {
    escrever: async (input, { db, caller }) => {
      const result = await db.query('SELECT 7 AS id', [input])
      assert.equal(caller.personName, 'Ana')
      return 'rows' in result ? result.rows[0] : result
    },
  },
})

test('uma operação declarada roda o handler com db e caller', async () => {
  const response = await call(app, 'api/escrever', { texto: 'oi' })
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { id: 7 })
})

test('entrada fora da forma: 400, sem repetir o valor', async () => {
  for (const body of [{ texto: '' }, { texto: 'oi', extra: 1 }, {}, 'não é json']) {
    const response = await call(app, 'api/escrever', body)
    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { code: 'INPUT_INVALID' })
  }
})

test('saída fora da forma: 500 sem o valor', async () => {
  const leaky = serveApp({
    manifest: MANIFEST,
    handlers: { escrever: () => ({ id: 'segredo-123' }) },
  })
  const response = await call(leaky, 'api/escrever', { texto: 'oi' })
  assert.equal(response.status, 500)
  const text = await response.text()
  assert.deepEqual(JSON.parse(text), { code: 'OUTPUT_INVALID' })
  assert.ok(!text.includes('segredo-123'))
})

test('handler que lança: 500 sem a mensagem, e o registro diz só a operação', async (t) => {
  const logged = t.mock.method(console, 'error', () => undefined)
  const failing = serveApp({
    manifest: MANIFEST,
    handlers: {
      escrever: () => {
        throw new Error('segredo-456')
      },
    },
  })
  const response = await call(failing, 'api/escrever', { texto: 'oi' })
  assert.equal(response.status, 500)
  assert.ok(!(await response.text()).includes('segredo-456'))
  assert.deepEqual(logged.mock.calls[0]?.arguments, [
    JSON.stringify({ level: 50, msg: 'HANDLER_FAILED', operation: 'escrever', kind: 'Error' }),
  ])
})

test('operação desconhecida, outro método ou caminho: 404', async () => {
  for (const [path, method] of [
    ['api/apagar', 'POST'],
    ['api/escrever', 'GET'],
    ['api/__proto__', 'POST'],
    ['index.html', 'GET'],
  ] as const) {
    const response = await call(app, path, {}, method)
    assert.equal(response.status, 404)
    assert.deepEqual(await response.json(), { code: 'OPERATION_NOT_FOUND' })
  }
})

test('o Worker não sobe com manifesto inválido ou handler a menos ou a mais', () => {
  assert.throws(() => serveApp({ manifest: { ...MANIFEST, contract: 2 }, handlers: {} }))
  assert.throws(() => serveApp({ manifest: MANIFEST, handlers: {} }))
  assert.throws(() =>
    serveApp({ manifest: MANIFEST, handlers: { escrever: () => ({ id: 1 }), outro: () => 1 } }),
  )
})

test('sem operações todo /api responde 404', async () => {
  const empty = serveApp({ manifest: { ...MANIFEST, operations: {} }, handlers: {} })
  const response = await call(empty, 'api/escrever', { texto: 'oi' })
  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), { code: 'OPERATION_NOT_FOUND' })
})

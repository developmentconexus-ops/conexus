import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import type { AppProps, CallerAccess, Connectors, Db, Operations, Roles } from './index.ts'
import { serveApp } from './index.ts'

const OPERATIONS = {
  escrever: {
    input: z.strictObject({ texto: z.string().min(1) }),
    output: z.strictObject({ id: z.int() }),
  },
}

const DB: Db = {
  query: async () => ({ rows: [{ id: 7 }] }),
  batch: async () => ({ results: [] }),
}
const CONNECTORS: Connectors = {
  call: async () => ({ kind: 'NOT_GRANTED' }),
  connections: async () => [],
}
const BUILDER: CallerAccess = { kind: 'BUILDER' }
const CALLER = {
  personId: 'p',
  personName: 'Ana',
  projectId: 'j',
  projectName: 'Pedidos',
  access: BUILDER,
}

function call(
  app: ReturnType<typeof serveApp>,
  path: string,
  body: unknown,
  method = 'POST',
  access: CallerAccess = BUILDER,
) {
  const init: RequestInit = { method }
  if (method === 'POST') init.body = typeof body === 'string' ? body : JSON.stringify(body)
  const props: AppProps = { caller: { ...CALLER, access }, db: DB, connectors: CONNECTORS }
  return app.fetch(new Request(`https://app.example/${path}`, init), {}, { props })
}

const app = serveApp({
  operations: OPERATIONS,
  handlers: {
    escrever: async (input, { db, caller, connectors }) => {
      const result = await db.query('SELECT 7 AS id', [input])
      assert.equal(caller.personName, 'Ana')
      assert.equal(connectors, CONNECTORS, 'the props connectors reach the handler as given')
      return 'rows' in result ? result.rows[0] : result
    },
  },
})

test('uma operação declarada roda o handler com db, caller e connectors', async () => {
  const response = await call(app, 'api/escrever', { texto: 'oi' })
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { id: 7 })
})

test('entrada fora do Zod da operação: 400, sem repetir o valor', async () => {
  for (const body of [{ texto: '' }, { texto: 'oi', extra: 1 }, {}, 'não é json']) {
    const response = await call(app, 'api/escrever', body)
    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { code: 'INPUT_INVALID' })
  }
})

test('saída fora do Zod da operação: 500 sem o valor', async () => {
  const leaky = serveApp({
    operations: OPERATIONS,
    handlers: { escrever: () => ({ id: 'segredo-123' }) },
  })
  const response = await call(leaky, 'api/escrever', { texto: 'oi' })
  assert.equal(response.status, 500)
  const text = await response.text()
  assert.deepEqual(JSON.parse(text), { code: 'OUTPUT_INVALID' })
  assert.ok(!text.includes('segredo-123'))
})

test('saída com transform de mão única: 500 OUTPUT_INVALID, nunca exceção', async (t) => {
  const logged = t.mock.method(console, 'error', () => undefined)
  const oneWay = serveApp({
    operations: {
      contar: {
        input: z.object({}),
        output: z.object({ total: z.string().transform((text) => text.length) }),
      },
    },
    handlers: { contar: () => ({ total: 3 }) },
  })
  const response = await call(oneWay, 'api/contar', {})
  assert.equal(response.status, 500)
  assert.deepEqual(await response.json(), { code: 'OUTPUT_INVALID' })
  assert.deepEqual(logged.mock.calls[0]?.arguments, [
    JSON.stringify({
      level: 50,
      msg: 'OUTPUT_INVALID',
      operation: 'contar',
      kind: 'ZodEncodeError',
    }),
  ])
})

test('handler que lança: 500 sem a mensagem, e o registro diz só a operação', async (t) => {
  const logged = t.mock.method(console, 'error', () => undefined)
  const failing = serveApp({
    operations: OPERATIONS,
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
    ['api/constructor', 'POST'],
    ['escrever', 'POST'],
    ['index.html', 'GET'],
  ] as const) {
    const response = await call(app, path, {}, method)
    assert.equal(response.status, 404)
    assert.deepEqual(await response.json(), { code: 'OPERATION_NOT_FOUND' })
  }
})

test('o Worker não sobe com handler a menos ou a mais, ou nome que /api não diz', () => {
  assert.throws(() => serveApp({ operations: OPERATIONS, handlers: {} }))
  assert.throws(() =>
    serveApp({
      operations: OPERATIONS,
      handlers: { escrever: () => ({ id: 1 }), outro: () => 1 },
    }),
  )
  const spec = OPERATIONS.escrever
  assert.throws(() => serveApp({ operations: { 'a/b': spec }, handlers: { 'a/b': () => 1 } }))
})

test('zero operações: todo /api responde 404; e sem teto de operações', async () => {
  const empty = serveApp({ operations: {}, handlers: {} })
  const response = await call(empty, 'api/escrever', { texto: 'oi' })
  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), { code: 'OPERATION_NOT_FOUND' })
  const names = Array.from({ length: 200 }, (_, at) => `op${at}`)
  const many = serveApp({
    operations: Object.fromEntries(names.map((name) => [name, OPERATIONS.escrever])),
    handlers: Object.fromEntries(names.map((name) => [name, () => ({ id: 1 })])),
  })
  assert.equal((await call(many, 'api/op199', { texto: 'oi' })).status, 200)
})

const ROLES = { vendedor: 'Vendedor', gerente: 'Gerente' }
const aprovar = { input: z.strictObject({ id: z.int() }), output: z.strictObject({ id: z.int() }) }
const ROLED = {
  listar: { ...OPERATIONS.escrever, roles: ['vendedor', 'gerente'] },
  aprovar: { ...aprovar, roles: ['gerente'] },
  ola: { ...aprovar, roles: 'everyone' as const },
}
const HANDLERS = { listar: () => ({ id: 1 }), aprovar: () => ({ id: 2 }), ola: () => ({ id: 3 }) }
function user(role: string | null): CallerAccess {
  return { kind: 'USER', role }
}

test('papéis: a operação recusa o papel que não lista, antes do handler', async (t) => {
  const handler = t.mock.fn(() => ({ id: 2 }))
  const roled = serveApp({
    operations: ROLED,
    handlers: { ...HANDLERS, aprovar: handler },
    roles: ROLES,
  })
  const body = { id: 1 }
  const sells = await call(roled, 'api/aprovar', body, 'POST', user('vendedor'))
  assert.equal(sells.status, 403)
  assert.deepEqual(await sells.json(), { code: 'ROLE_FORBIDDEN' })
  const unreadable = await call(roled, 'api/aprovar', 'não é json', 'POST', user('vendedor'))
  assert.equal(unreadable.status, 403)
  assert.equal(handler.mock.callCount(), 0)
  assert.equal((await call(roled, 'api/aprovar', body, 'POST', user('gerente'))).status, 200)
  assert.equal(handler.mock.callCount(), 1)
  assert.equal((await call(roled, 'api/aprovar', body, 'POST', BUILDER)).status, 200)
  const listed = await call(roled, 'api/listar', { texto: 'oi' }, 'POST', user('vendedor'))
  assert.equal(listed.status, 200)
  for (const access of [user('extinto'), user(null)]) {
    assert.equal((await call(roled, 'api/listar', { texto: 'oi' }, 'POST', access)).status, 403)
    assert.equal((await call(roled, 'api/ola', body, 'POST', access)).status, 200)
  }
})

test('papéis: operação sem tranca ou com papel desconhecido não sobe', () => {
  function start(operations: Operations, roles?: Roles) {
    return serveApp({ operations, handlers: HANDLERS, roles })
  }
  assert.throws(
    () => start({ listar: ROLED.listar, aprovar: aprovar, ola: ROLED.ola }, ROLES),
    /aprovar/,
  )
  assert.throws(
    () => start({ ...ROLED, aprovar: { ...aprovar, roles: ['chefe'] } }, ROLES),
    /aprovar.*chefe/,
  )
  assert.throws(() => start(ROLED), /vendedor|gerente/)
  const open = { listar: OPERATIONS.escrever, aprovar, ola: aprovar }
  assert.doesNotThrow(() => start(open))
})

test('GET /api/caller: quem chama e como detém o app', async () => {
  const roled = serveApp({ operations: ROLED, handlers: HANDLERS, roles: ROLES })
  for (const access of [BUILDER, user('gerente'), user(null)]) {
    const response = await call(roled, 'api/caller', undefined, 'GET', access)
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { personName: 'Ana', access })
  }
  assert.equal((await call(roled, 'api/caller', {}, 'POST')).status, 404)
})

test('papéis: o papel que a versão não declara chega ao app como nenhum', async () => {
  const seen: CallerAccess[] = []
  const roled = serveApp({
    operations: ROLED,
    handlers: {
      ...HANDLERS,
      ola: (_input, { caller }) => {
        seen.push(caller.access)
        return { id: 3 }
      },
    },
    roles: ROLES,
  })
  const response = await call(roled, 'api/caller', undefined, 'GET', user('extinto'))
  assert.deepEqual(await response.json(), { personName: 'Ana', access: user(null) })
  await call(roled, 'api/ola', { id: 1 }, 'POST', user('extinto'))
  assert.deepEqual(seen, [user(null)])
})

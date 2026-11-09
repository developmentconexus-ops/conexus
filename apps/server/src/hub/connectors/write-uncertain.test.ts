import assert from 'node:assert/strict'
import { test } from 'node:test'
import { markOf } from './public.ts'
import { writing } from './test-write.ts'

test('o pedido sem leitura (a): um 2xx que o kit não lê termina incerto, com o status e o formato (sem valores) no log e na linha, sem chegar ao modelo, ao cartão nem à rota', async (t) => {
  const body = { mensagem: 'Pedido incluído', retorno: { codigoPedido: '911374' } }
  const on = await writing(t, {
    order: async () => Response.json(body, { status: 201 }),
  })
  const asked = on.byAna()
  const mark = markOf(asked.threadId, asked.toolCallId)
  assert.deepEqual(await on.ask(asked), { kind: 'WRITE_UNCERTAIN', mark })
  const [row] = await on.ledger()
  assert.equal(row?.state, 'UNCERTAIN')
  assert.deepEqual(row?.answer, {
    native: {
      status: 201,
      code: null,
      message: null,
      body: null,
      reason: {
        kind: 'SHAPE',
        issues: [{ path: 'retorno.codigoPedido', expected: 'number', received: 'string' }],
      },
    },
  })
  const [line] = on.lines('CONNECTOR_WRITE_UNCERTAIN')
  assert.equal(line?.fields.status, 201)
  assert.equal(line?.fields.reason, 'SHAPE')
  assert.equal(line?.fields.shape, 'retorno.codigoPedido: number, got string')
  assert.ok(!JSON.stringify(line).includes('911374'))
  assert.deepEqual(await on.ask(asked), { kind: 'WRITE_UNCERTAIN', mark })
  assert.equal(on.mode.posts, 1)
  const [written] = await on.hub.connectors.assistant.writes({
    scope: asked.scope,
    threadId: asked.threadId,
  })
  assert.deepEqual(Object.keys(written ?? {}).sort(), [
    'approved',
    'connectionId',
    'mark',
    'message',
    'operation',
    'since',
    'state',
    'toolCallId',
  ])
  assert.equal(written?.state, 'UNCERTAIN')
  assert.equal(written?.message, null)
})

test('o pedido sem leitura (b): um 5xx termina incerto, com o status no log e na linha', async (t) => {
  const on = await writing(t, {
    order: async () =>
      Response.json({ code: 'GTW3503', message: 'Gateway Timeout' }, { status: 504 }),
  })
  const asked = on.byAna()
  assert.deepEqual(await on.ask(asked), {
    kind: 'WRITE_UNCERTAIN',
    mark: markOf(asked.threadId, asked.toolCallId),
  })
  const [row] = await on.ledger()
  assert.equal(row?.state, 'UNCERTAIN')
  assert.deepEqual(row?.answer, {
    native: {
      status: 504,
      code: 'GTW3503',
      message: 'Gateway Timeout',
      body: { code: 'GTW3503', message: 'Gateway Timeout' },
    },
  })
  const [line] = on.lines('CONNECTOR_WRITE_UNCERTAIN')
  assert.equal(line?.fields.status, 504)
  assert.equal(line?.fields.reason, undefined)
})

test('o pedido sem leitura (c): um corte guarda nulo, e o log não traz status', async (t) => {
  const on = await writing(t)
  on.mode.cut = true
  assert.equal((await on.ask(on.byAna())).kind, 'WRITE_UNCERTAIN')
  const [row] = await on.ledger()
  assert.deepEqual(row?.answer, { native: null })
  assert.equal(on.lines('CONNECTOR_WRITE_UNCERTAIN')[0]?.fields.status, undefined)
})

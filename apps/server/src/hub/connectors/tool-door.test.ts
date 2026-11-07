import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { CompanyId, ConnectionId, PersonId, ToolDataAnswer, ToolVersionId } from '@conexus/hub-api'
import type { LiveToolCall, SessionScope } from './public.ts'
import { TurnKey } from './public.ts'
import { appCalls, CONNECTOR_CALLS_PER_TURN } from './test-app-calls.ts'

const VERSION = ToolVersionId.parse(randomUUID())

async function doorOn(t: Parameters<typeof appCalls>[0]) {
  const on = await appCalls(t)
  const matriz = ConnectionId.parse(await on.connect('Matriz', false))
  const scope: SessionScope = {
    companyId: CompanyId.parse(on.companyId),
    personId: PersonId.parse(on.ana.id),
    place: { kind: 'COMPANY' },
    chosen: [matriz],
  }
  const turn = TurnKey.parse(randomUUID())
  const live: LiveToolCall = {
    scope,
    toolVersionId: VERSION,
    connectionId: matriz,
    reads: ['empresas'],
    turn,
  }
  /** The edge's read for a tool, as `toolDataOf` sends it. */
  async function read(body: { call: string; toolVersionId?: string; operation?: string }) {
    const response = await on.hub.edge.inject({
      method: 'POST',
      url: '/api/tool-connector-calls',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({
        toolVersionId: VERSION,
        operation: 'empresas',
        input: { page: 0 },
        deadlineMs: 5000,
        ...body,
      }),
    })
    assert.equal(response.statusCode, 200, response.body)
    return ToolDataAnswer.parse(response.json()).kind
  }
  function called() {
    return on.hub.lines.filter((line) => line.message === 'CONNECTOR_CALLED').length
  }
  return { ...on, matriz, scope, turn, live, read, called }
}

test('50 por turno: as leituras do agente e as da ferramenta salva contam juntas, e a 51ª é CALLS_SPENT sem chegar ao fornecedor', async (t) => {
  const on = await doorOn(t)
  const own = CONNECTOR_CALLS_PER_TURN - 20
  for (let n = 0; n < own; n += 1) {
    const answered = await on.hub.connectors.assistant.read(on.scope, {
      connectionId: on.matriz,
      operation: 'empresas',
      input: { page: 0 },
      turn: on.turn,
    })
    assert.equal(answered.kind, 'OK')
  }
  const { key, close } = on.hub.connectors.tools.open(on.live)
  t.after(close)
  const kinds = []
  for (let n = 0; n < 21; n += 1) kinds.push(await on.read({ call: key }))
  assert.deepEqual(kinds, [...Array(20).fill('OK'), 'CALLS_SPENT'])
  assert.equal(on.called(), CONNECTOR_CALLS_PER_TURN, 'the 51st never reached the provider')
})

test('a chave da chamada: sem chamada aberta, de outra versão, de uma leitura não declarada ou depois de fechada, NOT_DECLARED sem chegar ao fornecedor', async (t) => {
  const on = await doorOn(t)
  const { key, close } = on.hub.connectors.tools.open(on.live)
  const refused = [
    await on.read({ call: randomUUID() }),
    await on.read({ call: key, toolVersionId: randomUUID() }),
    await on.read({ call: key, operation: 'consultar' }),
  ]
  assert.equal(await on.read({ call: key }), 'OK')
  close()
  refused.push(await on.read({ call: key }))
  assert.deepEqual(refused, Array(4).fill('NOT_DECLARED'))
  assert.equal(on.called(), 1, 'only the open call read')
  const reasons = on.hub.lines
    .filter((line) => line.message === 'TOOL_READ_REFUSED')
    .map((line) => line.fields.reason)
  assert.deepEqual(reasons, ['NO_CALL', 'OTHER_VERSION', 'NOT_DECLARED', 'NO_CALL'])
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ActAnswer, Catalog } from '@conexus/hub-api'
import { LANCAR, ORDER, placedAnswer } from '../connectors/test-write.ts'
import { turnWorld } from './test-turn.ts'

test('agir pelo contrato passa pelo funil e não repete', async (t) => {
  const on = await turnWorld(t)
  const approvedBy = on.scope.personId
  const data = on.bound({ ...on.anaTurn, approvedBy })
  const call = on.callOf()
  const asked = { connection: on.matriz, operation: LANCAR, input: ORDER, call }
  const first = await data.act(asked)
  assert.deepEqual(first, {
    kind: 'OK',
    value: { codigoPedido: 98001 },
    returned: placedAnswer(98001),
  })
  const rows = await on.ledger()
  assert.deepEqual(
    rows.map(({ thread_id, tool_call_id, state, approved_by }) => ({
      ...{ thread_id, tool_call_id, state, approved_by },
    })),
    [{ thread_id: on.thread, tool_call_id: call.toolCall, state: 'DONE', approved_by: approvedBy }],
  )
  assert.deepEqual(await data.act(asked), first, 'the same call answers the same')
  assert.equal(on.fake.orders().length, 1, 'and is not sent again')
  const other = await data.act({ ...asked, input: { ...ORDER, codigoCliente: 2 } })
  assert.equal(other.kind, 'IDEMPOTENCY_CONFLICT', JSON.stringify(other))
  assert.equal(on.fake.orders().length, 1)
  assert.equal((await on.ledger()).length, 1)
})

test('agir fora do papel é recusado sem registro de escrita', async (t) => {
  const on = await turnWorld(t)
  const carla = on.scopeOf(on.carla.id)
  const described = Catalog.parse(await on.bound(undefined, carla).describe())
  const offered = described.systems.flatMap(({ actions }) => actions)
  assert.ok(
    offered.every(({ operation }) => operation !== LANCAR),
    'the act is not offered',
  )
  const turn = on.bindingOf(carla.personId, 'atendente')
  const asked = { connection: on.matriz, operation: LANCAR, input: ORDER, call: on.callOf() }
  assert.deepEqual(await on.bound(turn, carla).act(asked), { kind: 'NOT_IN_CATALOG' })
  assert.deepEqual(await on.ledger(), [])
  assert.equal(on.fake.orders().length, 0)
})

test('a resposta do funil passa no esquema do contrato', async (t) => {
  const on = await turnWorld(t)
  on.mode.cut = true
  const data = on.bound(on.anaTurn)
  const asked = { connection: on.matriz, operation: LANCAR, input: ORDER }
  const uncertain = ActAnswer.parse(await data.act({ ...asked, call: on.callOf() }))
  assert.equal(uncertain.kind, 'WRITE_UNCERTAIN', JSON.stringify(uncertain))
  on.mode.cut = false
  const open = ActAnswer.parse(await data.act({ ...asked, call: on.callOf() }))
  assert.equal(open.kind, 'WRITE_OPEN', JSON.stringify(open))
  assert.ok(open.kind === 'WRITE_OPEN')
  assert.equal(open.since, new Date(open.since).toISOString(), 'since in ISO')
  assert.equal(open.mark, uncertain.kind === 'WRITE_UNCERTAIN' ? uncertain.mark : null)
  assert.ok(!JSON.stringify(open).includes('"since":{'), 'no Date escapes the contract')
})

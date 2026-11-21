import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CONNECTOR_CALLS_PER_TURN } from '../connectors/public.ts'
import { EMPRESAS, turnWorld } from './test-turn.ts'

const READ = { input: { page: 0 } }

test('a leitura ao vivo pelo contrato chama o sistema com o turno', async (t) => {
  const on = await turnWorld(t)
  const asked = { kind: 'OPERATION', connection: on.matriz, operation: EMPRESAS, ...READ } as const
  const before = on.lines('CONNECTOR_CALLED').length
  const live = await on.bound(on.anaTurn).read(asked)
  assert.equal(live.kind, 'LIVE', JSON.stringify(live))
  assert.equal(on.lines('CONNECTOR_CALLED').length, before + 1, 'the system called once')
  const tool = await on.hub.connectors.assistant.read(on.scope, {
    ...{ connectionId: on.matriz, operation: EMPRESAS, ...READ, turn: on.anaTurn.turn },
  })
  assert.ok(live.kind === 'LIVE' && tool.kind === 'OK')
  assert.deepEqual(live.value, tool.whole, "the system's value, whole, as the tool gets it")
  const records = await on.hub.test.asOwner(
    "select verb, outcome, thread_id from data.data_read where operation = 'empresas' order by at",
  )
  assert.deepEqual(records, [
    { verb: 'LIVE', outcome: 'OK', thread_id: on.thread },
    { verb: 'LIVE', outcome: 'OK', thread_id: null },
  ])
  assert.deepEqual(await on.bound(undefined).read(asked), { kind: 'NOT_GRANTED' })
  assert.equal(
    on.lines('CONNECTOR_CALLED').length,
    before + 2,
    'without a turn the system is not called',
  )
})

test('o contrato gasta o limite do turno', async (t) => {
  const on = await turnWorld(t)
  const call = { connectionId: on.matriz, operation: EMPRESAS, ...READ, turn: on.anaTurn.turn }
  for (let made = 1; made < CONNECTOR_CALLS_PER_TURN; made++)
    assert.equal((await on.hub.connectors.assistant.read(on.scope, call)).kind, 'OK', `${made}`)
  const asked = { kind: 'OPERATION', connection: on.matriz, operation: EMPRESAS, ...READ } as const
  const data = on.bound(on.anaTurn)
  assert.equal((await data.read(asked)).kind, 'LIVE', 'the last call of the turn')
  assert.deepEqual(await data.read(asked), { kind: 'CALLS_SPENT' })
  assert.deepEqual(await on.hub.connectors.assistant.read(on.scope, call), { kind: 'CALLS_SPENT' })
  const spent = await on.hub.test.asOwner(
    "select verb, outcome, rows from data.data_read where outcome = 'CALLS_SPENT'",
  )
  assert.deepEqual(spent, [{ verb: 'LIVE', outcome: 'CALLS_SPENT', rows: null }])
})

import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { BalloonAddress, balloonCallKeyOf } from '@conexus/hub-api'
import { TurnKey } from './public.ts'
import { markFor, ORDER, writing } from './test-write.ts'

test('o workflow escreve: uma vez no livro da execução, com o terceiro autor, e a mesma chave de novo devolve o que o registro diz', async (t) => {
  const on = await writing(t)
  const first = on.byWorkflow({ callKey: balloonCallKeyOf(BalloonAddress.parse('b5'), 0) })
  const done = await on.ask(first)
  assert.equal(done.kind, 'OK')
  assert.deepEqual(await on.ask({ ...first, turn: TurnKey.parse(randomUUID()) }), done)
  assert.equal(on.mode.posts, 1)
  assert.equal(on.fake.orders()[0]?.observacao, markFor(first))
  const [row, ...rest] = await on.ledger()
  assert.equal(rest.length, 0)
  assert.equal(row?.thread_id, on.runId)
  assert.equal(row?.tool_call_id, 'b5#0')
  assert.equal(row?.workflow_id, on.workflowId)
  assert.equal(row?.workflow_version, 1)
  assert.equal(row?.agent_id, null)
  assert.equal(row?.version_number, null)
  assert.equal(row?.person_id, null)
  const sent = on.lines('CONNECTOR_WRITE_SENT')[0]
  assert.equal(sent?.fields.workflowId, on.workflowId)
})

test('o workflow escreve: uma operação que a versão não declara é NOT_IN_ROLE, e uma ligação não escolhida NOT_GRANTED, sem enviar', async (t) => {
  const on = await writing(t)
  const undeclared = on.byWorkflow({ declares: false })
  assert.deepEqual(await on.ask(undeclared), { kind: 'NOT_IN_ROLE' })
  const elsewhere = on.byWorkflow({ scope: on.scopeOf(on.ana.id, []) })
  assert.deepEqual(await on.ask(elsewhere), { kind: 'NOT_GRANTED' })
  assert.equal(on.mode.posts, 0)
})

test('a tentativa seguinte: depois de uma b5#0 feita, a mesma entrada devolve a resposta e outra entrada é conflito; incerta, WRITE_UNCERTAIN com a marca da b5#0; recusada, envia uma vez', async (t) => {
  const on = await writing(t)
  function attempt(n: number, input: unknown = ORDER) {
    return on.byWorkflow({ callKey: balloonCallKeyOf(BalloonAddress.parse('b5'), n), input })
  }
  const zero = attempt(0)
  const done = await on.ask(zero)
  assert.equal(done.kind, 'OK')
  assert.deepEqual(await on.ask(attempt(1)), done)
  assert.equal(on.mode.posts, 1)
  assert.deepEqual(await on.ask(attempt(1, { ...ORDER, codigoCliente: 2 })), {
    kind: 'IDEMPOTENCY_CONFLICT',
    mark: markFor(zero),
  })
  assert.equal(on.mode.posts, 1)
  await on.hub.test.asOwner(
    "update connectors.connector_write set state = 'UNCERTAIN', answer = null",
  )
  assert.deepEqual(await on.ask(attempt(2)), { kind: 'WRITE_UNCERTAIN', mark: markFor(zero) })
  assert.equal(on.mode.posts, 1)
  await on.hub.test.asOwner(
    'update connectors.connector_write set state = \'REFUSED\', answer = \'{"kind":"UNREACHABLE"}\'',
  )
  assert.equal((await on.ask(attempt(3))).kind, 'OK')
  assert.equal(on.mode.posts, 2)
})

test('o terceiro autor: um INSERT com dois autores é recusado pelo CHECK connector_write_speaker', async (t) => {
  const on = await writing(t)
  await assert.rejects(
    on.hub.test.asOwner(
      `insert into connectors.connector_write(company_id, thread_id, tool_call_id, connection_id,
         operation_id, input_hash, person_id, workflow_id, workflow_version, state, created_at)
       values ($1, 'r', 'b5#0', $2, 'lancarPedido', 'h', $3, $4, 1, 'SENDING', now())`,
      [on.companyId, on.matriz, on.ana.id, on.workflowId],
    ),
    { code: '23514', constraint: 'connector_write_speaker' },
  )
})

test('a tentativa seguinte: depois de uma b5#0 incerta, a b5#1 aprovada por quem olhou no sistema envia uma vez', async (t) => {
  const on = await writing(t)
  const first = on.byWorkflow({ callKey: balloonCallKeyOf(BalloonAddress.parse('b5'), 0) })
  assert.equal((await on.ask(first)).kind, 'OK')
  await on.hub.test.asOwner(
    "update connectors.connector_write set state = 'UNCERTAIN', answer = null",
  )
  const second = on.byWorkflow({ callKey: balloonCallKeyOf(BalloonAddress.parse('b5'), 1) })
  assert.equal((await on.ask(second)).kind, 'WRITE_UNCERTAIN')
  assert.equal((await on.ask({ ...second, approvedBy: second.scope.personId })).kind, 'OK')
  assert.equal(on.mode.posts, 2)
})

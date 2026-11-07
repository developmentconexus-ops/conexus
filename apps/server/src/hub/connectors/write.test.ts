import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { ConnectionId, OperationId, ToolCallId } from '@conexus/hub-api'
import { markOf, TurnKey } from './public.ts'
import { ORDER, writing } from './test-write.ts'

test('o pedido sai: de uma versão e de uma pessoa num rascunho, com a marca na observação e o código no log, sem os campos', async (t) => {
  const on = await writing(t)
  const first = on.byAna()
  const answered = await on.ask(first)
  assert.deepEqual(answered, { kind: 'OK', value: { codigoPedido: 98001 } })
  const second = on.byVersion()
  assert.deepEqual(await on.ask(second), { kind: 'OK', value: { codigoPedido: 98002 } })
  const stored = on.fake.orders()
  assert.equal(stored.length, 2)
  assert.equal(stored[0]?.estado, 'A_CONFIRMAR')
  assert.equal(stored[0]?.observacao, markOf(first.threadId, first.toolCallId))
  assert.equal(stored[1]?.observacao, markOf(second.threadId, second.toolCallId))
  assert.match(markOf(first.threadId, first.toolCallId), /^Conexus [0-9a-f]{8}$/)
  // The kit's description of `observacao` says 17: the mark and the space before it.
  assert.equal(markOf(first.threadId, first.toolCallId).length + 1, 17)
  const sent = on.lines('CONNECTOR_WRITE_SENT')
  assert.equal(sent.length, 2)
  assert.equal(sent[0]?.fields.codigoPedido, 98001)
  assert.equal(sent[0]?.fields.personId, on.ana.id)
  assert.equal(sent[1]?.fields.agentId, on.agentId)
  assert.equal(sent[1]?.fields.versionNumber, 1)
  assert.equal(sent[1]?.fields.connectionId, on.matriz)
  assert.equal(sent[1]?.fields.operation, 'lancarPedido')
  assert.ok(!JSON.stringify(sent).includes('codigoCliente'))
  const rows = await on.ledger()
  assert.deepEqual(
    rows.map((row) => [
      row.state,
      row.agent_id === null,
      row.version_number,
      row.person_id === null,
    ]),
    [
      ['DONE', true, null, false],
      ['DONE', false, 1, true],
    ],
  )
})

test('a observação da pessoa fica, com a marca no fim', async (t) => {
  const on = await writing(t)
  const request = on.byAna({ input: { ...ORDER, observacao: 'urgente' } })
  assert.equal((await on.ask(request)).kind, 'OK')
  assert.equal(
    on.fake.orders()[0]?.observacao,
    `urgente ${markOf(request.threadId, request.toolCallId)}`,
  )
})

test('a escrita recusada: sem a operação no papel, sem a liberação, sem a escolha, uma leitura ou uma entrada inválida, o dublê não recebe nada e nada se grava', async (t) => {
  const on = await writing(t)
  const refusedRole = await on.ask(on.byCarla())
  assert.deepEqual(refusedRole, { kind: 'NOT_IN_ROLE' })
  const loose = ConnectionId.parse(await on.connect('Filial', false))
  assert.deepEqual(
    await on.ask(on.byAna({ connectionId: loose, scope: on.scopeOf(on.ana.id, [loose]) })),
    { kind: 'NOT_GRANTED' },
  )
  assert.deepEqual(await on.ask(on.byAna({ scope: on.scopeOf(on.ana.id, []) })), {
    kind: 'NOT_GRANTED',
  })
  await assert.rejects(on.ask(on.byAna({ operation: OperationId.parse('empresas') })), {
    code: 'REQUEST_MALFORMED',
  })
  const invalid = await on.ask(on.byAna({ input: { ...ORDER, codigoCliente: 'um' } }))
  assert.equal(invalid.kind, 'REFUSED')
  const tooLong = await on.ask(on.byAna({ input: { ...ORDER, observacao: 'x'.repeat(150) } }))
  assert.equal(tooLong.kind, 'REFUSED')
  assert.match(String(Object(Object(tooLong).native).message), /at most 133 characters/)
  assert.equal(on.mode.posts, 0)
  assert.equal(on.fake.orders().length, 0)
  assert.equal((await on.ledger()).length, 0)
  const refused = on.lines('CONNECTOR_WRITE_REFUSED')
  assert.equal(refused[0]?.fields.role, 'atendente')
  assert.ok(!JSON.stringify(refused).includes('codigoCliente'))
})

test('o papel se lê de novo a cada escrita: tirar a pessoa do papel faz a próxima recusar', async (t) => {
  const on = await writing(t)
  assert.equal((await on.ask(on.byAna())).kind, 'OK')
  await on.hub.test.asOwner(
    "update auth.member set role = 'atendente' where company_id = $1 and user_id = $2",
    [on.companyId, on.ana.id],
  )
  assert.deepEqual(await on.ask(on.byAna()), { kind: 'NOT_IN_ROLE' })
  assert.equal(on.mode.posts, 1)
})

test('uma escrita conta nas chamadas da resposta, como uma leitura', async (t) => {
  const on = await writing(t)
  const turn = TurnKey.parse(randomUUID())
  let spent = 0
  for (let n = 0; n < 51; n += 1) {
    const answered = await on.ask(
      on.byAna({
        turn,
        toolCallId: ToolCallId.parse(randomUUID()),
        input: { ...ORDER, codigoCliente: 999 },
      }),
    )
    if (answered.kind === 'CALLS_SPENT') spent += 1
  }
  assert.equal(spent, 1)
})

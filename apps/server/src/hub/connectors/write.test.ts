import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { ConnectionId, OperationId, ToolCallId } from '@conexus/hub-api'
import { markOf, openText, TurnKey } from './public.ts'
import { ORDER, placedAnswer, writing } from './test-write.ts'

test('o pedido sai: de uma versão e de uma pessoa num rascunho, com a marca na observação e o código no log, sem os campos', async (t) => {
  const on = await writing(t)
  const first = on.byAna()
  const answered = await on.ask(first)
  assert.deepEqual(answered, {
    kind: 'OK',
    value: { codigoPedido: 98001 },
    returned: placedAnswer(98001),
  })
  const second = on.byVersion()
  assert.deepEqual(await on.ask(second), {
    kind: 'OK',
    value: { codigoPedido: 98002 },
    returned: placedAnswer(98002),
  })
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
  assert.equal(sent[0]?.fields.writtenId, 98001)
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

type Planted = Partial<{
  thread: string
  toolCallId: string
  connection: string
  operation: string
  hash: string
  state: string
}>

/** A row of the record as an earlier call left it, written as the owner. */
function plant(on: Awaited<ReturnType<typeof writing>>, over: Planted = {}) {
  return on.hub.test.asOwner(
    `insert into connectors.connector_write(company_id, thread_id, tool_call_id, connection_id,
       operation_id, input_hash, person_id, state, created_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, now())`,
    [
      on.companyId,
      over.thread ?? on.thread,
      over.toolCallId ?? randomUUID(),
      over.connection ?? on.matriz,
      over.operation ?? 'lancarPedido',
      over.hash ?? createHash('sha256').update(JSON.stringify(ORDER)).digest('hex'),
      on.ana.id,
      over.state ?? 'SENDING',
    ],
  )
}

function another() {
  return ToolCallId.parse(randomUUID())
}

test('o pedido sem resposta (a): uma linha SENDING de outra chamada faz WRITE_OPEN com a marca dela, sem gravar nem enviar', async (t) => {
  const on = await writing(t)
  const open = randomUUID()
  await plant(on, { toolCallId: open })
  const answer = await on.ask(on.byAna())
  const mark = markOf(on.thread, ToolCallId.parse(open))
  assert.ok(answer.kind === 'WRITE_OPEN' && answer.mark === mark && answer.since instanceof Date)
  assert.match(openText(mark, answer.since), /Do not call this again/)
  assert.ok(openText(mark, answer.since).includes(mark))
  assert.equal(on.mode.posts, 0)
  assert.equal((await on.ledger()).length, 1)
  assert.equal(on.lines('CONNECTOR_WRITE_OPEN').length, 1)
})

test('o pedido sem resposta (b): depois de um corte a linha UNCERTAIN trava outra chamada, com os mesmos campos ou outros', async (t) => {
  const on = await writing(t)
  on.mode.cut = true
  const first = on.byAna()
  assert.equal((await on.ask(first)).kind, 'WRITE_UNCERTAIN')
  on.mode.cut = false
  const mark = markOf(first.threadId, first.toolCallId)
  for (const input of [ORDER, { ...ORDER, codigoCliente: 2 }]) {
    const answer = await on.ask(on.byAna({ toolCallId: another(), input }))
    assert.ok(answer.kind === 'WRITE_OPEN' && answer.mark === mark)
  }
  assert.equal(on.mode.posts, 1)
  assert.equal(on.fake.orders().length, 1)
  assert.equal((await on.ledger()).length, 1)
})

test('o pedido sem resposta (c): uma linha DONE ou REFUSED não trava', async (t) => {
  const on = await writing(t)
  await plant(on, { state: 'DONE' })
  await plant(on, { state: 'REFUSED' })
  assert.equal((await on.ask(on.byAna())).kind, 'OK')
  assert.equal(on.mode.posts, 1)
})

test('o pedido sem resposta (d): outra operação, outra ligação ou outra conversa não travam', async (t) => {
  const on = await writing(t)
  await plant(on, { operation: 'outraOperacao' })
  await plant(on, { connection: randomUUID() })
  await plant(on, { thread: randomUUID() })
  assert.equal((await on.ask(on.byAna())).kind, 'OK')
  assert.equal(on.mode.posts, 1)
})

test('o pedido sem resposta (e): com a aprovação de uma pessoa a escrita passa pelo aberto, e o dublê conta dois', async (t) => {
  const on = await writing(t)
  on.mode.cut = true
  assert.equal((await on.ask(on.byAna())).kind, 'WRITE_UNCERTAIN')
  on.mode.cut = false
  const approved = on.byAna({ toolCallId: another() })
  assert.equal((await on.ask({ ...approved, approvedBy: approved.scope.personId })).kind, 'OK')
  assert.equal(on.mode.posts, 2)
})

test('o pedido sem resposta (f): a chamada que se repete com outra linha aberta recebe a sua própria resposta e a sua marca', async (t) => {
  const on = await writing(t)
  on.mode.cut = true
  assert.equal((await on.ask(on.byAna())).kind, 'WRITE_UNCERTAIN')
  on.mode.cut = false
  const approved = on.byAna({ toolCallId: another() })
  const done = await on.ask({ ...approved, approvedBy: approved.scope.personId })
  assert.deepEqual(done, {
    kind: 'OK',
    value: { codigoPedido: 98002 },
    returned: placedAnswer(98002),
  })
  assert.deepEqual(await on.ask(approved), done)
  const held = another()
  await plant(on, { toolCallId: held })
  assert.deepEqual(await on.ask(on.byAna({ toolCallId: held })), {
    kind: 'WRITE_UNCERTAIN',
    mark: markOf(on.thread, held),
    returned: null,
  })
  assert.equal(on.mode.posts, 2)
})

test('o pedido sem resposta (g): duas chamadas da mesma escrita ao mesmo tempo, sem linha antes: uma envia, a outra devolve WRITE_OPEN', async (t) => {
  const on = await writing(t)
  // The insert waits, so the second call reaches the record while the first one's row is not yet committed.
  await on.hub.test.asOwner(`
    create function connectors.slow_insert() returns trigger language plpgsql as
      $$ begin perform pg_sleep(0.3); return new; end $$;
    create trigger slow_insert before insert on connectors.connector_write
      for each row execute function connectors.slow_insert();`)
  const answers = await Promise.all([
    on.ask(on.byAna({ toolCallId: another() })),
    on.ask(on.byAna({ toolCallId: another() })),
  ])
  assert.deepEqual(answers.map((answer) => answer.kind).sort(), ['OK', 'WRITE_OPEN'])
  assert.equal(on.mode.posts, 1)
  assert.equal(on.fake.orders().length, 1)
})

const UNKNOWN_PRODUCT = {
  ...ORDER,
  itens: [{ codigoProduto: 999, quantidade: 1, valorUnitario: 10 }],
}
const RECORDED_BODY = {
  statusCode: 400,
  error: {
    code: 'BAD_REQUEST',
    message: 'Ocorreu algum erro inesperado!',
    details: 'O produto [999] enviado não existe.',
  },
}

test('a recusa inteira: o Written traz native.body igual ao corpo gravado, e a linha guarda o mesmo em answer', async (t) => {
  const on = await writing(t)
  const answered = await on.ask(on.byAna({ input: UNKNOWN_PRODUCT }))
  assert.deepEqual(answered, {
    kind: 'REFUSED',
    native: {
      status: 400,
      code: 'BAD_REQUEST',
      message: 'Ocorreu algum erro inesperado! O produto [999] enviado não existe.',
      body: RECORDED_BODY,
    },
  })
  const [row] = await on.ledger()
  assert.equal(row?.state, 'REFUSED')
  assert.deepEqual(row?.answer, answered)
  const repeated = on.byAna({ input: UNKNOWN_PRODUCT })
  assert.deepEqual(await on.ask(repeated), await on.ask(repeated))
})

test('a recusa inteira: um corpo acima do teto do executor não prova recusa: WRITE_UNCERTAIN com o status, sem corpo', async (t) => {
  const on = await writing(t, {
    order: async () => new Response('x'.repeat(2 * 1024 * 1024 + 1), { status: 400 }),
  })
  const asked = on.byAna()
  assert.deepEqual(await on.ask(asked), {
    kind: 'WRITE_UNCERTAIN',
    mark: markOf(asked.threadId, asked.toolCallId),
    returned: { status: 400, body: null },
  })
})

test('quem aprovou: o Aprovar grava a pessoa em approved_by, e Faz sozinho grava null', async (t) => {
  const on = await writing(t)
  const asked = on.byAna({ toolCallId: another() })
  assert.equal((await on.ask({ ...asked, approvedBy: asked.scope.personId })).kind, 'OK')
  assert.equal((await on.ask(on.byVersion())).kind, 'OK')
  const rows = await on.ledger()
  assert.deepEqual(
    rows.map((row) => row.approved_by),
    [on.ana.id, null],
  )
})

import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { ConversationId, ToolCallId } from '@conexus/hub-api'
import { markOf, openText, TurnKey, uncertainText } from './public.ts'
import { ORDER, writing } from './test-write.ts'

test('o mesmo toolCallId: a repetição devolve o que o registro diz sem enviar, outra entrada sob a mesma chave não, e noutra conversa é outra escrita', async (t) => {
  const on = await writing(t)
  const first = on.byAna()
  const done = await on.ask(first)
  assert.deepEqual(await on.ask({ ...first, turn: TurnKey.parse(randomUUID()) }), done)
  assert.equal(on.mode.posts, 1)
  const other = await on.ask({ ...first, input: { ...ORDER, codigoCliente: 2 } })
  assert.deepEqual(other, {
    kind: 'IDEMPOTENCY_CONFLICT',
    mark: markOf(first.threadId, first.toolCallId),
  })
  assert.equal(on.mode.posts, 1)
  assert.equal(on.fake.orders().length, 1)
  const elsewhere = await on.ask({ ...first, threadId: ConversationId.parse(randomUUID()) })
  assert.deepEqual(elsewhere, { kind: 'OK', value: { codigoPedido: 98001 + 1 } })
  assert.equal(on.mode.posts, 2)
})

test('duas chamadas iguais ao mesmo tempo mandam um pedido só', async (t) => {
  const on = await writing(t)
  const first = on.byAna()
  const answers = await Promise.all([on.ask(first), on.ask(first)])
  assert.equal(on.mode.posts, 1)
  assert.deepEqual(answers.map((answer) => answer.kind).sort(), ['OK', 'WRITE_UNCERTAIN'])
})

test('a resposta perdida: perdida depois de gravar ou antes, e um corte, dão WRITE_UNCERTAIN com a marca e a repetição não envia', async (t) => {
  const on = await writing(t)
  on.fake.orderSwitches.lostAfterStore = true
  const after = on.byAna()
  const mark = markOf(after.threadId, after.toolCallId)
  assert.deepEqual(await on.ask(after), { kind: 'WRITE_UNCERTAIN', mark })
  assert.deepEqual(await on.ask(after), { kind: 'WRITE_UNCERTAIN', mark })
  assert.equal(on.mode.posts, 1)
  assert.equal(on.fake.orders().length, 1)
  on.fake.orderSwitches.lostAfterStore = false
  on.fake.orderSwitches.lostBeforeStore = true
  const before = on.byAna({ threadId: ConversationId.parse(randomUUID()) })
  assert.equal((await on.ask(before)).kind, 'WRITE_UNCERTAIN')
  assert.equal((await on.ask(before)).kind, 'WRITE_UNCERTAIN')
  assert.equal(on.mode.posts, 2)
  assert.equal(on.fake.orders().length, 1)
  on.fake.orderSwitches.lostBeforeStore = false
  on.mode.cut = true
  const cut = on.byAna({ threadId: ConversationId.parse(randomUUID()) })
  assert.equal((await on.ask(cut)).kind, 'WRITE_UNCERTAIN')
  assert.equal((await on.ask(cut)).kind, 'WRITE_UNCERTAIN')
  assert.equal(on.mode.posts, 3)
  assert.equal(on.fake.orders().length, 2)
  assert.deepEqual(
    (await on.ledger()).map((row) => row.state),
    ['UNCERTAIN', 'UNCERTAIN', 'UNCERTAIN'],
  )
  assert.equal(on.lines('CONNECTOR_WRITE_UNCERTAIN').length, 3)
  assert.match(uncertainText(mark), /Do not call this again/)
  assert.ok(uncertainText(mark).includes(mark))
})

test('um processo que morreu depois do registro: a linha SENDING faz a chamada de novo dar WRITE_UNCERTAIN, sem enviar', async (t) => {
  const on = await writing(t)
  const first = on.byAna()
  await on.hub.test.asOwner(
    `insert into connectors.connector_write(company_id, thread_id, tool_call_id, connection_id,
       operation_id, input_hash, person_id, state, created_at)
     values ($1, $2, $3, $4, 'lancarPedido', $5, $6, 'SENDING', now())`,
    [
      on.companyId,
      first.threadId,
      first.toolCallId,
      on.matriz,
      createHash('sha256').update(JSON.stringify(ORDER)).digest('hex'),
      on.ana.id,
    ],
  )
  assert.deepEqual(await on.ask(first), {
    kind: 'WRITE_UNCERTAIN',
    mark: markOf(first.threadId, first.toolCallId),
  })
  assert.equal(on.mode.posts, 0)
  assert.equal(Object((await on.ledger())[0]).state, 'UNCERTAIN')
})

test('o pedido recusado: o produto que não existe e o cliente que não existe voltam REFUSED ao modelo, e nada fica como enviado com sucesso', async (t) => {
  const on = await writing(t)
  const noProduct = await on.ask(
    on.byAna({ input: { ...ORDER, itens: [{ codigoProduto: 99999999, quantidade: 1 }] } }),
  )
  assert.equal(noProduct.kind, 'REFUSED')
  const noClient = await on.ask(on.byAna({ input: { ...ORDER, codigoCliente: 999 } }))
  assert.equal(noClient.kind, 'REFUSED')
  assert.equal(on.fake.orders().length, 0)
  assert.deepEqual(
    (await on.ledger()).map((row) => row.state),
    ['REFUSED', 'REFUSED'],
  )
  assert.equal(on.lines('CONNECTOR_WRITE_SENT').length, 0)
  const again = on.byAna()
  assert.equal((await on.ask(again)).kind, 'OK')
})

test('o token vencido do gateway volta ao modelo sem repetir, e a próxima chamada entra de novo', async (t) => {
  const on = await writing(t)
  on.fake.switches.expireToken = true
  const expired = await on.ask(on.byAna())
  assert.equal(expired.kind, 'TOKEN_EXPIRED')
  assert.equal(on.mode.posts, 1)
  on.fake.switches.expireToken = false
  const before = on.fake.logins()
  assert.equal((await on.ask(on.byAna())).kind, 'OK')
  assert.equal(on.fake.logins(), before + 1)
})

test('o fim do registro que falha: o modelo recebe o OK, o processo diz CONNECTOR_WRITE_UNRECORDED, e a repetição dá WRITE_UNCERTAIN sem enviar', async (t) => {
  const on = await writing(t)
  await on.hub.test.asOwner(`
    create function connectors.refuse_end() returns trigger language plpgsql as
      $$ begin raise exception 'sem fim'; end $$;
    create trigger refuse_end before update on connectors.connector_write
      for each row execute function connectors.refuse_end();`)
  const first = on.byAna()
  assert.deepEqual(await on.ask(first), { kind: 'OK', value: { codigoPedido: 98001 } })
  const sent = on.lines('CONNECTOR_WRITE_SENT')
  assert.equal(sent[0]?.fields.codigoPedido, 98001)
  assert.equal(on.lines('CONNECTOR_WRITE_UNRECORDED')[0]?.fields.toolCallId, first.toolCallId)
  assert.equal(Object((await on.ledger())[0]).state, 'SENDING')
  await on.hub.test.asOwner('drop trigger refuse_end on connectors.connector_write')
  assert.equal((await on.ask(first)).kind, 'WRITE_UNCERTAIN')
  assert.equal(on.mode.posts, 1)
})

test('o foi?: depois de um corte, outro toolCallId na mesma conversa, conexão e operação não envia e diz que pode existir', async (t) => {
  const on = await writing(t)
  on.mode.cut = true
  const first = on.byAna()
  assert.equal((await on.ask(first)).kind, 'WRITE_UNCERTAIN')
  on.mode.cut = false
  const again = on.byAna({ toolCallId: ToolCallId.parse(randomUUID()) })
  const answer = await on.ask(again)
  const mark = markOf(first.threadId, first.toolCallId)
  assert.equal(answer.kind, 'WRITE_OPEN')
  assert.ok(answer.kind === 'WRITE_OPEN' && answer.mark === mark && answer.since instanceof Date)
  assert.match(openText(mark, new Date(0)), /Do not call this again/)
  assert.equal(on.mode.posts, 1)
  assert.equal(on.fake.orders().length, 1)
  assert.equal((await on.ledger()).length, 1)
  assert.equal(on.lines('CONNECTOR_WRITE_OPEN').length, 1)
})

test('o foi? não alcança outra operação, outra conexão nem outra conversa, e a linha acabada não bloqueia', async (t) => {
  const on = await writing(t)
  const first = on.byAna()
  function hold(over: Record<string, string>) {
    return on.hub.test.asOwner(
      `insert into connectors.connector_write(company_id, thread_id, tool_call_id, connection_id,
         operation_id, input_hash, person_id, state, created_at)
       values ($1, $2, $3, $4, $5, 'x', $6, $7, now())`,
      [
        on.companyId,
        over.thread ?? first.threadId,
        randomUUID(),
        over.connection ?? on.matriz,
        over.operation ?? 'lancarPedido',
        on.ana.id,
        over.state ?? 'SENDING',
      ],
    )
  }
  await hold({ operation: 'outraOperacao' })
  await hold({ connection: randomUUID() })
  await hold({ thread: randomUUID() })
  assert.equal((await on.ask(first)).kind, 'OK')
  await hold({ state: 'REFUSED' })
  await hold({ state: 'DONE' })
  assert.equal((await on.ask(on.byAna({ toolCallId: ToolCallId.parse(randomUUID()) }))).kind, 'OK')
  assert.equal(on.mode.posts, 2)
})

test('com a aprovação de uma pessoa a escrita passa pelo aberto', async (t) => {
  const on = await writing(t)
  on.mode.cut = true
  assert.equal((await on.ask(on.byAna())).kind, 'WRITE_UNCERTAIN')
  on.mode.cut = false
  const approved = on.byAna({ toolCallId: ToolCallId.parse(randomUUID()) })
  assert.equal((await on.ask({ ...approved, approvedBy: approved.scope.personId })).kind, 'OK')
  assert.equal(on.mode.posts, 2)
})

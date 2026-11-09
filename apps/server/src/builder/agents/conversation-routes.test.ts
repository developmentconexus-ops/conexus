import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ConversationId, ToolCallId } from '@conexus/hub-api'
import { markOf } from '../../hub/connectors/public.ts'
import { CARLA, call, codeOf, memberOn } from '../../hub/identity/test-hub.ts'
import { said } from '../assistant/test-assistant.ts'
import { endOf, sent } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import { ASKED, answer, approving, askedOf, launched, untilAsked, WRITE } from './test-approval.ts'

const UNKNOWN_PRODUCT = {
  ...ASKED,
  itens: [{ codigoProduto: 999, quantidade: 1, valorUnitario: 10 }],
}

test('as escritas da conversa: listWrites traz cada escrita com o estado, a marca, se uma pessoa aprovou e a mensagem do sistema da recusa, sem os campos; Faz sozinho não conta como aprovada; um envio sem resposta vem UNCERTAIN, com a marca; outra pessoa recebe CONVERSATION_NOT_FOUND (38)', async (t) => {
  const on = await approving(t, [
    [launched()],
    [said('Lançado.')],
    [tool(WRITE, UNKNOWN_PRODUCT)],
    [said('O Sankhya recusou.')],
    [launched()],
    [said('Lançado.')],
  ])
  const asking = await on.writer('ASK')
  const a = await on.opened(asking.id)
  for (const text of ['Lance o pedido', 'Lance o do produto 999']) {
    await sent(on.hub, on.ana, a.url, text)
    const asked = askedOf(await untilAsked(a.stream)).toolCallId
    assert.deepEqual(await answer(on.hub, on.ana, a.url, asked, true), { ok: true })
    assert.equal(endOf(await a.stream.turn()), 'complete')
  }
  const listed = await call(on.hub, on.ana, 'GET', `${a.url}/writes`)
  assert.equal(listed.statusCode, 200, listed.body)
  const threadId = ConversationId.parse(a.url.slice(a.url.lastIndexOf('/') + 1))
  const ledger = await on.hub.test.asOwner(
    'select tool_call_id from connectors.connector_write order by created_at',
  )
  const [first, second] = Object(listed.json()).writes
  assert.deepEqual(first, {
    ...{ connectionId: on.matriz, operation: 'lancarPedido', state: 'DONE' },
    ...{ sentAt: first.sentAt, approved: true, message: null },
    ...{
      toolCallId: ledger[0]?.tool_call_id,
      mark: markOf(threadId, ToolCallId.parse(ledger[0]?.tool_call_id)),
    },
  })
  assert.deepEqual(
    [second.state, second.approved, second.message],
    ['REFUSED', true, 'Ocorreu algum erro inesperado! O produto [999] enviado não existe.'],
  )
  assert.doesNotMatch(listed.body, /codigoCliente|itens|codigoProduto|statusCode/)

  const alone = await on.writer('AUTO')
  const b = await on.opened(alone.id)
  on.fake.orderSwitches.lostAfterStore = true
  await sent(on.hub, on.ana, b.url, 'Lance o pedido')
  await b.stream.turn()
  const [own] = Object(Object((await call(on.hub, on.ana, 'GET', `${b.url}/writes`)).json())).writes
  assert.deepEqual([own.state, own.approved, own.message], ['UNCERTAIN', false, null])
  assert.ok(Math.abs(Date.parse(own.sentAt) - Date.now()) < 60_000)
  assert.deepEqual(
    Object((await call(on.hub, on.ana, 'GET', `${a.url}/writes`)).json()).writes.length,
    2,
    'the other conversation’s write is not in this one',
  )

  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const foreign = await call(on.hub, carla, 'GET', `${a.url}/writes`)
  assert.deepEqual([foreign.statusCode, codeOf(foreign)], [404, 'CONVERSATION_NOT_FOUND'])
  const crossed = `${a.url}/writes`.replace(`/agents/${asking.id}/`, `/agents/${alone.id}/`)
  const elsewhere = await call(on.hub, on.ana, 'GET', crossed)
  assert.deepEqual([elsewhere.statusCode, codeOf(elsewhere)], [404, 'CONVERSATION_NOT_FOUND'])
})

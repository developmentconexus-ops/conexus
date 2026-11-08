import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ConversationId, ToolCallId } from '@conexus/hub-api'
import { markOf } from '../../hub/connectors/public.ts'
import { CARLA, call, codeOf, memberOn } from '../../hub/identity/test-hub.ts'
import { said } from '../assistant/test-assistant.ts'
import { sent } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import { publishedAgent } from './test-agents.ts'
import { ASKED, approving, launched, WRITE } from './test-approval.ts'

const UNKNOWN_PRODUCT = {
  ...ASKED,
  itens: [{ codigoProduto: 999, quantidade: 1, valorUnitario: 10 }],
}

test('os envios abertos: listOpenWrites traz cada envio da conversa sem fim conhecido, com ligação, operação, estado, hora e marca, sem os campos; DONE e REFUSED não aparecem; outra pessoa, ou outra conversa pelo caminho deste agente, recebe CONVERSATION_NOT_FOUND (23)', async (t) => {
  const on = await approving(t, [
    [launched()],
    [said('Lançado.')],
    [tool(WRITE, UNKNOWN_PRODUCT)],
    [said('O Sankhya recusou.')],
    [launched()],
    [said('Não sei se entrou.')],
  ])
  const agent = await on.writer('AUTO')
  const { url, stream } = await on.opened(agent.id)
  const writes = `${url}/open-writes`
  assert.deepEqual(Object(await call(on.hub, on.ana, 'GET', writes)).json(), { writes: [] })

  await sent(on.hub, on.ana, url, 'Lance o pedido')
  await stream.turn()
  await sent(on.hub, on.ana, url, 'Lance o do produto 999')
  await stream.turn()
  on.fake.orderSwitches.lostAfterStore = true
  await sent(on.hub, on.ana, url, 'Lance outro')
  await stream.turn()
  const ledger = await on.hub.test.asOwner(
    'select tool_call_id, state from connectors.connector_write order by created_at',
  )
  assert.deepEqual(
    ledger.map((row) => row.state),
    ['DONE', 'REFUSED', 'UNCERTAIN'],
  )

  const listed = await call(on.hub, on.ana, 'GET', writes)
  assert.equal(listed.statusCode, 200, listed.body)
  const [open] = Object(listed.json()).writes
  const threadId = ConversationId.parse(url.slice(url.lastIndexOf('/') + 1))
  const toolCallId = ToolCallId.parse(ledger[2]?.tool_call_id)
  assert.deepEqual(Object(listed.json()).writes, [
    {
      connectionId: on.matriz,
      operation: 'lancarPedido',
      state: 'UNCERTAIN',
      sentAt: open.sentAt,
      mark: markOf(threadId, toolCallId),
    },
  ])
  assert.ok(Math.abs(Date.parse(open.sentAt) - Date.now()) < 60_000)
  assert.doesNotMatch(listed.body, /codigoCliente|itens|codigoProduto/)

  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const foreign = await call(on.hub, carla, 'GET', writes)
  assert.deepEqual([foreign.statusCode, codeOf(foreign)], [404, 'CONVERSATION_NOT_FOUND'])
  const another = await publishedAgent(on.hub, on.ana, on.agents, { instructions: 'Responda.' })
  const crossed = writes.replace(`/agents/${agent.id}/`, `/agents/${another.id}/`)
  const elsewhere = await call(on.hub, on.ana, 'GET', crossed)
  assert.deepEqual([elsewhere.statusCode, codeOf(elsewhere)], [404, 'CONVERSATION_NOT_FOUND'])
})

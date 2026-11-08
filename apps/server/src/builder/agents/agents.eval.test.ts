import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ConversationId, ToolCallId } from '@conexus/hub-api'
import { markOf } from '../../hub/connectors/public.ts'
import { REAL_MODEL, subscribed } from '../assistant/test-real-model.ts'
import { sent, streamOf } from '../conversation/test-conversation.ts'
import { madeTool, publishedAgent, talkedTo } from './test-agents.ts'
import { answer, approvalsIn, askedOf, untilAsked, WRITE } from './test-approval.ts'

const OPT_IN =
  'opt-in: set CONEXUS_EVAL_REAL_MODEL to a folder; firstmate opens the link the test writes there and writes back the sign-in code (step 24.5, criterion 18)'
const ORDER = 'Lance um pedido para o cliente 1: 2 unidades do produto 11 a R$ 10,00 cada.'

/** The company of the real model with `Lançar pedido` in an agent at `approval`, and Ana's conversation with it. */
async function writing(t: Parameters<typeof subscribed>[0], approval: 'ASK' | 'AUTO') {
  const on = await subscribed(t, REAL_MODEL ?? '')
  const agents = `${on.company}/projects/${on.projectId}/agents`
  const write = await madeTool(on.hub, on.ana, `${on.company}/projects/${on.projectId}/tools`, {
    slug: 'lancar_pedido',
    connectionId: on.matriz,
    operation: 'lancarPedido',
    description: 'Lança um pedido de venda da empresa 1.',
    bound: { notaModelo: 12, codigoLocalEstoque: 1 },
    open: ['codigoCliente', 'itens'],
  })
  const agent = await publishedAgent(on.hub, on.ana, agents, {
    instructions: 'Lance no Sankhya os pedidos que a pessoa pedir.',
    connections: [on.matriz],
    tools: [write.latest.id],
    approvals: { [write.id]: approval },
  })
  const url = await talkedTo(on.hub, on.ana, agents, agent.id)
  const stream = await streamOf(on.hub, on.ana, url)
  t.after(() => stream.close())
  return { ...on, url, stream }
}

/** The model's text in the events, as the person reads it. */
function saidIn(events: Awaited<ReturnType<typeof untilAsked>>) {
  return events
    .flatMap((event) =>
      event.type === 'message_update' && event.event.type === 'text-delta'
        ? [event.event.delta]
        : [],
    )
    .join('')
}

test('a escrita, com o modelo de verdade: o pedido para no cartão; recusado, o agente diz que não lançou e não chama de novo no turno (18)', {
  timeout: 1_800_000,
}, async (t) => {
  if (REAL_MODEL === undefined) {
    t.skip(OPT_IN)
    return
  }
  const on = await writing(t, 'ASK')
  assert.equal((await sent(on.hub, on.ana, on.url, ORDER)).statusCode, 200)
  const card = askedOf(await untilAsked(on.stream))
  assert.equal(card.toolName, WRITE)
  assert.deepEqual(await answer(on.hub, on.ana, on.url, card.toolCallId, false), { ok: true })
  const after = await on.stream.turn()
  assert.deepEqual(approvalsIn(after), [], 'the write is not called again in the turn')
  assert.match(saidIn(after), /não (foi )?lan[cç]/i)
  assert.deepEqual(on.sankhya.orders(), [])
})

test('a escrita, com o modelo de verdade: em Faz sozinho, com WRITE_UNCERTAIN, o agente não chama de novo e diz a marca (18)', {
  timeout: 1_800_000,
}, async (t) => {
  if (REAL_MODEL === undefined) {
    t.skip(OPT_IN)
    return
  }
  const on = await writing(t, 'AUTO')
  on.sankhya.orderSwitches.lostAfterStore = true
  assert.equal((await sent(on.hub, on.ana, on.url, ORDER)).statusCode, 200)
  const turn = await on.stream.turn()
  assert.equal(on.sankhya.orders().length, 1, 'one order, never sent again')
  const [row] = await on.hub.test.asOwner('select tool_call_id from connectors.connector_write')
  const threadId = ConversationId.parse(on.url.slice(on.url.lastIndexOf('/') + 1))
  const mark = markOf(threadId, ToolCallId.parse(row?.tool_call_id))
  assert.ok(saidIn(turn).includes(mark), saidIn(turn))
})

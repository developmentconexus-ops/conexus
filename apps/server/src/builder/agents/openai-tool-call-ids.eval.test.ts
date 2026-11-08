import assert from 'node:assert/strict'
import { test } from 'node:test'
import { OPENAI_LOGIN, REAL_MODEL, subscribed } from '../assistant/test-real-model.ts'
import { endOf, sent, streamOf } from '../conversation/test-conversation.ts'
import { madeTool, ordersOf, publishedAgent, talkedTo } from './test-agents.ts'

const OPT_IN =
  'opt-in: set CONEXUS_EVAL_REAL_MODEL to a folder and CONEXUS_EVAL_OPENAI_CREDENTIAL to the file of the kept ChatGPT login (step 24.5, issue 840)'

const ASK =
  'Faça nesta ordem, uma ferramenta de cada vez: 1) consulte os pedidos da empresa 1 de setembro de 2025; ' +
  '2) lance um pedido para o cliente 1: 2 unidades do produto 11 a R$ 10,00 cada; ' +
  '3) consulte de novo os pedidos de setembro de 2025; ' +
  '4) lance outro pedido, já que este é um segundo pedido da pessoa, para o cliente 2: 3 unidades do produto 12 a R$ 5,00 cada; ' +
  '5) consulte os pedidos uma última vez. Depois diga o que foi feito.'

test('o OpenAI não repete toolCallId na conversa: várias chamadas, duas escritas, nenhuma recusada como repetida (issue 840)', {
  timeout: 1_800_000,
}, async (t) => {
  if (REAL_MODEL === undefined || OPENAI_LOGIN === undefined) {
    t.skip(OPT_IN)
    return
  }
  const on = await subscribed(t, REAL_MODEL, 'openai')
  const project = `${on.company}/projects/${on.projectId}`
  const agents = `${project}/agents`
  const write = await madeTool(on.hub, on.ana, `${project}/tools`, {
    slug: 'lancar_pedido',
    connectionId: on.matriz,
    operation: 'lancarPedido',
    description: 'Lança um pedido de venda da empresa 1.',
    bound: { notaModelo: 12 },
    open: ['codigoCliente', 'itens'],
  })
  const read = await madeTool(on.hub, on.ana, `${project}/tools`, ordersOf(String(on.matriz)))
  const agent = await publishedAgent(on.hub, on.ana, agents, {
    instructions: 'Use as ferramentas que a pessoa pedir, uma por vez, na ordem pedida.',
    connections: [on.matriz],
    tools: [write.latest.id, read.latest.id],
    approvals: { [write.id]: 'AUTO' },
  })
  const url = await talkedTo(on.hub, on.ana, agents, agent.id)
  const stream = await streamOf(on.hub, on.ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(on.hub, on.ana, url, ASK)).statusCode, 200)
  const events = await stream.turn()
  const errors = events.filter((event) => event.type === 'error')
  assert.equal(endOf(events), 'complete', JSON.stringify(errors).slice(0, 1500))
  const ids = events.flatMap((event) => (event.type === 'tool_end' ? [event.toolCallId] : []))
  t.diagnostic(`${ids.length} calls, ${new Set(ids).size} different toolCallIds`)
  assert.ok(ids.length >= 5, `the model made at least five calls, made ${ids.length}`)
  assert.equal(new Set(ids).size, ids.length, `every call has its own toolCallId (${ids.length})`)
  const ledger = await on.hub.test.asOwner('select state from connectors.connector_write')
  assert.deepEqual(
    ledger,
    [{ state: 'DONE' }, { state: 'DONE' }],
    'neither write was refused as repeated',
  )
  assert.equal(on.sankhya.orders().length, 2, 'both orders left')
})

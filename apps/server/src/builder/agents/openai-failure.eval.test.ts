import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { OPENAI_LOGIN, REAL_MODEL, subscribed } from '../assistant/test-real-model.ts'
import { endOf, sent, streamOf } from '../conversation/test-conversation.ts'
import { madeTool, ordersOf, publishedAgent, talkedTo } from './test-agents.ts'

const OPT_IN =
  'opt-in: set CONEXUS_EVAL_REAL_MODEL to a folder and CONEXUS_EVAL_OPENAI_CREDENTIAL to the file of the kept ChatGPT login (step 24.5, criteria 34 and 36)'

const RESPONSES_URL = 'https://chatgpt.com/backend-api/codex/responses'
/** The real calls this case may make: one refused write and one refused read, each with the call that carries the failure back. */
const CALLS = 4

/**
 * Keeps the body of every call to the Codex endpoint and the stream it answers, and no header, in
 * `folder/raw/`, numbered in the order made; a fifth call fails before it is sent.
 */
function recording(folder: string) {
  const real = globalThis.fetch
  const raw = join(folder, 'raw')
  mkdirSync(raw, { recursive: true })
  let made = 0
  globalThis.fetch = async (input, init) => {
    if (String(input instanceof Request ? input.url : input) !== RESPONSES_URL) {
      return real(input, init)
    }
    made += 1
    if (made > CALLS) throw new Error(`The case allows ${CALLS} real calls.`)
    writeFileSync(join(raw, `${made}.request.json`), String(init?.body))
    const response = await real(input, init)
    if (!response.ok) throw new Error(`The endpoint answered ${response.status}.`)
    writeFileSync(join(raw, `${made}.sse`), await response.clone().text())
    return response
  }
  return () => {
    globalThis.fetch = real
    return made
  }
}

test('a recusa chega ao OpenAI de verdade: grava a escrita recusada e a leitura recusada, cada uma com o pedido que leva a falha (34, 36)', {
  timeout: 600_000,
}, async (t) => {
  if (REAL_MODEL === undefined || OPENAI_LOGIN === undefined) {
    t.skip(OPT_IN)
    return
  }
  const on = await subscribed(t, REAL_MODEL, 'openai')
  const stop = recording(REAL_MODEL)
  t.after(() => {
    stop()
  })
  const project = `${on.company}/projects/${on.projectId}`
  const agents = `${project}/agents`
  const write = await madeTool(on.hub, on.ana, `${project}/tools`, {
    slug: 'lancar_pedido',
    connectionId: on.matriz,
    operation: 'lancarPedido',
    description: 'Lança um pedido de venda da empresa 1.',
    bound: { notaModelo: 12, codigoLocalEstoque: 1 },
    open: ['codigoCliente', 'itens'],
  })
  const read = await madeTool(on.hub, on.ana, `${project}/tools`, ordersOf(String(on.matriz)))
  const rule =
    ' Se uma ferramenta falhar, não tente de novo: diga em uma frase o que ela respondeu.'
  const writer = await publishedAgent(on.hub, on.ana, agents, {
    instructions: `Lance os pedidos que a pessoa pedir.${rule}`,
    connections: [on.matriz],
    tools: [write.latest.id],
    approvals: { [write.id]: 'AUTO' },
  })
  const reader = await publishedAgent(on.hub, on.ana, agents, {
    instructions: `Responda sobre os pedidos da empresa.${rule}`,
    connections: [on.matriz],
    tools: [read.latest.id],
  })

  async function turn(agentId: string, content: string) {
    const url = await talkedTo(on.hub, on.ana, agents, agentId)
    const stream = await streamOf(on.hub, on.ana, url)
    t.after(() => stream.close())
    assert.equal((await sent(on.hub, on.ana, url, content)).statusCode, 200)
    const events = await stream.turn()
    assert.equal(
      endOf(events),
      'complete',
      JSON.stringify(events.filter((e) => e.type === 'error')),
    )
    return events.filter((event) => event.type === 'tool_end')
  }

  const written = await turn(
    writer.id,
    'Lance um pedido para o cliente 1: 1 unidade do produto 999 a R$ 10,00.',
  )
  assert.equal(Reflect.get(written[0] ?? {}, 'isError'), true, 'the write was refused')
  on.sankhya.switches.refuse.add('pedidos')
  const asked = await turn(reader.id, 'Quais os pedidos de 1 de setembro de 2025?')
  assert.equal(Reflect.get(asked[0] ?? {}, 'isError'), true, 'the read was refused')
  assert.equal(stop(), CALLS, 'two turns, two calls each')
})

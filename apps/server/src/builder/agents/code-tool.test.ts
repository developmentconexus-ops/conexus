import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { APP_CALL_LIMITS } from '@conexus/app-contract'
import { ToolCall, toolWorkerOf } from '@conexus/hub-api'
import type { Hub } from '../../hub/identity/test-hub.ts'
import { toolsAt } from '../../platform/test-cloudflare.ts'
import { talking } from '../assistant/test-assistant.ts'
import { endOf, stopped } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import {
  agentsOn,
  madeTool,
  ordersOf,
  publishedAgent,
  savedCodeTool,
  talkedTo,
} from './test-agents.ts'

const SALES = 'tool_vendas_do_mes'
const ORDERS = 'tool_pedidos_matriz'

/**
 * The tools' host as the dispatcher serves it, over HTTP: past the Hub's service token, a version
 * whose Worker the namespace double holds reads `pedidos` through the Hub's door with the call's
 * key and answers how many rows came; one it does not hold is `MISSING`.
 */
/** One read through the Hub's door for the tools, as the edge's `data.read` makes it. */
function readThroughDoor(hub: Hub, toolVersionId: string, call: string) {
  return hub.edge.inject({
    method: 'POST',
    url: '/api/tool-connector-calls',
    headers: { 'content-type': 'application/json' },
    payload: JSON.stringify({
      toolVersionId,
      call,
      operation: 'pedidos',
      input: { codigoEmpresa: 1, page: 1 },
      deadlineMs: APP_CALL_LIMITS.callDeadlineMs,
    }),
  })
}

async function edgeDouble(t: TestContext, holder: { hub?: Hub }) {
  const seen: { worker: string; input: unknown }[] = []
  const keys: string[] = []
  const server = createServer(async (request, response) => {
    const hub = holder.hub
    assert.ok(hub)
    const { clientId, clientSecret } = hub.config.toolsAccess
    const passed =
      request.headers['cf-access-client-id'] === clientId.reveal() &&
      request.headers['cf-access-client-secret'] === clientSecret.reveal()
    if (!passed) return response.writeHead(403).end()
    const toolVersionId = String(request.url).slice(1)
    const worker = `t-${toolVersionId}`
    let text = ''
    for await (const chunk of request) text += chunk
    const body = ToolCall.parse(JSON.parse(text))
    seen.push({ worker, input: body.input })
    keys.push(body.call)
    function reply(answer: object) {
      response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(answer))
    }
    if (!hub.tools.workers().includes(worker)) return reply({ kind: 'MISSING' })
    const read = await readThroughDoor(hub, toolVersionId, body.call)
    const answered = Object(read.json())
    if (answered.kind !== 'OK') return reply({ kind: 'FAILED', reason: answered.kind })
    return reply({ kind: 'OK', value: { total: Object(answered.value).linhas.length } })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => server.close())
  const address = server.address()
  assert.ok(address !== null && typeof address === 'object')
  return { origin: `http://127.0.0.1:${address.port}`, seen, keys }
}

/**
 * The Assistant's test company with the edge double at the tools' host, a saved tool on the
 * Matriz written as the Construtor saves it, and a published agent that holds it beside the
 * connector tool of the Matriz's orders.
 */
async function agentWithCode(t: TestContext, model: Parameters<typeof agentsOn>[1]) {
  const holder: { hub?: Hub } = {}
  const edge = await edgeDouble(t, holder)
  const on = await agentsOn(t, model, (config) => ({
    ...config,
    toolsOrigin: toolsAt(edge.origin),
  }))
  holder.hub = on.hub
  const saved = await savedCodeTool(on)
  const orders = await madeTool(on.hub, on.ana, on.tools, ordersOf(on.matriz))
  const agent = await publishedAgent(on.hub, on.ana, on.agents, {
    instructions: 'Responda sobre as vendas.',
    tools: [saved.latest.id, orders.latest.id],
  })
  const url = await talkedTo(on.hub, on.ana, on.agents, agent.id)
  const conversation = await talking(t, on.hub, on.ana, url)
  return { ...on, edge, saved, conversation, url, worker: toolWorkerOf(saved.latest.id) }
}

/** The tool results the model received in its last step. */
function heard(on: { calls: { texts: string[] }[] }) {
  return on.calls.at(-1)?.texts.join('\n') ?? ''
}

test('a ferramenta salva sobe ao gravar como t-<versão>, com só o módulo, e o agente recebe a conta que a borda fez pela porta do Hub', async (t) => {
  const on = await agentWithCode(t, [[tool(SALES, { mes: '2026-09' })], []])
  const upload = on.hub.tools.upload(on.worker)
  assert.ok(upload, 'uploaded when the version was written')
  assert.deepEqual(upload.tags, [`company-${on.companyId}`, `tool-${on.saved.id}`, 'kind-tool'])
  assert.equal(upload.cpuMs, APP_CALL_LIMITS.cpuMs)
  assert.deepEqual(
    upload.files.map((file) => file.path),
    ['module.js'],
  )
  assert.deepEqual(on.hub.cloudflare.workers(), [], 'nothing in the apps’ namespace')

  assert.equal(endOf(await on.conversation.say('Quanto vendemos em setembro?')), 'complete')
  assert.deepEqual(on.edge.seen, [{ worker: on.worker, input: { mes: '2026-09' } }])
  assert.match(heard(on), /"kind":"OK"/)
  assert.match(heard(on), /"total":\d+/)
  assert.equal(on.reads.length, 1, 'the tool’s read counted in the turn’s calls')

  const [key] = on.edge.keys
  assert.ok(key)
  const late = await readThroughDoor(on.hub, on.saved.latest.id, key)
  assert.deepEqual(late.json(), { kind: 'NOT_DECLARED' }, 'the call’s key closed with its call')
  assert.equal(on.reads.length, 1)
})

test('o Worker que sumiu sobe de novo do módulo gravado e responde; com a Cloudflare fora, TOOL_UNAVAILABLE, e a ferramenta de conector do mesmo agente continua', async (t) => {
  const asked = { page: 1, dataNegociacaoInicio: '01/11/2026' }
  const on = await agentWithCode(t, [
    [tool(SALES, { mes: '2026-09' })],
    [],
    [tool(SALES, { mes: '2026-10' }), tool(ORDERS, asked)],
    [],
  ])
  await on.hub.tools.cloudflare.remove(on.worker)
  assert.equal(endOf(await on.conversation.say('E setembro?')), 'complete')
  assert.ok(on.hub.tools.workers().includes(on.worker), 'uploaded again from the stored module')
  assert.match(heard(on), /"total":\d+/)

  await on.hub.tools.cloudflare.remove(on.worker)
  on.hub.tools.script('upload', 'NO_ANSWER')
  assert.equal(endOf(await on.conversation.say('E outubro, e os pedidos?')), 'complete')
  const last = heard(on)
  assert.match(last, /TOOL_UNAVAILABLE/)
  assert.match(last, /"kind":"OK"/, 'the connector tool answered in the same step')
  assert.ok(
    on.hub.lines.some((line) => line.message === 'TOOL_CALL_UNAVAILABLE'),
    'the unavailable call is in the log',
  )
})

test('o turno parado enquanto o Worker sobe de novo solta a subida: o sinal do turno chega até a Cloudflare', async (t) => {
  const on = await agentWithCode(t, [[tool(SALES, { mes: '2026-09' })], []])
  await on.hub.tools.cloudflare.remove(on.worker)
  const held = on.hub.tools.holdUpload()
  const turn = on.conversation.say('E setembro?')
  await held.arrived
  assert.equal((await stopped(on.hub, on.ana, on.url)).statusCode, 200)
  const patience = new Promise<string>((resolve) => setTimeout(resolve, 3000, 'STILL_WAITING'))
  assert.equal(await Promise.race([held.ended, patience]), 'ABORTED', 'the upload kept waiting')
  assert.equal(endOf(await turn), 'aborted')
  assert.deepEqual(on.hub.tools.workers(), [], 'the stopped upload left nothing in the namespace')
})

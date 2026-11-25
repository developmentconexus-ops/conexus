import assert from 'node:assert/strict'
import { test } from 'node:test'
import { agentsOn, publishedAgent, talkedTo } from '../../builder/agents/test-agents.ts'
import { created } from '../../builder/assistant/test-assistant.ts'
import { opened } from '../../builder/construtor/test-construtor.ts'
import { CARLA, call, memberOn } from '../../hub/identity/test-hub.ts'
import { MODEL, started } from '../routes/test-conversation.ts'
import { printedOf } from '../routes/test-research.ts'

// In the order the removal releases them today.
const RELEASED = [
  'ASSISTANT_CONVERSATIONS_RELEASED',
  'AGENT_CONVERSATIONS_RELEASED',
  'CONSTRUTOR_CONVERSATIONS_RELEASED',
]

function idOf(url: string): string {
  return url.slice(url.lastIndexOf('/') + 1)
}

test('soltar as conversas: tirar uma pessoa com uma conversa de cada tipo dá a linha de cada tipo, com a contagem', async (t) => {
  const on = await agentsOn(t)
  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const agent = await publishedAgent(on.hub, on.ana, on.agents, { instructions: 'Responda.' })
  await created(on.hub, carla, on.assistant, { connections: [] })
  await opened({ ...on, ana: carla })
  await talkedTo(on.hub, carla, on.agents, agent.id)
  const removed = await call(on.hub, on.ana, 'DELETE', `${on.company}/members/${carla.id}`)
  assert.equal(removed.statusCode, 204, removed.body)
  assert.deepEqual(
    on.lines.filter((line) => RELEASED.includes(line.message)),
    RELEASED.map((message) => ({ message, fields: { companyId: on.companyId, count: 1 } })),
  )
})

test('apagar um agente varre as conversas dele: AGENT_CONVERSATIONS_SWEPT com a contagem, antes e depois da remoção', async (t) => {
  const on = await agentsOn(t)
  const agent = await publishedAgent(on.hub, on.ana, on.agents, { instructions: 'Responda.' })
  await talkedTo(on.hub, on.ana, on.agents, agent.id)
  const gone = await call(on.hub, on.ana, 'DELETE', `${on.agents}/${agent.id}`)
  assert.equal(gone.statusCode, 204, gone.body)
  const fields = { companyId: on.companyId, agentId: agent.id }
  assert.deepEqual(
    on.lines.filter((line) => line.message === 'AGENT_CONVERSATIONS_SWEPT'),
    [
      { message: 'AGENT_CONVERSATIONS_SWEPT', fields: { ...fields, count: 1 } },
      { message: 'AGENT_CONVERSATIONS_SWEPT', fields: { ...fields, count: 0 } },
    ],
  )
})

test('trocar o modelo de uma conversa do Builder, do Assistente e do Construtor: a linha de cada um, com os campos', async (t) => {
  const printed = printedOf(t)
  const on = await agentsOn(t, [], (config) => ({ ...config, logLevel: 'info' }))
  const builder = `${on.conversations}/${await started(on.hub, on.ana, on.conversations)}`
  const assistant = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const construtor = await opened(on)
  const choice = { model: MODEL, effort: 'off' }
  for (const url of [builder, assistant, construtor]) {
    const set = await call(on.hub, on.ana, 'PUT', `${url}/model`, choice)
    assert.equal(set.statusCode, 200, set.body)
  }
  // The Builder's line goes through the request's logger, which prints it.
  const ofBuilder = printed
    .flatMap((chunk) => chunk.split('\n'))
    .flatMap((text) => (text.includes('"CONVERSATION_MODEL_SET"') ? [JSON.parse(text)] : []))
  assert.equal(ofBuilder.length, 1)
  assert.deepEqual(
    [ofBuilder[0]?.msg, ofBuilder[0]?.companyId, ofBuilder[0]?.conversationId],
    ['CONVERSATION_MODEL_SET', on.companyId, idOf(builder)],
  )
  const lines = on.lines.filter((line) => line.message.endsWith('_MODEL_SET'))
  assert.deepEqual(
    lines.map((line) => line.message),
    ['ASSISTANT_MODEL_SET', 'CONSTRUTOR_MODEL_SET'],
  )
  for (const [line, url] of [
    [lines[0], assistant],
    [lines[1], construtor],
  ] as const) {
    const traceId = String(line?.fields.traceId)
    assert.match(traceId, /\S/)
    assert.deepEqual(line?.fields, { companyId: on.companyId, traceId, conversationId: idOf(url) })
  }
})

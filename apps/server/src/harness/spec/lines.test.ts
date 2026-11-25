import assert from 'node:assert/strict'
import { test } from 'node:test'
import { opened } from '../../agents/agent-builder/test-construtor.ts'
import { created } from '../../agents/assistant/test-assistant.ts'
import { agentsOn, publishedAgent, talkedTo } from '../../agents/saved-agent/test-agents.ts'
import { CARLA, call, memberOn, post } from '../../hub/identity/test-hub.ts'
import { MODEL, sessionUrl, started } from '../routes/test-conversation.ts'
import { switched } from '../routes/test-questions.ts'

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

test('trocar o modelo de uma conversa do Builder, do Assistente e do Construtor: a linha de cada um, com os campos, só depois do ok do Mastra', async (t) => {
  const on = await agentsOn(t)
  const builder = `${on.conversations}/${await started(on.hub, on.ana, on.conversations)}`
  const assistant = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const construtor = await opened(on)
  const urls = [builder, assistant, construtor]
  function named() {
    return on.lines.filter((line) => line.message.endsWith('_MODEL_SET'))
  }

  for (const url of urls) {
    for (const choice of [
      { model: 'openai/gpt-5.4', effort: 'off' },
      { model: 'nada/nenhum', effort: 'off' },
      { model: MODEL, effort: 'xhigh' },
    ]) {
      assert.equal((await switched(on.hub, on.ana, url, choice)).statusCode, 422)
    }
    const malformed = await post(on.hub, on.ana, `${sessionUrl(url)}/model`, { modelId: MODEL })
    assert.equal(malformed.statusCode, 400)
  }
  assert.deepEqual(named(), [], 'a refusal writes no line')

  for (const url of urls) {
    const set = await switched(on.hub, on.ana, url, { model: MODEL, effort: 'off' })
    assert.equal(set.statusCode, 200, set.body)
  }
  const lines = named()
  assert.deepEqual(
    lines.map((line) => line.message),
    ['CONVERSATION_MODEL_SET', 'ASSISTANT_MODEL_SET', 'CONSTRUTOR_MODEL_SET'],
  )
  for (const [index, line] of lines.entries()) {
    const traceId = String(line.fields.traceId)
    assert.match(traceId, /\S/)
    const conversationId = idOf(urls[index] ?? '')
    assert.deepEqual(line.fields, { companyId: on.companyId, traceId, conversationId })
  }
})

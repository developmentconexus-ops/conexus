import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  AGENTS_CONTROLLER,
  ASSISTANT_CONTROLLER,
  BUILDER_CONTROLLER,
  CONSTRUTOR_CONTROLLER,
} from '@conexus/hub-api'
import { opened } from '../../agents/agent-builder/test-construtor.ts'
import { created } from '../../agents/assistant/test-assistant.ts'
import { agentsOn, publishedAgent, talkedTo } from '../../agents/saved-agent/test-agents.ts'
import type { Hub } from '../../hub/identity/test-hub.ts'
import { CARLA, call, codeOf, memberOn } from '../../hub/identity/test-hub.ts'
import { hubBeside, sessionUrl, started } from './test-conversation.ts'
import { renamed } from './test-questions.ts'

// Criterion 25 of "Uma sala e os nomes certos" (U13): Renomear on Mastra's own route, behind the guard.

function idOf(url: string): string {
  return url.slice(url.lastIndexOf('/') + 1)
}

async function stored(hub: Hub, url: string) {
  const found = await hub.test.mastraPool.query(
    'select title, metadata from mastra.mastra_threads where id = $1',
    [idOf(url)],
  )
  const row = Object(found.rows[0])
  return { title: String(row.title), metadata: Object(row.metadata) }
}

async function conversations(t: Parameters<typeof agentsOn>[0]) {
  const on = await agentsOn(t)
  const agent = await publishedAgent(on.hub, on.ana, on.agents, { instructions: 'Responda.' })
  const urls = {
    [BUILDER_CONTROLLER]: `${on.conversations}/${await started(on.hub, on.ana, on.conversations)}`,
    [ASSISTANT_CONTROLLER]: await created(on.hub, on.ana, on.assistant, { connections: [] }),
    [CONSTRUTOR_CONTROLLER]: await opened(on),
    [AGENTS_CONTROLLER]: await talkedTo(on.hub, on.ana, on.agents, agent.id),
  }
  return { on, urls }
}

test('renomear nos quatro agentes: grava o título aparado e fixo, as marcas da conversa seguem, e a linha leva a conversa e o agente, nunca o título', async (t) => {
  const { on, urls } = await conversations(t)
  for (const [agent, url] of Object.entries(urls)) {
    const before = await stored(on.hub, url)
    const done = await renamed(on.hub, on.ana, url, '  Pedidos de outubro  ')
    assert.equal(done.statusCode, 200, done.body)
    assert.deepEqual(done.json(), { ok: true })
    const after = await stored(on.hub, url)
    assert.equal(after.title, 'Pedidos de outubro', agent)
    assert.equal(after.metadata.titlePinned, true, agent)
    for (const key of Object.keys(before.metadata)) {
      assert.deepEqual(after.metadata[key], before.metadata[key], `${agent}: ${key}`)
    }
  }
  const lines = on.lines.filter((line) => line.message === 'CONVERSATION_RENAMED')
  assert.deepEqual(
    lines.map((line) => line.fields.agent),
    Object.keys(urls),
  )
  for (const [line, url] of lines.map((one, at) => [one, Object.values(urls)[at] ?? ''] as const)) {
    assert.equal(line.fields.companyId, on.companyId)
    assert.equal(line.fields.conversationId, idOf(url))
    assert.equal(typeof line.fields.traceId, 'string')
    assert.deepEqual(Object.keys(line.fields).sort(), [
      'agent',
      'companyId',
      'conversationId',
      'traceId',
    ])
  }
  assert.doesNotMatch(JSON.stringify(on.lines), /Pedidos de outubro/)
})

test('renomear: um título vazio, só de espaços, longo demais, de outro tipo ou com campo a mais é REQUEST_MALFORMED; outra pessoa e um threadId que não é o da sessão dão CONVERSATION_NOT_FOUND; nada muda e nenhuma linha sai', async (t) => {
  const { on, urls } = await conversations(t)
  const mine = urls[AGENTS_CONTROLLER]
  const route = `${sessionUrl(mine)}/threads/${idOf(mine)}`
  const before = await stored(on.hub, mine)
  for (const title of ['', '   ', 'a'.repeat(121), 7, null]) {
    const refused = await renamed(on.hub, on.ana, mine, title)
    assert.deepEqual(
      [refused.statusCode, codeOf(refused)],
      [400, 'REQUEST_MALFORMED'],
      String(title),
    )
  }
  for (const body of [{ title: 'Novo', pin: false }, { title: 'Novo', requestContext: {} }, {}]) {
    const refused = await call(on.hub, on.ana, 'PUT', route, body)
    assert.deepEqual([refused.statusCode, codeOf(refused)], [400, 'REQUEST_MALFORMED'])
  }
  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const foreign = await renamed(on.hub, carla, mine, 'De outra pessoa')
  assert.deepEqual([foreign.statusCode, codeOf(foreign)], [404, 'CONVERSATION_NOT_FOUND'])
  const elsewhere = await call(
    on.hub,
    on.ana,
    'PUT',
    `${sessionUrl(mine)}/threads/${idOf(urls[ASSISTANT_CONTROLLER])}`,
    {
      title: 'Da outra conversa',
    },
  )
  assert.deepEqual([elsewhere.statusCode, codeOf(elsewhere)], [404, 'CONVERSATION_NOT_FOUND'])
  const crossed = route.replace('/agent-controller/agents/', '/agent-controller/assistant/')
  const other = await call(on.hub, on.ana, 'PUT', crossed, { title: 'Pelo outro controlador' })
  assert.deepEqual([other.statusCode, codeOf(other)], [404, 'CONVERSATION_NOT_FOUND'])
  assert.deepEqual(await stored(on.hub, mine), before)
  assert.equal((await stored(on.hub, urls[ASSISTANT_CONTROLLER])).title.includes('outra'), false)
  assert.deepEqual(
    on.lines.filter((line) => line.message === 'CONVERSATION_RENAMED'),
    [],
  )
})

test('renomear: a rota PATCH do Assistente não existe mais', async (t) => {
  const { on, urls } = await conversations(t)
  const gone = await call(on.hub, on.ana, 'PATCH', urls[ASSISTANT_CONTROLLER], { title: 'Pedidos' })
  assert.equal(gone.statusCode, 404)
})

test('renomear depois de um reinício do Hub, sem a sessão na memória: grava igual, e as marcas da conversa seguem', async (t) => {
  const { on, urls } = await conversations(t)
  const restarted = await hubBeside(t, on.hub)
  for (const url of Object.values(urls)) {
    const before = await stored(restarted, url)
    const done = await renamed(restarted, on.ana, url, 'Depois do reinício')
    assert.equal(done.statusCode, 200, done.body)
    const after = await stored(restarted, url)
    assert.equal(after.title, 'Depois do reinício')
    for (const key of Object.keys(before.metadata)) {
      assert.deepEqual(after.metadata[key], before.metadata[key], key)
    }
  }
})

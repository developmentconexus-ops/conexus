import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { DATA_TOOL } from '@conexus/hub-api'
import { opened } from '../../../agents/agent-builder/test-construtor.ts'
import { created, said, talking } from '../../../agents/assistant/test-assistant.ts'
import {
  agentsOn,
  madeTool,
  ordersOf,
  publishedAgent,
  talkedTo,
} from '../../../agents/saved-agent/test-agents.ts'
import { memberOn } from '../../../hub/identity/test-hub.ts'
import type { Sent } from '../../../platform/test-anthropic.ts'
import { started } from '../../routes/test-conversation.ts'
import { tool } from '../../routes/test-questions.ts'

const MEMBER = { name: 'Bruno Lima', email: 'bruno@example.test' }
const DESCRIBE = tool(DATA_TOOL.describe, {})
const LISTING = [[DESCRIBE], [said('Pronto.')]]

type On = Awaited<ReturnType<typeof agentsOn>>

/** The three agents' conversations of the owner, each ready to take a turn; the Assistant's is the Início's. */
async function conversationsOf(t: TestContext, on: On) {
  const assistant = await talking(
    t,
    on.hub,
    on.ana,
    await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] }),
  )
  const builder = await talking(
    t,
    on.hub,
    on.ana,
    `${on.conversations}/${await started(on.hub, on.ana, on.conversations)}`,
  )
  const agent = await publishedAgent(on.hub, on.ana, on.agents, {
    instructions: 'Responda sobre os dados.',
    connections: [on.matriz],
    tools: [(await madeTool(on.hub, on.ana, on.tools, ordersOf(on.matriz))).latest.id],
  })
  const saved = await talking(
    t,
    on.hub,
    on.ana,
    await talkedTo(on.hub, on.ana, on.agents, agent.id),
  )
  return { assistant, builder, saved }
}

/** The first call the model received for a turn of `conversation`. */
async function firstCall(on: On, conversation: { say(text: string): Promise<unknown> }) {
  const before = on.calls.length
  await conversation.say('Quanto vendemos?')
  const first = on.calls[before]
  assert.ok(first, 'the turn reached the model')
  return first
}

/** What the data tool returned in the turn that ended at `calls.at(-1)`. */
function resultOf(on: On): { kind: string; systems: { name: string }[] } {
  const text = on.calls.at(-1)?.toolResults.at(-1)?.text
  assert.ok(text, 'the model read a tool result')
  return JSON.parse(text)
}

function offered(call: Sent) {
  return Object.fromEntries(
    Object.values(DATA_TOOL).map((name) => [
      name,
      { description: call.descriptions[name], schema: call.schemas[name] },
    ]),
  )
}

test('o Assistente, o Builder e o agente salvo oferecem data_describe e data_query com a mesma descrição e o mesmo esquema', async (t) => {
  const on = await agentsOn(t, [])
  const { assistant, builder, saved } = await conversationsOf(t, on)
  const [first, ...others] = [
    await firstCall(on, assistant),
    await firstCall(on, builder),
    await firstCall(on, saved),
  ]
  for (const name of Object.values(DATA_TOOL)) {
    assert.ok(first.tools.includes(name), `${name} is offered`)
    assert.ok(first.descriptions[name], `${name} has a description`)
  }
  for (const other of others) assert.deepEqual(offered(other), offered(first))
})

test('o Construtor não oferece data_describe nem data_query', async (t) => {
  const on = await agentsOn(t, [])
  const construtor = await talking(t, on.hub, on.ana, await opened(on))
  const call = await firstCall(on, construtor)
  assert.ok(call.tools.length > 0, 'the Construtor reached the model with tools')
  for (const name of Object.values(DATA_TOOL)) assert.ok(!call.tools.includes(name), name)
})

test('a ordem do agente está nas instruções dos três, sem sync nem cópia', async (t) => {
  const on = await agentsOn(t, [])
  const { assistant, builder, saved } = await conversationsOf(t, on)
  for (const conversation of [assistant, builder, saved]) {
    const call = await firstCall(on, conversation)
    assert.ok(call.system.includes('## Company data'))
    assert.ok(call.system.includes('answer NOT_IN_CATALOG'))
    assert.doesNotMatch(call.system, /\bsync\b|released copy/i)
  }
})

async function describedBy(on: On, conversation: Awaited<ReturnType<typeof talking>>) {
  assert.equal(
    (await conversation.say('Quais sistemas eu leio?')) !== undefined,
    true,
    'the turn ended',
  )
  const result = resultOf(on)
  assert.equal(result.kind, 'CATALOG')
  assert.equal(Object(result).tables, undefined)
  return result.systems.map((each) => each.name).sort()
}

test('data_describe responde os sistemas do lugar: o Início, o Projeto e o agente salvo listam a Matriz e nunca a Filial', async (t) => {
  const on = await agentsOn(t, [...LISTING, ...LISTING, ...LISTING])
  const { assistant, builder, saved } = await conversationsOf(t, on)
  assert.deepEqual(await describedBy(on, assistant), ['Matriz'])
  assert.deepEqual(await describedBy(on, builder), ['Matriz'])
  assert.deepEqual(await describedBy(on, saved), ['Matriz'])
  assert.ok(!on.calls.at(-1)?.toolResults.at(-1)?.text.includes('Filial'), 'the Filial never shows')
})

test('o agente salvo usado por um membro lê os sistemas do Projeto, como o autor', async (t) => {
  const on = await agentsOn(t, [...LISTING, ...LISTING])
  const agent = await publishedAgent(on.hub, on.ana, on.agents, {
    instructions: 'Responda sobre os dados.',
    connections: [on.matriz],
    tools: [(await madeTool(on.hub, on.ana, on.tools, ordersOf(on.matriz))).latest.id],
  })
  const member = await memberOn(on.hub, on.companyId, MEMBER, 'admin')
  const byAuthor = await talking(
    t,
    on.hub,
    on.ana,
    await talkedTo(on.hub, on.ana, on.agents, agent.id),
  )
  const byMember = await talking(
    t,
    on.hub,
    member,
    await talkedTo(on.hub, member, on.agents, agent.id),
  )
  const author = await describedBy(on, byAuthor)
  assert.deepEqual(await describedBy(on, byMember), author)
  assert.deepEqual(author, ['Matriz'])
})

test('sem cópia: data_query, no Início, volta ao modelo como NOT_IN_CATALOG depois da lista dos sistemas', async (t) => {
  const on = await agentsOn(t, [
    [DESCRIBE],
    [tool(DATA_TOOL.query, { sql: 'select count(*) as n from sync.sankhya_vendas' })],
    [said('Pronto.')],
  ])
  const { assistant } = await conversationsOf(t, on)
  await assistant.say('Quanto vendemos?')
  const [described, queried] = on.calls.at(-1)?.toolResults.map(({ text }) => text) ?? []
  assert.deepEqual(
    JSON.parse(String(described)).systems.map((each: { name: string }) => each.name),
    ['Matriz'],
  )
  assert.equal(JSON.parse(String(queried)).kind, 'NOT_IN_CATALOG')
})

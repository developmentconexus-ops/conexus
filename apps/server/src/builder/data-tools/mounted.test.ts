import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { DATA_TOOL } from '@conexus/hub-api'
import { releasing } from '../../hub/copies/test-released.ts'
import { memberOn } from '../../hub/identity/test-hub.ts'
import type { Sent } from '../../platform/test-anthropic.ts'
import { agentsOn, publishedAgent, talkedTo } from '../agents/test-agents.ts'
import { created, said, talking } from '../assistant/test-assistant.ts'
import { opened } from '../construtor/test-construtor.ts'
import { started } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'

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
function resultOf(on: On): { kind: string; tables: { name: string }[] } {
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

test('a ordem do agente está nas instruções dos três, também num Projeto sem cópia', async (t) => {
  const on = await agentsOn(t, [])
  const { assistant, builder, saved } = await conversationsOf(t, on)
  for (const conversation of [assistant, builder, saved]) {
    const call = await firstCall(on, conversation)
    assert.ok(call.system.includes('## Company data'))
    assert.ok(call.system.includes('A table read is never replaced by a live read of the system.'))
  }
})

test('o bloco de dados do Builder não manda ver linhas com app_data_read', async (t) => {
  const on = await agentsOn(t, [])
  await releasing(t, on, { connectionId: on.matriz }, ['vendas', 'vendedores'], ['vendas'])
  const { builder } = await conversationsOf(t, on)
  const { system } = await firstCall(on, builder)
  assert.ok(system.includes('## Data'))
  assert.ok(system.includes('see the columns and a few rows of a copy with `data_describe`'))
  assert.ok(!system.includes('see a few rows with `app_data_read`'))
})

async function describedBy(on: On, conversation: Awaited<ReturnType<typeof talking>>) {
  assert.equal(
    (await conversation.say('Quais tabelas eu leio?')) !== undefined,
    true,
    'the turn ended',
  )
  const result = resultOf(on)
  assert.equal(result.kind, 'CATALOG')
  return result.tables.map((each) => each.name).sort()
}

test('data_describe responde o catálogo do lugar: o Início lista a cópia da empresa, o Projeto só a liberada', async (t) => {
  const on = await agentsOn(t, [...LISTING, ...LISTING, ...LISTING])
  await releasing(t, on, { connectionId: on.matriz }, ['vendas', 'vendedores'], ['vendas'])
  const { assistant, builder, saved } = await conversationsOf(t, on)
  assert.deepEqual(await describedBy(on, assistant), ['sankhya_vendas', 'sankhya_vendedores'])
  assert.deepEqual(await describedBy(on, builder), ['sankhya_vendas'])
  assert.deepEqual(await describedBy(on, saved), ['sankhya_vendas'])
})

test('o agente salvo usado por um membro lê o catálogo do Projeto, como o autor', async (t) => {
  const on = await agentsOn(t, [...LISTING, ...LISTING])
  await releasing(t, on, { connectionId: on.matriz }, ['vendas', 'vendedores'], ['vendas'])
  const agent = await publishedAgent(on.hub, on.ana, on.agents, {
    instructions: 'Responda sobre os dados.',
    connections: [on.matriz],
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
  assert.deepEqual(author, ['sankhya_vendas'])
})

test('uma conexão à espera de nova autorização tira a sua tabela da lista e não recusa o catálogo', async (t) => {
  const on = await agentsOn(t, LISTING)
  await releasing(t, on, { connectionId: on.matriz }, ['vendas'])
  const { assistant } = await conversationsOf(t, on)
  await on.hub.test.asOwner(
    "update connectors.connection set state = 'NEEDS_REAUTH' where id = $1",
    [on.matriz],
  )
  assert.deepEqual(await describedBy(on, assistant), [])
  assert.equal(resultOf(on).kind, 'CATALOG')
})

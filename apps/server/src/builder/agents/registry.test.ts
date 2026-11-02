import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { AgentId, CompanyId, PersonId, ProjectId } from '@conexus/hub-api'
import type { Hub } from '../../hub/identity/test-hub.ts'
import { CARLA, call, codeOf, memberOn, post } from '../../hub/identity/test-hub.ts'
import type { Scalar } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { talking } from '../assistant/test-assistant.ts'
import { endOf, hubBeside, KEY, MODEL, sent } from '../conversation/test-conversation.ts'
import { agentKey, agentRunContext } from './agent.ts'
import {
  agentsOn,
  drafted,
  publishedAgent,
  publishedNow,
  talkedTo,
} from './test-agents.ts'

const CLOCK = { schedulerTickMs: 200, turnMs: 60_000 }
const HAIKU = 'anthropic/claude-haiku-4-5'

type Line = { fields: Record<string, Scalar>; message: string }

/** A log that keeps its lines, for a second Hub's start and turns. */
function recording() {
  const lines: Line[] = []
  const keep = (fields: Record<string, Scalar>, message: string) => {
    lines.push({ fields, message })
  }
  return { lines, log: { info: keep, error: keep } }
}

/** The Hub's registered agent of `agentId`, as the registry keeps it. */
function registered(hub: Hub, agentId: string) {
  const agents: Record<string, ReturnType<Hub['mastra']['getAgentById']> | undefined> =
    hub.mastra.listAgents()
  return agents[agentKey(AgentId.parse(agentId))]
}

/** A Hub on the short tick, Ana's published agent on it. */
async function onePublished(t: TestContext, body: object = {}) {
  const on = await agentsOn(t, [], (config) => ({ ...config, automationClock: CLOCK }))
  const agent = await publishedAgent(on.hub, on.ana, on.agents, {
    instructions: 'Responda sobre as vendas.',
    model: MODEL,
    ...body,
  })
  return { ...on, agent }
}

test('ao ligar: todo agente publicado é registrado antes da agenda, a linha da agenda dele fica depois de quatro tiques, e a primeira conversa não registra de novo', async (t) => {
  const on = await onePublished(t)
  await on.hub.mastra.getWorker('scheduler')?.stop()
  const store = await on.hub.mastra.getStorage()?.getStore('schedules')
  assert.ok(store, 'the schedules store')
  const id = randomUUID()
  const now = Date.now()
  await store.createSchedule({
    ...{ id, cron: '0 7 * * *', status: 'active', nextFireAt: now - 1000 },
    target: { type: 'agent', agentId: agentKey(AgentId.parse(on.agent.id)), prompt: 'Oi' },
    ...{ createdAt: now, updatedAt: now },
  })

  const { lines, log } = recording()
  const back = await hubBeside(t, on.hub, log)
  await sleep(4 * CLOCK.schedulerTickMs + 400)
  assert.notEqual(await store.getSchedule(id), null, 'the schedule outlived four ticks')
  const said = lines.map((line) => line.message)
  const hydrated = said.indexOf('AGENTS_HYDRATED')
  assert.ok(hydrated >= 0 && hydrated < said.indexOf('MASTRA_WORKERS_STARTED'), said.join(' '))
  assert.ok(Number(lines[hydrated]?.fields.count) >= 1)

  const url = await talkedTo(back, on.ana, on.agents, on.agent.id)
  const conversation = await talking(t, back, on.ana, url)
  assert.equal(endOf(await conversation.say('Quanto vendemos?')), 'complete')
  const lazy = lines.filter((line) => line.message === 'AGENT_REGISTERED' && line.fields.lazy)
  assert.deepEqual(lazy, [])
})

test('publicar troca: o turno seguinte de uma conversa aberta recebe as instruções, as ferramentas e o modelo da versão ativa; apagar leva a conversa', async (t) => {
  const on = await onePublished(t)
  const url = await talkedTo(on.hub, on.ana, on.agents, on.agent.id)
  const conversation = await talking(t, on.hub, on.ana, url)
  async function asked() {
    assert.equal(endOf(await conversation.say('Quanto vendemos?')), 'complete')
    const call = on.calls.at(-1)
    assert.ok(call)
    return call
  }
  const first = await asked()
  assert.match(first.system, /Responda sobre as vendas\./)
  assert.equal(first.model, 'claude-sonnet-4-6')
  assert.ok(!first.tools.includes('web_fetch'))

  const second = await drafted(on.hub, on.ana, on.agents, on.agent, {
    instructions: 'Responda sobre o estoque.',
    model: HAIKU,
    web: true,
  })
  await publishedNow(on.hub, on.ana, on.agents, second)
  const two = await asked()
  assert.match(two.system, /Responda sobre o estoque\./)
  assert.doesNotMatch(two.system, /Responda sobre as vendas\./)
  assert.equal(two.model, 'claude-haiku-4-5')
  assert.ok(two.tools.includes('web_fetch'))

  const back = await post(on.hub, on.ana, `${on.agents}/${on.agent.id}/versions/1/activate`, {})
  assert.equal(back.statusCode, 200, back.body)
  const one = await asked()
  assert.match(one.system, /Responda sobre as vendas\./)
  assert.equal(one.model, 'claude-sonnet-4-6')

  const key = agentKey(AgentId.parse(on.agent.id))
  assert.equal(registered(on.hub, on.agent.id)?.id, key)
  const gone = await call(on.hub, on.ana, 'DELETE', `${on.agents}/${on.agent.id}`)
  assert.equal(gone.statusCode, 204, gone.body)
  assert.equal(registered(on.hub, on.agent.id), undefined)
  const after = await sent(on.hub, on.ana, url, 'E agora?')
  assert.equal(codeOf(after), 'CONVERSATION_NOT_FOUND')
})

test('roda sozinho: o agente registrado, com o dono no requestContext, chama o modelo da versão pela conta da pessoa; sem conta, MODEL_NO_ACCOUNT', async (t) => {
  // Alone, with no thread: the observational memory reads one, so this version has none.
  const on = await onePublished(t, { memory: { observational: false } })
  const agent = registered(on.hub, on.agent.id)
  assert.ok(agent)
  const scope = {
    companyId: CompanyId.parse(on.companyId),
    projectId: ProjectId.parse(on.projectId),
    personId: PersonId.parse(on.ana.id),
  }
  const run = { kind: 'PUBLISHED', scope, agentId: AgentId.parse(on.agent.id) } as const
  const answered = await agent.generate('Quanto vendemos?', {
    requestContext: agentRunContext(run),
  })
  // `generate` asks without a stream, which the double answers with its title's text.
  assert.equal(answered.text, 'Título')
  const asked = on.anthropic.sent.at(-1)
  assert.equal(asked?.model, 'claude-sonnet-4-6')
  assert.equal(asked?.key, KEY)
  assert.match(asked?.system ?? '', /Responda sobre as vendas\./)

  const gpt = await publishedAgent(on.hub, on.ana, on.agents, {
    instructions: 'Responda.',
    model: 'openai/gpt-5',
    memory: { observational: false },
  })
  const other = registered(on.hub, gpt.id)
  assert.ok(other)
  const refused = other.generate('Oi', {
    requestContext: agentRunContext({ ...run, agentId: AgentId.parse(gpt.id) }),
  })
  await assert.rejects(refused, (error) => error instanceof Failure && error.code === 'MODEL_NO_ACCOUNT')
})

test('o registro atrasado: um agente que falta no registro é registrado pela linha no próximo turno', async (t) => {
  const on = await onePublished(t)
  on.hub.mastra.removeAgent(agentKey(AgentId.parse(on.agent.id)))
  const url = await talkedTo(on.hub, on.ana, on.agents, on.agent.id)
  const conversation = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await conversation.say('Quanto vendemos?')), 'complete')
  assert.match(on.calls.at(-1)?.system ?? '', /Responda sobre as vendas\./)
  const lazy = on.lines.filter((line) => line.message === 'AGENT_REGISTERED' && line.fields.lazy)
  assert.deepEqual(
    lazy.map((line) => line.fields.agentId),
    [on.agent.id],
  )
  assert.equal(registered(on.hub, on.agent.id)?.id, agentKey(AgentId.parse(on.agent.id)))
})

test('sem as chaves dos outros: procurar um agente que falta não imprime as chaves dos outros, só o id pedido', async (t) => {
  const on = await onePublished(t)
  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const theirs = await publishedAgent(on.hub, carla, on.agents, { instructions: 'Outro.' })
  on.hub.mastra.removeAgent(agentKey(AgentId.parse(on.agent.id)))
  const from = on.lines.length
  const url = await talkedTo(on.hub, on.ana, on.agents, on.agent.id)
  const conversation = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await conversation.say('Quanto vendemos?')), 'complete')
  const printed = JSON.stringify(on.lines.slice(from))
  assert.ok(printed.includes(on.agent.id))
  assert.ok(!printed.includes(theirs.id), printed)
})

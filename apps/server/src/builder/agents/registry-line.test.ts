import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { AgentId, CompanyId, ProjectId } from '@conexus/hub-api'
import type { Agent } from '@mastra/core/agent'
import type { Mastra } from '@mastra/core/mastra'
import type { AgentReads } from './public.ts'
import { agentKey, createRegistry } from './public.ts'

type Live = NonNullable<Awaited<ReturnType<AgentReads['liveOf']>>>

const ids = {
  companyId: CompanyId.parse(randomUUID().replaceAll('-', '')),
  projectId: ProjectId.parse(randomUUID().replaceAll('-', '')),
  agentId: AgentId.parse(randomUUID()),
}
const live: Live = Object.assign(Object.create(null), {
  ...ids,
  source: { kind: 'VERSION', number: 1, answeredBy: null },
})

function agentNamed(id: string): Agent {
  return Object.assign(Object.create(null), { id })
}

type Line = { fields: Record<string, unknown>; message: string }

/** A registry over a `Mastra` that only keeps the agents added, and what it logged. */
function registryOver(options: {
  liveOf?: () => Promise<Live | null>
  build?: () => Agent
  publishedAll?: () => Promise<Live[]>
}) {
  const held = new Map<string, Agent>()
  const lines: Line[] = []
  function keep(fields: Record<string, unknown>, message: string) {
    lines.push({ fields, message })
  }
  const mastra: Mastra = Object.assign(Object.create(null), {
    listAgents: () => Object.fromEntries(held),
    removeAgent: (key: string) => held.delete(key),
    addAgent: (agent: Agent, key: string) => held.set(key, agent),
  })
  const registry = createRegistry({
    activeOf: async () => null,
    draftOf: async () => live,
    versionOf: async () => null,
    liveOf: options.liveOf ?? (async () => live),
    publishedAll: options.publishedAll ?? (async () => [live]),
    mastra: () => mastra,
    build: options.build ?? (() => agentNamed('built')),
    log: { info: keep, error: keep },
  })
  return { registry, held, lines }
}

test('remover espera na fila do agente: uma troca em andamento não registra o agente de novo depois que ele foi apagado', async () => {
  let release: () => void = () => undefined
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const on = registryOver({
    liveOf: async () => {
      await gate
      return live
    },
  })
  const replacing = on.registry.replace(ids.agentId, ids.companyId)
  const removing = on.registry.remove(ids.agentId)
  release()
  await Promise.all([replacing, removing])
  assert.equal(on.held.has(agentKey(ids.agentId)), false)
})

test('ao ligar: o erro que não é Failure que impede registrar um agente deixa a causa no registro, e os outros agentes seguem', async () => {
  const other = { ...live, agentId: AgentId.parse(randomUUID()) }
  let built = 0
  const on = registryOver({
    publishedAll: async () => [live, other],
    build: () => {
      built += 1
      if (built === 1) throw new RangeError('boom')
      return agentNamed('built')
    },
  })
  assert.deepEqual(await on.registry.hydrate(), { count: 1 })
  const failed = on.lines.find((line) => line.message === 'AGENT_REGISTER_FAILED')
  assert.ok(failed)
  assert.equal(failed.fields.causes, 'RangeError')
  assert.deepEqual(Object.keys(failed.fields).includes('instructions'), false)
  assert.equal(failed.fields.agentId, ids.agentId)
})

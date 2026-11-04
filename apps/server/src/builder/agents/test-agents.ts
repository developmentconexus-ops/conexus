import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import { call, post } from '../../hub/identity/test-hub.ts'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import { assisting } from '../assistant/test-assistant.ts'

export type ToolVersion = {
  id: string
  number: number
  description: string
  bound: Record<string, unknown>
  open: string[]
}
export type Tool = {
  id: string
  slug: string
  connectionId: string
  operation: string
  description: string
  connectionName: string
  readLabel: string
  effect: string
  latest: { id: string; number: number }
  usedBy: { id: string; name: string }[]
  versions?: ToolVersion[]
}
export type Agent = {
  id: string
  projectId: string
  name: string
  description: string
  state: { kind: 'DRAFT' } | { kind: 'PUBLISHED'; version: number; changed: boolean }
  draft: Record<string, unknown> & { instructions: string; connections: string[] }
  revision: number
  tools: (Omit<Tool, 'usedBy' | 'description' | 'versions'> & { version: ToolVersion })[]
  offered: { connectionId: string; name: string; reads: { operation: string; label: string }[] }[]
  createdBy: { personId: string; name: string } | null
}

/**
 * The Assistant's test company (`assisting`): Matriz given to the Projeto, Filial not, and the
 * addresses of the Projeto's agents and tools.
 */
export async function agentsOn(
  t: TestContext,
  model: Parameters<typeof assisting>[1] = [],
  change?: Parameters<typeof assisting>[3],
) {
  const on = await assisting(t, model, undefined, change)
  const project = `${on.company}/projects/${on.projectId}`
  return {
    ...on,
    agents: `${project}/agents`,
    tools: `${project}/tools`,
    listed: `${on.company}/agents?projectId=${on.projectId}`,
  }
}

export function patch(hub: Hub, person: Person, url: string, body: object) {
  return hub.app.inject({
    method: 'PATCH',
    url,
    headers: { origin: TEST_ORIGIN, 'content-type': 'application/json', cookie: person.cookie },
    payload: JSON.stringify(body),
  })
}

export function agentOf(response: { json(): unknown }): Agent {
  return Object(response.json()).agent
}

export function toolOf(response: { json(): unknown }): Tool {
  return Object(response.json()).tool
}

/** The order reads of one company of the Matriz, its window left to the model. */
export function ordersOf(connectionId: string, change: object = {}) {
  return {
    slug: 'pedidos_matriz',
    connectionId,
    operation: 'pedidos',
    description: 'Os pedidos de venda da empresa 1, por período.',
    bound: { codigoEmpresa: 1 },
    open: ['page', 'dataNegociacaoInicio', 'dataNegociacaoFinal'],
    ...change,
  }
}

/** A new agent of `person`, named `name`. */
export async function madeAgent(hub: Hub, person: Person, url: string, name = 'Vendas do dia') {
  const made = await post(hub, person, url, { name }, randomUUID())
  assert.equal(made.statusCode, 201, made.body)
  return agentOf(made)
}

/** A new tool of the library, saved by `person`. */
export async function madeTool(hub: Hub, person: Person, url: string, body: object) {
  const made = await post(hub, person, url, body, randomUUID())
  assert.equal(made.statusCode, 201, made.body)
  return toolOf(made)
}

/** The draft changed by `body` at its current revision; the agent as it is after. */
export async function drafted(hub: Hub, person: Person, url: string, agent: Agent, body: object) {
  const saved = await patch(hub, person, `${url}/${agent.id}/draft`, {
    revision: agent.revision,
    ...body,
  })
  assert.equal(saved.statusCode, 200, saved.body)
  return agentOf(saved)
}

/** A tool of `companyId` written as its rows, as another company's library holds one. */
export async function plantedTool(hub: Hub, companyId: string, connectionId: string) {
  const toolId = randomUUID()
  const versionId = randomUUID()
  await hub.test.asOwner(
    `insert into builder.tool (id, company_id, connection_id, operation, slug, body_hash)
      values ($1, $2, $3, 'pedidos', 'pedidos_outra', 'plantada')`,
    [toolId, companyId, connectionId],
  )
  const config = { description: 'Os pedidos da outra empresa.', bound: {}, open: ['page'] }
  await hub.test.asOwner(
    `insert into builder.tool_version (id, tool_id, company_id, number, config, body_hash)
      values ($1, $2, $3, 1, $4, 'plantada')`,
    [versionId, toolId, companyId, JSON.stringify(config)],
  )
  return { toolId, versionId }
}

/** The draft published at its current revision; the agent after. */
export async function publishedNow(hub: Hub, person: Person, url: string, agent: Agent) {
  const done = await post(hub, person, `${url}/${agent.id}/publish`, {
    revision: agent.revision,
    message: '',
  })
  assert.equal(done.statusCode, 200, done.body)
  return agentOf(done)
}

/** A new agent of `person`, its draft set by `body`, published as version 1. */
export async function publishedAgent(hub: Hub, person: Person, url: string, body: object) {
  const made = await madeAgent(hub, person, url)
  return publishedNow(hub, person, url, await drafted(hub, person, url, made, body))
}

/**
 * A new conversation of `person` with the agent, `{ draft: true }` the test one; its test address,
 * which `sessionUrl` maps to the agents' controller.
 */
export async function talkedTo(
  hub: Hub,
  person: Person,
  url: string,
  agentId: string,
  body: object = {},
) {
  const made = await post(hub, person, `${url}/${agentId}/conversations`, body, randomUUID())
  assert.equal(made.statusCode, 201, made.body)
  return `${url}/${agentId}/conversations/${String(Object(made.json()).conversation.id)}`
}

/** Another Projeto of the company, named `name`, given `connections`. */
export async function otherProject(
  hub: Hub,
  person: Person,
  company: string,
  connections: string[],
  name = 'Vendas',
) {
  const made = await post(hub, person, `${company}/projects`, { name })
  assert.equal(made.statusCode, 201, made.body)
  const projectId = String(Object(made.json()).project.id)
  for (const connectionId of connections) {
    const given = await call(
      hub,
      person,
      'PUT',
      `${company}/projects/${projectId}/connections/${connectionId}`,
    )
    assert.equal(given.statusCode, 200, given.body)
  }
  return {
    projectId,
    agents: `${company}/projects/${projectId}/agents`,
    tools: `${company}/projects/${projectId}/tools`,
  }
}

import { getAgent, listAgentConversations, listAgentVersions, listTools } from '@conexus/hub-api'
import type { Replies } from './layout-harness.ts'
import { ok } from './layout-harness.ts'
import { companies, PROJECT_ID } from './sweep-replies.ts'

export const COMPANY_ID = '0'.repeat(32)
/** The company page of an owner, with the roles. */
export function rolesReplies(): Replies {
  return {
    ...companies([{ name: 'Empresa Teste', role: 'owner' }], false),
  }
}

const AGENT = '11111111-aaaa-4aaa-8aaa-111111111111'
const CONNECTION = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const BASE = `/api/companies/${COMPANY_ID}/projects/${PROJECT_ID}`
export const AGENT_PATH = `/companies/${COMPANY_ID}/projects/${PROJECT_ID}/agents/${AGENT}`

/** An agent page with the Sankhya offered and selected, nothing marked. */
export function agentReplies(selected: boolean): Replies {
  const draft = {
    name: 'Atendimento',
    description: 'Responde sobre pedidos.',
    instructions: 'Responda sobre pedidos.',
    model: null,
    memory: { observational: false },
    connections: selected ? [CONNECTION] : [],
    web: false,
    appData: false,
    machine: false,
  }
  const reads = [
    { operation: 'pedidos', label: 'Pedidos', summary: 'Os pedidos de venda.', allowed: true },
    {
      operation: 'contasAReceber',
      label: 'Contas a receber',
      summary: 'Os títulos a receber.',
      allowed: false,
    },
    {
      operation: 'consultar',
      label: 'Consulta',
      summary: 'Roda uma consulta SQL de leitura.',
      allowed: true,
    },
  ]
  const detail = {
    id: AGENT,
    projectId: PROJECT_ID,
    ...draft,
    state: { kind: 'DRAFT' as const },
    updatedAt: '2026-11-02T12:00:00.000Z',
    lastRunAt: null,
    draft,
    revision: 2,
    tools: [],
    offered: [
      { connectionId: CONNECTION, connector: 'sankhya', name: 'Matriz', reads, writes: [] },
    ],
    createdBy: null,
  }
  return {
    ...rolesReplies(),
    [`GET ${BASE}/agents/${AGENT}`]: ok(getAgent, { agent: detail }),
    [`GET ${BASE}/agents/${AGENT}/versions`]: ok(listAgentVersions, { versions: [] }),
    [`GET ${BASE}/agents/${AGENT}/conversations`]: ok(listAgentConversations, {
      conversations: [],
    }),
    [`GET ${BASE}/tools`]: ok(listTools, {
      tools: [],
      ready: reads.map((read) => ({
        connectionId: CONNECTION,
        operation: read.operation,
        label: read.label,
        summary: read.summary,
        slug: `${read.operation.toLowerCase()}_aa`,
      })),
    }),
  }
}

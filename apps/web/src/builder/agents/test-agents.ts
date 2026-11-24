import type { AgentDetail, AgentVersionSummary, ToolSummary } from '@conexus/hub-api'
import {
  AgentId,
  ConnectionId,
  ConversationId,
  OperationId,
  ToolId,
  ToolVersionId,
} from '@conexus/hub-api'
import { COMPANY } from '../../platform/fixtures.ts'
import { PEDIDOS } from '../../platform/test-hub.tsx'

export const AGENT = AgentId.parse('11111111-aaaa-4aaa-8aaa-111111111111')
export const OTHER_AGENT = AgentId.parse('22222222-aaaa-4aaa-8aaa-222222222222')
export const THIRD_AGENT = AgentId.parse('99999999-aaaa-4aaa-8aaa-999999999999')
export const MATRIZ = ConnectionId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
export const FILIAL = ConnectionId.parse('bbbbbbbb-aaaa-4aaa-8aaa-bbbbbbbbbbbb')
const PEDIDOS_READ = OperationId.parse('pedidos')
export const TOOL = ToolId.parse('33333333-aaaa-4aaa-8aaa-333333333333')
export const TOOL_V1 = ToolVersionId.parse('44444444-aaaa-4aaa-8aaa-444444444444')
export const CHAT = ConversationId.parse('66666666-aaaa-4aaa-8aaa-666666666666')
export const TEST_CHAT = ConversationId.parse('77777777-aaaa-4aaa-8aaa-777777777777')
export const BUILDER_CHAT = ConversationId.parse('88888888-aaaa-4aaa-8aaa-888888888888')
export const PROJECT_ROOT = `/companies/${COMPANY.id}/projects/${PEDIDOS.id}`
export const AREA = `${PROJECT_ROOT}/agents`

export function agent(fields: Partial<AgentDetail> = {}): AgentDetail {
  return {
    id: AGENT,
    projectId: PEDIDOS.id,
    name: 'Conferente de metas',
    description: 'Compara as vendas de ontem com as metas.',
    state: { kind: 'DRAFT' },
    updatedAt: '2026-11-02T12:00:00.000Z',
    lastRunAt: null,
    draft: {
      name: 'Conferente de metas',
      description: 'Compara as vendas de ontem com as metas.',
      instructions: 'Diga quem ficou abaixo da meta.',
      model: null,
      memory: { observational: true },
      connections: [MATRIZ],
      web: false,
      appData: false,
      byTool: true,
      machine: false,
    },
    revision: 3,
    tools: [
      {
        kind: 'PRESET',
        id: TOOL,
        slug: 'vendas_de_ontem',
        connectionId: MATRIZ,
        operation: PEDIDOS_READ,
        effect: 'READ',
        latest: { id: TOOL_V1, number: 1 },
        version: {
          kind: 'PRESET',
          id: TOOL_V1,
          number: 1,
          description: 'Vendas de ontem por vendedor.',
          bound: {},
          open: [],
        },
      },
    ],
    offered: [
      {
        connectionId: MATRIZ,
        connector: 'sankhya',
        name: 'Matriz',
        reads: [
          { operation: 'pedidos', label: 'Pedidos', summary: 'Pedidos de venda', allowed: true },
        ],
        writes: [],
      },
    ],
    createdBy: null,
    ...fields,
  }
}

export function toolSummary(
  fields: Partial<Extract<ToolSummary, { kind: 'PRESET' }>> = {},
): ToolSummary {
  return {
    kind: 'PRESET',
    id: TOOL,
    slug: 'vendas_de_ontem',
    connectionId: MATRIZ,
    operation: PEDIDOS_READ,
    description: 'Vendas de ontem por vendedor.',
    connectionName: 'Matriz',
    readLabel: 'Pedidos',
    effect: 'READ',
    latest: { id: TOOL_V1, number: 1 },
    usedBy: [],
    ...fields,
  }
}

export function version(number: number, active: boolean, message = ''): AgentVersionSummary {
  return { number, message, active, publishedAt: '2026-11-01T12:00:00.000Z', publishedBy: null }
}

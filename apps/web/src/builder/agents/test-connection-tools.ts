import type { AgentDetail, ReadyTool } from '@conexus/hub-api'
import { HttpResponse, http } from 'msw'
import { SANKHYA } from '../../hub/connectors/fixtures.ts'
import { FILIAL, MATRIZ, agent } from './test-agents.ts'

/** The reads the Sankhya's kit offers a Projeto here: two of the kit and the free query of its door. */
const READS = [
  { operation: 'pedidos', label: 'Pedidos', summary: 'Os pedidos de venda.' },
  { operation: 'contasAReceber', label: 'Contas a receber', summary: 'Os títulos a receber.' },
  { operation: 'consultar', label: 'Consulta', summary: 'Roda uma consulta SQL de leitura.' },
]

export function offered(
  connectionId: typeof MATRIZ | typeof FILIAL,
  name: string,
  reads: AgentDetail['offered'][number]['reads'] = READS,
) {
  return { connectionId, connector: 'sankhya', name, reads }
}

/** An agent with the given connections offered and none selected, no tool chosen. */
export function bare(fields: Partial<AgentDetail> = {}): AgentDetail {
  const one = agent()
  return agent({
    draft: { ...one.draft, connections: [] },
    tools: [],
    offered: [offered(MATRIZ, 'Matriz')],
    ...fields,
  })
}

export function readyOf(connectionId: typeof MATRIZ | typeof FILIAL): ReadyTool[] {
  return READS.map(({ operation, label, summary }) => ({
    connectionId,
    operation,
    label,
    summary,
    slug: `${operation.toLowerCase()}_${connectionId.slice(0, 2)}`,
  })) as ReadyTool[]
}

/** The catalog the Hub reads, with the Sankhya's subjects: the door's read marked as the free query. */
export const catalog = http.get('*/api/companies/:companyId/connections', () =>
  HttpResponse.json({ connectors: [SANKHYA], connections: [], mayManage: true }),
)

import type { AgentDetail } from '@conexus/hub-api'
import { ReadyTool } from '@conexus/hub-api'
import type { FILIAL } from './test-agents.ts'
import { agent, MATRIZ } from './test-agents.ts'

/** The reads the Sankhya's kit offers a Projeto here, marked `allowed` as the Hub marks every read of the page. */
const READS = [
  { operation: 'pedidos', label: 'Pedidos', summary: 'Os pedidos de venda.', allowed: true },
  {
    operation: 'contasAReceber',
    label: 'Contas a receber',
    summary: 'Os títulos a receber.',
    allowed: true,
  },
  {
    operation: 'consultar',
    label: 'Consulta',
    summary: 'Roda uma consulta SQL de leitura.',
    allowed: true,
  },
]

export function offered(
  connectionId: typeof MATRIZ | typeof FILIAL,
  name: string,
  reads: AgentDetail['offered'][number]['reads'] = READS,
) {
  return { connectionId, connector: 'sankhya', name, reads }
}

/** An agent with the Matriz offered, none selected and no tool chosen. */
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
  return READS.map(({ operation, label, summary }) =>
    ReadyTool.parse({
      connectionId,
      operation,
      label,
      summary,
      slug: `${operation.toLowerCase()}_${connectionId.slice(0, 2)}`,
    }),
  )
}

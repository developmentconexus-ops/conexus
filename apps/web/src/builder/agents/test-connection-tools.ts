import type { AgentDetail } from '@conexus/hub-api'
import { OperationId, ReadyTool } from '@conexus/hub-api'
import type { FILIAL } from './test-agents.ts'
import { agent, MATRIZ, TOOL, TOOL_V1 } from './test-agents.ts'

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
  return { connectionId, connector: 'sankhya', name, reads, writes: [] }
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

/** The write the Sankhya's kit offers a Projeto here (step 24.5), allowed to whoever edits. */
export const LANCAR = {
  operation: 'lancarPedido',
  label: 'Lançar pedido',
  summary: 'Lança um pedido de venda.',
  allowed: true,
}

/** An agent with the Matriz selected and its write offered, the write chosen at `approval` when it is given. */
export function writer(approval?: 'ASK' | 'AUTO'): AgentDetail {
  const one = bare()
  return bare({
    draft: { ...one.draft, connections: [MATRIZ] },
    offered: [{ ...offered(MATRIZ, 'Matriz'), writes: [LANCAR] }],
    tools:
      approval === undefined
        ? []
        : [
            {
              kind: 'PRESET',
              id: TOOL,
              slug: 'lancar_pedido',
              connectionId: MATRIZ,
              operation: OperationId.parse('lancarPedido'),
              effect: 'WRITE',
              latest: { id: TOOL_V1, number: 1 },
              version: {
                kind: 'PRESET',
                id: TOOL_V1,
                number: 1,
                description: 'Lança um pedido de venda.',
                bound: {},
                open: [],
              },
              approval,
            },
          ],
  })
}

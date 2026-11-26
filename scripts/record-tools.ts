import { CompanyId, ConversationId, MACHINE_TOOL, PersonId } from '@conexus/hub-api'
import {
  createTool,
  taskCompleteTool,
  taskWriteTool,
  webFetchTool,
  webSearchTool,
} from '@mastra/core/tools'
import { z } from 'zod'
import { requestNetworkTool } from '../apps/server/src/harness/network/public.ts'
import { recordedData } from '../apps/server/src/harness/tools/data/test-data.ts'
import { dataTools } from '../apps/server/src/harness/tools/public.ts'
import { PADARIA_SOL_MATRIZ, salesDatabase } from '../apps/server/src/hub/connectors/test-sales.ts'
import { orderBook } from '../packages/connectors/src/sankhya/fake-orders.ts'
import * as approval from './record-approval.ts'
import { APPROVAL_TOOL } from './record-calls.ts'

const matriz = salesDatabase(PADARIA_SOL_MATRIZ)
const orders = orderBook()
const TASK_TOOLS = { task_write: taskWriteTool, task_complete: taskCompleteTool }

const requestNetwork = requestNetworkTool({
  store: { opened: async () => ({ kind: 'LIST', hosts: [] }), grant: async () => undefined },
  machines: { reopen: async () => true },
  asking: async () => ({
    kind: 'ASKS',
    companyId: CompanyId.parse('0'.repeat(32)),
    conversationId: ConversationId.parse('00000000-0000-4000-8000-000000000001'),
    personId: PersonId.parse('00000000-0000-4000-8000-000000000002'),
    scopes: ['CONVERSATION', 'COMPANY'],
  }),
})

/** The tools the recorded agent has. */
export const RECORDED_TOOLS = {
  ...TASK_TOOLS,
  web_fetch: webFetchTool,
  web_search: webSearchTool,
  ...dataTools({ data: recordedData() }),
  [MACHINE_TOOL.requestNetwork]: requestNetwork,
  connector_read: createTool({
    id: 'connector_read',
    description: 'Reads a connection the conversation chose.',
    inputSchema: z.object({
      connection: z.string(),
      operation: z.string(),
      input: z.object({ sql: z.string() }),
    }),
    execute: async ({ input }) => {
      const answered = matriz(input.sql)
      if (answered === undefined) return { kind: 'REFUSED' }
      const linhas = answered.rows.map((row) =>
        Object.fromEntries(answered.fields.map((name, at) => [name, row[at] ?? null])),
      )
      return {
        kind: 'OK',
        value: { linhas, completo: true },
        complete: true,
        at: new Date().toISOString(),
      }
    },
  }),
  [APPROVAL_TOOL]: approval.approvalTool(orders, process.argv.includes('approval-refused')),
  anotar: createTool({
    id: 'anotar',
    description: 'Anota uma nota.',
    inputSchema: z.object({ nota: z.string() }),
    execute: async () => 'Anotado.',
  }),
}

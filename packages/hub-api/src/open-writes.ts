import { z } from 'zod'
import { AgentId } from './agent-ids.ts'
import { CompanyId } from './companies.ts'
import { ConnectionId } from './connectors.ts'
import { ConversationId } from './conversations.ts'
import { ProjectId } from './library-ids.ts'
import { defineOperation } from './operation.ts'
import { OperationId } from './tools.ts'

/**
 * A write of the conversation that may exist in the system and whose end is not known (step 24.5):
 * sent and not answered, or answered in a way that could not be read. Never the write's fields
 * (security S40), only what the card's notice says: the time it was sent and the mark to look for.
 */
export const OpenWrite = z.object({
  connectionId: ConnectionId,
  operation: OperationId,
  state: z.enum(['SENDING', 'UNCERTAIN']),
  sentAt: z.iso.datetime(),
  mark: z.string(),
})
export type OpenWrite = z.infer<typeof OpenWrite>

export const listOpenWrites = defineOperation({
  id: 'listOpenWrites',
  summary:
    "Lists the writes of the person's conversation with the agent whose end is not known, oldest first.",
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/projects/{projectId}/agents/{agentId}/conversations/{conversationId}/open-writes',
  bodyLimit: 1024,
  input: {
    params: z.object({
      companyId: CompanyId,
      projectId: ProjectId,
      agentId: AgentId,
      conversationId: ConversationId,
    }),
  },
  success: { status: 200, body: z.object({ writes: z.array(OpenWrite) }) },
  failures: [
    'NOT_FOUND',
    'SESSION_REQUIRED',
    'DATABASE_UNAVAILABLE',
    'AGENT_NOT_FOUND',
    'CONVERSATION_NOT_FOUND',
  ],
})

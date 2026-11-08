import { z } from 'zod'
import { AgentId } from './agent-ids.ts'
import { CompanyId } from './companies.ts'
import { ConnectionId } from './connectors.ts'
import { ConversationId } from './conversations.ts'
import { ProjectId } from './library-ids.ts'
import { defineOperation } from './operation.ts'
import { ToolCallId } from './questions.ts'
import { OperationId } from './tools.ts'

const OfConversation = z.object({
  companyId: CompanyId,
  projectId: ProjectId,
  agentId: AgentId,
  conversationId: ConversationId,
})

/**
 * A write of the conversation as the record keeps it, whatever its end (step 24.5, U5): what the card
 * reads after a reload. Never the write's fields (security S40).
 */
export const WrittenRow = z.object({
  toolCallId: ToolCallId,
  connectionId: ConnectionId,
  operation: OperationId,
  state: z.enum(['SENDING', 'DONE', 'REFUSED', 'UNCERTAIN']),
  sentAt: z.iso.datetime(),
  mark: z.string(),
  /** A person answered Aprovar for this call. */
  approved: z.boolean(),
  /** On `REFUSED`, the system's message as it came. */
  message: z.string().nullable(),
})
export type WrittenRow = z.infer<typeof WrittenRow>

export const listWrites = defineOperation({
  id: 'listWrites',
  summary:
    "Lists every write of the person's conversation with the agent as the record keeps it, oldest first.",
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/projects/{projectId}/agents/{agentId}/conversations/{conversationId}/writes',
  bodyLimit: 1024,
  input: { params: OfConversation },
  success: { status: 200, body: z.object({ writes: z.array(WrittenRow) }) },
  failures: [
    'NOT_FOUND',
    'SESSION_REQUIRED',
    'DATABASE_UNAVAILABLE',
    'AGENT_NOT_FOUND',
    'CONVERSATION_NOT_FOUND',
  ],
})

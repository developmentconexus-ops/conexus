import { z } from 'zod'
import { CompanyId } from './companies.ts'
import { CONNECTIONS_MAX, ConnectionId } from './connectors.ts'
import { ConversationId } from './conversations.ts'
import { ATTEMPT_KEY_HEADER, defineOperation } from './operation.ts'
import { ProjectId, ProjectName } from './projects.ts'
import { ToolCallId } from './questions.ts'

/** Why a marked connection was not released to the Projeto; the others were. */
export const HandOffRefusal = z.enum([
  'CONNECTION_NOT_WORKING',
  'CONNECTION_NOT_FOUND',
  'CONNECTIONS_NOT_ALLOWED',
])
export type HandOffRefusal = z.infer<typeof HandOffRefusal>

/**
 * What a hand-off made (step 24.3.2, U2): the Projeto (new on the Início, the conversation's in a
 * Projeto), the Builder's conversation that received the proposal, and each marked connection
 * released or refused.
 */
export const HandedOff = z.object({
  projectId: ProjectId,
  conversationId: ConversationId,
  released: z.array(ConnectionId),
  refused: z.array(z.object({ connectionId: ConnectionId, code: HandOffRefusal })),
})
export type HandedOff = z.infer<typeof HandedOff>

export const handAssistantProposal = defineOperation({
  id: 'handAssistantProposal',
  summary: `Hands one of the Assistant's proposals to the Builder, keyed by ${ATTEMPT_KEY_HEADER}: on the Início it creates the Projeto and releases the marked connections the conversation chose; in a Projeto it uses that Projeto. It opens a Builder conversation there that receives the summary and the briefing once, marked as coming from the Assistant.`,
  access: 'session',
  method: 'POST',
  path: '/api/companies/{companyId}/assistant/conversations/{conversationId}/handoffs',
  bodyLimit: 4096,
  input: {
    params: z.object({ companyId: CompanyId, conversationId: ConversationId }),
    body: z.object({
      toolCallId: ToolCallId,
      /** The new Projeto's name on the Início; absent in a Projeto's conversation, which uses its own. */
      projectName: ProjectName.optional(),
      connections: z.array(ConnectionId).max(CONNECTIONS_MAX),
    }),
  },
  attemptKey: true,
  success: { status: 201, body: HandedOff },
  failures: [
    'NOT_FOUND',
    'CONVERSATION_NOT_FOUND',
    'SESSION_REQUIRED',
    'DATABASE_UNAVAILABLE',
    'IDEMPOTENCY_CONFLICT',
    'REQUEST_MALFORMED',
    'HUB_UPDATING',
    'PROJECT_NAME_TAKEN',
    'PROJECT_ADDRESS_TAKEN',
    'PROJECT_NAME_NO_ADDRESS',
    'COMPANY_SETUP_PENDING',
    'COMPANY_DATABASE_PREPARING',
    'COMPANY_DATABASE_UNAVAILABLE',
    'MODEL_UNKNOWN',
    'MODEL_NO_ACCOUNT',
    'EFFORT_UNSUPPORTED',
    'HANDOFF_NOT_DELIVERED',
  ],
})

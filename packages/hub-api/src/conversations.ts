import { z } from 'zod'
import { CompanyId, Next, Page } from './companies.ts'
import type { FailureCode } from './failures.ts'
import { ATTEMPT_KEY_HEADER, defineOperation } from './operation.ts'
import { ProjectId } from './projects.ts'

/**
 * Where the Hub serves Mastra's own session routes of the Builder, behind its guard (decision
 * 0050), as the screen's `MastraClient` asks them, and the controller they name.
 */
export const BUILDER_ROUTES = '/api/builder'
export const BUILDER_CONTROLLER = 'builder'

export const ConversationId = z.uuid().brand('ConversationId')
export type ConversationId = z.infer<typeof ConversationId>

/** A model of the router's registry, such as `anthropic/claude-sonnet-4-5` (decision 0049). */
export const ModelId = z.string().min(1).max(200).brand('ModelId')
export type ModelId = z.infer<typeof ModelId>

/** A model's provider, its name before the first slash as the router splits it, or null. */
export function providerOfModel(model: string): string | null {
  const slash = model.indexOf('/')
  return slash > 0 && slash < model.length - 1 ? model.slice(0, slash) : null
}

/** How hard the model reasons before it answers, the controller's `AgentControllerThinkingLevel`. */
export const EFFORTS = ['off', 'low', 'medium', 'high', 'xhigh', 'max'] as const
export const Effort = z.enum(EFFORTS)
export type Effort = z.infer<typeof Effort>

/**
 * The effort a model runs at for `effort`, given the efforts it accepts, lowest first: the same; or
 * for a level it lacks the nearest level below it, else its lowest level; `off` only where listed.
 * The Hub asks the provider by it and the screen names it, so the two never differ.
 */
export function runningEffort(efforts: readonly [Effort, ...Effort[]], effort: Effort): Effort {
  if (efforts.includes(effort)) return effort
  const levels = efforts.filter((each) => each !== 'off')
  const rank = Effort.options.indexOf(effort)
  return (
    levels.findLast((level) => Effort.options.indexOf(level) <= rank) ?? levels[0] ?? efforts[0]
  )
}

/** The failures a turn ends with, rows of the failure table that the screen reads by code. */
export const TurnFailureCode = z.enum([
  'RUN_BUSY',
  'MODEL_NO_ACCOUNT',
  'MODEL_CALL_FAILED',
  'MODEL_REFUSED',
  'MODEL_ANSWER_CUT',
  'SAVE_REFUSED',
  'GIT_RESTORE_NEEDED',
  'MACHINE_LOST',
  'MACHINE_UNAVAILABLE',
  'INTERNAL_UNEXPECTED',
] as const satisfies readonly FailureCode[])
export type TurnFailureCode = z.infer<typeof TurnFailureCode>

export const ConversationSummary = z.object({
  id: ConversationId,
  title: z.string().nullable(),
  createdAt: z.iso.datetime(),
})
export type ConversationSummary = z.infer<typeof ConversationSummary>

const InProject = z.object({ companyId: CompanyId, projectId: ProjectId })
const OfConversation = InProject.extend({ conversationId: ConversationId })
const BASE = '/api/companies/{companyId}/projects/{projectId}/conversations'
const READ_FAILURES = [
  'NOT_FOUND',
  'SESSION_REQUIRED',
  'DATABASE_UNAVAILABLE',
  'CONVERSATION_NOT_FOUND',
] as const satisfies readonly FailureCode[]

export const listConversations = defineOperation({
  id: 'listConversations',
  summary: 'Lists the person’s own conversations of a Projeto, newest first.',
  access: 'session',
  method: 'GET',
  path: BASE,
  bodyLimit: 1024,
  input: { params: InProject, query: Page },
  success: {
    status: 200,
    body: z.object({ conversations: z.array(ConversationSummary), next: Next }),
  },
  failures: ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
})

export const createConversation = defineOperation({
  id: 'createConversation',
  summary: `Starts a conversation of the person in a Projeto, keyed by ${ATTEMPT_KEY_HEADER}, on the model chosen or the company’s default.`,
  access: 'session',
  method: 'POST',
  path: BASE,
  bodyLimit: 1024,
  input: { params: InProject, body: z.object({ model: ModelId.optional() }) },
  attemptKey: true,
  success: {
    status: 201,
    body: z.object({ conversation: ConversationSummary.extend({ model: ModelId }) }),
  },
  failures: [...READ_FAILURES, 'IDEMPOTENCY_CONFLICT', 'MODEL_UNKNOWN', 'MODEL_NO_ACCOUNT'],
})

export const readConversation = defineOperation({
  id: 'readConversation',
  summary:
    'Reads one of the person’s conversations: its title. Its model, effort and tasks are Mastra’s session-state route.',
  access: 'session',
  method: 'GET',
  path: `${BASE}/{conversationId}`,
  bodyLimit: 1024,
  input: { params: OfConversation },
  success: { status: 200, body: z.object({ conversation: ConversationSummary }) },
  failures: READ_FAILURES,
})

export const setConversationModel = defineOperation({
  id: 'setConversationModel',
  summary: 'Changes the model of a conversation and its reasoning effort, for its next answers.',
  access: 'session',
  method: 'PUT',
  path: `${BASE}/{conversationId}/model`,
  bodyLimit: 1024,
  input: { params: OfConversation, body: z.object({ model: ModelId, effort: Effort }) },
  success: { status: 200, body: z.object({ model: ModelId, effort: Effort }) },
  failures: [...READ_FAILURES, 'MODEL_UNKNOWN', 'MODEL_NO_ACCOUNT', 'EFFORT_UNSUPPORTED'],
})

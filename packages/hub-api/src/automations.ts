import { z } from 'zod'
import { AutomationId, SessionConnection } from './assistant.ts'
import { CompanyId, Next, Page } from './companies.ts'
import { ConnectionId } from './connectors.ts'
import { ConversationId } from './conversations.ts'
import type { FailureCode } from './failures.ts'
import { ATTEMPT_KEY_HEADER, defineOperation } from './operation.ts'
import { ProjectId } from './projects.ts'

/** The id the Assistant's conversations carry for the automation that opened them, re-exported with the automation's own shapes. */
export { AutomationId }

/** The most connections an automation reads, as a conversation chooses at most. */
const CONNECTIONS_MAX = 50
export const AUTOMATION_NAME_MAX = 80
export const AUTOMATION_PROMPT_MAX = 4000

export const HourMinute = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
export const Weekday = z.enum(['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'])
export type Weekday = z.infer<typeof Weekday>

/** When an automation runs, always at a time of day in São Paulo (founder F1): every day, weekdays, chosen days of the week, or a day of the month up to 28. */
export const Cadence = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('DAILY'), time: HourMinute }),
  z.object({ kind: z.literal('WEEKDAYS'), time: HourMinute }),
  z.object({ kind: z.literal('WEEKLY'), days: z.array(Weekday).min(1).max(7), time: HourMinute }),
  z.object({ kind: z.literal('MONTHLY'), day: z.int().min(1).max(28), time: HourMinute }),
])
export type Cadence = z.infer<typeof Cadence>

export const AutomationName = z.string().trim().min(1).max(AUTOMATION_NAME_MAX)
export const AutomationPrompt = z.string().trim().min(1).max(AUTOMATION_PROMPT_MAX)

export const AutomationSummary = z.object({
  id: AutomationId,
  name: z.string(),
  prompt: z.string(),
  cadence: Cadence,
  projectId: ProjectId.nullable(),
  /** Each connection the automation's place offers now, and whether the automation reads it. */
  connections: z.array(SessionConnection),
  state: z.enum(['ACTIVE', 'PAUSED']),
  nextRunAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
})
export type AutomationSummary = z.infer<typeof AutomationSummary>

/**
 * How a run failed (code C21: a closed set): a turn's codes without the Builder's own (`RUN_BUSY`,
 * `SAVE_REFUSED`, `GIT_RESTORE_NEEDED`), with the run's.
 */
export const AutomationFailureCode = z.enum([
  'MODEL_NO_ACCOUNT',
  'MODEL_CALL_FAILED',
  'MODEL_REFUSED',
  'MODEL_ANSWER_CUT',
  'MACHINE_UNAVAILABLE',
  'MACHINE_LOST',
  'HUB_UPDATED',
  'INTERNAL_UNEXPECTED',
  'DATABASE_UNAVAILABLE',
  'INTERRUPTED',
  'SCHEDULE_PUBLISH_FAILED',
] as const satisfies readonly FailureCode[])
export type AutomationFailureCode = z.infer<typeof AutomationFailureCode>

/** How a run ended, the workflow's output, one per run. */
export const RunOutcome = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('DONE'), conversationId: ConversationId }),
  z.object({
    kind: z.literal('FAILED'),
    code: AutomationFailureCode,
    conversationId: ConversationId.nullable(),
  }),
  z.object({ kind: z.literal('SKIPPED'), reason: z.literal('OWNER_CANNOT_ASK') }),
])
export type RunOutcome = z.infer<typeof RunOutcome>

/** Where a run stands: still running, or how it ended. */
export const RunState = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('RUNNING'), conversationId: ConversationId.nullable() }),
  ...RunOutcome.options,
])
export type RunState = z.infer<typeof RunState>

/** Mastra's id of a run of the automation's schedule: `sched_<automationId>_<ms>`. */
export const AutomationRunId = z
  .string()
  .regex(/^sched_schedule_conexus-automation-[0-9a-f-]{36}_\d{1,15}$/)
  .brand('AutomationRunId')
export type AutomationRunId = z.infer<typeof AutomationRunId>

export const RunTrigger = z.enum(['SCHEDULED', 'MANUAL'])
export type RunTrigger = z.infer<typeof RunTrigger>

export const AutomationRun = z.object({
  runId: AutomationRunId,
  firedAt: z.iso.datetime(),
  trigger: RunTrigger,
  state: RunState,
})
export type AutomationRun = z.infer<typeof AutomationRun>

export const CreateAutomation = z.object({
  name: AutomationName,
  prompt: AutomationPrompt,
  cadence: Cadence,
  projectId: ProjectId.optional(),
  connections: z.array(ConnectionId).max(CONNECTIONS_MAX),
})
export type CreateAutomation = z.infer<typeof CreateAutomation>

/**
 * What `propose_automation` answers (step 24.2, U3): an automation as the Assistant wrote it, for the
 * person to create with one touch; the place is the conversation's. It lives here and not in
 * `assistant.ts`, which this file already imports.
 */
export const ProposedAutomation = z.object({
  name: AutomationName,
  prompt: AutomationPrompt,
  cadence: Cadence,
  connections: z.array(ConnectionId).max(CONNECTIONS_MAX),
})
export type ProposedAutomation = z.infer<typeof ProposedAutomation>

const InCompany = z.object({ companyId: CompanyId })
const OfAutomation = InCompany.extend({ automationId: AutomationId })
const BASE = '/api/companies/{companyId}/automations'
const READ_FAILURES = [
  'NOT_FOUND',
  'SESSION_REQUIRED',
  'DATABASE_UNAVAILABLE',
] as const satisfies readonly FailureCode[]
const ONE_FAILURES = [...READ_FAILURES, 'AUTOMATION_NOT_FOUND'] as const
const Automation = z.object({ automation: AutomationSummary })

export const listAutomations = defineOperation({
  id: 'listAutomations',
  summary:
    'Lists the person’s own automations of the Assistant, in the company’s Início or in one Projeto.',
  access: 'session',
  method: 'GET',
  path: BASE,
  bodyLimit: 1024,
  input: { params: InCompany, query: z.object({ projectId: ProjectId.optional() }) },
  success: { status: 200, body: z.object({ automations: z.array(AutomationSummary) }) },
  failures: READ_FAILURES,
})

export const createAutomation = defineOperation({
  id: 'createAutomation',
  summary: `Creates an automation of the person, keyed by ${ATTEMPT_KEY_HEADER}: the Assistant asks its prompt in a new conversation at each time of its cadence, in the Início or in one Projeto, reading the connections its place offers.`,
  access: 'session',
  method: 'POST',
  path: BASE,
  bodyLimit: 32_768,
  input: { params: InCompany, body: CreateAutomation },
  attemptKey: true,
  success: { status: 201, body: Automation },
  failures: [...READ_FAILURES, 'IDEMPOTENCY_CONFLICT', 'AUTOMATION_LIMIT', 'HUB_UPDATING'],
})

export const pauseAutomation = defineOperation({
  id: 'pauseAutomation',
  summary: 'Pauses one of the person’s automations: it does not run at its next times.',
  access: 'session',
  method: 'POST',
  path: `${BASE}/{automationId}/pause`,
  bodyLimit: 1024,
  input: { params: OfAutomation },
  success: { status: 200, body: Automation },
  failures: ONE_FAILURES,
})

export const resumeAutomation = defineOperation({
  id: 'resumeAutomation',
  summary: 'Resumes one of the person’s paused automations from its next time.',
  access: 'session',
  method: 'POST',
  path: `${BASE}/{automationId}/resume`,
  bodyLimit: 1024,
  input: { params: OfAutomation },
  success: { status: 200, body: Automation },
  failures: [...ONE_FAILURES, 'AUTOMATION_LIMIT', 'HUB_UPDATING'],
})

export const runAutomation = defineOperation({
  id: 'runAutomation',
  summary:
    'Runs one of the person’s automations now, paused or not, unless a run of it is running.',
  access: 'session',
  method: 'POST',
  path: `${BASE}/{automationId}/run`,
  bodyLimit: 1024,
  input: { params: OfAutomation },
  success: { status: 202, body: z.object({ runId: AutomationRunId }) },
  failures: [...ONE_FAILURES, 'AUTOMATION_RUNNING', 'HUB_UPDATING'],
})

export const deleteAutomation = defineOperation({
  id: 'deleteAutomation',
  summary:
    'Deletes one of the person’s automations and its runs; the conversations its runs opened stay.',
  access: 'session',
  method: 'DELETE',
  path: `${BASE}/{automationId}`,
  bodyLimit: 1024,
  input: { params: OfAutomation },
  success: { status: 204 },
  failures: ONE_FAILURES,
})

export const listAutomationRuns = defineOperation({
  id: 'listAutomationRuns',
  summary: 'Lists the runs of one of the person’s automations, newest first.',
  access: 'session',
  method: 'GET',
  path: `${BASE}/{automationId}/runs`,
  bodyLimit: 1024,
  input: { params: OfAutomation, query: Page },
  success: { status: 200, body: z.object({ runs: z.array(AutomationRun), next: Next }) },
  failures: ONE_FAILURES,
})

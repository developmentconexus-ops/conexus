import { z } from 'zod'
import { CompanyId } from './companies.ts'
import { Effort, ModelId } from './conversations.ts'
import type { FailureCode } from './failures.ts'
import { defineOperation } from './operation.ts'

/** A model and the reasoning level a conversation starts at (founder, card 12.3 P1). */
export const ModelDefault = z.object({ model: ModelId, effort: Effort })
export type ModelDefault = z.infer<typeof ModelDefault>

/** Where a new conversation's start comes from: the person's default, the company's, or the starter list. */
export const StartSource = z.enum(['mine', 'company', 'starter'])
export type StartSource = z.infer<typeof StartSource>

/**
 * Where a conversation created now begins: the model and level, which step of the order it came
 * from, and the name of the first account that will answer for it (the same read that decided the
 * step was usable, code C26).
 */
export const ConversationStart = ModelDefault.extend({ from: StartSource, account: z.string() })
export type ConversationStart = z.infer<typeof ConversationStart>

/**
 * The defaults: the company's and the viewer's own, and what a conversation created now would
 * begin on with no model asked: `start` for the viewer (`mine`, then the company's, then the
 * starter list) and `companyStart` for the company's people alike (without the viewer's own step,
 * over the accounts given to all); each is null with no usable account.
 */
export const Defaults = z.object({
  company: ModelDefault.nullable(),
  mine: ModelDefault.nullable(),
  start: ConversationStart.nullable(),
  companyStart: ConversationStart.nullable(),
})
export type Defaults = z.infer<typeof Defaults>

const InCompany = z.object({ companyId: CompanyId })
const READ_FAILURES = [
  'NOT_FOUND',
  'SESSION_REQUIRED',
  'DATABASE_UNAVAILABLE',
] as const satisfies readonly FailureCode[]

const DEFAULT_FAILURES = [
  ...READ_FAILURES,
  'MODEL_UNKNOWN',
  'EFFORT_UNSUPPORTED',
  'MODEL_NO_ACCOUNT',
] as const

export const setDefaultModel = defineOperation({
  id: 'setDefaultModel',
  summary:
    'Sets the company’s default model and reasoning level, for a provider the company has connected.',
  access: 'session',
  method: 'PUT',
  path: '/api/companies/{companyId}/default-model',
  bodyLimit: 1024,
  input: { params: InCompany, body: ModelDefault },
  success: { status: 200, body: z.object({ defaultModel: ModelDefault }) },
  failures: DEFAULT_FAILURES,
})

export const setMyModelDefault = defineOperation({
  id: 'setMyModelDefault',
  summary:
    'Sets the person’s own default model and reasoning level, for a provider they or the company gave them connected.',
  access: 'session',
  method: 'PUT',
  path: '/api/companies/{companyId}/my-model-default',
  bodyLimit: 1024,
  input: { params: InCompany, body: ModelDefault },
  success: { status: 200, body: z.object({ mine: ModelDefault }) },
  failures: DEFAULT_FAILURES,
})

export const clearMyModelDefault = defineOperation({
  id: 'clearMyModelDefault',
  summary: 'Clears the person’s own default; clearing it again answers the same.',
  access: 'session',
  method: 'DELETE',
  path: '/api/companies/{companyId}/my-model-default',
  bodyLimit: 1024,
  input: { params: InCompany },
  success: { status: 204 },
  failures: READ_FAILURES,
})

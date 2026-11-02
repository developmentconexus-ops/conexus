import { z } from 'zod'
import { AutomationId } from './assistant.ts'
import { AutomationFailureCode } from './automations.ts'
import { CompanyId, Next, Page } from './companies.ts'
import { ConversationId } from './conversations.ts'
import type { FailureCode } from './failures.ts'
import { defineOperation } from './operation.ts'
import { ProjectId } from './projects.ts'

export const NotificationId = z.uuid().brand('NotificationId')
export type NotificationId = z.infer<typeof NotificationId>

const OfNotification = {
  id: NotificationId,
  createdAt: z.iso.datetime(),
  read: z.boolean(),
  automation: z.object({ id: AutomationId, name: z.string() }),
  projectId: ProjectId.nullable(),
}

/** What the Hub tells a person: an automation's run ended (step 24.2). */
export const NotificationRow = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('AUTOMATION_DONE'),
    ...OfNotification,
    conversationId: ConversationId,
  }),
  z.object({
    kind: z.literal('AUTOMATION_FAILED'),
    ...OfNotification,
    code: AutomationFailureCode,
    conversationId: ConversationId.nullable(),
  }),
  z.object({ kind: z.literal('AUTOMATION_PAUSED'), ...OfNotification }),
])
export type NotificationRow = z.infer<typeof NotificationRow>

/** The most notifications one marking names. */
const READ_MAX = 100

const MarkRead = z.union([
  z.strictObject({ ids: z.array(NotificationId).min(1).max(READ_MAX) }),
  z.strictObject({ all: z.literal(true) }),
])

/**
 * Where a conversation of the Assistant opens in the Hub, from the company's Início or from a
 * Projeto: the one owner of the address, which the e-mail and the screens both use (code C26).
 */
export function conversationPath(
  companyId: CompanyId,
  projectId: ProjectId | null,
  conversationId: ConversationId,
): string {
  return projectId === null
    ? `/companies/${companyId}/conversations/${conversationId}`
    : `/companies/${companyId}/projects/${projectId}/assistant/${conversationId}`
}

/** Where an automation's page opens, on the same floor as its place (the company's or the Projeto's). */
export function automationPath(
  companyId: CompanyId,
  projectId: ProjectId | null,
  automationId: AutomationId,
): string {
  return projectId === null
    ? `/companies/${companyId}/automations/${automationId}`
    : `/companies/${companyId}/projects/${projectId}/automations/${automationId}`
}

const InCompany = z.object({ companyId: CompanyId })
const FAILURES = [
  'NOT_FOUND',
  'SESSION_REQUIRED',
  'DATABASE_UNAVAILABLE',
] as const satisfies readonly FailureCode[]

export const listNotifications = defineOperation({
  id: 'listNotifications',
  summary:
    'Lists the person’s own notifications in the company, newest first, with how many are unread.',
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/notifications',
  bodyLimit: 1024,
  input: { params: InCompany, query: Page },
  success: {
    status: 200,
    body: z.object({
      notifications: z.array(NotificationRow),
      unread: z.int().min(0),
      next: Next,
    }),
  },
  failures: FAILURES,
})

export const markNotificationsRead = defineOperation({
  id: 'markNotificationsRead',
  summary: 'Marks some of the person’s own notifications read, or all of them.',
  access: 'session',
  method: 'POST',
  path: '/api/companies/{companyId}/notifications/read',
  bodyLimit: 8192,
  input: { params: InCompany, body: MarkRead },
  success: { status: 204 },
  failures: FAILURES,
})

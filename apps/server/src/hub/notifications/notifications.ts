import { randomUUID } from 'node:crypto'
import type {
  AutomationId,
  AutomationRunId,
  CompanyId,
  NotificationId,
  Person,
  PersonId,
  ProjectId,
  RunOutcome,
  RunTrigger,
} from '@conexus/hub-api'
import { automationPath, conversationPath, NotificationRow } from '@conexus/hub-api'
import { and, desc, eq, inArray, isNull, lt, or, sql } from 'drizzle-orm'
import type { PublicOrigin } from '../../platform/config.ts'
import type { Database, ReadTx, Scope } from '../../platform/database.ts'
import { databaseFailure } from '../../platform/database.ts'
import type { FailureLog, Scalar } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { SendMail } from '../../platform/mail.ts'
import { pageOf } from '../../platform/pages.ts'
import type { IdentityPorts } from '../identity/public.ts'
import { automationMail } from './mail.ts'
import { notification } from './tables.ts'

/** A run that ended, for the person who owns its automation. */
export type AutomationRan = {
  companyId: CompanyId
  personId: PersonId
  automationId: AutomationId
  name: string
  projectId: ProjectId | null
  runId: AutomationRunId
  trigger: RunTrigger
  outcome: RunOutcome
}

/** What the Hub tells a person when an automation's run ends (step 24.2). */
export type Notify = {
  /** One notification per run; mails the owner only for a new one fired by the schedule, or a pause. */
  automationRan(ran: AutomationRan): Promise<void>
}

type Deps = {
  database: Database
  identity: Pick<IdentityPorts, 'admitMember' | 'peopleNamed'>
  sendMail: SendMail
  publicOrigin: PublicOrigin
  log: FailureLog
}

/** What the notification says of the run: its kind, and the conversation and the code it keeps. */
function summaryOf(outcome: RunOutcome) {
  switch (outcome.kind) {
    case 'DONE':
      return {
        kind: 'AUTOMATION_DONE',
        conversationId: outcome.conversationId,
        failureCode: null,
      } as const
    case 'FAILED':
      return {
        kind: 'AUTOMATION_FAILED',
        conversationId: outcome.conversationId,
        failureCode: outcome.code,
      } as const
    case 'SKIPPED':
      return {
        kind: 'AUTOMATION_PAUSED',
        conversationId: null,
        failureCode: null,
      } as const
    default:
      return outcome satisfies never
  }
}

/**
 * Where the button of the e-mail opens: the conversation of the run, by its place; else the
 * automation's page. A pause names no page: its owner can no longer ask, so the page would not be
 * found (criterion 10), and the Início opens.
 */
function linkOf(deps: Deps, ran: AutomationRan): string {
  const { companyId, projectId, automationId, outcome } = ran
  function path(): string {
    switch (outcome.kind) {
      case 'SKIPPED':
        return `/companies/${companyId}`
      case 'FAILED':
        return outcome.conversationId === null
          ? automationPath(companyId, projectId, automationId)
          : conversationPath(companyId, projectId, outcome.conversationId)
      case 'DONE':
        return conversationPath(companyId, projectId, outcome.conversationId)
      default:
        return outcome satisfies never
    }
  }
  return `${deps.publicOrigin}${path()}`
}

/** The notification of the run, once: the row that is new, or `undefined` for a repeated step. */
async function recorded(deps: Deps, ran: AutomationRan, scope: Scope) {
  const summary = summaryOf(ran.outcome)
  const [inserted] = await deps.database.command(scope, (tx) =>
    tx
      .insert(notification)
      .values({
        id: randomUUID(),
        companyId: ran.companyId,
        personId: ran.personId,
        kind: summary.kind,
        automationId: ran.automationId,
        automationName: ran.name,
        projectId: ran.projectId,
        conversationId: summary.conversationId,
        failureCode: summary.failureCode,
        runId: ran.runId,
        createdAt: sql`statement_timestamp()`,
      })
      .onConflictDoNothing({ target: [notification.companyId, notification.runId] })
      .returning({ id: notification.id }),
  )
  return inserted === undefined ? undefined : summary
}

/** Whether the run's end reaches the owner's mailbox: a pause always, a run only when the schedule fired it. */
function mails(ran: AutomationRan): boolean {
  return ran.outcome.kind === 'SKIPPED' || ran.trigger === 'SCHEDULED'
}

/**
 * A refused e-mail, printed under the one message the process has for it, with the failure's own
 * fields: its causes and frames, and never the address (security S40).
 */
function mailRefused(deps: Deps, ran: AutomationRan, failure: Failure): void {
  const { companyId, automationId, runId } = ran
  function print(fields: Record<string, Scalar>): void {
    deps.log.error(fields, 'AUTOMATION_MAIL_FAILED')
  }
  logFailure({ info: print, error: print }, failure, {
    companyId,
    automationId,
    runId,
    failure: failure.code,
  })
}

/** The e-mail never undoes the notification or the run: a refusal is printed and the run ends as it did. */
async function mailed(
  deps: Deps,
  ran: AutomationRan,
  scope: Scope,
  summary: ReturnType<typeof summaryOf>,
): Promise<void> {
  try {
    const named = await deps.database.read(scope, (tx) =>
      deps.identity.peopleNamed(tx, [ran.personId]),
    )
    const to = named.get(ran.personId)?.email
    if (to === undefined) {
      return mailRefused(
        deps,
        ran,
        new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'OWNER' } }),
      )
    }
    await deps.sendMail(
      await automationMail({ to, name: ran.name, kind: summary.kind, link: linkOf(deps, ran) }),
    )
  } catch (error) {
    mailRefused(deps, ran, databaseFailure(error))
  }
}

/** Notifications per page of the bell (code C44). */
const NOTIFICATIONS_PER_PAGE = 30

type Of = { person: Person; companyId: CompanyId }

function scopeOf(input: Of): Scope {
  return { kind: 'COMPANY', companyId: input.companyId, personId: input.person.id }
}

/** The person is a member of the company, who converses in it (the bell is theirs); else the same 404 (S10). */
async function admitted(deps: Deps, tx: ReadTx, input: Of): Promise<void> {
  await deps.identity.admitMember({
    tx,
    personId: input.person.id,
    companyId: input.companyId,
    action: 'useConversations',
  })
}

/** The person's own notifications, newest first, and how many are unread (the bell's number). */
async function list(deps: Deps, input: Of & { after: NotificationId | undefined }) {
  return deps.database.read(scopeOf(input), async (tx) => {
    await admitted(deps, tx, input)
    const mine = and(
      eq(notification.companyId, input.companyId),
      eq(notification.personId, input.person.id),
    )
    const anchor = input.after
    const [last] =
      anchor === undefined
        ? []
        : await tx
            .select({ id: notification.id, createdAt: notification.createdAt })
            .from(notification)
            .where(and(mine, eq(notification.id, anchor)))
    const before =
      last === undefined
        ? undefined
        : or(
            lt(notification.createdAt, last.createdAt),
            and(eq(notification.createdAt, last.createdAt), lt(notification.id, last.id)),
          )
    const rows = await tx
      .select()
      .from(notification)
      .where(and(mine, before))
      .orderBy(desc(notification.createdAt), desc(notification.id))
      .limit(NOTIFICATIONS_PER_PAGE + 1)
    const [counted] = await tx
      .select({ unread: sql<number>`count(*)::int` })
      .from(notification)
      .where(and(mine, isNull(notification.readAt)))
    const page = pageOf(rows, (row) => row.id, NOTIFICATIONS_PER_PAGE)
    return {
      notifications: page.rows.map((row) =>
        NotificationRow.parse({
          kind: row.kind,
          id: row.id,
          createdAt: row.createdAt.toISOString(),
          read: row.readAt !== null,
          automation: { id: row.automationId, name: row.automationName },
          projectId: row.projectId,
          conversationId: row.conversationId,
          code: row.failureCode,
        }),
      ),
      unread: counted?.unread ?? 0,
      next: page.next,
    }
  })
}

/** Marks the person's own notifications read, the ones named or all; a repeat changes nothing. */
async function markRead(deps: Deps, input: Of & { ids: readonly NotificationId[] | 'ALL' }) {
  await deps.database.command(scopeOf(input), async (tx) => {
    await admitted(deps, tx, input)
    await tx
      .update(notification)
      .set({ readAt: sql`statement_timestamp()` })
      .where(
        and(
          eq(notification.companyId, input.companyId),
          eq(notification.personId, input.person.id),
          isNull(notification.readAt),
          input.ids === 'ALL' ? undefined : inArray(notification.id, [...input.ids]),
        ),
      )
  })
}

/** The Hub's notifications (step 24.2, U2): what a run tells its owner, and what the bell reads. */
export function createNotifications(deps: Deps) {
  const notify: Notify = {
    async automationRan(ran) {
      const { companyId, automationId, runId } = ran
      const scope: Scope = { kind: 'COMPANY', companyId, personId: ran.personId }
      let summary: Awaited<ReturnType<typeof recorded>>
      try {
        summary = await recorded(deps, ran, scope)
      } catch (error) {
        // The Hub's database is the one that failed, so the owner stays unannounced; the run's
        // outcome is already the history's, and a throw here would only fail the step (card, failure table).
        logFailure(deps.log, databaseFailure(error), { companyId, automationId, runId })
        return
      }
      if (summary === undefined) return
      deps.log.info({ companyId, automationId, kind: summary.kind }, 'NOTIFICATION_CREATED')
      if (mails(ran)) await mailed(deps, ran, scope, summary)
    },
  }
  return Object.freeze({
    notify,
    list: (input: Of & { after: NotificationId | undefined }) => list(deps, input),
    markRead: (input: Of & { ids: readonly NotificationId[] | 'ALL' }) => markRead(deps, input),
  })
}

export type Notifications = ReturnType<typeof createNotifications>

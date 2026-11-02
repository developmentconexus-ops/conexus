import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import {
  AutomationId,
  AutomationRunId,
  CompanyId,
  ConversationId,
  PersonId,
} from '@conexus/hub-api'
import { MailApiUrl } from '../../platform/config.ts'
import { mailServer } from '../../platform/test-mail.ts'
import type { Hub, Person } from '../identity/test-hub.ts'
import { ANA_OWNER, call, hubWithLog, personOn, plantCompany } from '../identity/test-hub.ts'

type Ran = Parameters<Hub['notify']['automationRan']>[0]
type Next = { kind: 'END' } | { kind: 'MORE'; page: string }

/**
 * Empresa Teste with Ana its owner, on a Hub with no Builder behind the test: its log lines, and
 * its mail going to a fake of the provider.
 */
export async function notifying(t: TestContext) {
  const mail = await mailServer(t)
  const hub = await hubWithLog(t, (config) => ({
    ...config,
    mailApiUrl: MailApiUrl.parse(mail.url),
  }))
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id)
  return { hub, mail, ana, companyId, company: `/api/companies/${companyId}`, lines: hub.lines }
}

/**
 * A run that ended, as the workflow tells `Notify`, for a test that does not wait for the
 * schedule: the person's automation `Resumo de vendas` of the Início, fired by the schedule, done.
 */
export function endedRun(
  company: { companyId: string; ana: { id: string } },
  change: Partial<Ran> = {},
): Ran {
  const automation = `schedule_conexus-automation-${randomUUID()}`
  return {
    companyId: CompanyId.parse(company.companyId),
    personId: PersonId.parse(company.ana.id),
    automationId: AutomationId.parse(automation),
    name: 'Resumo de vendas',
    projectId: null,
    runId: AutomationRunId.parse(`sched_${automation}_${Date.now()}`),
    trigger: 'SCHEDULED',
    outcome: { kind: 'DONE', conversationId: ConversationId.parse(randomUUID()) },
    ...change,
  }
}

export type Bell = {
  notifications: {
    kind: string
    id: string
    read: boolean
    automation: { id: string; name: string }
    projectId: string | null
    conversationId?: string | null
    code?: string
  }[]
  unread: number
  next: Next
}

/** The person's notifications in the company, a page at a time, as the bell reads them. */
export async function bellOf(hub: Hub, person: Person, company: string, page?: string) {
  const read = await call(
    hub,
    person,
    'GET',
    `${company}/notifications${page ? `?page=${page}` : ''}`,
  )
  assert.equal(read.statusCode, 200, read.body)
  const bell: Bell = Object(read.json())
  return bell
}

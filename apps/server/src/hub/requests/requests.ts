import { randomUUID } from 'node:crypto'
import type { CompanyId, Decision, Person, PublishRequest, Role } from '@conexus/hub-api'
import { PersonId, ProjectId, RequestId } from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import type { CommandTx, Database, ReadTx, Scope } from '../../platform/database.ts'
import { violatedConstraint } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { CloseRequests, PublishInput, Ungranted } from '../apps/public.ts'
import { keptVersionOf, lockApp, publishIn } from '../apps/public.ts'
import type { IdentityPorts } from '../identity/public.ts'
import { member, personNameColumn } from '../identity/public.ts'
import { liveProjectOf, project } from '../projects/public.ts'
import { request } from './tables.ts'

/** Writes what a request tells its people; implemented by the notifications (step 24.3.4). */
export type NoticeRequests = (
  tx: CommandTx,
  notices: readonly {
    companyId: CompanyId
    personId: PersonId
    requestId: RequestId
    kind: 'REQUEST_OPENED' | 'REQUEST_DECIDED'
  }[],
) => Promise<void>

export type RequestDeps = {
  database: Database
  identity: Pick<IdentityPorts, 'admitMember' | 'allows' | 'membersAllowed'>
  ungranted: Ungranted
  noticeRequests: NoticeRequests
  log: FailureLog
}

const OPEN_KEY = 'request_open_key'
const ATTEMPT_KEY = 'request_attempt_key'

function scopeOf(person: Person, companyId: CompanyId): Scope {
  return { kind: 'COMPANY', companyId, personId: person.id }
}

/**
 * The name of a person who decided, while they are still a member of the request's company: one who
 * has left is no longer named (criterion 19).
 */
function memberNameColumn(personId: typeof request.decidedBy) {
  return sql<string | null>`case when exists (select 1 from ${member}
    where ${member.organizationId} = ${request.companyId} and ${member.userId} = ${personId})
    then ${personNameColumn(personId)} end`
}

/** What the bell reads of the request a notice names (`hub/notifications` joins it by id). */
export const NOTICE_VIEW = {
  projectId: request.projectId,
  projectName: sql<string>`(select ${project.name} from ${project} where ${project.id} = ${request.projectId})`,
  number: request.number,
  state: request.state,
  reason: request.reason,
  requestedByName: personNameColumn(request.requestedBy),
  decidedByName: memberNameColumn(request.decidedBy),
}

const VIEW = {
  id: request.id,
  number: request.number,
  message: request.message,
  requestedBy: request.requestedBy,
  requestedByName: personNameColumn(request.requestedBy),
  createdAt: request.createdAt,
}

type Row = {
  id: string
  number: number
  message: string
  requestedBy: string
  requestedByName: string | null
  createdAt: Date
}

function viewOf(
  deps: Pick<RequestDeps, 'identity'>,
  row: Row,
  reader: { personId: PersonId; role: Role },
): PublishRequest {
  const own = row.requestedBy === reader.personId
  return {
    id: RequestId.parse(row.id),
    number: row.number,
    message: row.message,
    requestedBy: { name: row.requestedByName ?? '' },
    createdAt: row.createdAt.toISOString(),
    mayDecide: !own && deps.identity.allows(reader.role, 'decideRequest'),
    mayCancel: own,
  }
}

export async function publishRequestOf(
  deps: Pick<RequestDeps, 'identity'>,
  tx: ReadTx,
  input: { companyId: CompanyId; projectId: ProjectId; personId: PersonId; role: Role },
): Promise<PublishRequest | null> {
  const [row] = await tx
    .select(VIEW)
    .from(request)
    .where(
      and(
        eq(request.companyId, input.companyId),
        eq(request.projectId, input.projectId),
        eq(request.state, 'PENDING'),
      ),
    )
  return row === undefined ? null : viewOf(deps, row, input)
}

type Asking = {
  person: Person
  companyId: CompanyId
  projectId: ProjectId
  number: number
  message: string
  attemptKey: string
}

/** The request this attempt already made; the same key with another body is another request (code C37). */
async function replayOf(tx: CommandTx, input: Asking): Promise<Row | undefined> {
  const [row] = await tx
    .select({ ...VIEW, projectId: request.projectId })
    .from(request)
    .where(and(eq(request.companyId, input.companyId), eq(request.attemptKey, input.attemptKey)))
  if (row === undefined) return undefined
  const same =
    row.projectId === input.projectId &&
    row.number === input.number &&
    row.message === input.message &&
    row.requestedBy === input.person.id
  if (!same) throw new Failure('IDEMPOTENCY_CONFLICT')
  return row
}

async function insertRequest(tx: CommandTx, input: Asking): Promise<Row> {
  try {
    const [row] = await tx
      .insert(request)
      .values({
        id: randomUUID(),
        attemptKey: input.attemptKey,
        companyId: input.companyId,
        requestedBy: input.person.id,
        projectId: input.projectId,
        kind: 'PUBLISH_APP_VERSION',
        number: input.number,
        message: input.message,
        state: 'PENDING',
        createdAt: sql`statement_timestamp()`,
      })
      .returning(VIEW)
    if (row === undefined) throw new Failure('INTERNAL_UNEXPECTED')
    return row
  } catch (error) {
    const violated = violatedConstraint(error)
    if (violated === OPEN_KEY) throw new Failure('PUBLISH_REQUEST_ALREADY_OPEN', { cause: error })
    if (violated === ATTEMPT_KEY) throw new Failure('IDEMPOTENCY_CONFLICT', { cause: error })
    throw error
  }
}

/**
 * The app is locked before the request is written, the order every publish and decision keeps (code
 * C65), so two requests at once queue and the unique index leaves one open.
 */
async function ask(deps: RequestDeps, input: Asking) {
  const { companyId, projectId } = input
  return deps.database.command(scopeOf(input.person, companyId), async (tx) => {
    const admitted = await deps.identity.admitMember({
      tx,
      personId: input.person.id,
      companyId,
      action: 'requestPublish',
    })
    if ((await liveProjectOf(tx, input)) === undefined)
      throw new Failure('NOT_FOUND', { details: { reason: 'NO_PROJECT' } })
    if (deps.identity.allows(admitted.role, 'publishAppVersion'))
      throw new Failure('PUBLISH_REQUEST_NOT_NEEDED')
    const held = await lockApp(tx, { companyId, projectId })
    const reader = { personId: input.person.id, role: admitted.role }
    const replay = await replayOf(tx, input)
    if (replay !== undefined) return { request: viewOf(deps, replay, reader), created: false }
    const kept = await keptVersionOf(tx, input)
    if (kept === undefined)
      throw new Failure('APP_VERSION_NOT_FOUND', { details: { number: input.number } })
    if (kept.id === held.publishedVersionId) throw new Failure('PUBLISH_REQUEST_ALREADY_LIVE')
    const row = await insertRequest(tx, input)
    const requestId = RequestId.parse(row.id)
    const deciders = await deps.identity.membersAllowed(tx, { companyId, action: 'decideRequest' })
    await deps.noticeRequests(
      tx,
      deciders.map((personId) => ({ companyId, personId, requestId, kind: 'REQUEST_OPENED' })),
    )
    return { request: viewOf(deps, row, reader), created: true }
  })
}

type OfRequest = { person: Person; companyId: CompanyId; requestId: RequestId }

async function heldRequest(tx: CommandTx, input: OfRequest) {
  const [row] = await tx
    .select({
      projectId: request.projectId,
      requestedBy: request.requestedBy,
      number: request.number,
      state: request.state,
    })
    .from(request)
    .where(and(eq(request.id, input.requestId), eq(request.companyId, input.companyId)))
    .for('update')
  return row
}

/**
 * The app is locked before the request (code C65). The decision is written before `publishIn`, so
 * its `closeRequests` finds no open request and neither closes it again nor tells the asker twice.
 */
async function decide(deps: RequestDeps, input: OfRequest & { decision: Decision }) {
  const { companyId, requestId, person } = input
  return deps.database.command(scopeOf(person, companyId), async (tx) => {
    await deps.identity.admitMember({
      tx,
      personId: person.id,
      companyId,
      action: 'decideRequest',
    })
    const [found] = await tx
      .select({ projectId: request.projectId })
      .from(request)
      .where(and(eq(request.id, requestId), eq(request.companyId, companyId)))
    if (found === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'NO_REQUEST' } })
    const projectId = ProjectId.parse(found.projectId)
    if ((await liveProjectOf(tx, { companyId, projectId })) === undefined)
      throw new Failure('NOT_FOUND', { details: { reason: 'NO_PROJECT' } })
    await lockApp(tx, { companyId, projectId })
    const row = await heldRequest(tx, input)
    if (row === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'NO_REQUEST' } })
    if (row.state !== 'PENDING') throw new Failure('PUBLISH_REQUEST_CLOSED')
    if (row.requestedBy === person.id) throw new Failure('PUBLISH_REQUEST_OWN')
    const state =
      input.decision.decision === 'APPROVE' ? ('APPROVED' as const) : ('DECLINED' as const)
    const reason = input.decision.decision === 'DECLINE' ? (input.decision.reason ?? null) : null
    await tx
      .update(request)
      .set({ state, decidedBy: person.id, reason })
      .where(eq(request.id, requestId))
    if (state === 'APPROVED') {
      const by = person.id
      await publishIn(tx, publishDeps(deps), { companyId, projectId, number: row.number, by })
    }
    const asker = PersonId.parse(row.requestedBy)
    await deps.noticeRequests(tx, [
      { companyId, personId: asker, requestId, kind: 'REQUEST_DECIDED' },
    ])
    return { state, projectId, number: row.number }
  })
}

/**
 * The asker is checked before the state, so another person gets the same not-found whether it is
 * open or closed (S10). It takes one lock, the request's row, so it forms no cycle with a publish.
 */
async function cancel(deps: RequestDeps, input: OfRequest) {
  const { companyId, person } = input
  await deps.database.command(scopeOf(person, companyId), async (tx) => {
    await deps.identity.admitMember({
      tx,
      personId: person.id,
      companyId,
      action: 'cancelRequest',
    })
    const row = await heldRequest(tx, input)
    if (row === undefined || row.requestedBy !== person.id)
      throw new Failure('NOT_FOUND', { details: { reason: 'NO_REQUEST' } })
    if (row.state !== 'PENDING') throw new Failure('PUBLISH_REQUEST_CLOSED')
    await tx.update(request).set({ state: 'CANCELLED' }).where(eq(request.id, input.requestId))
  })
}

function closeRequestsOf(deps: Pick<RequestDeps, 'noticeRequests' | 'log'>): CloseRequests {
  return async (tx, input: PublishInput) => {
    const { companyId, projectId } = input
    const [open] = await tx
      .select({ id: request.id, requestedBy: request.requestedBy, number: request.number })
      .from(request)
      .where(
        and(
          eq(request.companyId, companyId),
          eq(request.projectId, projectId),
          eq(request.state, 'PENDING'),
        ),
      )
      .for('update')
    if (open === undefined) return
    const outcome = open.number === input.number ? 'APPROVED' : 'SUPERSEDED'
    await tx
      .update(request)
      .set({ state: outcome, decidedBy: input.by })
      .where(eq(request.id, open.id))
    const requestId = RequestId.parse(open.id)
    if (open.requestedBy !== input.by) {
      const personId = PersonId.parse(open.requestedBy)
      await deps.noticeRequests(tx, [{ companyId, personId, requestId, kind: 'REQUEST_DECIDED' }])
    }
    deps.log.info(
      { companyId, projectId, requestId, by: input.by, outcome },
      'PUBLISH_REQUEST_CLOSED_BY_PUBLISH',
    )
  }
}

function publishDeps(deps: RequestDeps) {
  return { ungranted: deps.ungranted, closeRequests: closeRequestsOf(deps), log: deps.log }
}

export function createRequests(deps: RequestDeps) {
  return Object.freeze({
    ask: (input: Asking) => ask(deps, input),
    decide: (input: OfRequest & { decision: Decision }) => decide(deps, input),
    cancel: (input: OfRequest) => cancel(deps, input),
    closeRequests: closeRequestsOf(deps),
    publishRequestOf: (tx: ReadTx, input: Parameters<typeof publishRequestOf>[2]) =>
      publishRequestOf(deps, tx, input),
  })
}

export type Requests = ReturnType<typeof createRequests>

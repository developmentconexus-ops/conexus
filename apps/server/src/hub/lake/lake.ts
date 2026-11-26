import type { ClientLake, PersonId } from '@conexus/hub-api'
import { CompanyId } from '@conexus/hub-api'
import { and, eq, isNull } from 'drizzle-orm'
import type { AwsAnswer, LakeStacks, LakeTables, Where } from '../../platform/aws.ts'
import { bucketName, LakeId, StackId } from '../../platform/aws.ts'
import type { Config } from '../../platform/config.ts'
import { AwsAccount, AwsRegion, TemplateVersion } from '../../platform/config-aws.ts'
import type { CommandTx, Database, ReadTx } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { IdentityPorts, OperatorProof } from '../identity/public.ts'
import { newLakeId } from './lake-id.ts'
import { dropTables } from './lake-tables.ts'
import type { LakeState, Step } from './settle.ts'
import { settle } from './settle.ts'
import { companyLake } from './tables.ts'

export type LakeDeps = {
  database: Database
  identity: IdentityPorts
  aws: LakeStacks
  /** The lake's tables, which AWS refuses to drop the stack under. */
  tables: LakeTables
  /** The company's copies, their rows and clocks, once the tables are gone (hub/copies, injected: subjects do not import each other). */
  eraseCopies: (companyId: CompanyId) => Promise<void>
  config: Config
  log: FailureLog
}

/** The row as the Hub reads it, its ids parsed at the database's edge (C23, C27). */
type Lake = Readonly<{
  at: Where
  lakeId: LakeId
  state: LakeState
  template: TemplateVersion
  stackId: StackId | null
  since: Date
}>
type Scope = { kind: 'OPERATOR'; personId: PersonId; companyId: CompanyId }
type AwsCall =
  | 'CreateStack'
  | 'DescribeStacks'
  | 'DescribeStackEvents'
  | 'DeleteStack'
  | 'Leftover'
  | 'ListTables'
  | 'DeleteTable'

function scopeOf(personId: PersonId, companyId: CompanyId): Scope {
  return { kind: 'OPERATOR', personId, companyId }
}

async function lakeOf(tx: ReadTx, companyId: CompanyId, lock = false): Promise<Lake | undefined> {
  const query = tx.select().from(companyLake).where(eq(companyLake.companyId, companyId))
  const [row] = lock ? await query.for('update') : await query
  if (row === undefined) return undefined
  return {
    at: {
      company: CompanyId.parse(row.companyId),
      account: AwsAccount.parse(row.account),
      region: AwsRegion.parse(row.region),
    },
    lakeId: LakeId.parse(row.lakeId),
    state: row.state,
    template: TemplateVersion.parse(row.template),
    stackId: row.stackId === null ? null : StackId.parse(row.stackId),
    since: row.since,
  }
}

/** What the screen shows of the row (decision A). */
function viewOf(lake: Lake | undefined): ClientLake {
  if (lake === undefined) return { state: 'NONE' }
  const at = lake.since.toISOString()
  switch (lake.state) {
    case 'creating':
      return { state: 'CREATING', since: at }
    case 'ready':
      return {
        state: 'READY',
        bucket: bucketName(lake.lakeId),
        region: lake.at.region,
        readyAt: at,
      }
    case 'failed':
      return { state: 'FAILED', code: 'LAKE_CREATE_FAILED', at }
    case 'deleting':
      return { state: 'DELETING', since: at }
    case 'delete_failed':
      return { state: 'DELETE_FAILED', at }
    default:
      return lake.state satisfies never
  }
}

function moving(lake: Lake): boolean {
  return lake.state === 'creating' || lake.state === 'deleting'
}

/** Only the chosen fields reach the log: no sentence of AWS, no account (S41, criterion 54). */
function logged(deps: LakeDeps, lake: Lake, call: AwsCall, answer: AwsAnswer<unknown>): void {
  const fields = { companyId: lake.at.company, lakeId: lake.lakeId, call }
  if (answer.kind === 'NO_ANSWER') deps.log.error(fields, 'LAKE_AWS_SILENT')
  if (answer.kind === 'REFUSED')
    deps.log.error({ ...fields, code: answer.code }, 'LAKE_AWS_REFUSED')
}

/**
 * Moves the row from the state it was read in, so of two readers only one moves it (the failure
 * table); `undefined` deletes it. Then the row as it is now.
 */
async function moved(
  deps: LakeDeps,
  scope: Scope,
  lake: Lake,
  to: { state: LakeState; failure?: 'LAKE_CREATE_FAILED' } | undefined,
): Promise<Lake | undefined> {
  const same = and(
    eq(companyLake.companyId, lake.at.company),
    eq(companyLake.lakeId, lake.lakeId),
    eq(companyLake.state, lake.state),
  )
  return deps.database.command(scope, async (tx) => {
    if (to === undefined) await tx.delete(companyLake).where(same)
    else {
      const failure = to.failure ?? null
      await tx.update(companyLake).set({ state: to.state, failure, since: new Date() }).where(same)
    }
    return lakeOf(tx, lake.at.company)
  })
}

async function failed(deps: LakeDeps, scope: Scope, lake: Lake, cause?: object) {
  deps.log.error(
    { companyId: lake.at.company, lakeId: lake.lakeId, ...cause },
    'LAKE_CREATE_FAILED',
  )
  return moved(deps, scope, lake, { state: 'failed', failure: 'LAKE_CREATE_FAILED' })
}

/** The creation, sent again with the same token when the row has no stack yet (card L.4). */
async function sendCreate(deps: LakeDeps, scope: Scope, lake: Lake): Promise<Lake | undefined> {
  const answer = await deps.aws.create(lake.at, { id: lake.lakeId, template: lake.template })
  logged(deps, lake, 'CreateStack', answer)
  if (answer.kind === 'REFUSED') return failed(deps, scope, lake)
  if (answer.kind === 'NO_ANSWER') return lake
  return deps.database.command(scope, async (tx) => {
    await tx
      .update(companyLake)
      .set({ stackId: answer.value })
      .where(and(eq(companyLake.lakeId, lake.lakeId), isNull(companyLake.stackId)))
    return lakeOf(tx, lake.at.company)
  })
}

/**
 * The deletion, sent again while the row says `deleting`. A refusal reads the stack: one already
 * gone leaves (criterion 56), one still there goes to "Não deu para apagar" with its retry, never to
 * "Apagando…" for good (review of PR 1248, finding 6).
 */
async function sendDelete(deps: LakeDeps, scope: Scope, lake: Lake): Promise<Lake | undefined> {
  if (lake.stackId === null) return lake
  const stuck = await dropTables(deps, lake, (call, said) => logged(deps, lake, call, said))
  if (stuck !== null)
    return stuck.kind === 'REFUSED' ? moved(deps, scope, lake, { state: 'delete_failed' }) : lake
  const answer = await deps.aws.remove(lake.at, lake.stackId)
  logged(deps, lake, 'DeleteStack', answer)
  if (answer.kind !== 'REFUSED') return lake
  const status = await deps.aws.status(lake.at, lake.stackId)
  logged(deps, lake, 'DescribeStacks', status)
  if (status.kind !== 'DONE') return lake
  const step = settle(lake, status.value).do
  return applied(deps, scope, lake, step === 'RESEND_DELETE' ? 'DELETE_FAILED' : step)
}

/** The creation that failed: its first failed resource to the log, and the bucket it left (decision E). */
async function failure(deps: LakeDeps, scope: Scope, lake: Lake, stack: StackId) {
  const first = await deps.aws.firstFailure(lake.at, stack)
  logged(deps, lake, 'DescribeStackEvents', first)
  const left = await deps.aws.leftover(lake.at, { id: lake.lakeId, stack })
  logged(deps, lake, 'Leftover', left)
  if (left.kind === 'NO_ANSWER') return lake
  const fields = { companyId: lake.at.company, lakeId: lake.lakeId }
  if (left.kind === 'REFUSED') deps.log.error(fields, 'LAKE_LEFTOVER_REFUSED')
  if (left.kind === 'DONE' && left.value === 'DELETED')
    deps.log.info(fields, 'LAKE_LEFTOVER_DELETED')
  return failed(deps, scope, lake, first.kind === 'DONE' && first.value !== null ? first.value : {})
}

/** The one place a step of `settle` moves the row (C21); `undefined` when the lake left. */
async function applied(
  deps: LakeDeps,
  scope: Scope,
  lake: Lake,
  step: Step['do'],
): Promise<Lake | undefined> {
  const fields = { companyId: lake.at.company, lakeId: lake.lakeId }
  switch (step) {
    case 'KEEP':
      return lake
    case 'RESEND_CREATE':
      return sendCreate(deps, scope, lake)
    case 'READY':
      deps.log.info(fields, 'LAKE_READY')
      return moved(deps, scope, lake, { state: 'ready' })
    case 'FAIL':
      return lake.stackId === null ? lake : failure(deps, scope, lake, lake.stackId)
    case 'RESEND_DELETE':
      return sendDelete(deps, scope, lake)
    case 'GONE':
      deps.log.info(fields, 'LAKE_DELETED')
      return moved(deps, scope, lake, undefined)
    case 'DELETE_FAILED':
      return moved(deps, scope, lake, { state: 'delete_failed' })
    default:
      return step satisfies never
  }
}

/** Reads the stack of a moving row and settles the row by it (card L.12); `undefined` when it left. */
async function settled(deps: LakeDeps, scope: Scope, lake: Lake): Promise<Lake | undefined> {
  if (lake.stackId === null) return applied(deps, scope, lake, settle(lake, null).do)
  const status = await deps.aws.status(lake.at, lake.stackId)
  logged(deps, lake, 'DescribeStacks', status)
  if (status.kind !== 'DONE') return lake
  return applied(deps, scope, lake, settle(lake, status.value).do)
}

async function known(deps: LakeDeps, tx: ReadTx, admitted: OperatorProof, companyId: CompanyId) {
  const name = await deps.identity.companyNameOf(tx, { admitted, companyId })
  if (name === undefined) throw new Failure('NOT_FOUND')
  return name
}

type Input = { person: PersonId; companyId: CompanyId }

/** The lake as the Central reads it: a moving one is settled against its stack, a still one is not. */
async function read(deps: LakeDeps, input: Input): Promise<ClientLake> {
  const scope = scopeOf(input.person, input.companyId)
  const lake = await deps.database.read(scope, async (tx) => {
    const personId = input.person
    const admitted = await deps.identity.admitOperator({ tx, personId, action: 'operateClients' })
    await known(deps, tx, admitted, input.companyId)
    return lakeOf(tx, input.companyId)
  })
  if (lake === undefined || !moving(lake)) return viewOf(lake)
  return viewOf(await settled(deps, scope, lake))
}

/** A new try's row: a new id, this image's template, no stack, no failure (card L.4). */
async function started(deps: LakeDeps, tx: CommandTx, input: Input, before: Lake | undefined) {
  const lakeId = newLakeId()
  const fresh = { lakeId, state: 'creating' as const, template: deps.config.aws.templateVersion }
  const reset = { ...fresh, stackId: null, failure: null, since: new Date() } as const
  if (before === undefined) {
    const { account, region } = deps.config.aws
    await tx.insert(companyLake).values({ ...reset, companyId: input.companyId, account, region })
  } else await tx.update(companyLake).set(reset).where(eq(companyLake.companyId, input.companyId))
  deps.log.info({ companyId: input.companyId, lakeId }, 'LAKE_CREATE_REQUESTED')
  return lakeOf(tx, input.companyId)
}

/**
 * Creates under the company's lock, with no lock held while AWS answers (data D22): a second
 * click finds the row and answers the same lake.
 */
async function create(deps: LakeDeps, input: Input): Promise<ClientLake> {
  const scope = scopeOf(input.person, input.companyId)
  const begun = await deps.database.command(scope, async (tx) => {
    await deps.identity.lockCompany(tx, input.companyId)
    const personId = input.person
    const admitted = await deps.identity.admitOperator({ tx, personId, action: 'createClientLake' })
    await known(deps, tx, admitted, input.companyId)
    if (await deps.identity.markedDeleting(tx, input.companyId)) {
      throw new Failure('NOT_FOUND', { details: { reason: 'DELETING' } })
    }
    const before = await lakeOf(tx, input.companyId, true)
    if (before?.state === 'creating' || before?.state === 'ready')
      return { lake: before, fresh: false }
    if (before !== undefined && before.state !== 'failed') throw new Failure('LAKE_BUSY')
    return { lake: await started(deps, tx, input, before), fresh: true }
  })
  if (!begun.fresh || begun.lake === undefined) return viewOf(begun.lake)
  return viewOf(await sendCreate(deps, scope, begun.lake))
}

/** Deletes at once and for good, by the company's name (decision B); the read settles the rest. */
async function remove(deps: LakeDeps, input: Input & { name: string }): Promise<ClientLake> {
  const scope = scopeOf(input.person, input.companyId)
  const lake = await deps.database.command(scope, async (tx) => {
    await deps.identity.lockCompany(tx, input.companyId)
    const personId = input.person
    const admitted = await deps.identity.admitOperator({ tx, personId, action: 'deleteClientLake' })
    if ((await known(deps, tx, admitted, input.companyId)) !== input.name) {
      throw new Failure('CLIENT_NAME_MISMATCH')
    }
    const before = await lakeOf(tx, input.companyId, true)
    if (before === undefined) return undefined
    if (before.state !== 'ready' && before.state !== 'delete_failed') throw new Failure('LAKE_BUSY')
    await tx
      .update(companyLake)
      .set({ state: 'deleting', since: new Date() })
      .where(eq(companyLake.companyId, input.companyId))
    deps.log.info({ companyId: input.companyId, lakeId: before.lakeId }, 'LAKE_DELETE_REQUESTED')
    return lakeOf(tx, input.companyId)
  })
  if (lake !== undefined) await sendDelete(deps, scope, lake)
  return viewOf(lake)
}

type Of = { admitted: OperatorProof; companyId: CompanyId }

/**
 * The lake in the client's deletion (card L.13), each try the read's own settling first: a ready or
 * undeleted one is sent its deletion, a failed one leaves at once, a moving one is waited for.
 */
async function release(deps: LakeDeps, input: Of): Promise<'GONE' | 'PENDING'> {
  const scope = scopeOf(input.admitted.personId, input.companyId)
  const read = await deps.database.read(scope, (tx) => lakeOf(tx, input.companyId))
  const lake = read !== undefined && moving(read) ? await settled(deps, scope, read) : read
  if (lake === undefined) return 'GONE'
  if (lake.state === 'failed')
    return (await moved(deps, scope, lake, undefined)) ? 'PENDING' : 'GONE'
  if (lake.state === 'ready' || lake.state === 'delete_failed') {
    const deleting = await moved(deps, scope, lake, { state: 'deleting' })
    if (deleting !== undefined) await sendDelete(deps, scope, deleting)
  }
  return 'PENDING'
}

export function createLake(deps: LakeDeps) {
  return Object.freeze({
    read: (input: Input) => read(deps, input),
    create: (input: Input) => create(deps, input),
    remove: (input: Input & { name: string }) => remove(deps, input),
    outside: Object.freeze({
      has: async (tx: ReadTx, input: Of) => (await lakeOf(tx, input.companyId)) !== undefined,
      release: (input: Of) => release(deps, input),
    }),
  })
}

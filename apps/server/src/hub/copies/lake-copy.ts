import type { CompanyId, ConnectionId, ConnectorId, PersonId, SetLakeCopy } from '@conexus/hub-api'
import { and, eq, isNull } from 'drizzle-orm'
import type { AwsAnswer, CopyTasks, LakeStacks, LakeTables } from '../../platform/aws.ts'
import { StackName, stackName } from '../../platform/aws.ts'
import type { CommandTx, Database } from '../../platform/database.ts'
import { transactionLock, violatedConstraint, violatedReference } from '../../platform/database.ts'
import type { FailureLog, Scalar } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { LakeArea } from '../../platform/lake-areas.ts'
import type { CopyColumn, CopySource, CopyTable } from '../connectors/public.ts'
import type { IdentityPorts } from '../identity/public.ts'
import type { CompanyScope } from './lake-close.ts'
import { companyScope, lakeOf } from './lake-close.ts'
import type { Added, Plan, Row } from './lake-copy-write.ts'
import { dropCopy, writePlan } from './lake-copy-write.ts'
import type { LakeRuns, StartClock } from './lake-run.ts'
import type { ScheduledCopy } from './lake-schedule.ts'
import { lakeCopy, lakeRun, lakeTable } from './tables.ts'

export const COPY_TIMEZONE = 'America/Sao_Paulo'

const TODAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: COPY_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function todayOf(now: Date): string {
  return TODAY.format(now)
}

const READY_STACK = new Set<string>(['CREATE_COMPLETE', 'UPDATE_COMPLETE'])
/** The areas that hold a table of a copy's name: the copy's two and its treated one. */
const AREAS_OF_A_COPY = ['raw', 'current', 'tratado'] as const satisfies readonly LakeArea[]

/** What the copy's writing asks of the connection's clock: it only says when. */
export type CopyClock = {
  set(copy: ScheduledCopy): Promise<void>
  remove(connection: ConnectionId): Promise<void>
  /** The common clock's next fire, or null when the connection has none (MANUAL). */
  next(connection: ConnectionId): Promise<Date | null>
  /** The next full pass, or null when none runs. */
  fullNext(connection: ConnectionId): Promise<Date | null>
}

export type LakeCopyDeps = {
  database: Database
  identity: IdentityPorts
  source: CopySource
  runs: Pick<LakeRuns, 'iniciarRodada' | 'closeLakeRun'>
  tasks: Pick<CopyTasks, 'deleteRun' | 'stop' | 'state' | 'find'>
  clock: CopyClock
  stacks: Pick<LakeStacks, 'status'>
  tables: LakeTables
  log: FailureLog
  /** The machine's clock; a test's own (T20). */
  now?: () => Date
  /** The clock a leave waits for its task to stop on; the machine's by default, a test's own (T20). */
  stopWait?: StartClock | undefined
}

export type Marker = Readonly<{
  person: PersonId
  companyId: CompanyId
  connectionId: ConnectionId
}>

type State = Readonly<{
  copy: (Pick<Plan, 'interval' | 'startDate' | 'fullPass'> & { createdAt: Date }) | undefined
  tables: readonly Row[]
  taken: ReadonlySet<string>
  runOpen: boolean
  lake: Awaited<ReturnType<typeof lakeOf>>
}>

async function stateOf(tx: CommandTx, at: Marker): Promise<State> {
  const [copy] = await tx
    .select({
      interval: lakeCopy.interval,
      startDate: lakeCopy.startDate,
      fullPass: lakeCopy.fullPass,
      createdAt: lakeCopy.createdAt,
    })
    .from(lakeCopy)
    .where(eq(lakeCopy.connectionId, at.connectionId))
  const all = await tx
    .select({
      id: lakeTable.id,
      source: lakeTable.sourceTable,
      name: lakeTable.name,
      connection: lakeTable.connectionId,
    })
    .from(lakeTable)
  const [open] = await tx
    .select({ id: lakeRun.id })
    .from(lakeRun)
    .where(and(eq(lakeRun.connectionId, at.connectionId), isNull(lakeRun.endedAt)))
  return {
    copy,
    tables: all.filter((row) => row.connection === at.connectionId),
    taken: new Set(
      all.filter((row) => row.connection !== at.connectionId).map((row) => row.name.toLowerCase()),
    ),
    runOpen: open !== undefined,
    lake: await lakeOf(tx, at.companyId),
  }
}

/** The connection a copy is written for: its connector and the tables the kit declares for it. */
type Declared = Readonly<{ connector: ConnectorId; tables: readonly CopyTable[] }>
function tableOf(
  rule: Pick<CopySource, 'nameIsValid'>,
  found: Declared,
  declared: ReadonlyMap<string, CopyTable>,
  marked: ReadonlyMap<string, Row>,
  sources: Set<string>,
  { source, name }: SetLakeCopy['tables'][number],
): Added | undefined {
  const declaration = declared.get(source)
  if (declaration === undefined) throw new Failure('COPY_TABLE_NOT_DECLARED')
  if (sources.has(source))
    throw new Failure('REQUEST_MALFORMED', { details: { reason: 'DUPLICATE' } })
  sources.add(source)
  if (!rule.nameIsValid(found.connector, name)) throw new Failure('COPY_NAME_INVALID')
  const own = marked.get(source)
  if (own === undefined) return { declaration, source, name }
  if (own.name !== name) throw new Failure('COPY_NAME_FIXED')
  return undefined
}

function claim(names: Set<string>, name: string): void {
  if (names.has(name.toLowerCase())) throw new Failure('COPY_NAME_TAKEN')
  names.add(name.toLowerCase())
}

function planOf(
  rule: Pick<CopySource, 'nameIsValid'>,
  state: State,
  found: Declared,
  body: SetLakeCopy,
  today: string,
): Plan {
  if (body.startDate !== null && body.startDate > today)
    throw new Failure('COPY_START_DATE_INVALID')
  const declared = new Map(found.tables.map((table) => [table.source, table]))
  const marked = new Map(state.tables.map((row) => [row.source, row]))
  const sources = new Set<string>()
  const names = new Set<string>()
  const add: Added[] = []
  for (const entry of body.tables) {
    const added = tableOf(rule, found, declared, marked, sources, entry)
    if (added !== undefined) add.push(added)
    claim(names, entry.name)
  }
  for (const { name } of add)
    if (state.taken.has(name.toLowerCase())) throw new Failure('COPY_NAME_TAKEN')
  const remove = state.tables.filter((row) => !sources.has(row.source))
  const { interval, startDate, fullPass } = body
  return { add, remove, interval, startDate, fullPass }
}

export function awsDown(
  log: FailureLog,
  at: Pick<Marker, 'companyId'> & Partial<Pick<Marker, 'connectionId'>>,
  call: string,
  answer: AwsAnswer<unknown>,
): never {
  const said: Record<string, Scalar> = { companyId: at.companyId, call, answer: answer.kind }
  if (at.connectionId !== undefined) said.connectionId = at.connectionId
  log.error(
    answer.kind === 'REFUSED' ? { ...said, code: answer.code } : said,
    'COPY_AWS_UNAVAILABLE',
  )
  throw new Failure('COPY_AWS_UNAVAILABLE')
}

async function ensureReady(deps: LakeCopyDeps, at: Marker, lake: State['lake']) {
  if (lake === null || !lake.ready) throw new Failure('COPY_LAKE_NOT_READY')
  const status = await deps.stacks.status(lake.where, StackName.parse(stackName(lake.lakeId)))
  if (status.kind === 'NO_ANSWER') return awsDown(deps.log, at, 'DescribeStacks', status)
  if (status.kind === 'REFUSED' || !READY_STACK.has(status.value)) {
    deps.log.info({ companyId: at.companyId, connectionId: at.connectionId }, 'COPY_LAKE_NOT_READY')
    throw new Failure('COPY_LAKE_NOT_READY')
  }
}

/**
 * An unmarked table's three areas and its stopping point, the AWS first and the row after: a table
 * or a point AWS does not have counts as gone, so a repeat ends what an interrupted one began.
 * Nothing is dropped under an open round.
 */
export async function dropTables(
  deps: Pick<LakeCopyDeps, 'tables' | 'log'>,
  at: Pick<Marker, 'companyId' | 'connectionId'>,
  lake: NonNullable<State['lake']>,
  removed: readonly Pick<Row, 'name'>[],
) {
  for (const { name } of removed) {
    for (const namespace of AREAS_OF_A_COPY) {
      const answer = await deps.tables.drop(lake.where, lake.lakeId, { namespace, name })
      if (answer.kind !== 'DONE') awsDown(deps.log, at, 'DeleteTable', answer)
    }
    const point = await deps.tables.forget(lake.where, at.connectionId, name)
    if (point.kind !== 'DONE') awsDown(deps.log, at, 'ForgetStoppingPoint', point)
  }
}

function dictionaryColumns(read: Awaited<ReturnType<CopySource['columns']>>) {
  return read.kind === 'READ' ? read.columns : new Map<string, readonly CopyColumn[]>()
}

async function written(
  deps: LakeCopyDeps,
  scope: CompanyScope & { personId: PersonId },
  at: Marker,
  plan: Plan,
  columns: ReadonlyMap<string, readonly CopyColumn[]>,
  connector: ConnectorId,
) {
  try {
    return await deps.database.command(scope, async (tx) => {
      await transactionLock(tx, `conexus.lake-copy:${at.connectionId}`)
      await deps.identity.admitMember({
        tx,
        personId: at.person,
        companyId: at.companyId,
        action: 'manageCopies',
      })
      const state = await stateOf(tx, at)
      if (plan.remove.length > 0 && state.runOpen) throw new Failure('COPY_RUN_OPEN')
      const kept = state.tables.length - plan.remove.length + plan.add.length
      if (kept === 0) {
        await dropCopy(tx, at.connectionId, state.copy)
        return { kept, copy: undefined }
      }
      const copy = await writePlan(tx, { at, plan, existing: state.copy, connector }, columns)
      return { kept, copy }
    })
  } catch (error) {
    if (violatedConstraint(error) === 'lake_table_name_key')
      throw new Failure('COPY_NAME_TAKEN', { cause: error })
    if (violatedReference(error) === 'lake_copy_connection_fkey')
      throw new Failure('NOT_FOUND', { details: { reason: 'CONNECTION' }, cause: error })
    throw error
  }
}

async function dictionaryOf(deps: LakeCopyDeps, at: Marker, plan: Plan) {
  if (plan.add.length === 0) return new Map<string, readonly CopyColumn[]>()
  return dictionaryColumns(await deps.source.columns(at))
}

async function dropUnmarked(deps: LakeCopyDeps, at: Marker, state: State, plan: Plan) {
  if (plan.remove.length === 0) return
  if (state.runOpen) throw new Failure('COPY_RUN_OPEN')
  if (state.lake !== null) await dropTables(deps, at, state.lake, plan.remove)
}

/**
 * Writes a connection's copy: the request checked, the unmarked tables
 * dropped in AWS, then the copy and its rows in one transaction; after it, the clocks (none under
 * MANUAL) and, if a table was born, one round that reads it whole. Changing only the
 * date, the interval or the full pass starts nothing. The last table unmarked takes the copy and
 * its clocks.
 */
export function createLakeCopy(deps: LakeCopyDeps) {
  const now = deps.now ?? (() => new Date())
  return Object.freeze({
    async set(at: Marker, body: SetLakeCopy, found: Declared): Promise<void> {
      const scope = { kind: 'COMPANY', companyId: at.companyId, personId: at.person } as const
      const state = await deps.database.command(scope, async (tx) => {
        await deps.identity.admitMember({
          tx,
          personId: at.person,
          companyId: at.companyId,
          action: 'manageCopies',
        })
        return stateOf(tx, at)
      })
      const plan = planOf(deps.source, state, found, body, todayOf(now()))
      if (plan.add.length > 0) await ensureReady(deps, at, state.lake)
      await dropUnmarked(deps, at, state, plan)
      const dictionary = await dictionaryOf(deps, at, plan)
      const done = await written(deps, scope, at, plan, dictionary, found.connector)
      if (done.copy === undefined) {
        await deps.clock.remove(at.connectionId)
        return
      }
      await deps.clock.set({
        companyId: at.companyId,
        connectionId: at.connectionId,
        interval: plan.interval,
        fullPass: plan.fullPass,
        anchor: done.copy.createdAt,
      })
      if (plan.add.length > 0)
        await deps.runs.iniciarRodada(companyScope(at.companyId), at.connectionId, 'NOW')
    },
  })
}

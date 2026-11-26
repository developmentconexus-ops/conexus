import type { CompanyId } from '@conexus/hub-api'
import { TreatmentRunId } from '@conexus/hub-api'
import { databaseFailure } from '../../platform/database.ts'
import { logFailure } from '../../platform/failure.ts'
import { companiesWithConnections } from '../connectors/public.ts'
import type { CompanyScope, StartClock, TreatmentHooks } from '../copies/public.ts'
import { companyScope, MACHINE_CLOCK } from '../copies/public.ts'
import { TreatTaskResult } from './treat-task.ts'
import type { OpenAnswer, OpenAsk, OpenCause, TreatmentEnd } from './treatment-rows.ts'
import { closedIn, companyOfRun, openIn, openRunsOf } from './treatment-rows.ts'
import type { TreatmentRunDeps } from './treatment-start.ts'
import { startRun } from './treatment-start.ts'
import { sweepTreatment } from './treatment-sweep.ts'

export type { TreatmentEnd } from './treatment-rows.ts'
export type { TreatmentRunDeps } from './treatment-start.ts'

const RUN_STALE_SECONDS = 48 * 60 * 60
/** Opening tries again when the open run closed between the insert and the append to its `pending`. */
const OPEN_TRIES = 3

/** The runs' state: the starts in flight, which the sweeper leaves alone, and their promises. */
type Line = Readonly<{
  deps: TreatmentRunDeps
  clock: StartClock
  starting: Set<string>
  pending: Set<Promise<void>>
}>

function fieldsOf(companyId: CompanyId, run: TreatmentRunId) {
  return { companyId, runId: run }
}

function launched(line: Line, at: CompanyScope, run: TreatmentRunId) {
  line.deps.watch().opened(at.companyId, run, 'TREATMENT')
  line.starting.add(run)
  const starting = {
    ...line,
    close: (a: CompanyScope, r: TreatmentRunId, end: TreatmentEnd) => close(line, a, r, end),
  }
  const job: Promise<void> = startRun(starting, at, run)
    .catch((error: unknown) => logFailure(line.deps.log, databaseFailure(error)))
    .finally(() => {
      line.starting.delete(run)
      line.pending.delete(job)
    })
  line.pending.add(job)
}

function swept(line: Line, at: CompanyScope) {
  const sweep = { ...line.deps, starting: line.starting, staleSeconds: RUN_STALE_SECONDS }
  return sweepTreatment({ ...sweep, close: (a, r, end) => close(line, a, r, end) }, at)
}

function told(line: Line, at: CompanyScope, cause: OpenCause, answer: OpenAnswer) {
  if (answer.kind === 'OPENED') {
    line.deps.log.info({ ...fieldsOf(at.companyId, answer.run), cause }, 'TREATMENT_RUN_OPENED')
    launched(line, at, answer.run)
  }
  if (answer.kind === 'COALESCED')
    line.deps.log.info(fieldsOf(at.companyId, answer.run), 'TREATMENT_RUN_COALESCED')
  return answer
}

async function opened(line: Line, at: CompanyScope, ask: OpenAsk): Promise<OpenAnswer> {
  const { deps } = line
  await swept(line, at)
  for (let attempt = 1; ; attempt += 1) {
    const answer = await deps.database.command(at, (tx) => openIn(deps, tx, at.companyId, ask))
    if (answer !== null) return told(line, at, ask.cause, answer)
    if (attempt === OPEN_TRIES) {
      deps.log.error({ companyId: at.companyId, attempts: attempt }, 'TREATMENT_RUN_NOT_OPENED')
      return { kind: 'NOTHING_TO_TREAT' }
    }
  }
}

function countsOf(end: TreatmentEnd) {
  const models = end.kind === 'RESULT' ? end.result.models : []
  function counted(status: string) {
    return models.filter((model) => model.status === status).length
  }
  return { built: counted('BUILT'), failed: counted('FAILED'), skipped: counted('SKIPPED') }
}

async function close(
  line: Line,
  at: CompanyScope,
  run: TreatmentRunId,
  end: TreatmentEnd,
): Promise<'CLOSED' | 'ALREADY_CLOSED'> {
  const { deps } = line
  const { companyId } = at
  const closed = await deps.database.command(at, (tx) =>
    closedIn(deps, tx, { companyId, run, end }),
  )
  if (closed === null) return 'ALREADY_CLOSED'
  deps.watch().ended(run)
  deps.log.info(
    {
      ...fieldsOf(companyId, run),
      ...{ cause: end.kind, state: closed.state.state },
      ...(closed.state.failure === null ? {} : { failure: closed.state.failure }),
      ...countsOf(end),
    },
    'TREATMENT_RUN_CLOSED',
  )
  if (closed.next !== null) {
    deps.log.info({ ...fieldsOf(companyId, closed.next), cause: 'COPY' }, 'TREATMENT_RUN_OPENED')
    launched(line, at, closed.next)
  }
  return 'CLOSED'
}

function hooksOf(line: Line): TreatmentHooks {
  return {
    afterCopy: (companyId, copied) =>
      opened(line, companyScope(companyId), {
        cause: 'COPY',
        changed: copied.map((table) => ({ layer: 'current', table })),
      }),
    openRuns: () => openRunsOf(line.deps.database),
    companyOf: (run) => companyOfRun(line.deps.database, run),
    async closeResult(companyId, body) {
      const read = TreatTaskResult.safeParse(body)
      if (!read.success) return 'UNREADABLE'
      const end = { kind: 'RESULT', result: read.data } as const
      await close(line, companyScope(companyId), read.data.runId, end)
      return 'DONE'
    },
    async closeLost(companyId, run) {
      const end = { kind: 'LOST', cause: 'ECS_STOPPED' } as const
      await close(line, companyScope(companyId), TreatmentRunId.parse(run), end)
    },
  }
}

async function sweptAll(line: Line) {
  for (const companyId of await companiesWithConnections(line.deps.database))
    await swept(line, companyScope(companyId))
}

/**
 * The company's treatment runs: one open at a time, by the open-run index; a copy that ends while
 * one is open adds its tables to that run's `pending`, and the run's close opens the next by them
 * in the same transaction, unless a person stopped it (decision F14).
 */
export function createTreatmentRuns(deps: TreatmentRunDeps) {
  const clock = deps.clock ?? MACHINE_CLOCK
  const line: Line = { deps, clock, starting: new Set(), pending: new Set() }
  return Object.freeze({
    hooks: hooksOf(line),
    /** Tratar agora: a run of every model of the company. */
    now: (at: CompanyScope) => opened(line, at, { cause: 'NOW' }),
    close: (at: CompanyScope, run: TreatmentRunId, end: TreatmentEnd) => close(line, at, run, end),
    /** The runs whose task the Hub lost while it was down; a failure is logged, never thrown. */
    sweepAll: () =>
      sweptAll(line).catch((error: unknown) => logFailure(deps.log, databaseFailure(error))),
    /** Resolves when every start has ended: a test's wait, and the Hub's end. */
    async idle(): Promise<void> {
      while (line.pending.size > 0) await Promise.all(line.pending)
    },
  })
}

export type TreatmentRuns = ReturnType<typeof createTreatmentRuns>

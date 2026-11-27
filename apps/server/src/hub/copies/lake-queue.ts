import { setTimeout as sleep } from 'node:timers/promises'
import type { CompanyId, LakeRunMachine } from '@conexus/hub-api'
import { LakeRunId, SYSTEM_MESSAGE_MAX } from '@conexus/hub-api'
import { eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import type { CopyQueue, CopyTasks } from '../../platform/aws.ts'
import { TaskArn } from '../../platform/aws.ts'
import { COPY_CONTAINER } from '../../platform/aws-names.ts'
import type { Database } from '../../platform/database.ts'
import { databaseFailure } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { logFailure } from '../../platform/failure.ts'
import type { CloseCause, RunEnd, RunTableCounts, TreatmentHooks } from './lake-close.ts'
import { closeLakeRun, companyScope, RESULT_GRACE_MS } from './lake-close.ts'
import { takeProgress } from './lake-progress.ts'
import { CopyTaskProgress, CopyTaskResult } from './lake-task.ts'
import { lakeRun } from './tables.ts'

/** A treatment round's result as the queue sees it: its run, the rest read by the treatment. */
const TreatResultEnvelope = z.looseObject({ type: z.literal('TREAT_RESULT'), runId: z.uuid() })

/**
 * What reaches the queue, once read: a copy's scoreboard or a copy's or a treatment's result, or
 * ECS's stop of a round's task, whose `runId` is the round of either.
 */
const CopyQueueMessage = z.discriminatedUnion('type', [
  CopyTaskProgress,
  CopyTaskResult,
  TreatResultEnvelope,
  z.object({
    type: z.literal('ECS_STOPPED'),
    runId: z.uuid(),
    task: TaskArn,
    stopCode: z.string(),
    exitCode: z.int().nullable(),
    /** ECS's own sentence for the stop, with the container's when it gives one. */
    stoppedReason: z.string().nullable(),
  }),
])
type CopyQueueMessage = z.infer<typeof CopyQueueMessage>

const EcsStopped = z
  .object({
    source: z.literal('aws.ecs'),
    'detail-type': z.literal('ECS Task State Change'),
    detail: z.object({
      lastStatus: z.literal('STOPPED'),
      startedBy: z.uuid(),
      taskArn: TaskArn,
      stopCode: z.string(),
      stoppedReason: z.string().optional(),
      containers: z.array(
        z.object({ name: z.string(), exitCode: z.int().optional(), reason: z.string().optional() }),
      ),
    }),
  })
  .transform(({ detail }): CopyQueueMessage => {
    const container = detail.containers.find(({ name }) => name === COPY_CONTAINER)
    const sentences = [detail.stoppedReason, container?.reason].filter(
      (sentence) => sentence !== undefined,
    )
    return {
      type: 'ECS_STOPPED',
      runId: detail.startedBy,
      task: detail.taskArn,
      stopCode: detail.stopCode,
      exitCode: container?.exitCode ?? null,
      stoppedReason:
        sentences.length === 0 ? null : sentences.join(': ').slice(0, SYSTEM_MESSAGE_MAX),
    }
  })

const QueueEntry = z.union([CopyTaskProgress, CopyTaskResult, TreatResultEnvelope, EcsStopped])

/** ECS's `stopCode` for a `StopTask`: only the Hub stops a copy's task. */
const STOPPED_BY_THE_HUB = 'UserInitiated'
const LOST: RunEnd = { kind: 'ERROR', code: 'COPY_TASK_LOST', table: null, system: null }
const RECEIVE_RETRY_MS = 5_000

function readEntry(body: string): CopyQueueMessage | null {
  try {
    const read = QueueEntry.safeParse(JSON.parse(body))
    return read.success ? read.data : null
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error
    return null
  }
}

type RoundMessage = Exclude<CopyQueueMessage, { type: 'TREAT_RESULT' | 'PROGRESS' }>

function endOf(message: RoundMessage): Readonly<{
  end: RunEnd
  tables: readonly RunTableCounts[]
  cause: CloseCause
  machine?: LakeRunMachine | null
}> {
  if (message.type === 'RESULT') {
    const { outcome: end, tables, machine = null } = message
    return { end, tables, cause: 'RESULT', machine }
  }
  const lost: RunEnd = {
    kind: 'ERROR',
    code: 'COPY_TASK_LOST',
    table: null,
    system:
      message.stoppedReason === null
        ? null
        : { status: null, code: null, message: message.stoppedReason },
  }
  const end: RunEnd = message.stopCode === STOPPED_BY_THE_HUB ? { kind: 'INTERRUPTED' } : lost
  return { end, tables: [], cause: 'ECS_STOPPED' }
}

function exitedWell(message: CopyQueueMessage): boolean {
  return message.type === 'ECS_STOPPED' && message.exitCode === 0
}

/** Within one batch the results go first: a standard queue keeps no order between them. */
function stopsLast(a: { entry: CopyQueueMessage | null }, b: { entry: CopyQueueMessage | null }) {
  return Number(a.entry?.type === 'ECS_STOPPED') - Number(b.entry?.type === 'ECS_STOPPED')
}

type Kind = 'COPY' | 'TREATMENT'
type Open = Readonly<{ companyId: CompanyId; kind: Kind }>

type RunWatch = Readonly<{
  opened(companyId: CompanyId, run: string, kind?: Kind): void
  ended(run: string): void
}>

export type LakeQueueDeps = {
  database: Database
  tasks: CopyTasks
  queue: CopyQueue
  log: FailureLog
  /** The companies with a connection, read by the Hub's own login. */
  companies: () => Promise<readonly CompanyId[]>
  /** The clock of the result's grace; the machine's by default. */
  clock?: Readonly<{ now(): number }>
  /** The treatment's rounds, read from the same queue; none in a Hub without the treatment. */
  treatment?: () => TreatmentHooks
}

async function openRuns(deps: LakeQueueDeps): Promise<Map<string, Open>> {
  const found = new Map<string, Open>()
  for (const companyId of await deps.companies()) {
    const rows = await deps.database.read(companyScope(companyId), (tx) =>
      tx.select({ id: lakeRun.id }).from(lakeRun).where(isNull(lakeRun.endedAt)),
    )
    for (const row of rows) found.set(row.id, { companyId, kind: 'COPY' })
  }
  for (const [run, companyId] of (await deps.treatment?.().openRuns()) ?? [])
    found.set(run, { companyId, kind: 'TREATMENT' })
  return found
}

/** The round's company, by its id in the copy's rounds and then in the treatment's. */
async function roundOf(deps: LakeQueueDeps, run: string): Promise<Open | undefined> {
  for (const companyId of await deps.companies()) {
    const [row] = await deps.database.read(companyScope(companyId), (tx) =>
      tx.select({ id: lakeRun.id }).from(lakeRun).where(eq(lakeRun.id, run)),
    )
    if (row !== undefined) return { companyId, kind: 'COPY' }
  }
  const companyId = await deps.treatment?.().companyOf(run)
  return companyId === undefined ? undefined : { companyId, kind: 'TREATMENT' }
}

type Held = Readonly<{
  deps: LakeQueueDeps
  closing: LakeQueueDeps & { watch: RunWatch }
  open: Map<string, Open>
  resultDeadlines: Map<string, number>
}>

/** A result reaches only a round of its own kind; ECS's stop, either. */
function ofKind(kind: Kind, entry: CopyQueueMessage): boolean {
  if (entry.type === 'ECS_STOPPED') return true
  return (entry.type === 'TREAT_RESULT') === (kind === 'TREATMENT')
}

async function treatmentEnd(held: Held, round: Open, entry: CopyQueueMessage) {
  const treatment = held.deps.treatment?.()
  if (treatment === undefined) return
  if (entry.type !== 'TREAT_RESULT') return treatment.closeLost(round.companyId, entry.runId)
  const read = await treatment.closeResult(round.companyId, entry)
  if (read === 'UNREADABLE') held.deps.log.error({ runId: entry.runId }, 'COPY_QUEUE_UNREADABLE')
}

async function handle(held: Held, message: { handle: string; entry: CopyQueueMessage | null }) {
  const { deps, open, resultDeadlines } = held
  const { entry } = message
  if (entry === null) {
    deps.log.error({}, 'COPY_QUEUE_UNREADABLE')
    await deps.queue.acknowledge(message.handle)
    return
  }
  const run = entry.runId
  if (entry.type === 'PROGRESS') return takeProgress(deps, open.get(run), entry, message.handle)
  if (open.has(run) && exitedWell(entry)) {
    if (!resultDeadlines.has(run))
      resultDeadlines.set(run, (deps.clock ?? Date).now() + RESULT_GRACE_MS)
    await deps.queue.acknowledge(message.handle)
    return
  }
  const round = open.get(run) ?? (await roundOf(deps, run))
  if (round === undefined || !ofKind(round.kind, entry)) {
    deps.log.info({ runId: run, type: entry.type }, 'COPY_QUEUE_RUN_UNKNOWN')
    await deps.queue.acknowledge(message.handle)
    return
  }
  if (round.kind === 'TREATMENT') {
    await treatmentEnd(held, round, entry)
    open.delete(run)
    resultDeadlines.delete(run)
    await deps.queue.acknowledge(message.handle)
    return
  }
  if (entry.type === 'TREAT_RESULT') return
  const { companyId } = round
  const closed = await closeLakeRun(held.closing, companyScope(companyId), {
    ...{ run: LakeRunId.parse(run), ...endOf(entry) },
  })
  if (closed.parameter === 'LEFT') {
    open.set(run, round)
    resultDeadlines.set(run, (deps.clock ?? Date).now() + RESULT_GRACE_MS)
    return
  }
  open.delete(run)
  resultDeadlines.delete(run)
  await deps.queue.acknowledge(message.handle)
}

async function closeOverdue({ deps, closing, open, resultDeadlines }: Held): Promise<void> {
  const now = (deps.clock ?? Date).now()
  for (const [run, until] of resultDeadlines) {
    const round = open.get(run)
    if (until > now || round === undefined) continue
    try {
      if (round.kind === 'TREATMENT') await deps.treatment?.().closeLost(round.companyId, run)
      else
        await closeLakeRun(closing, companyScope(round.companyId), {
          ...{ run: LakeRunId.parse(run), end: LOST, tables: [], cause: 'ECS_STOPPED' },
        })
      open.delete(run)
      resultDeadlines.delete(run)
    } catch (error) {
      logFailure(deps.log, databaseFailure(error))
    }
  }
}

async function waitToRetry(signal: AbortSignal): Promise<void> {
  await sleep(RECEIVE_RETRY_MS, undefined, { signal }).catch((error: unknown) => {
    if (!(error instanceof Error && error.name === 'AbortError')) throw error
  })
}

async function handleBatch(held: Held, bodies: readonly { handle: string; body: string }[]) {
  const read = bodies.map(({ handle, body }) => ({ handle, entry: readEntry(body) }))
  for (const message of read.sort(stopsLast)) {
    try {
      await handle(held, message)
    } catch (error) {
      logFailure(held.deps.log, databaseFailure(error))
    }
  }
  await closeOverdue(held)
}

/**
 * The end of the rounds that run outside the Hub: the queue is read only while a round the Hub
 * knows is open (data D27). A message leaves the queue only after `closeLakeRun` wrote the close
 * and deleted the round's parameter; a stop of a task that exited 0 does not close, and the round
 * waits `RESULT_GRACE_MS` in memory for its result, since three deliveries at the queue's
 * visibility end before the grace. A parameter AWS did not delete keeps the message for the queue's
 * redelivery and the round read for one grace more, whose end deletes it once again; past that the
 * next start's sweep deletes it.
 */
export function createLakeQueue(deps: LakeQueueDeps) {
  const open = new Map<string, Open>()
  const resultDeadlines = new Map<string, number>()
  const stopping = new AbortController()
  let started = false
  let reading: Promise<void> | null = null

  const watch: RunWatch = {
    opened(companyId, run, kind = 'COPY') {
      open.set(run, { companyId, kind })
      wake()
    },
    ended(run) {
      open.delete(run)
      resultDeadlines.delete(run)
    },
  }
  const held: Held = { deps, closing: { ...deps, watch }, open, resultDeadlines }

  async function read(): Promise<void> {
    const { signal } = stopping
    while (open.size > 0 && !signal.aborted) {
      const batch = await deps.queue.receive(signal)
      if (signal.aborted) return
      if (batch.kind !== 'DONE') await waitToRetry(signal)
      else await handleBatch(held, batch.value)
    }
  }

  function wake(): void {
    if (!started || reading !== null || stopping.signal.aborted || open.size === 0) return
    reading = read()
      .catch((error: unknown) => logFailure(deps.log, databaseFailure(error)))
      .finally(() => {
        reading = null
        wake()
      })
  }

  return Object.freeze({
    watch,
    /** Reads the open rounds once, then the queue while one is open. */
    async start(): Promise<void> {
      for (const [run, round] of await openRuns(deps)) open.set(run, round)
      started = true
      wake()
    },
    /** Ends the long poll in flight and waits for the message being closed. */
    async stop(): Promise<void> {
      stopping.abort()
      await reading
    },
    /** Whether a long poll is going on: a test's view of a consumer that sleeps. */
    reading: () => reading !== null,
  })
}

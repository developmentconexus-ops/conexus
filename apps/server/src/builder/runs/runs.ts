import { randomUUID } from 'node:crypto'
import type {
  CompanyId,
  ConversationEvent,
  ConversationId,
  PersonId,
  ProjectId,
  RunId,
} from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import type { Workspace } from '@mastra/core/workspace'
import type { Phase } from '../machine/public.ts'
import type { Outcome, RunsContext, RunsDeps } from './context.ts'
import { copyPending } from './copy.ts'
import { createCopyRetry } from './copy-retry.ts'
import { dailySweep, sweep } from './daily.ts'
import { watchDeadline } from './deadline.ts'
import { runIn, withRun } from './keys.ts'
import { holdLease, RENEW_MS, repeatEvery } from './lease.ts'
import type { ReleaseScope } from './removal.ts'
import { releaseRuns } from './removal.ts'
import { saveRun } from './save.ts'
import { settleExpired, settleRuns } from './settle.ts'
import { RunStore } from './store.ts'

/** A turn's hour (card, limits). */
const TURN_MS = 3_600_000

/** How long a stopping copy waits for its turns to end before it lets go of their leases. */
const YIELD_AFTER_MS = 8_000

function idleRun(taken: boolean) {
  return {
    workspace: undefined,
    onPhase: () => undefined,
    taken,
    stopDeadline: () => undefined,
    stopLease: () => undefined,
    lost: false,
  }
}

/** A run this copy of the program drives: its Projeto, its timers and its workspace. */
type Driven = {
  companyId: CompanyId
  projectId: ProjectId
  deadlineAt: Date
  workspace: Promise<Workspace> | undefined
  /** Where the machine's phases are told; the turn sets it, none until then. */
  onPhase: (phase: Phase) => void
  /** A run another copy left and this one took: its machine keeps the files the turn wrote. */
  taken: boolean
  /** Ends the hour's timer; the lease goes on until the save is over. */
  stopDeadline: () => void
  stopLease: () => void
  lost: boolean
}

type Admission = {
  companyId: CompanyId
  projectId: ProjectId
  conversationId: ConversationId
  personId: PersonId
}

/** A run another copy of the program left open, taken over to be driven here. */
export type TakenRun = Admission & { runId: RunId; deadlineAt: Date; expired: boolean }

/**
 * The Builder's runs (decision 0051): one turn that may write per Projeto, the workspace it works
 * in, and the version it saves. The turn's rows say whose it is and how it ended; the Git and the
 * machine do the rest through their ports.
 */
export class Runs {
  readonly #deps: RunsDeps
  readonly #context: RunsContext
  readonly #driven = new Map<RunId, Driven>()
  readonly #retry = createCopyRetry(() => copyPending(this.#context))
  readonly #sweepDaily: () => void
  #stopRetaking: () => void = () => undefined

  constructor(deps: RunsDeps) {
    this.#deps = deps
    this.#context = {
      ...deps,
      store: new RunStore(deps.database, randomUUID()),
      retry: this.#retry,
      stopped: async (runId) => {
        this.#driven.get(runId)?.stopDeadline()
        this.#driven.get(runId)?.stopLease()
        this.#driven.delete(runId)
      },
    }
    this.#sweepDaily = dailySweep(this.#context)
  }

  #openWorkspace(mine: Driven): Promise<Workspace> {
    const { companyId, projectId } = mine
    return this.#deps.machines.workspaceFor({
      companyId,
      projectId,
      deadline: mine.deadlineAt,
      resumed: mine.taken,
      onPhase: (phase) => mine.onPhase(phase),
    })
  }

  /** Opens the turn of a message, or says the Projeto's builder is busy (data D5, card 12). */
  async admit(
    input: Admission,
  ): Promise<{ ok: true; value: RunId } | { ok: false; error: 'busy'; person?: string }> {
    const { companyId, projectId, personId } = input
    await settleExpired(this.#context, { companyId, projectId })
    this.#sweepDaily()
    const deadlineAt = new Date(Date.now() + (this.#deps.turnMs?.() ?? TURN_MS))
    const { conversationId } = input
    const row = { companyId, projectId, personId, conversationId, deadlineAt }
    const id = await this.#context.store.admit(row)
    const fields = { companyId, projectId, conversationId: input.conversationId }
    if (id === undefined) {
      this.#deps.log.info(fields, 'RUN_BUSY')
      const person = await this.#context.store.holder(companyId, projectId)
      return { ok: false, error: 'busy', ...(person === undefined ? {} : { person }) }
    }
    this.#driven.set(id, { companyId, projectId, deadlineAt, ...idleRun(false) })
    this.#deps.log.info({ ...fields, runId: id }, 'RUN_ADMITTED')
    return { ok: true, value: id }
  }

  /** The Projeto's repository, for the reads of its saved files. */
  repositoryOf(ids: { companyId: CompanyId; projectId: ProjectId }) {
    return this.#deps.repository(ids)
  }

  /** Sets where the machine's phases of the run are told. */
  onPhase(runId: RunId, listener: (phase: Phase) => void): void {
    const mine = this.#driven.get(runId)
    if (mine !== undefined) mine.onPhase = listener
  }

  /** Starts the turn's hour and its lease; `abort` stops the turn as Parar does. */
  attach(runId: RunId, abort: () => void): void {
    const mine = this.#driven.get(runId)
    if (mine === undefined) return
    const stopDeadline = watchDeadline(mine.deadlineAt, abort)
    const stopLease = holdLease({
      everyMs: this.#deps.renewMs?.(),
      renew: () => this.#context.store.renew(mine.companyId, runId),
      lost: () => {
        mine.lost = true
        this.#deps.log.error({ companyId: mine.companyId, runId }, 'RUN_LEASE_LOST')
        abort()
      },
    })
    mine.stopDeadline = stopDeadline
    mine.stopLease = stopLease
  }

  /**
   * Keeps an event of the run's turn, even after the run ended: its last events follow its save.
   * `undefined` once the run is not this copy's (data D25).
   */
  append(input: { companyId: CompanyId; runId: RunId; event: ConversationEvent }) {
    return this.#context.store.appendEvent(input)
  }

  /** At most `limit` of the events a run kept after `after`. */
  events(input: { companyId: CompanyId; runId: RunId; after: number; limit: number }) {
    return this.#context.store.readEvents(input)
  }

  /** The conversation's latest run, to tell which turn a reconnecting stream belongs to. */
  lastRunOf(companyId: CompanyId, conversationId: ConversationId) {
    return this.#context.store.lastRunOf(companyId, conversationId)
  }

  /**
   * At start: the runs another copy left `open` with their lease ended become this copy's (data
   * D25), each driven again with the same hour (card, the clocks). A run whose hour is over is
   * saved as it stands instead of continued.
   */
  async takeOver(): Promise<TakenRun[]> {
    const taken: TakenRun[] = []
    for (const companyId of await this.#context.store.companiesWithRuns()) {
      for (const row of await this.#context.store.takeOver(companyId)) {
        const { projectId, personId, conversationId, deadlineAt } = row
        this.#driven.set(row.id, { companyId, projectId, deadlineAt, ...idleRun(true) })
        const expired = deadlineAt.getTime() <= Date.now()
        this.#deps.log.info({ companyId, projectId, runId: row.id, expired }, 'RUN_RESUMED')
        taken.push({
          ...{ companyId, projectId, personId, conversationId, deadlineAt },
          runId: row.id,
          expired,
        })
      }
    }
    return taken
  }

  /**
   * Looks again, as long as this copy runs, for the turns another copy left whose lease has since
   * ended (data D25): a copy that was killed leaves its lease up to ninety seconds ahead, so the
   * look at start finds nothing. `resume` drives what is found.
   */
  retakeEvery(resume: () => Promise<void>): void {
    this.#stopRetaking = repeatEvery({
      everyMs: this.#deps.renewMs?.() ?? RENEW_MS,
      work: resume,
      failed: (error) => this.#deps.log.error({ error: String(error) }, 'RUN_RETAKE_FAILED'),
    })
  }

  /**
   * Lets go of the leases once the turns are drained, or after a short wait if they are not, so
   * another copy takes the turns a stuck call holds and not the ninety seconds' wait; the turns
   * still draining go on until the process ends.
   */
  async yieldAfter(drained: Promise<void>): Promise<void> {
    const gave = AbortSignal.timeout(this.#deps.yieldMs?.() ?? YIELD_AFTER_MS)
    await Promise.race([
      drained,
      new Promise<void>((done) => gave.addEventListener('abort', () => done())),
    ])
    await this.stop()
  }

  /** The request context of the turn, naming its run. */
  contextOf(context: RequestContext, runId: RunId): RequestContext {
    return withRun(context, runId)
  }

  /** The workspace of the turn's run, opened on the first call; none for a context with no run. */
  async workspaceOf(requestContext: RequestContext): Promise<Workspace | undefined> {
    const runId = runIn(requestContext)
    const mine = runId === undefined ? undefined : this.#driven.get(runId)
    if (runId === undefined || mine === undefined) return undefined
    mine.workspace ??= this.#openWorkspace(mine)
    return mine.workspace
  }

  /**
   * Ends the turn and saves what it wrote, whatever stopped it: the end, Parar, an error, the hour.
   * A run settled already, or whose lease another copy took, answers `gone` and writes nothing.
   */
  async finish(input: { runId: RunId; reason: string }): Promise<Outcome | 'gone'> {
    const mine = this.#driven.get(input.runId)
    if (mine === undefined || mine.lost) return 'gone'
    mine.stopDeadline()
    const { companyId, projectId } = mine
    const { store } = this.#context
    try {
      // A taken-over run's machine holds what the first copy wrote, though no tool ran here.
      if (mine.taken) {
        mine.workspace ??= this.#openWorkspace(mine)
        await mine.workspace
      }
      const claimed = await store.move({
        ...{ companyId, id: input.runId, from: 'open', to: 'saving' },
        mine: true,
      })
      const saved = claimed ? await store.get(companyId, input.runId) : undefined
      if (saved === undefined) return 'gone'
      const fields = { companyId, projectId, runId: input.runId, reason: input.reason }
      this.#deps.log.info(fields, 'RUN_SETTLING')
      return await saveRun(this.#context, saved)
    } finally {
      mine.stopLease()
      this.#driven.delete(input.runId)
      await this.#deps.machines
        .release(projectId)
        .catch((error: unknown) =>
          this.#deps.log.error(
            { companyId, projectId, error: String(error) },
            'MACHINE_RELEASE_FAILED',
          ),
        )
    }
  }

  /** Tries the copies the bucket did not take; true while any is left. */
  retryCopies(): Promise<boolean> {
    return copyPending(this.#context)
  }

  async settleRuns(): Promise<void> {
    await settleRuns(this.#context)
  }

  /** Kills the marked machines idle for seven days, now; the daily gate calls it too. */
  sweep(): Promise<number> {
    return sweep(this.#context)
  }

  release(scope: ReleaseScope): Promise<void> {
    return releaseRuns(this.#context, scope)
  }

  /** The stop of this copy: timers end and the leases are yielded, nothing is settled (code C62). */
  async stop(): Promise<void> {
    this.#stopRetaking()
    this.#retry.stop()
    const mine = [...this.#driven.values()]
    for (const each of mine) {
      each.stopDeadline()
      each.stopLease()
    }
    await this.#context.store.yieldLeases([...new Set(mine.map((each) => each.companyId))])
  }
}

export function createRuns(deps: RunsDeps): Runs {
  return new Runs(deps)
}

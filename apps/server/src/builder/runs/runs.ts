import { randomUUID } from 'node:crypto'
import type { CheckReport, PackageGrant } from '@conexus/app/check'
import type {
  CompanyId,
  ConversationEvent,
  ConversationId,
  PersonId,
  ProjectId,
  RunId,
  VersionCheck,
} from '@conexus/hub-api'
import type { Mastra } from '@mastra/core/mastra'
import type { RequestContext } from '@mastra/core/request-context'
import type { Workspace } from '@mastra/core/workspace'
import type { Result } from '../../platform/result.ts'
import type { CheckPlatformFailed, Phase } from '../machine/public.ts'
import type { Outcome, Restart, RunsContext, RunsDeps } from './context.ts'
import { copyPending } from './copy.ts'
import { createCopyRetry } from './copy-retry.ts'
import { dailySweep, sweep } from './daily.ts'
import { watchDeadline } from './deadline.ts'
import { runIn, withRun } from './keys.ts'
import { holdLease, onceAfter } from './lease.ts'
import type { ReleaseScope } from './removal.ts'
import { releaseRuns } from './removal.ts'
import { saveRun } from './save.ts'
import { settleExpired, settleRuns } from './settle.ts'
import { RunStore } from './store.ts'

/**
 * The packages granted to the Projeto beyond the starter's: none until `builder.package_grant`,
 * which unit U5 of step 14 brings with the card that asks for one.
 */
const GRANTS: readonly PackageGrant[] = []

/** A turn's hour (card, limits). */
const TURN_MS = 3_600_000

/** How long a stopping copy waits for its turns to end before it lets go of their leases. */
const YIELD_AFTER_MS = 8_000

/** Where Mastra keeps each workspace it resolved, to stop them all at its shutdown. */
type Registry = Pick<Mastra, 'removeWorkspace'>

function idleRun() {
  return {
    workspace: undefined,
    registry: undefined,
    onPhase: () => undefined,
    stopDeadline: () => undefined,
    stopLease: () => undefined,
    lost: false,
    check: undefined,
  }
}

/** A run this copy of the program drives: its Projeto, its timers and its workspace. */
type Driven = {
  companyId: CompanyId
  projectId: ProjectId
  deadlineAt: Date
  workspace: Promise<Workspace> | undefined
  registry: Registry | undefined
  /** Where the machine's phases are told; the turn sets it, none until then. */
  onPhase: (phase: Phase) => void
  /** Ends the hour's timer; the lease goes on until the save is over. */
  stopDeadline: () => void
  stopLease: () => void
  lost: boolean
  /** What the end of the turn's check said last, for the version it saves. */
  check: VersionCheck | undefined
}

type Admission = {
  companyId: CompanyId
  projectId: ProjectId
  conversationId: ConversationId
  personId: PersonId
}

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
  #told: (restart: Restart) => Promise<void> = async () => undefined
  #stopSettle: () => void = () => undefined

  constructor(deps: RunsDeps) {
    this.#deps = deps
    this.#context = {
      ...deps,
      store: new RunStore(deps.database, randomUUID()),
      retry: this.#retry,
      stopped: async (runId) => {
        const mine = this.#driven.get(runId)
        if (mine === undefined) return
        mine.stopDeadline()
        mine.stopLease()
        this.#driven.delete(runId)
        await this.#unregister(mine)
      },
      restarted: (restart) => this.#told(restart),
    }
    this.#sweepDaily = dailySweep(this.#context)
  }

  #openWorkspace(mine: Driven): Promise<Workspace> {
    const { companyId, projectId } = mine
    return this.#deps.machines.workspaceFor({
      companyId,
      projectId,
      deadline: mine.deadlineAt,
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
    this.#driven.set(id, { companyId, projectId, deadlineAt, ...idleRun() })
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
    mine.stopDeadline = watchDeadline(mine.deadlineAt, abort)
    mine.stopLease = holdLease({
      everyMs: this.#deps.renewMs?.(),
      renew: () => this.#context.store.renew(mine.companyId, runId),
      lost: () => {
        mine.lost = true
        this.#deps.log.error({ companyId: mine.companyId, runId }, 'RUN_LEASE_LOST')
        abort()
      },
    })
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

  /**
   * The workspace of the turn's run, opened on the first call; none for a context with no run.
   * `registry` is the Mastra that keeps it from here.
   */
  async workspaceOf(
    requestContext: RequestContext,
    registry?: Registry,
  ): Promise<Workspace | undefined> {
    const mine = this.#mine(requestContext)
    if (mine === undefined) return undefined
    mine.registry ??= registry
    mine.workspace ??= this.#openWorkspace(mine)
    return mine.workspace
  }

  /** The Projeto of the turn's run, while this copy drives it: whose `main` the prompt reads. */
  projectOf(
    requestContext: RequestContext,
  ): { companyId: CompanyId; projectId: ProjectId } | undefined {
    const mine = this.#mine(requestContext)
    return mine === undefined ? undefined : { companyId: mine.companyId, projectId: mine.projectId }
  }

  /** The run a turn's context names, while this copy drives it. */
  #mine(requestContext: RequestContext): Driven | undefined {
    const runId = runIn(requestContext)
    return runId === undefined ? undefined : this.#driven.get(runId)
  }

  /** Whether the turn changed its app folder; one that never woke the machine did not. */
  async changed(requestContext: RequestContext): Promise<boolean> {
    const mine = this.#mine(requestContext)
    return mine !== undefined && (await this.#deps.machines.changed({ projectId: mine.projectId }))
  }

  /** The check of the turn's app folder (decision 0055): the one path of `conexus_check` and of the turn's end. */
  check(requestContext: RequestContext): Promise<Result<CheckReport, CheckPlatformFailed>> {
    const mine = this.#mine(requestContext)
    if (mine === undefined) return Promise.resolve({ ok: false, error: 'CHECK_PLATFORM_FAILED' })
    return this.#deps.machines.check({ projectId: mine.projectId, grants: GRANTS })
  }

  /** Keeps what the end of the turn's check said, for the version the turn saves. */
  judged(requestContext: RequestContext, check: VersionCheck): void {
    const mine = this.#mine(requestContext)
    if (mine !== undefined) mine.check = check
  }

  /**
   * Takes the turn's workspace out of Mastra once the run lets go of it: Mastra's shutdown stops
   * every workspace it keeps, which would pause a machine another copy of the program drives now.
   */
  async #unregister(mine: Driven) {
    const workspace = await mine.workspace?.catch(() => undefined)
    if (workspace !== undefined) await mine.registry?.removeWorkspace(workspace.id)
  }

  /**
   * Ends the turn and saves what it wrote, whatever stopped it: the end, Parar, an error, the hour.
   * A run settled already, or whose lease was lost, answers `gone` and writes nothing; when another
   * copy holds it now, its machine is that copy's and is left as it is.
   */
  async finish(input: { runId: RunId; reason: string }): Promise<Outcome | 'gone'> {
    const mine = this.#driven.get(input.runId)
    if (mine === undefined) return 'gone'
    mine.stopDeadline()
    const { companyId, projectId } = mine
    const { store } = this.#context
    let elsewhere = false
    try {
      const claimed = !mine.lost && (await store.claim(companyId, input.runId))
      const saved = claimed ? await store.get(companyId, input.runId) : undefined
      if (saved === undefined) {
        elsewhere = await store.heldElsewhere(companyId, input.runId)
        return 'gone'
      }
      const fields = { companyId, projectId, runId: input.runId, reason: input.reason }
      this.#deps.log.info(fields, 'RUN_SETTLING')
      return await saveRun(this.#context, saved, mine.check)
    } finally {
      mine.stopLease()
      this.#driven.delete(input.runId)
      await this.#unregister(mine)
      if (elsewhere) this.#deps.machines.drop(projectId)
      else
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

  /** Where a restart's word on a turn goes: its conversation's streams and thread. */
  onRestart(told: (restart: Restart) => Promise<void>): void {
    this.#told = told
  }

  /**
   * Settles the runs other copies left (card, the restart). A copy that died less than a lease ago
   * still holds its runs: one more settle runs when the last of those leases ends.
   */
  async settleRuns(): Promise<void> {
    const ends = await settleRuns(this.#context)
    if (ends === undefined) return
    this.#stopSettle = onceAfter(ends, () => {
      void settleRuns(this.#context).catch((error: unknown) =>
        this.#deps.log.error({ error: String(error) }, 'RUN_SETTLE_FAILED'),
      )
    })
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
    this.#retry.stop()
    this.#stopSettle()
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

import { randomUUID } from 'node:crypto'
import type { CompanyId, ConversationId, PersonId, ProjectId, RunId } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import type { Workspace } from '@mastra/core/workspace'
import type { Result } from '../../platform/result.ts'
import type { Outcome, RunsContext, RunsDeps } from './context.ts'
import { copyPending } from './copy.ts'
import { createCopyRetry } from './copy-retry.ts'
import { dailySweep, sweep } from './daily.ts'
import { watchDeadline } from './deadline.ts'
import { runIn, withRun } from './keys.ts'
import { holdLease } from './lease.ts'
import type { ReleaseScope } from './removal.ts'
import { releaseRuns } from './removal.ts'
import { saveRun } from './save.ts'
import { settleExpired, settleRuns } from './settle.ts'
import { RunStore } from './store.ts'

/** A turn's hour (card, limits). */
const TURN_MS = 3_600_000

/** A run this copy of the program drives: its Projeto, its timers and its workspace. */
type Driven = {
  companyId: CompanyId
  projectId: ProjectId
  deadlineAt: Date
  workspace: Promise<Workspace> | undefined
  stop: () => void
  lost: boolean
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

  constructor(deps: RunsDeps) {
    this.#deps = deps
    this.#context = {
      ...deps,
      store: new RunStore(deps.database, randomUUID()),
      retry: this.#retry,
      stopped: async (runId) => {
        this.#driven.get(runId)?.stop()
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
      onPhase: () => undefined,
    })
  }

  /** Opens the turn of a message, or says the Projeto's builder is busy (data D5, card 12). */
  async admit(input: Admission): Promise<Result<RunId, 'busy'>> {
    const { companyId, projectId, personId } = input
    await settleExpired(this.#context, { companyId, projectId })
    this.#sweepDaily()
    const deadlineAt = new Date(Date.now() + (this.#deps.turnMs?.() ?? TURN_MS))
    const id = await this.#context.store.admit({ companyId, projectId, personId, deadlineAt })
    const fields = { companyId, projectId, conversationId: input.conversationId }
    if (id === undefined) {
      this.#deps.log.info(fields, 'RUN_BUSY')
      return { ok: false, error: 'busy' }
    }
    const idle = { workspace: undefined, stop: () => undefined, lost: false }
    this.#driven.set(id, { companyId, projectId, deadlineAt, ...idle })
    this.#deps.log.info({ ...fields, runId: id }, 'RUN_ADMITTED')
    return { ok: true, value: id }
  }

  /** Starts the turn's hour and its lease; `abort` stops the turn as Parar does. */
  attach(runId: RunId, abort: () => void): void {
    const mine = this.#driven.get(runId)
    if (mine === undefined) return
    const stopDeadline = watchDeadline(mine.deadlineAt, abort)
    const stopLease = holdLease({
      renew: () => this.#context.store.renew(mine.companyId, runId),
      lost: () => {
        mine.lost = true
        this.#deps.log.error({ companyId: mine.companyId, runId }, 'RUN_LEASE_LOST')
        abort()
      },
    })
    mine.stop = () => {
      stopDeadline()
      stopLease()
    }
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
    mine.stop()
    const { companyId, projectId } = mine
    const { store } = this.#context
    try {
      const claimed = await store.move({ companyId, id: input.runId, from: 'open', to: 'saving' })
      const saved = claimed ? await store.get(companyId, input.runId) : undefined
      if (saved === undefined) return 'gone'
      const fields = { companyId, projectId, runId: input.runId, reason: input.reason }
      this.#deps.log.info(fields, 'RUN_SETTLING')
      return await saveRun(this.#context, saved)
    } finally {
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
    this.#sweepDaily()
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
    this.#retry.stop()
    const mine = [...this.#driven.values()]
    for (const each of mine) each.stop()
    await this.#context.store.yieldLeases([...new Set(mine.map((each) => each.companyId))])
  }
}

export function createRuns(deps: RunsDeps): Runs {
  return new Runs(deps)
}

import { randomUUID } from 'node:crypto'
import type { CheckReport } from '@conexus/app/check'
import type {
  CompanyId,
  ConversationId,
  PersonId,
  ProjectId,
  RunId,
  VersionCheck,
} from '@conexus/hub-api'
import { RunId as RunIdSchema } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import type { Workspace } from '@mastra/core/workspace'
import type { Result } from '../../platform/result.ts'
import type { CheckPlatformFailed, Phase } from '../machine/public.ts'
import type { RunsContext, RunsDeps, Settled } from './context.ts'
import { copyPending } from './copy.ts'
import { createCopyRetry } from './copy-retry.ts'
import { dailySweep, sweep } from './daily.ts'
import { watchDeadline } from './deadline.ts'
import type { Driven, Registry } from './driven.ts'
import { runIn, withRun } from './keys.ts'
import type { ReleaseScope } from './removal.ts'
import { releaseRuns } from './removal.ts'
import { saveRun } from './save.ts'
import { RunStore } from './store.ts'

/** A turn's hour (card, limits). */
const TURN_MS = 3_600_000

type Admission = {
  companyId: CompanyId
  projectId: ProjectId
  conversationId: ConversationId
  personId: PersonId
}

/**
 * The Builder's runs (decision 0051): the one run that writes per Projeto, the workspace it works
 * in, and the version it saves. A run lives while Mastra's run does in this process (the person's
 * message or answer opens it, Mastra's `agent_end` closes it); Mastra keeps the turn, a question
 * waiting included, and the Git and the machine do the rest through their ports.
 */
export class Runs {
  readonly #deps: RunsDeps
  readonly #context: RunsContext
  // The run writing in each Projeto (data D15): checked and set in the same tick.
  readonly #writing = new Map<ProjectId, Driven>()
  readonly #retry = createCopyRetry(() => copyPending(this.#context))
  readonly #sweepDaily: () => void

  constructor(deps: RunsDeps) {
    this.#deps = deps
    this.#context = {
      ...deps,
      store: new RunStore(deps.database),
      retry: this.#retry,
      writing: (projectId) => this.#writing.has(projectId),
      stopWriting: async (scope) => {
        for (const mine of [...this.#writing.values()]) {
          if (mine.companyId !== scope.companyId) continue
          if (scope.projectId !== undefined && mine.projectId !== scope.projectId) continue
          if (scope.personId !== undefined && mine.personId !== scope.personId) continue
          mine.stopped = true
          mine.stopDeadline()
          this.#writing.delete(mine.projectId)
          await this.#unregister(mine)
        }
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
      onPhase: (phase) => mine.onPhase(phase),
    })
  }

  /**
   * Opens the run of a message or an answer, or says the Projeto's builder is busy, with whose run
   * holds it (data D5, card 12). A question waiting holds nothing: its run closed when it asked.
   */
  async admit(
    input: Admission,
  ): Promise<{ ok: true; value: RunId } | { ok: false; error: 'busy'; person?: string }> {
    const { companyId, projectId, conversationId, personId } = input
    const fields = { companyId, projectId, conversationId }
    const holder = this.#writing.get(projectId)
    if (holder !== undefined) {
      this.#deps.log.info(fields, 'RUN_BUSY')
      const person = await this.#context.store.nameOf(companyId, holder.personId)
      return { ok: false, error: 'busy', ...(person === undefined ? {} : { person }) }
    }
    const runId = RunIdSchema.parse(randomUUID())
    this.#writing.set(projectId, {
      ...{ runId, companyId, projectId, conversationId, personId },
      deadlineAt: new Date(Date.now() + (this.#deps.turnMs?.() ?? TURN_MS)),
      ...{ workspace: undefined, registry: undefined, onPhase: () => undefined },
      ...{ stopDeadline: () => undefined, check: undefined, rounds: 0, stopped: false },
    })
    this.#sweepDaily()
    this.#deps.log.info({ ...fields, runId }, 'RUN_ADMITTED')
    return { ok: true, value: runId }
  }

  /** The Projeto's repository, for the reads of its saved files. */
  repositoryOf(ids: { companyId: CompanyId; projectId: ProjectId }) {
    return this.#deps.repository(ids)
  }

  #driven(runId: RunId): Driven | undefined {
    for (const mine of this.#writing.values()) if (mine.runId === runId) return mine
    return undefined
  }

  /** Sets where the machine's phases of the run are told. */
  onPhase(runId: RunId, listener: (phase: Phase) => void): void {
    const mine = this.#driven(runId)
    if (mine !== undefined) mine.onPhase = listener
  }

  /** Starts the turn's hour, which ends in `abort`, as the person's Parar does. */
  attach(runId: RunId, abort: () => void): void {
    const mine = this.#driven(runId)
    if (mine !== undefined) mine.stopDeadline = watchDeadline(mine.deadlineAt, abort)
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

  /** The Projeto of the turn's run, while it writes: whose `main` the prompt reads. */
  projectOf(
    requestContext: RequestContext,
  ): { companyId: CompanyId; projectId: ProjectId } | undefined {
    const mine = this.#mine(requestContext)
    return mine === undefined ? undefined : { companyId: mine.companyId, projectId: mine.projectId }
  }

  /** The run a turn's context names, while it writes. */
  #mine(requestContext: RequestContext): Driven | undefined {
    const runId = runIn(requestContext)
    return runId === undefined ? undefined : this.#driven(runId)
  }

  /** Whether the turn changed its app folder; one that never woke the machine did not. */
  async changed(requestContext: RequestContext): Promise<boolean> {
    const mine = this.#mine(requestContext)
    return mine !== undefined && (await this.#deps.machines.changed({ projectId: mine.projectId }))
  }

  /** The check of the turn's app folder (decision 0055): the one path of `conexus_check` and of the turn's end. */
  async check(requestContext: RequestContext): Promise<Result<CheckReport, CheckPlatformFailed>> {
    const mine = this.#mine(requestContext)
    if (mine === undefined) return { ok: false, error: 'CHECK_PLATFORM_FAILED' }
    return this.#deps.machines.check({ projectId: mine.projectId })
  }

  /** Keeps what the end of the turn's check said, for the version the turn saves. */
  judged(requestContext: RequestContext, check: VersionCheck): void {
    const mine = this.#mine(requestContext)
    if (mine !== undefined) mine.check = check
  }

  /** Counts a round of the end of the turn (`checkGate`), for the turn's line. */
  rounded(requestContext: RequestContext, rounds: number): void {
    const mine = this.#mine(requestContext)
    if (mine !== undefined) mine.rounds = rounds
  }

  /** Takes the turn's workspace out of Mastra once the run lets go of it: Mastra's shutdown would stop it again. */
  async #unregister(mine: Driven) {
    const workspace = await mine.workspace?.catch(() => undefined)
    if (workspace !== undefined) await mine.registry?.removeWorkspace(workspace.id)
  }

  /**
   * Closes the run and saves what it wrote, whatever ended Mastra's run: the end, a question, Parar,
   * an error, the hour. The Projeto stays held until the save is over and the machine is let go. A
   * run closed already, or that a removal stopped, answers `gone` and writes nothing.
   */
  async finish(input: { runId: RunId; reason: string }): Promise<Settled | 'gone'> {
    const mine = this.#driven(input.runId)
    if (mine === undefined) return 'gone'
    mine.stopDeadline()
    const { companyId, projectId } = mine
    try {
      this.#deps.log.info({ companyId, projectId, ...input }, 'RUN_SETTLING')
      const outcome = await saveRun(this.#context, mine)
      return outcome === 'gone' ? outcome : { ...outcome, rounds: mine.rounds }
    } finally {
      if (this.#writing.get(projectId) === mine) this.#writing.delete(projectId)
      await this.#unregister(mine)
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

  /** At start: the copies the bucket did not take are tried again until it takes them. */
  async resumeCopies(): Promise<void> {
    if (await copyPending(this.#context)) this.#retry.kick()
  }

  /** Kills the marked machines idle for seven days, now; the daily gate calls it too. */
  sweep(): Promise<number> {
    return sweep(this.#context)
  }

  release(scope: ReleaseScope): Promise<void> {
    return releaseRuns(this.#context, scope)
  }

  /** The stop of this process: its timers end (code C62). */
  stop(): void {
    this.#retry.stop()
    for (const mine of this.#writing.values()) mine.stopDeadline()
  }
}

export function createRuns(deps: RunsDeps): Runs {
  return new Runs(deps)
}

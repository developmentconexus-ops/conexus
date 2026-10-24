import { randomUUID } from 'node:crypto'
import type { CheckReport } from '@conexus/app/check'
import type { CompanyId, ConversationId, PersonId, ProjectId, VersionCheck } from '@conexus/hub-api'
import { RunId as RunIdSchema } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import type { Workspace } from '@mastra/core/workspace'
import { sql } from 'drizzle-orm'
import { z } from 'zod'
import { personNameColumn } from '../../hub/identity/public.ts'
import type { Result } from '../../platform/result.ts'
import type { CheckPlatformFailed, Phase } from '../machine/public.ts'
import type { RunsContext, RunsDeps, Settled } from './context.ts'
import { copyPending } from './copy.ts'
import { createCopyRetry } from './copy-retry.ts'
import { dailySweep, sweep } from './daily.ts'
import type { Driven, Opened, Registry } from './driven.ts'
import { conversationIn } from './keys.ts'
import type { ReleaseScope } from './removal.ts'
import { releaseRuns } from './removal.ts'
import { saveRun } from './save.ts'

/** The one row `#nameOf` reads: the person's name, null once they are gone. */
const PersonName = z.object({ name: z.string().nullable() })

/** The machine's lease: an hour (card, limits). */
const LEASE_MS = 3_600_000

type Taking = {
  companyId: CompanyId
  projectId: ProjectId
  conversationId: ConversationId
  personId: PersonId
}

/**
 * The Builder's runs (decision 0051): the one run that writes per Projeto, the workspace it works
 * in, and the version it saves. A run is its conversation's while Mastra's run does in this process
 * (taken as the run reads its input, let go once its end saved it); Mastra keeps the turn, a
 * question waiting included, and the Git and the machine do the rest through their ports.
 */
export class Runs {
  readonly #deps: RunsDeps
  readonly #context: RunsContext
  // The run writing in each Projeto (data D15): checked and set in the same tick.
  readonly #writing = new Map<ProjectId, Driven>()
  // The workspace of each Projeto's machine, from the first run that asked for it to the save.
  readonly #opened = new Map<ProjectId, Opened>()
  // Where each open conversation hears its machine's phases.
  readonly #phases = new Map<ConversationId, (phase: Phase) => void>()
  readonly #retry = createCopyRetry(() => copyPending(this.#context))
  readonly #sweepDaily: () => void

  constructor(deps: RunsDeps) {
    this.#deps = deps
    this.#context = {
      ...deps,
      retry: this.#retry,
      writing: (projectId) => this.#writing.has(projectId),
      stopWriting: async (scope) => {
        for (const mine of [...this.#writing.values()]) {
          if (mine.companyId !== scope.companyId) continue
          if (scope.projectId !== undefined && mine.projectId !== scope.projectId) continue
          if (scope.personId !== undefined && mine.personId !== scope.personId) continue
          mine.stopped = true
          this.#writing.delete(mine.projectId)
          for (const end of mine.ends.splice(0)) end()
          await this.#unregister(mine.projectId)
        }
      },
    }
    this.#sweepDaily = dailySweep(this.#context)
  }

  /** The Projeto's machine, its phases told to the conversation whose run holds it. */
  #openWorkspace(ids: { companyId: CompanyId; projectId: ProjectId }): Promise<Workspace> {
    const { companyId, projectId } = ids
    return this.#deps.machines.workspaceFor({
      companyId,
      projectId,
      deadline: new Date(Date.now() + LEASE_MS),
      onPhase: (phase) => {
        const holder = this.#writing.get(projectId)
        if (holder !== undefined) this.#phases.get(holder.conversationId)?.(phase)
      },
    })
  }

  /**
   * Takes the Projeto for the conversation's run, or says the Projeto's builder is busy, with whose
   * run holds it (data D5, card 12). The conversation's own run still saving is waited for: the next
   * run writes on its version. `onEnd` runs once the run is let go. A question waiting holds
   * nothing: its run ended when it asked.
   */
  async take(
    input: Taking & { onEnd: () => void },
  ): Promise<{ ok: true } | { ok: false; error: 'busy'; person?: string }> {
    const { companyId, projectId, conversationId, personId } = input
    const fields = { companyId, projectId, conversationId }
    for (;;) {
      const holder = this.#writing.get(projectId)
      if (holder === undefined) break
      if (holder.conversationId !== conversationId) {
        this.#deps.log.info(fields, 'RUN_BUSY')
        const person = await this.#nameOf(companyId, holder.personId)
        return { ok: false, error: 'busy', ...(person === undefined ? {} : { person }) }
      }
      if (holder.saving === undefined) {
        holder.ends.push(input.onEnd)
        return { ok: true }
      }
      await holder.saving
    }
    const runId = RunIdSchema.parse(randomUUID())
    this.#writing.set(projectId, {
      ...{ runId, companyId, projectId, personId, conversationId },
      ...{ check: undefined, rounds: 0 },
      ...{ stopped: false, ends: [input.onEnd], saving: undefined },
    })
    this.#sweepDaily()
    this.#deps.log.info({ ...fields, runId }, 'RUN_ADMITTED')
    return { ok: true }
  }

  /** The person's name, for the `RUN_BUSY` of whoever holds the Projeto; none once they are gone. */
  async #nameOf(companyId: CompanyId, personId: PersonId): Promise<string | undefined> {
    const found = await this.#deps.database.read(
      { kind: 'COMPANY', companyId, personId: null },
      (tx) => tx.execute(sql`select ${personNameColumn(sql`${personId}`)} as name`),
    )
    return PersonName.parse(found.rows[0]).name ?? undefined
  }

  /** The Projeto's repository, for the reads of its saved files. */
  repositoryOf(ids: { companyId: CompanyId; projectId: ProjectId }) {
    return this.#deps.repository(ids)
  }

  /** The run the conversation holds. */
  #writingFor(conversationId: ConversationId | undefined): Driven | undefined {
    if (conversationId === undefined) return undefined
    for (const mine of this.#writing.values()) {
      if (mine.conversationId === conversationId) return mine
    }
    return undefined
  }

  /** Where the conversation hears its machine's phases, until the returned function. */
  onPhase(conversationId: ConversationId, listener: (phase: Phase) => void): () => void {
    this.#phases.set(conversationId, listener)
    return () => {
      if (this.#phases.get(conversationId) === listener) this.#phases.delete(conversationId)
    }
  }

  /**
   * The workspace of the Projeto's machine, for every Mastra run of its conversations: Mastra
   * resolves it before the run takes the Projeto (`turnOf`), so a run refused as busy is handed the
   * one the holder works in, and never calls it. A save in progress is waited for: the next run
   * works on a machine opened after it. `registry` is the Mastra that keeps it from here.
   */
  async workspaceOf(
    ids: { companyId: CompanyId; projectId: ProjectId },
    registry?: Registry,
  ): Promise<Workspace> {
    await this.#writing.get(ids.projectId)?.saving
    let opened = this.#opened.get(ids.projectId)
    if (opened === undefined) {
      const made: Opened = { workspace: this.#openWorkspace(ids), registry }
      this.#opened.set(ids.projectId, made)
      // One that did not open is asked again by the next run.
      made.workspace.catch(() => {
        if (this.#opened.get(ids.projectId) === made) this.#opened.delete(ids.projectId)
      })
      opened = made
    }
    opened.registry ??= registry
    return opened.workspace
  }

  /** The run of the conversation Mastra's run is, while it holds the Projeto. */
  #mine(requestContext: RequestContext): Driven | undefined {
    return this.#writingFor(conversationIn(requestContext))
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

  /** Takes the Projeto's workspace out of Mastra once the run lets go of it: Mastra's shutdown would stop it again. */
  async #unregister(projectId: ProjectId) {
    const opened = this.#opened.get(projectId)
    this.#opened.delete(projectId)
    // biome-ignore lint/plugin: one that did not open failed the run that asked for it; there is nothing to take out (code C53)
    const workspace = await opened?.workspace.catch(() => undefined)
    if (workspace !== undefined) await opened?.registry?.removeWorkspace(workspace.id)
  }

  /**
   * Closes the conversation's run and saves what it wrote, whatever ended Mastra's run: the end, a
   * question, Parar, an error. The Projeto stays held until the save is over and the machine is let
   * go. A conversation holding no run (one refused as busy, or whose end was said already), or a run
   * a removal stopped, answers `gone` and writes nothing.
   */
  async finish(input: {
    conversationId: ConversationId
    reason: string
  }): Promise<Settled | 'gone'> {
    const mine = this.#writingFor(input.conversationId)
    if (mine === undefined) return 'gone'
    if (mine.saving !== undefined) {
      await mine.saving
      return 'gone'
    }
    const settling = this.#settle(mine, input.reason)
    // biome-ignore lint/plugin: the save's failure goes to its own caller; who waits here waits only for its end (code C53)
    mine.saving = settling.catch(() => undefined)
    return settling
  }

  async #settle(mine: Driven, reason: string): Promise<Settled | 'gone'> {
    const { companyId, projectId, conversationId, runId } = mine
    try {
      this.#deps.log.info({ companyId, projectId, conversationId, runId, reason }, 'RUN_SETTLING')
      const outcome = await saveRun(this.#context, mine)
      return outcome === 'gone' ? outcome : { ...outcome, rounds: mine.rounds }
    } finally {
      for (const end of mine.ends.splice(0)) end()
      await this.#unregister(projectId)
      await this.#deps.machines
        .release(projectId)
        .catch((error: unknown) =>
          this.#deps.log.error(
            { companyId, projectId, error: String(error) },
            'MACHINE_RELEASE_FAILED',
          ),
        )
      // Held until the machine is let go: a run that asks for it meanwhile waits for `saving`.
      if (this.#writing.get(projectId) === mine) this.#writing.delete(projectId)
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

  /** The stop of this process: its timer ends (code C62). */
  stop(): void {
    this.#retry.stop()
  }
}

export function createRuns(deps: RunsDeps): Runs {
  return new Runs(deps)
}

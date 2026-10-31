import { randomUUID } from 'node:crypto'
import type { CheckReport } from '@conexus/app/check'
import type {
  CompanyId,
  ConversationId,
  PersonId,
  PreviewData,
  ProjectId,
  RunId,
  VersionCheck,
} from '@conexus/hub-api'
import { RunId as RunIdSchema } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import type { Workspace } from '@mastra/core/workspace'
import { sql } from 'drizzle-orm'
import { z } from 'zod'
import { personNameColumn } from '../../hub/identity/public.ts'
import type { Result } from '../../platform/result.ts'
import type { CheckPlatformFailed, Phase, VersionFolder } from '../machine/public.ts'
import type {
  Driven,
  Opened,
  Outcome,
  Registry,
  RunsContext,
  RunsDeps,
  Settled,
} from './context.ts'
import { copyPending } from './copy.ts'
import { createCopyRetry } from './copy-retry.ts'
import { conversationIn } from './keys.ts'
import type { ReleaseScope } from './removal.ts'
import { releaseRuns } from './removal.ts'
import { saveRun } from './save.ts'

/** The one row `#nameOf` reads: the person's name, null once they are gone. */
const PersonName = z.object({ name: z.string().nullable() })

type Conversation = { companyId: CompanyId; projectId: ProjectId; conversationId: ConversationId }
type Taking = Conversation & { personId: PersonId }

/** Only a version whose app built goes to the app (step 14, "A" of 2026-10-24). */
function passed(outcome: Outcome): outcome is Extract<Outcome, { kind: 'saved' }> {
  return outcome.kind === 'saved' && outcome.version.check?.state === 'passed'
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
  // The workspace of each conversation's machine, from the first run that asked for it to the save.
  readonly #opened = new Map<ConversationId, Opened>()
  // Where each open conversation hears its machine's phases.
  readonly #phases = new Map<ConversationId, (phase: Phase) => void>()
  readonly #retry = createCopyRetry(() => copyPending(this.#context))

  constructor(deps: RunsDeps) {
    this.#deps = deps
    this.#context = { ...deps, retry: this.#retry }
  }

  /**
   * Lets go of the runs a removal reaches, before anything is deleted (card, criterion 24): their
   * workspace is forgotten, and nothing of them is saved, so the turn's end finds them gone; one
   * already saved sends no version.
   */
  async stopWriting(scope: ReleaseScope): Promise<void> {
    for (const mine of [...this.#writing.values()]) {
      if (mine.companyId !== scope.companyId) continue
      if (scope.projectId !== undefined && mine.projectId !== scope.projectId) continue
      if (scope.personId !== undefined && mine.personId !== scope.personId) continue
      mine.stopped = true
      this.#writing.delete(mine.projectId)
      for (const end of mine.ends.splice(0)) end()
      await this.#unregister(mine.conversationId)
    }
  }

  /** The conversation's machine, its phases told to the conversation. */
  #openWorkspace(ids: Conversation): Promise<Workspace> {
    return this.#deps.machines.workspaceFor({
      ...ids,
      onPhase: (phase) => this.#phases.get(ids.conversationId)?.(phase),
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
   * The workspace of the conversation's machine, for every Mastra run of the conversation: Mastra
   * resolves it before the run takes the Projeto (`turnOf`), so a run refused as busy is handed one
   * that touches no machine, let go at its end. The conversation's own save in progress is waited
   * for: the next run works on a machine opened after it. `registry` is the Mastra that keeps it
   * from here.
   */
  async workspaceOf(ids: Conversation, registry?: Registry): Promise<Workspace> {
    const { conversationId } = ids
    await this.#writingFor(conversationId)?.saving
    let opened = this.#opened.get(conversationId)
    if (opened === undefined) {
      const made: Opened = { workspace: this.#openWorkspace(ids), registry }
      this.#opened.set(conversationId, made)
      // One that did not open is asked again by the next run.
      made.workspace.catch(() => {
        if (this.#opened.get(conversationId) === made) this.#opened.delete(conversationId)
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

  /** The id of the run the Mastra run is, while it holds the Projeto: what a tool counts its calls by. */
  runIdOf(requestContext: RequestContext): RunId | undefined {
    return this.#mine(requestContext)?.runId
  }

  /** Whether the turn changed its app folder; one that never woke the machine did not. */
  async changed(requestContext: RequestContext): Promise<boolean> {
    const mine = this.#mine(requestContext)
    return (
      mine !== undefined &&
      (await this.#deps.machines.changed({ conversationId: mine.conversationId }))
    )
  }

  /** The check of the turn's app folder (decision 0055): the one path of `conexus_check` and of the turn's end. */
  async check(requestContext: RequestContext): Promise<Result<CheckReport, CheckPlatformFailed>> {
    const mine = this.#mine(requestContext)
    if (mine === undefined) return { ok: false, error: 'CHECK_PLATFORM_FAILED' }
    return this.#deps.machines.check({ conversationId: mine.conversationId })
  }

  /** Keeps what the end of the turn's check said, for the version the turn saves. */
  judged(requestContext: RequestContext, check: VersionCheck): void {
    const mine = this.#mine(requestContext)
    if (mine !== undefined) mine.check = check
  }

  /** Counts a round of the end of the turn (`conexusCheck`), for the turn's line, and says which it is. */
  round(requestContext: RequestContext): number {
    const mine = this.#mine(requestContext)
    if (mine === undefined) return 0
    mine.rounds += 1
    return mine.rounds
  }

  /** Takes the conversation's workspace out of Mastra once the run lets go of it: Mastra's shutdown would stop it again. */
  async #unregister(conversationId: ConversationId) {
    const opened = this.#opened.get(conversationId)
    this.#opened.delete(conversationId)
    if (opened === undefined) return
    // One that did not open failed the run that asked for it: there is nothing to take out.
    const [made] = await Promise.allSettled([opened.workspace])
    if (made?.status === 'fulfilled') await opened.registry?.removeWorkspace(made.value.id)
  }

  /**
   * Closes the conversation's run and saves what it wrote, whatever ended Mastra's run: the end, a
   * question, Parar, an error. `saved` hears the outcome as soon as it is saved, a version whose app
   * built as `sending`; that one is then taken from the machine, and sent to the Projeto's app once
   * the machine is let go. The Projeto stays held until the send is over. A conversation holding no
   * run (one refused as busy, or whose end was said already), or a run a removal stopped before its
   * save, answers `gone` and writes nothing; the workspace Mastra resolved for it is let go, and
   * its machine was never started. A run a removal stops after its save sends no version.
   */
  async finish(input: {
    conversationId: ConversationId
    reason: string
    saved: (settled: Settled) => void
  }): Promise<Settled | 'gone'> {
    const mine = this.#writingFor(input.conversationId)
    if (mine === undefined) {
      await this.#unregister(input.conversationId)
      await this.#deps.machines.release(input.conversationId)
      return 'gone'
    }
    if (mine.saving !== undefined) {
      await mine.saving
      return 'gone'
    }
    const settling = this.#settle(mine, input)
    // The save's failure goes to its own caller; who waits here waits only for its end.
    mine.saving = Promise.allSettled([settling])
    return settling
  }

  async #settle(
    mine: Driven,
    input: { reason: string; saved: (settled: Settled) => void },
  ): Promise<Settled | 'gone'> {
    const { companyId, projectId, conversationId, runId } = mine
    let machine: Promise<void> | undefined
    const letGo = () => {
      machine ??= this.#letGo(mine)
      return machine
    }
    try {
      const fields = { companyId, projectId, conversationId, runId, reason: input.reason }
      this.#deps.log.info(fields, 'RUN_SETTLING')
      const outcome = await saveRun(this.#context, mine)
      if (outcome === 'gone') return outcome
      const settled = { ...outcome, rounds: mine.rounds }
      if (!passed(outcome)) {
        input.saved(settled)
        return settled
      }
      const { number } = outcome.version
      input.saved({ ...settled, preview: { state: 'sending', number } })
      const packed = await this.#pack(mine)
      await letGo()
      if (mine.stopped) return settled
      const preview: PreviewData | undefined = packed.ok
        ? await this.#send(mine, number, packed.value)
        : { state: 'failed', number, code: 'APP_VERSION_FAILED' }
      return preview === undefined ? settled : { ...settled, preview }
    } finally {
      await letGo()
      // Held until the send is over: a run that asks for it meanwhile waits for `saving`.
      if (this.#writing.get(projectId) === mine) this.#writing.delete(projectId)
    }
  }

  /** The version the passing check left, read while the run still holds the machine. */
  async #pack(mine: Driven): Promise<Result<VersionFolder, string>> {
    const { companyId, projectId, conversationId, runId } = mine
    const fields = { companyId, projectId, conversationId, runId }
    try {
      const packed = await this.#deps.machines.pack({ conversationId })
      if (!packed.ok)
        this.#deps.log.error({ ...fields, reason: packed.error }, 'PREVIEW_PACK_REFUSED')
      return packed
    } catch (error) {
      // The machine died on the way: there is no version to send.
      this.#deps.log.error(
        { ...fields, reason: 'LOST', error: String(error) },
        'PREVIEW_PACK_REFUSED',
      )
      return { ok: false, error: 'LOST' }
    }
  }

  /** The version to the Projeto's app. */
  #send(mine: Driven, number: number, folder: VersionFolder) {
    const { companyId, projectId, personId, runId } = mine
    return this.#deps.send({ companyId, projectId, personId, runId, number, folder })
  }

  /** The run lets go of what it keeps open and of its machine, which pauses. */
  async #letGo(mine: Driven): Promise<void> {
    const { companyId, conversationId } = mine
    for (const end of mine.ends.splice(0)) end()
    await this.#unregister(conversationId)
    await this.#deps.machines
      .release(conversationId)
      .catch((error: unknown) =>
        this.#deps.log.error(
          { companyId, conversationId, error: String(error) },
          'MACHINE_RELEASE_FAILED',
        ),
      )
  }

  /** Tries the copies the bucket did not take; true while any is left. */
  retryCopies(): Promise<boolean> {
    return copyPending(this.#context)
  }

  /** At start: the copies the bucket did not take are tried again until it takes them. */
  async resumeCopies(): Promise<void> {
    if (await copyPending(this.#context)) this.#retry.kick()
  }

  /** Kills the machines of the removal's conversations, and takes its Projetos' source, before their threads go. */
  release(scope: ReleaseScope, conversations: ConversationId[]): Promise<void> {
    return releaseRuns(this.#context, scope, conversations)
  }

  /** The stop of this process: its timer ends (code C62). */
  stop(): void {
    this.#retry.stop()
  }
}

export function createRuns(deps: RunsDeps): Runs {
  return new Runs(deps)
}

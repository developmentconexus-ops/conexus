import type { ConversationId } from '@conexus/hub-api'
import { Failure } from '../../platform/failure.ts'
import type { Sha } from '../git/public.ts'
import type { Driven, Outcome, RunsContext } from './context.ts'
import { copyVersion } from './copy.ts'

/**
 * The turn's tree as a bundle. A machine that never came up for the turn (`MACHINE_UNAVAILABLE`) is
 * told as that, with the conversation kept; one that died on the way, as lost.
 */
async function collectOf(
  context: RunsContext,
  input: { conversationId: ConversationId; base: Sha; fields: Record<string, string> },
) {
  try {
    return await context.machines.collect({
      conversationId: input.conversationId,
      base: input.base,
    })
  } catch (error) {
    const unavailable = error instanceof Failure && error.code === 'MACHINE_UNAVAILABLE'
    context.log.error({ ...input.fields, error: String(error) }, 'MACHINE_LOST')
    return { failed: unavailable ? 'MACHINE_UNAVAILABLE' : 'MACHINE_LOST' } as const
  }
}

/**
 * Saves what the turn wrote (card, the machine's flow): one commit on the base the turn started
 * from, checked into a candidate ref, then `main` moved from exactly that base (compare-and-swap).
 * Whatever fails before `main` moves leaves `main` as it was. A turn that never needed the machine
 * saves nothing. A run a removal stopped on the way is `gone` before `main` moves.
 */
export async function saveRun(context: RunsContext, mine: Driven): Promise<Outcome | 'gone'> {
  const { companyId, projectId, conversationId, runId } = mine
  const fields = { companyId, projectId, runId }
  if (!context.machines.touched(conversationId)) return { kind: 'unchanged' }
  // The base is `main` as the machine's seed took it: no other run moves it meanwhile (data D15).
  const repository = context.repository({ companyId, projectId })
  const base = await repository.ensure().catch((error: unknown) => {
    if (error instanceof Failure && error.code === 'GIT_RESTORE_NEEDED') return error
    throw error
  })
  if (base instanceof Failure) {
    context.log.error(fields, 'GIT_RESTORE_NEEDED')
    return { kind: 'failed', code: 'GIT_RESTORE_NEEDED' }
  }
  const bundle = await collectOf(context, { conversationId, base, fields })
  if (typeof bundle === 'object' && 'failed' in bundle)
    return { kind: 'failed', code: bundle.failed }
  if (bundle === 'unchanged') return { kind: 'unchanged' }
  if (bundle === 'too-large') {
    context.log.error({ ...fields, reason: bundle }, 'SAVE_REFUSED')
    return { kind: 'failed', code: 'SAVE_REFUSED' }
  }
  const moved = await advanceMain(context, { ...mine, run: mine, base, bundle: bundle.bundle })
  if (moved === 'gone' || moved.kind === 'failed') return moved
  const { files, changedFiles } = bundle
  const counts = { number: moved.number, changed: true, files, changedFiles }
  const { check } = mine
  return { kind: 'saved', version: check === undefined ? counts : { ...counts, check } }
}

/**
 * Moves the Projeto's `main` to the commit of a machine's bundle, from exactly `base`
 * (compare-and-swap), and copies the version out. Whatever fails before `main` moves leaves it as it
 * was; a run a removal stopped on the way is `gone` before it moves.
 */
export async function advanceMain(
  context: RunsContext,
  input: Pick<Driven, 'companyId' | 'projectId' | 'runId'> & {
    /** Read once the bundle is received: a removal may have stopped the run meanwhile. */
    run: Pick<Driven, 'stopped'>
    base: Sha
    bundle: Uint8Array
  },
): Promise<{ kind: 'saved'; number: number } | Extract<Outcome, { kind: 'failed' }> | 'gone'> {
  const { companyId, projectId, runId, base } = input
  const fields = { companyId, projectId, runId }
  const repository = context.repository({ companyId, projectId })
  const received = await repository.receive({ runId, bundle: input.bundle, base })
  if (!received.ok) {
    context.log.error({ ...fields, reason: received.error }, 'SAVE_REFUSED')
    return { kind: 'failed', code: 'SAVE_REFUSED' }
  }
  const candidate = received.value
  let advanced: 'advanced' | 'stale' | 'gone'
  try {
    advanced = input.run.stopped ? 'gone' : await repository.advance({ candidate, base })
  } finally {
    // Whatever the answer, `main` holds the commit or nobody wants it: the run's ref has no reader left.
    await repository.dropRun(runId)
  }
  if (advanced === 'gone') return 'gone'
  if (advanced === 'stale') {
    context.log.error({ ...fields, reason: 'stale' }, 'SAVE_REFUSED')
    return { kind: 'failed', code: 'SAVE_REFUSED' }
  }
  const number = await repository.versionAt(candidate)
  context.log.info({ ...fields, version: number }, 'VERSION_SAVED')
  if (!(await copyVersion(context, { companyId, projectId }))) context.retry.kick()
  return { kind: 'saved', number }
}

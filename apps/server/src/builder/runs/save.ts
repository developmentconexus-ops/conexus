import type { ProjectId } from '@conexus/hub-api'
import { Failure } from '../../platform/failure.ts'
import type { Sha } from '../git/public.ts'
import type { Outcome, RunsContext } from './context.ts'
import { copyVersion } from './copy.ts'
import type { Run, RunState } from './store.ts'

async function settle(context: RunsContext, saved: Run, to: RunState) {
  await context.store.move({ companyId: saved.companyId, id: saved.id, from: 'saving', to })
}

/**
 * The turn's tree as a bundle. A machine that never came up for the turn (`MACHINE_UNAVAILABLE`) is
 * told as that, with the conversation kept; one that died on the way, as lost.
 */
async function collectOf(
  context: RunsContext,
  input: { projectId: ProjectId; base: Sha; fields: Record<string, string> },
) {
  try {
    return await context.machines.collect({ projectId: input.projectId, base: input.base })
  } catch (error) {
    const unavailable = error instanceof Failure && error.code === 'MACHINE_UNAVAILABLE'
    context.log.error({ ...input.fields, error: String(error) }, 'MACHINE_LOST')
    return { failed: unavailable ? 'MACHINE_UNAVAILABLE' : 'MACHINE_LOST' } as const
  }
}

/**
 * Saves what the turn wrote (card, the machine's flow): one commit on the base the turn started
 * from, checked into a candidate ref, then `main` moved from exactly that base. Whatever fails
 * before `main` moves leaves `main` as it was. A turn that never needed the machine has no base and
 * saves nothing. A fault the code did not expect leaves the run `saving`, for the next admission
 * after its lease to settle by what `main` holds.
 */
export async function saveRun(context: RunsContext, saved: Run): Promise<Outcome> {
  const { companyId, projectId } = saved
  const fields = { companyId, projectId, runId: saved.id }
  if (!context.machines.touched(projectId)) {
    await settle(context, saved, 'unchanged')
    return { kind: 'unchanged' }
  }
  // The base is `main` as the machine's seed took it: no other run moves it meanwhile (data D15). A
  // taken-over turn may reach here before any seed made the repository, so it is ensured.
  const repository = context.repository({ companyId, projectId })
  const base = await repository.ensure()
  await context.store.setBase(companyId, saved.id, base)
  const bundle = await collectOf(context, { projectId, base, fields })
  if (typeof bundle === 'object' && 'failed' in bundle) {
    await settle(context, saved, 'failed')
    return { kind: 'failed', code: bundle.failed }
  }
  if (bundle === 'unchanged') {
    await settle(context, saved, 'unchanged')
    return { kind: 'unchanged' }
  }
  const received =
    bundle === 'too-large'
      ? ({ ok: false, error: 'too-large' } as const)
      : await repository.receive({ runId: saved.id, bundle: bundle.bundle, base })
  if (!received.ok) {
    context.log.error({ ...fields, reason: received.error }, 'SAVE_REFUSED')
    await settle(context, saved, 'failed')
    return { kind: 'failed', code: 'SAVE_REFUSED' }
  }
  const candidate = received.value
  await context.store.setCandidate(companyId, saved.id, candidate)
  if ((await repository.advance({ candidate, base })) === 'stale') {
    context.log.error({ ...fields, reason: 'stale' }, 'SAVE_REFUSED')
    await settle(context, saved, 'failed')
    return { kind: 'failed', code: 'SAVE_REFUSED' }
  }
  await settle(context, saved, 'saved')
  const version = await repository.versionAt(candidate)
  context.log.info({ ...fields, version }, 'VERSION_SAVED')
  if (!(await copyVersion(context, { ...saved, candidateSha: candidate }))) context.retry.kick()
  if (bundle === 'too-large') return { kind: 'failed', code: 'SAVE_REFUSED' }
  const { files, changedFiles } = bundle
  return { kind: 'saved', version: { number: version, changed: true, files, changedFiles } }
}

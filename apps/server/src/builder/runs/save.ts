import type { Outcome, RunsContext } from './context.ts'
import { copyVersion } from './copy.ts'
import type { Run, RunState } from './store.ts'

async function settle(context: RunsContext, saved: Run, to: RunState) {
  await context.store.move({ companyId: saved.companyId, id: saved.id, from: 'saving', to })
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
  // The base is `main` as the machine's seed took it: no other run moves it meanwhile (data D15).
  const repository = context.repository({ companyId, projectId })
  const base = await repository.main()
  await context.store.setBase(companyId, saved.id, base)
  const bundle = await context.machines.collect({ projectId, base }).catch((error: unknown) => {
    context.log.error({ ...fields, error: String(error) }, 'MACHINE_LOST')
    return 'lost' as const
  })
  if (bundle === 'lost') {
    await settle(context, saved, 'failed')
    return { kind: 'failed', code: 'MACHINE_LOST' }
  }
  if (bundle === 'unchanged') {
    await settle(context, saved, 'unchanged')
    return { kind: 'unchanged' }
  }
  const received =
    bundle === 'too-large'
      ? ({ ok: false, error: 'too-large' } as const)
      : await repository.receive({ runId: saved.id, bundle, base })
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
  return { kind: 'saved', version }
}

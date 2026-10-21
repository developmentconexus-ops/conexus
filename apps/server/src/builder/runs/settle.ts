import type { CompanyId, ProjectId } from '@conexus/hub-api'
import type { Outcome, RunsContext } from './context.ts'
import { copyVersion } from './copy.ts'
import { holdLease } from './lease.ts'
import { saveRun } from './save.ts'
import type { Run, RunState } from './store.ts'

/** What a restart kept of the turn: its version, nothing to save, or a save that did not happen. */
type Kept = number | 'nothing' | 'lost'

function keptBy(outcome: Outcome | 'gone'): Kept {
  if (outcome === 'gone' || outcome.kind === 'failed') return 'lost'
  return outcome.kind === 'saved' ? outcome.version.number : 'nothing'
}

/** The stream of the turn a restart ended is told so, with what was kept, and ends (card, the restart). */
async function toldRestart(context: RunsContext, run: Run, kept: Kept) {
  const said = [
    { type: 'part', part: { type: 'restarted', kept } },
    { type: 'turnEnd', reason: 'aborted' },
  ] as const
  for (const event of said) {
    await context.store.appendEvent({ companyId: run.companyId, runId: run.id, event })
  }
}

/**
 * A turn whose copy of the program is gone ends here (card, the restart): what the machine holds is
 * saved as Parar saves it, kept as it stands since the machine is woken without the seed, and the
 * stream is told, with the version, so the person sends the message again.
 */
async function endTurn(context: RunsContext, orphan: Run): Promise<void> {
  const { companyId, projectId, id } = orphan
  const stopLease = holdLease({
    everyMs: context.renewMs?.(),
    renew: () => context.store.renew(companyId, id),
    lost: () => context.log.error({ companyId, runId: id }, 'RUN_LEASE_LOST'),
  })
  try {
    await context.machines.workspaceFor({
      ...{ companyId, projectId, deadline: orphan.deadlineAt, resumed: true },
      onPhase: () => undefined,
    })
    if (!(await context.store.claim(companyId, id))) return
    const outcome = await saveRun(context, { ...orphan, state: 'saving' })
    const kept = keptBy(outcome)
    await toldRestart(context, orphan, kept)
    context.log.info({ companyId, projectId, runId: id, kept }, 'RUN_SETTLED')
  } finally {
    stopLease()
    await context.machines
      .release(projectId)
      .catch((error: unknown) =>
        context.log.error({ companyId, projectId, error: String(error) }, 'MACHINE_RELEASE_FAILED'),
      )
  }
}

/**
 * Where a save whose copy of the program is gone ended (card, criterion 16). One that recorded its
 * candidate has one version if `main` holds it, or moves `main` now when still on the base; without
 * a candidate it is `interrupted`.
 */
async function settledState(context: RunsContext, expired: Run): Promise<RunState> {
  const { companyId, projectId, candidateSha: candidate, baseSha: base } = expired
  if (candidate === null || base === null) return 'interrupted'
  const repository = context.repository({ companyId, projectId })
  if (await repository.contains(candidate)) return 'saved'
  return (await repository.advance({ candidate, base })) === 'advanced' ? 'saved' : 'failed'
}

async function settleOne(context: RunsContext, expired: Run): Promise<void> {
  if (expired.state === 'open') return endTurn(context, expired)
  const { companyId, projectId } = expired
  const to = await settledState(context, expired)
  if (!(await context.store.end(companyId, expired.id, to))) return
  context.log.info({ companyId, projectId, runId: expired.id, state: to }, 'RUN_SETTLED')
  const { candidateSha } = expired
  const repository = context.repository({ companyId, projectId })
  const saved = to === 'saved' && candidateSha !== null
  await toldRestart(context, expired, saved ? await repository.versionAt(candidateSha) : 'lost')
  if (to === 'saved' && !(await copyVersion(context, expired))) context.retry.kick()
}

/**
 * Settles the runs of a company whose lease ended, for one Projeto or for all (data D25), each on
 * its own: one that fails is logged, stays taken until its lease ends, and the next settle tries it
 * again.
 */
export async function settleExpired(
  context: RunsContext,
  input: { companyId: CompanyId; projectId?: ProjectId },
): Promise<void> {
  for (const expired of await context.store.takeExpired(input.companyId, input.projectId)) {
    await settleOne(context, expired).catch((error: unknown) =>
      context.log.error(
        { companyId: input.companyId, runId: expired.id, error: String(error) },
        'RUN_SETTLE_FAILED',
      ),
    )
  }
}

/**
 * At start, every company with work left: the runs whose lease ended are settled, and the copies not
 * made are tried. Never at stop (code C62): a stopping copy of the program only yields its leases.
 */
export async function settleRuns(context: RunsContext): Promise<void> {
  const companies = await context.store.companiesWithRuns()
  for (const companyId of companies) {
    await settleExpired(context, { companyId })
    if ((await context.store.uncopied(companyId)).length > 0) context.retry.kick()
  }
}

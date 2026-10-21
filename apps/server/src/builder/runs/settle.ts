import type { CompanyId, ProjectId } from '@conexus/hub-api'
import type { RunsContext } from './context.ts'
import { copyVersion } from './copy.ts'
import type { Run, RunState } from './store.ts'

/**
 * Where a run whose copy of the program is gone ended (card, criterion 16). A `saving` run that
 * recorded its candidate has one version if `main` holds it, or moves `main` now when still on the
 * base; without a candidate it is `interrupted`, as an `open` one is.
 */
async function settledState(context: RunsContext, expired: Run): Promise<RunState> {
  const { companyId, projectId, candidateSha: candidate, baseSha: base } = expired
  if (expired.state !== 'saving' || candidate === null || base === null) return 'interrupted'
  const repository = context.repository({ companyId, projectId })
  if (await repository.contains(candidate)) return 'saved'
  return (await repository.advance({ candidate, base })) === 'advanced' ? 'saved' : 'failed'
}

async function settleOne(context: RunsContext, expired: Run): Promise<void> {
  const { companyId, projectId } = expired
  const to = await settledState(context, expired)
  const moved = await context.store.move({
    companyId,
    id: expired.id,
    from: expired.state,
    to,
  })
  if (!moved) return
  context.log.info({ companyId, projectId, runId: expired.id, state: to }, 'RUN_SETTLED')
  if (to === 'saved' && !(await copyVersion(context, expired))) context.retry.kick()
}

/** Settles the runs of a company whose lease ended, for one Projeto or for all (data D25). */
export async function settleExpired(
  context: RunsContext,
  input: { companyId: CompanyId; projectId?: ProjectId },
): Promise<void> {
  for (const expired of await context.store.expired(input.companyId, input.projectId)) {
    await settleOne(context, expired)
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

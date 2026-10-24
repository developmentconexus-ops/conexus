import type { RunsContext } from './context.ts'
import type { SavedRun } from './store.ts'

/** Puts a saved version's bundle in the bucket; false, logged, when the bucket did not take it. */
export async function copyVersion(context: RunsContext, saved: SavedRun): Promise<boolean> {
  const { companyId, projectId, candidateSha } = saved
  const repository = context.repository({ companyId, projectId })
  try {
    const version = await repository.versionAt(candidateSha)
    const bundle = await repository.bundleOfRun(saved.id)
    await context.copy.put({ companyId, projectId, version, sha: candidateSha, bundle })
    await context.store.markCopied(companyId, saved.id)
    context.log.info({ companyId, projectId, version }, 'GIT_COPY_DONE')
    return true
  } catch (error) {
    context.log.error({ companyId, projectId, error: String(error) }, 'GIT_COPY_PENDING')
    return false
  }
}

/** Tries the copies still pending in every company; true while any is left. */
export async function copyPending(context: RunsContext): Promise<boolean> {
  let left = false
  for (const companyId of await context.store.companiesWithRuns()) {
    for (const saved of await context.store.uncopied(companyId)) {
      if (!(await copyVersion(context, saved))) left = true
    }
  }
  return left
}

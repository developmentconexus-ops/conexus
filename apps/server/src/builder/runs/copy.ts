import type { CompanyId, ProjectId } from '@conexus/hub-api'
import type { RunsContext } from './context.ts'

/**
 * Puts the Projeto's newest version in the bucket when the bucket is behind (`refs/conexus/copied`,
 * our own mark, kept in the Projeto's repository); false, logged, when the bucket did not take it.
 * The bundle holds the whole history, so a version an earlier failed copy left out goes with it.
 */
export async function copyVersion(
  context: RunsContext,
  ids: { companyId: CompanyId; projectId: ProjectId },
): Promise<boolean> {
  const repository = context.repository(ids)
  try {
    const sha = await repository.uncopied()
    if (sha === null) return true
    const version = await repository.versionAt(sha)
    const bundle = await repository.bundleOfMain()
    await context.copy.put({ ...ids, version, sha, bundle })
    await repository.markCopied(sha)
    context.log.info({ ...ids, version }, 'GIT_COPY_DONE')
    return true
  } catch (error) {
    context.log.error({ ...ids, error: String(error) }, 'GIT_COPY_PENDING')
    return false
  }
}

/** Tries the copies still pending in every Projeto; true while any is left. */
export async function copyPending(context: RunsContext): Promise<boolean> {
  let left = false
  for (const ids of await context.repositories()) {
    if (!(await copyVersion(context, ids))) left = true
  }
  return left
}

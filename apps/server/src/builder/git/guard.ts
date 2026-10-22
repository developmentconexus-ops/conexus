import type { CompanyId, ProjectId } from '@conexus/hub-api'
import { Failure } from '../../platform/failure.ts'
import type { GitCopy } from './copy/copy.ts'
import type { Repository } from './repository.ts'

/**
 * The repository, but `ensure` refuses to make an empty one while the copy holds a version: a Git
 * missing from the disk is a loss to restore (`docs/how-to/hub-git-restore.md`), not a new Projeto,
 * and an empty one would number the next version 1 over the copy's.
 */
export function restoreGuarded(
  git: Repository,
  copy: Pick<GitCopy, 'newestVersion'>,
  ids: { companyId: CompanyId; projectId: ProjectId },
): Repository {
  return {
    ...git,
    async ensure() {
      if ((await git.head()) === null && (await copy.newestVersion(ids)) !== null) {
        throw new Failure('GIT_RESTORE_NEEDED')
      }
      return git.ensure()
    },
  }
}

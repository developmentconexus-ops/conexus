import type { CompanyId, ProjectId } from '@conexus/hub-api'
import type { Machines } from '../../../harness/machine/public.ts'
import {
  createE2bApi,
  createE2bKit,
  createMachines,
  markOf,
} from '../../../harness/machine/public.ts'
import type { Config } from '../../../platform/config.ts'
import type { FailureLog } from '../../../platform/failure.ts'
import type { GitCopy } from '../git/copy/copy.ts'
import { createGitCopy } from '../git/copy/copy.ts'
import { restoreGuarded } from '../git/guard.ts'
import type { Repository } from '../git/repository.ts'
import { openRepository } from '../git/repository.ts'

export type RepositoryOf = (ids: { companyId: CompanyId; projectId: ProjectId }) => Repository
/** The machines of the conversations, found at the provider by their names. */
export type MachinesOf = () => Machines

/** The Builder's Git on the server's volume and the machines of its Projeto on E2B (decision 0051). */
export function builderPortsOf(deps: { config: Config; log: FailureLog }): {
  machinesOf: MachinesOf
  repository: RepositoryOf
  copy: GitCopy
} {
  const { config, log } = deps
  const copy = createGitCopy(config, config.gitCopyUrl)
  function repository(ids: { companyId: CompanyId; projectId: ProjectId }): Repository {
    return restoreGuarded(openRepository({ root: config.gitRoot, ...ids, log }), copy, ids)
  }
  const mark = markOf(config)
  function machinesOf() {
    return createMachines({
      ...{ log, mark, installation: config.installationId },
      template: config.machineTemplate,
      kit: createE2bKit(config),
      api: createE2bApi(config, mark),
      seedOf: async (ids) => {
        const git = repository(ids)
        await git.ensure()
        return git.bundleOfMain()
      },
    })
  }
  return { machinesOf, repository, copy }
}

import type { CompanyId, ProjectId } from '@conexus/hub-api'
import type { Config } from '../../platform/config.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { GitCopy, Repository } from '../git/public.ts'
import { createGitCopy, openRepository } from '../git/public.ts'
import type { Machines } from '../machine/public.ts'
import { createE2bApi, createE2bKit, createMachines } from '../machine/public.ts'

export type RepositoryOf = (ids: { companyId: CompanyId; projectId: ProjectId }) => Repository
/** The machines, made with the database that keeps their ids. */
export type MachinesOf = (database: Database) => Machines

/** The Builder's Git on the server's volume and its machines on E2B (decision 0051). */
export function builderPortsOf(deps: { config: Config; log: FailureLog }): {
  machinesOf: MachinesOf
  repository: RepositoryOf
  copy: GitCopy
} {
  const { config, log } = deps
  function repository(ids: { companyId: CompanyId; projectId: ProjectId }) {
    return openRepository({ root: config.gitRoot, ...ids, log })
  }
  const mark = { conexus_origin: new URL(config.publicOrigin).host }
  function machinesOf(database: Database) {
    return createMachines({
      ...{ database, log, mark },
      kit: createE2bKit(config),
      api: createE2bApi(config, mark),
      seedOf: async (ids) => {
        const git = repository(ids)
        await git.ensure()
        return git.bundleOfMain()
      },
    })
  }
  return { machinesOf, repository, copy: createGitCopy(config) }
}

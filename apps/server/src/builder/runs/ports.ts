import type { CompanyId, ProjectId } from '@conexus/hub-api'
import type { Config } from '../../platform/config.ts'
import type { InstallationId, MachineTemplate } from '../../platform/config-machine.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { GitCopy, Repository } from '../git/public.ts'
import { createGitCopy, openRepository, restoreGuarded } from '../git/public.ts'
import type { KitFactory, MachineApi, Machines } from '../machine/public.ts'
import { createE2bApi, createE2bKit, createMachines, MARK } from '../machine/public.ts'

export type RepositoryOf = (ids: { companyId: CompanyId; projectId: ProjectId }) => Repository
/** The machines of the conversations, found at the provider by their names. */
export type MachinesOf = () => Machines

/** What the Assistant's conversations need to have a machine: the provider's kit and API, the template and the installation. */
export type AssistantMachine = {
  kit: KitFactory
  api: MachineApi
  template: MachineTemplate
  installation: InstallationId
  workFolder?: string
}

/** The Builder's Git on the server's volume and its machines on E2B (decision 0051). */
export function builderPortsOf(deps: { config: Config; log: FailureLog }): {
  machinesOf: MachinesOf
  repository: RepositoryOf
  copy: GitCopy
  assistantMachine: AssistantMachine
} {
  const { config, log } = deps
  const copy = createGitCopy(config, config.gitCopyUrl)
  function repository(ids: { companyId: CompanyId; projectId: ProjectId }): Repository {
    return restoreGuarded(openRepository({ root: config.gitRoot, ...ids, log }), copy, ids)
  }
  const mark = { [MARK.origin]: config.installationId }
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
  const assistantMachine: AssistantMachine = {
    kit: createE2bKit(config),
    api: createE2bApi(config, mark),
    template: config.machineTemplate,
    installation: config.installationId,
  }
  return { machinesOf, repository, copy, assistantMachine }
}

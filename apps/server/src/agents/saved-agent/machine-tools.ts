import { MACHINE_TOOL } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import type { ConversationMachines } from '../../harness/machine/public.ts'
import { showFileTool } from '../../harness/machine/public.ts'
import type { NetworkStore } from '../../harness/network/public.ts'
import { askingByRole, requestNetworkTool } from '../../harness/network/public.ts'
import type { RunScope, Speakers } from '../../harness/spec/public.ts'
import type { IdentityPorts } from '../../hub/identity/public.ts'

export function machineTools(
  deps: {
    identity: Pick<IdentityPorts, 'allows'>
    network: Pick<NetworkStore, 'opened' | 'grant'>
    speakersOf: (scope: RunScope) => Promise<Speakers>
  },
  machines: Pick<ConversationMachines, 'folder' | 'serving' | 'reopen'>,
  runScopeOf: (requestContext: RequestContext) => Promise<RunScope>,
) {
  return {
    [MACHINE_TOOL.showFile]: showFileTool(machines),
    [MACHINE_TOOL.requestNetwork]: requestNetworkTool({
      store: deps.network,
      machines,
      asking: async (requestContext) => askingByRole(deps, await runScopeOf(requestContext)),
    }),
  }
}

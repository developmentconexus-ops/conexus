import { MACHINE_TOOL } from '@conexus/hub-api'
import type { ConversationMachines } from '../../harness/machine/public.ts'
import { showFileTool } from '../../harness/machine/public.ts'
import type { NetworkStore } from '../../harness/network/public.ts'
import { askingOf, requestNetworkTool } from '../../harness/network/public.ts'
import type { RunOf } from './context.ts'
import type { maysOf } from './mays.ts'

export function machineTools(deps: {
  machines: ConversationMachines
  network: Pick<NetworkStore, 'opened' | 'grant'>
  scopeOf: RunOf
  maysFor: ReturnType<typeof maysOf>
}) {
  const { machines, scopeOf, maysFor } = deps
  return {
    [MACHINE_TOOL.showFile]: showFileTool(machines),
    [MACHINE_TOOL.requestNetwork]: requestNetworkTool({
      store: deps.network,
      machines,
      async asking(requestContext) {
        const { network } = await maysFor(requestContext)
        return askingOf(await scopeOf(requestContext), network)
      },
    }),
  }
}

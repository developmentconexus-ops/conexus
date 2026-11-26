import { MACHINE_TOOL } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import type { NetworkStore } from '../network/public.ts'
import { askingByRole, requestNetworkTool } from '../network/public.ts'
import type { RunScope } from '../spec/public.ts'
import type { ConversationMachines } from './conversation.ts'
import { showFileTool } from './show-file.ts'

/** The tools a conversation's machine brings its agent: showing a file and asking for a domain. */
export function conversationMachineTools(
  machines: Pick<ConversationMachines, 'folder' | 'serving' | 'reopen'>,
  deps: Parameters<typeof askingByRole>[0] & {
    network: Pick<NetworkStore, 'opened' | 'grant'>
  },
  runScopeOf: (requestContext: RequestContext) => Promise<RunScope | undefined>,
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

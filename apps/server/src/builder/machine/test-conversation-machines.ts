import { join } from 'node:path'
import type { ConversationId } from '@conexus/hub-api'
import type { ConversationMachine } from './kit.ts'
import { MARK } from './kit.ts'
import {
  findOf,
  INSTALLATION,
  killByMark,
  killStaleOf,
  localKit,
  newControl,
  TEMPLATE,
} from './test-machine.ts'

/**
 * The conversations' machines as doubles (`ConversationMachine`): a folder of this computer of their
 * own, which a test steers through `control` and whose killed conversations `killed` lists.
 */
export function testConversationMachines(folder: string) {
  const own = join(folder, 'conversation')
  const control = newControl()
  const killed: ConversationId[] = []
  // The installation's marks, as `builderPortsOf` makes them: the machines carry them and the kill looks for them.
  const mark = { [MARK.origin]: INSTALLATION, conexus_probe: 'marks' }
  const kill = killByMark(control, mark)
  const deps: ConversationMachine = {
    kit: localKit(own, control),
    api: {
      kill: async (conversationId) => {
        killed.push(conversationId)
        return kill(conversationId)
      },
      killStale: killStaleOf(control),
      find: findOf(control),
    },
    template: TEMPLATE,
    installation: INSTALLATION,
    mark,
  }
  const tuning = { workFolder: join(own, 'work'), startMs: 5_000 }
  return { deps, tuning, control, killed, folder: own }
}

import type { PostgresStore } from '@mastra/pg'
import { conversationMemory, TITLE } from '../controller-kit/public.ts'
import type { QueueDeps } from '../model-accounts/public.ts'

/**
 * The Assistant's memory: the Builder's shape (`conversationMemory`), with its title and observer
 * written for a conversation, and no recall: its model's tools are the closed set of criterion 12.
 */
export function assistantMemory(deps: { storage: PostgresStore; queue: QueueDeps }) {
  return conversationMemory({
    ...deps,
    ...TITLE.ask,
    recall: false,
  })
}

import type { ConversationId } from '@conexus/hub-api'
import type { StorageThreadType } from '@mastra/core/memory'
import type { Memory } from '@mastra/memory'
import { Failure } from '../../platform/failure.ts'
import type { ControllerKind, Owner } from './kinds.ts'
import { resourceOf } from './kinds.ts'

/** The conversation of the kind and the owner; otherwise CONVERSATION_NOT_FOUND (S10). */
export async function ownThread(
  memory: Memory,
  kind: ControllerKind,
  owner: Owner,
  threadId: ConversationId,
): Promise<StorageThreadType> {
  const thread = await memory.getThreadById({ threadId, resourceId: resourceOf(kind, owner) })
  if (thread === null) throw new Failure('CONVERSATION_NOT_FOUND')
  return thread
}

/** The owner's conversations with the given marks, the last change first, without a page. */
export async function listOwned(
  memory: Memory,
  kind: ControllerKind,
  owner: Owner,
  marks: Readonly<Record<string, string>>,
): Promise<StorageThreadType[]> {
  const { threads } = await memory.listThreads({
    filter: { resourceId: resourceOf(kind, owner), metadata: marks },
    perPage: false,
    orderBy: { field: 'updatedAt', direction: 'DESC' },
  })
  return threads
}

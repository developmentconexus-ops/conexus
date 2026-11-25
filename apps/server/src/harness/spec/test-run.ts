import assert from 'node:assert/strict'
import type { Hub } from '../../hub/identity/test-hub.ts'
import { createMastraStorage } from '../memory/public.ts'

/** Marks stamped on a kept thread, as a write that went around the Hub's routes would leave them. */
export async function plantMark(hub: Hub, conversationId: string, marks: Record<string, string>) {
  const memory = await createMastraStorage(hub.test.mastraPool).getStore('memory')
  assert.ok(memory !== undefined, 'the store has its memory')
  const thread = await memory.getThreadById({ threadId: conversationId })
  assert.ok(thread !== null, 'the conversation is kept')
  await memory.updateThread({ id: conversationId, title: thread.title ?? '', metadata: marks })
}

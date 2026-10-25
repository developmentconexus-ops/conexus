import assert from 'node:assert/strict'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import { call } from '../../hub/identity/test-hub.ts'
import { sessionUrl } from './test-conversation.ts'

/** The conversation's model, effort and tasks, as Mastra's session-state route serves them (`guard.ts`). */
export async function stateOf(hub: Hub, person: Person, url: string) {
  const read = await call(hub, person, 'GET', sessionUrl(url))
  assert.equal(read.statusCode, 200, read.body)
  const state = Object(read.json())
  return { model: state.modelId, effort: state.settings.thinkingLevel ?? 'off', tasks: state.tasks }
}

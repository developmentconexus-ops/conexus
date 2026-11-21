import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import type { PersonId } from '@conexus/hub-api'
import { ConversationId, OperationId, Role, ToolCallId } from '@conexus/hub-api'
import type { Principal } from '../access/public.ts'
import { TurnKey } from '../connectors/public.ts'
import { writing } from '../connectors/test-write.ts'
import { personOf } from '../identity/public.ts'
import type { TurnBinding } from './public.ts'

export const EMPRESAS = OperationId.parse('empresas')

/** Ana, owner, in the write world's Projeto with the Sankhya double: the contract bound to a turn of a conversation, or to none. */
export async function turnWorld(t: TestContext) {
  const on = await writing(t)
  const thread = ConversationId.parse(randomUUID())
  const scope: Principal = on.scopeOf(on.ana.id)
  function bindingOf(personId: PersonId, role: string): TurnBinding {
    return { turn: TurnKey.parse(randomUUID()), speaker: personOf(personId, Role.parse(role)) }
  }
  const anaTurn = bindingOf(scope.personId, 'owner')
  function bound(turn: TurnBinding | undefined, principal = scope) {
    return on.hub.data(principal, { thread, ...(turn === undefined ? {} : { turn }) })
  }
  function callOf(toolCall = randomUUID()) {
    return { thread, toolCall: ToolCallId.parse(toolCall) }
  }
  return { ...on, thread, scope, anaTurn, bindingOf, bound, callOf }
}

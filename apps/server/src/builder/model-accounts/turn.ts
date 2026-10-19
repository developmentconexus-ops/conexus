import type { CompanyId, PersonId } from '@conexus/hub-api'
import { RequestContext } from '@mastra/core/request-context'
import type { Picked } from './queue.ts'

const TURN_KEY = 'conexus.turn'

/**
 * One turn of a conversation, as the server built it. The queue keeps in it the model, the accounts
 * it tried, the one each attempt goes through, and how it ended the turn, if it did. Each run copies
 * the request context shallowly, so this object is the one every processor of the turn sees.
 */
export class Turn {
  readonly companyId: CompanyId
  readonly personId: PersonId
  readonly tried = new Set<string>()
  readonly refreshed = new Set<string>()
  modelId: string | undefined
  switched = false
  account: Picked | undefined
  outcome: 'exhausted' | 'failed' | undefined

  constructor(owner: { companyId: CompanyId; personId: PersonId }) {
    this.companyId = owner.companyId
    this.personId = owner.personId
  }
}

/** The request context of one turn: the only way the queue learns whose turn it is. */
export function turnContext(turn: Turn): RequestContext {
  const context = new RequestContext()
  context.set(TURN_KEY, turn)
  return context
}

export function turnIn(context: RequestContext | undefined): Turn | undefined {
  const turn = context?.get(TURN_KEY)
  return turn instanceof Turn ? turn : undefined
}

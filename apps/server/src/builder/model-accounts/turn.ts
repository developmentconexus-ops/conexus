import type { CompanyId, PersonId } from '@conexus/hub-api'
import type { LanguageModel } from '@mastra/core/llm'
import { RequestContext } from '@mastra/core/request-context'

const TURN_KEY = 'conexus.turn'

/** The account an attempt goes through, and the model config that carries its credential. */
export type Picked = {
  id: string
  label: string
  kind: 'api_key' | 'claude_subscription' | 'google_cliproxy'
  modelId: string
  model: LanguageModel
  systemLine: string | undefined
}

export type Notice = {
  kind: 'account-switched' | 'accounts-exhausted' | 'model-switched'
  text: string
}

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
  /** The names of accounts refused as they were opened, for the next notice. */
  readonly unsaid: string[] = []
  /** The notices said in the turn, in order, for its answer to keep (`keepNotices`). */
  readonly notices: Notice[] = []
  modelId: string | undefined
  switched = false
  account: Picked | undefined
  /** The pick in flight, which every processor asking for the account meanwhile awaits. */
  picking: Promise<Picked | undefined> | undefined
  outcome: 'exhausted' | 'failed' | undefined
  /** What the turn's accounts keep open while it runs, such as a CLIProxy process. */
  readonly held: Array<() => void> = []

  constructor(owner: { companyId: CompanyId; personId: PersonId }) {
    this.companyId = owner.companyId
    this.personId = owner.personId
  }

  /** Lets go of what the turn's accounts kept open, once its run has ended. */
  end(): void {
    for (const release of this.held.splice(0)) release()
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

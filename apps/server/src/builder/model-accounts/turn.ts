import type { AccountKind, CompanyId, ModelAccountId, PersonId } from '@conexus/hub-api'
import type { LanguageModel } from '@mastra/core/llm'
import { RequestContext } from '@mastra/core/request-context'
import { z } from 'zod'
import { Failure } from '../../platform/failure.ts'

const TURN_KEY = 'conexus.turn'

/** The data part a queue notice is kept as in the answer, and the shape of its data. */
export const NOTICE_PART = 'data-conexus-notice'
export const Notice = z.object({
  kind: z.enum(['account-switched', 'accounts-exhausted', 'model-switched']),
  text: z.string(),
})
export type Notice = z.infer<typeof Notice>

/** The account an attempt goes through, and the model config that carries its credential. */
export type Picked = {
  id: ModelAccountId
  label: string
  kind: AccountKind
  modelId: string
  model: LanguageModel
  systemLine: string | undefined
}

/** How a turn ended for the queue: its accounts ran out, or the model's call failed. */
export type Outcome = 'exhausted' | 'failed'

/**
 * Where the queue stands in a turn: no account yet (or the last one failed), one being picked,
 * one taking the calls, or the turn ended. Only `Turn`'s methods move it (code C21).
 */
type Stage =
  | { name: 'unpicked' }
  | { name: 'picking'; pick: Promise<Picked | undefined> }
  | { name: 'calling'; account: Picked }
  | { name: 'ended'; outcome: Outcome }

const ControllerContext = z.object({
  session: z.object({ modelId: z.string().min(1) }),
})

/**
 * The conversation's model, as the controller holds it for this run (`session.model.switch`); a
 * run without one is the Builder's defect, never a model to look accounts up for.
 */
export function chosenModel(context: RequestContext | undefined): string {
  const parsed = ControllerContext.safeParse(context?.get('controller'))
  if (!parsed.success) {
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'NO_SESSION_MODEL' } })
  }
  return parsed.data.session.modelId
}

/**
 * One turn of a conversation, as the server built it. The queue keeps in it the model, the accounts
 * it tried, the one each attempt goes through, and how it ended the turn, if it did. Each run copies
 * the request context shallowly, so this object is the one every processor of the turn sees.
 */
export class Turn {
  readonly companyId: CompanyId
  readonly personId: PersonId
  readonly tried = new Set<ModelAccountId>()
  readonly refreshed = new Set<ModelAccountId>()
  /** The names of accounts refused as they were opened, for the next notice. */
  readonly unsaid: string[] = []
  /** The notices said in the turn, in order, for its answer to keep (`keepNotices`). */
  readonly notices: Notice[] = []
  /** What the turn's accounts keep open while it runs, such as a CLIProxy process. */
  readonly held: Array<() => void> = []
  #stage: Stage = { name: 'unpicked' }
  /** The model the turn calls now, read from its run on first use; `switched` by the company's switch. */
  #model: { id: string; switched: boolean } | undefined

  constructor(owner: { companyId: CompanyId; personId: PersonId }) {
    this.companyId = owner.companyId
    this.personId = owner.personId
  }

  /** How the queue ended the turn, if it did. */
  get outcome(): Outcome | undefined {
    return this.#stage.name === 'ended' ? this.#stage.outcome : undefined
  }

  /** Whether the company's automatic switch moved the turn to another model. */
  get switched(): boolean {
    return this.#model?.switched ?? false
  }

  /** The model the turn calls now: the conversation's, until the automatic switch moves it. */
  modelId(context: RequestContext | undefined): string {
    this.#model ??= { id: chosenModel(context), switched: false }
    return this.#model.id
  }

  switchTo(modelId: string): void {
    this.#model = { id: modelId, switched: true }
  }

  /**
   * The turn's account, picked once by `choose` for all who ask meanwhile: none once the turn
   * ended. `choose` ends the turn itself when it finds none; a pick that throws leaves it unpicked.
   */
  account(choose: () => Promise<Picked | undefined>): Promise<Picked | undefined> {
    const stage = this.#stage
    switch (stage.name) {
      case 'calling':
        return Promise.resolve(stage.account)
      case 'ended':
        return Promise.resolve(undefined)
      case 'picking':
        return stage.pick
      case 'unpicked': {
        const settle = (next: Stage) => {
          if (this.#stage.name === 'picking' && this.#stage.pick === pick) this.#stage = next
        }
        const pick = choose().then(
          (picked) => {
            settle(
              picked === undefined ? { name: 'unpicked' } : { name: 'calling', account: picked },
            )
            return picked
          },
          (error: unknown) => {
            settle({ name: 'unpicked' })
            throw error
          },
        )
        this.#stage = { name: 'picking', pick }
        return pick
      }
      default:
        return stage satisfies never
    }
  }

  /** The account that took the call now, which the queue lets go of once the call failed. */
  calling(): Picked | undefined {
    return this.#stage.name === 'calling' ? this.#stage.account : undefined
  }

  /** The call failed and the queue tries the next account. */
  drop(): void {
    if (this.#stage.name === 'calling') this.#stage = { name: 'unpicked' }
  }

  /** The turn ends here: its accounts ran out, or its call failed with no switch. */
  finish(outcome: Outcome): void {
    this.#stage = { name: 'ended', outcome }
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

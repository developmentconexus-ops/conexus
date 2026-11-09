import type { RequestContext } from '@mastra/core/request-context'
import { Memory } from '@mastra/memory'
import type { PostgresStore } from '@mastra/pg'
import { z } from 'zod'
import type { QueueDeps } from '../model-accounts/public.ts'
import { accountModel, memoryModelsFor, Turn } from '../model-accounts/public.ts'
import { MODEL_TIMEOUT } from './factories.ts'
import type { Owner, ResourceOwner } from './kinds.ts'
import { ownerOfResource } from './kinds.ts'

const Resource = z.object({ resourceId: z.string() })

/** Whose conversation a Mastra run is: the owner Mastra keeps its thread under, of either controller. */
export function ownerIn(requestContext: RequestContext): ResourceOwner | undefined {
  return ownerOfResource(Resource.safeParse(requestContext.get('controller')).data?.resourceId)
}

/** The turn of a conversation's owner, in the accounts' queue (step 11). */
export async function turnOfOwner(queue: QueueDeps, owner: Owner): Promise<Turn> {
  const { companyId, personId } = owner
  return new Turn({ companyId, personId, memoryModels: await memoryModelsFor(queue, owner) })
}

/** A turn for a side call made before the run read its input: the observer's (`accountModel`). */
export function sideTurn(queue: QueueDeps) {
  return async (requestContext: RequestContext): Promise<Turn | undefined> => {
    const owner = ownerIn(requestContext)
    return owner === undefined ? undefined : turnOfOwner(queue, owner)
  }
}

/**
 * The Builder's memory: its title and its observation through the turn's account, failing soft,
 * in Mastra's own database, with Mastra Code's observer context and titles
 * (`agents/memory.ts:355-417`). Async buffering is off (`bufferTokens: false`, Mastra's documented
 * mode): with it on, each buffer cycle re-read the last 20 messages and each step re-read the
 * memory record, which held the buffered chunks: 340 to 510 MB per Builder hour by the egress
 * study's count, 480 MB/h as Neon measured it, and the free transfer ran out in days. Off, it
 * measured 7 to 9 times fewer bytes, at the cost of a pause while the Observer runs, about every
 * 30k tokens. The founder accepted that trade. Idle and provider-change activation and both
 * `bufferActivation` act only on buffered chunks, and `blockAfter` only applies with buffering;
 * Mastra clears them when it is off, so they went with it.
 */
export function conversationMemory(deps: {
  storage: PostgresStore
  queue: QueueDeps
  /** The title's instructions and the observer's, in the words of the conversation's kind. */
  title: string
  observer: string
  /** Whether the model may recall the messages the observation folded (Mastra's `recall` tool and its instructions). */
  recall: boolean
}): Memory {
  const { storage, queue } = deps
  const modelSettings = { timeout: MODEL_TIMEOUT }
  const failSoft = { modelSettings, maxRetries: 0, failurePolicy: 'continue' as const }
  const turnFor = sideTurn(queue)
  return new Memory({
    storage,
    options: {
      generateTitle: {
        model: accountModel(queue, 'title', turnFor),
        instructions: deps.title,
      },
      observationalMemory: {
        enabled: true,
        scope: 'thread',
        ...(deps.recall ? { retrieval: { scope: 'thread' } } : {}),
        temporalMarkers: true,
        observation: {
          ...failSoft,
          model: accountModel(queue, 'observer', turnFor),
          messageTokens: 30_000,
          bufferTokens: false,
          previousObserverTokens: 1000,
          threadTitle: true,
          instruction: deps.observer,
        },
        reflection: {
          ...failSoft,
          model: accountModel(queue, 'reflection', turnFor),
          observationTokens: 40_000,
        },
      },
    },
  })
}

import type { CompanyId, ModelId, Person } from '@conexus/hub-api'
import {
  ConversationId,
  createConversation,
  listConversations,
  readConversation,
  sendConversationMessage,
  setConversationModel,
  stopConversation,
  streamConversation,
} from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { Failure } from '../../platform/failure.ts'
import { answer, serve } from '../../platform/http.ts'
import { pageKey } from '../../platform/pages.ts'
import type { QueueDeps } from '../model-accounts/public.ts'
import { conversationModel, effortsOf } from '../model-accounts/public.ts'
import type { Builder } from './builder.ts'
import { historyOf, threadModel, titlesOf } from './history.ts'
import type { Owner } from './live.ts'
import type { Sessions } from './sessions.ts'
import type { ConversationStore, InProject } from './store.ts'
import { bodyHashOf } from './store.ts'

type Deps = { store: ConversationStore; sessions: Sessions; builder: Builder; queue: QueueDeps }

function ownerOf(input: { person: Person; params: { companyId: CompanyId } }): Owner {
  return { companyId: input.params.companyId, personId: input.person.id }
}

/** What the person reads of the conversations: the list, one conversation and its stream. */
function registerReads(app: FastifyInstance, deps: Deps) {
  const { store, sessions, builder } = deps

  serve(app, listConversations, async (input) => {
    const { person, params, query } = input
    const after = pageKey(query.page, ConversationId)
    const page = await store.list({ person, ...params, after })
    const ids = page.rows.map((row) => row.id)
    const titles = await titlesOf(builder, ownerOf(input), ids)
    const conversations = page.rows.map((row) => ({
      id: row.id,
      title: titles.get(row.id) ?? null,
      createdAt: row.createdAt.toISOString(),
    }))
    return answer({ conversations, next: page.next })
  })

  serve(app, readConversation, async (input) => {
    const { person, params } = input
    const row = await store.owned({ person, ...params })
    const read = await historyOf(builder, ownerOf(input), params.conversationId)
    // An index row whose thread Mastra does not hold: the conversation is gone (the step's states).
    if (read === undefined) {
      await store.remove({ person, ...params })
      throw new Failure('CONVERSATION_NOT_FOUND')
    }
    const conversation = { id: row.id, createdAt: row.createdAt.toISOString(), ...read }
    return answer({ conversation })
  })

  serve(app, streamConversation, async (input) => {
    const { person, params, signal, lastEventId } = input
    await store.owned({ person, ...params })
    const conversationId = params.conversationId
    const owner = ownerOf(input)
    return answer(await sessions.events({ owner, conversationId, signal, lastEventId }))
  })
}

/**
 * A conversation's creation, keyed by its attempt (code C37): a repeat answers the model its thread
 * is on and runs nothing again; one whose first attempt stopped before the thread had its model
 * puts it on one now.
 */
async function created(
  deps: Deps,
  input: InProject & { attemptKey: string; body: { model?: ModelId | undefined } },
) {
  const owner = { companyId: input.companyId, personId: input.person.id }
  const attempt = { ...input, bodyHash: bodyHashOf(input.body) }
  const earlier = await deps.store.attempted(attempt)
  if (earlier !== undefined) {
    const kept = await threadModel(deps.builder, owner, earlier.id)
    if (kept !== undefined) return { ...earlier, model: kept, created: false }
  }
  const model = await conversationModel(deps.queue, owner, input.body.model)
  const made =
    earlier === undefined ? await deps.store.create(attempt) : { ...earlier, created: false }
  await deps.sessions.switchModel({ owner, conversationId: made.id, model, effort: 'off' })
  return { ...made, model }
}

/** What the person changes: a new conversation, a message, a stop and the model. */
function registerWrites(app: FastifyInstance, deps: Deps) {
  const { store, sessions } = deps

  serve(app, createConversation, async ({ person, params, body, attemptKey, log }) => {
    const made = await created(deps, { person, ...params, attemptKey, body })
    if (made.created)
      log.info({ companyId: params.companyId, conversationId: made.id }, 'CONVERSATION_CREATED')
    const createdAt = made.createdAt.toISOString()
    return answer({ conversation: { id: made.id, title: null, createdAt, model: made.model } })
  })

  serve(app, sendConversationMessage, async (input) => {
    const { person, params, body, attemptKey } = input
    const bodyHash = bodyHashOf(body)
    const turn = { person, ...params, key: attemptKey }
    if (await store.recordTurn({ ...turn, bodyHash })) {
      const question = { key: attemptKey, content: body.content, at: new Date().toISOString() }
      const conversationId = params.conversationId
      // The send runs outside the key's transaction (data D22); refused, it frees the key.
      await sessions
        .send({ owner: ownerOf(input), conversationId, question })
        .catch(async (error) => {
          await store.forgetTurn(turn)
          throw error
        })
    }
    return answer(undefined)
  })

  serve(app, stopConversation, async (input) => {
    await store.owned({ person: input.person, ...input.params })
    await sessions.stop(input.params.conversationId)
    return answer(undefined)
  })

  serve(app, setConversationModel, async (input) => {
    const { person, params, body } = input
    await store.owned({ person, ...params })
    const owner = ownerOf(input)
    const model = await conversationModel(deps.queue, owner, body.model)
    const { effort } = body
    if (!effortsOf(model).includes(effort)) throw new Failure('EFFORT_UNSUPPORTED')
    await sessions.switchModel({ owner, conversationId: params.conversationId, model, effort })
    input.log.info(
      { companyId: params.companyId, conversationId: params.conversationId },
      'CONVERSATION_MODEL_SET',
    )
    return answer({ model, effort })
  })
}

/** The conversations of a Projeto (step 12): every call checks the index first (security S10). */
export function registerConversationRoutes(app: FastifyInstance, deps: Deps) {
  registerReads(app, deps)
  registerWrites(app, deps)
}

import type { CompanyId, Person } from '@conexus/hub-api'
import {
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
import { conversationModel } from '../model-accounts/public.ts'
import type { Builder } from './builder.ts'
import { historyOf, titlesOf } from './history.ts'
import type { Owner, Sessions } from './sessions.ts'
import type { ConversationStore } from './store.ts'
import { bodyHashOf } from './store.ts'

const CONVERSATION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

type Deps = { store: ConversationStore; sessions: Sessions; builder: Builder; queue: QueueDeps }

function ownerOf(input: { person: Person; params: { companyId: CompanyId } }): Owner {
  return { companyId: input.params.companyId, personId: input.person.id }
}

/** What the person reads of the conversations: the list, one conversation and its stream. */
function registerReads(app: FastifyInstance, deps: Deps) {
  const { store, sessions, builder } = deps

  serve(app, listConversations, async ({ person, params, query }) => {
    const owner = { companyId: params.companyId, personId: person.id }
    const after = pageKey(query.page, CONVERSATION_ID)
    const page = await store.list({ person, ...params, after })
    const titles = await titlesOf(
      builder,
      owner,
      page.rows.map((row) => row.id),
    )
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
    const { person, params, signal } = input
    await store.owned({ person, ...params })
    return answer(await sessions.events(ownerOf(input), params.conversationId, signal))
  })
}

/** What the person changes: a new conversation, a message, a stop and the model. */
function registerWrites(app: FastifyInstance, deps: Deps) {
  const { store, sessions } = deps

  serve(app, createConversation, async ({ person, params, body, attemptKey, log }) => {
    const owner = { companyId: params.companyId, personId: person.id }
    const model = await conversationModel(deps.queue, owner, body.model)
    const bodyHash = bodyHashOf(body)
    const made = await store.create({ person, ...params, attemptKey, bodyHash })
    await sessions.switchModel(owner, made.id, model)
    if (made.created)
      log.info({ companyId: params.companyId, conversationId: made.id }, 'CONVERSATION_CREATED')
    const createdAt = made.createdAt.toISOString()
    return answer({ conversation: { id: made.id, title: null, createdAt, model } })
  })

  serve(app, sendConversationMessage, async (input) => {
    const { person, params, body, attemptKey } = input
    const bodyHash = bodyHashOf(body)
    const turn = { person, ...params, key: attemptKey }
    if (await store.recordTurn({ ...turn, bodyHash })) {
      // The send runs outside the key's transaction (data D22); refused, it frees the key.
      await sessions
        .send(ownerOf(input), params.conversationId, body.content)
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
    const model = await conversationModel(deps.queue, ownerOf(input), body.model)
    await sessions.switchModel(ownerOf(input), params.conversationId, model)
    input.log.info(
      { companyId: params.companyId, conversationId: params.conversationId },
      'CONVERSATION_MODEL_SET',
    )
    return answer({ model })
  })
}

/** The conversations of a Projeto (step 12): every call checks the index first (security S10). */
export function registerConversationRoutes(app: FastifyInstance, deps: Deps) {
  registerReads(app, deps)
  registerWrites(app, deps)
}

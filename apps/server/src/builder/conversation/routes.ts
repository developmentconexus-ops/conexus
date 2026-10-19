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

/** The conversations of a Projeto (step 12): every call checks the index first (security S10). */
export function registerConversationRoutes(app: FastifyInstance, deps: Deps) {
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

  serve(app, createConversation, async ({ person, params, body, attemptKey, log }) => {
    const owner = { companyId: params.companyId, personId: person.id }
    const model = await conversationModel(deps.queue, owner, body.model)
    const bodyHash = bodyHashOf(body)
    const made = await store.create({ person, ...params, attemptKey, bodyHash })
    await sessions.switchModel(owner, made.id, model)
    if (made.created)
      log.info({ companyId: params.companyId, conversationId: made.id }, 'CONVERSATION_STARTED')
    const createdAt = made.createdAt.toISOString()
    return answer({ conversation: { id: made.id, title: null, createdAt, model } })
  })

  serve(app, readConversation, async (input) => {
    const { person, params } = input
    const row = await store.owned({ person, ...params })
    const read = await historyOf(builder, ownerOf(input), params.conversationId)
    const conversation = { id: row.id, createdAt: row.createdAt.toISOString(), ...read }
    return answer({ conversation })
  })

  serve(app, sendConversationMessage, async (input) => {
    const { person, params, body, attemptKey, log } = input
    const bodyHash = bodyHashOf(body)
    const fresh = await store.recordTurn({ person, ...params, key: attemptKey, bodyHash })
    if (fresh) {
      await sessions.send(ownerOf(input), params.conversationId, body.content)
      log.info(
        { companyId: params.companyId, conversationId: params.conversationId },
        'CONVERSATION_TURN_SENT',
      )
    }
    return answer(undefined)
  })

  serve(app, streamConversation, async (input) => {
    const { person, params, signal } = input
    await store.owned({ person, ...params })
    return answer(sessions.events(ownerOf(input), params.conversationId, signal))
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
    return answer({ model })
  })
}

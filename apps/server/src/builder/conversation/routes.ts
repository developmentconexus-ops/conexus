import type { CompanyId, Effort, ModelId, Person } from '@conexus/hub-api'
import {
  ConversationId,
  createConversation,
  listConversations,
  readConversation,
  setConversationModel,
} from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { bodyHashOf } from '../../platform/attempt.ts'
import { Failure } from '../../platform/failure.ts'
import { answer, serve } from '../../platform/http.ts'
import { pageKey } from '../../platform/pages.ts'
import type { Owner } from '../controller-kit/public.ts'
import { attemptIdOf, changeModel, openSession } from '../controller-kit/public.ts'
import type { QueueDeps } from '../model-accounts/public.ts'
import type { Builder } from './builder.ts'
import { titleOf, titlesOf } from './history.ts'
import type { ConversationStore, InProject } from './store.ts'

type Deps = { store: ConversationStore; builder: Builder; queue: QueueDeps }

function ownerOf(input: { person: Person; params: { companyId: CompanyId } }): Owner {
  return { companyId: input.params.companyId, personId: input.person.id }
}

/** What the person reads of the conversations: the list and one conversation. */
function registerReads(app: FastifyInstance, deps: Deps) {
  const { store, builder } = deps

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
    const title = await titleOf(builder, ownerOf(input), params.conversationId)
    // An index row whose thread Mastra does not hold: the conversation is gone (the step's states).
    if (title === undefined) {
      await store.remove({ person, ...params })
      throw new Failure('CONVERSATION_NOT_FOUND')
    }
    const conversation = { id: row.id, createdAt: row.createdAt.toISOString(), title }
    return answer({ conversation })
  })
}

/**
 * A conversation's creation, keyed by its attempt (code C37): the person and the Projeto admitted
 * first, then `openSession` with the index row as what the first attempt kept. The Assistant's
 * hand-off opens its conversation here too (step 24.3.2), and sends on the session.
 */
export async function created(
  deps: Deps,
  input: InProject & {
    attemptKey: string
    body: { model?: ModelId | undefined; effort?: Effort | undefined }
  },
) {
  const owner = { companyId: input.companyId, personId: input.person.id }
  await deps.store.admit(input)
  const id = attemptIdOf('builder', owner, input.attemptKey)
  const attempt = { ...input, id, bodyHash: bodyHashOf(input.body) }
  let createdAt: Date | undefined
  const opened = await openSession(
    { controller: deps.builder.controller, memory: deps.builder.memory, queue: deps.queue },
    {
      ...{ kind: 'builder', owner, id, model: input.body.model, effort: input.body.effort },
      keep: async () => {
        const row = await deps.store.keep(attempt)
        createdAt = row.createdAt
        return row.kept
      },
    },
  )
  if (createdAt === undefined) throw new Failure('INTERNAL_UNEXPECTED')
  const conversationId = ConversationId.parse(opened.session.identity.getId())
  return {
    id: conversationId,
    createdAt,
    model: opened.model,
    made: opened.made,
    session: opened.session,
  }
}

/**
 * What the person changes here: a new conversation and its model. A message, Parar and a card's
 * answer are Mastra's own routes (`guard.ts`).
 */
function registerWrites(app: FastifyInstance, deps: Deps) {
  const { store } = deps

  serve(app, createConversation, async ({ person, params, body, attemptKey, log }) => {
    const made = await created(deps, { person, ...params, attemptKey, body })
    if (made.made)
      log.info({ companyId: params.companyId, conversationId: made.id }, 'CONVERSATION_CREATED')
    const createdAt = made.createdAt.toISOString()
    return answer({ conversation: { id: made.id, title: null, createdAt, model: made.model } })
  })

  serve(app, setConversationModel, async (input) => {
    const { person, params, body } = input
    await store.owned({ person, ...params })
    const { model, effort } = await changeModel(
      { controller: deps.builder.controller, queue: deps.queue },
      { kind: 'builder', owner: ownerOf(input), id: params.conversationId, choice: body },
    )
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

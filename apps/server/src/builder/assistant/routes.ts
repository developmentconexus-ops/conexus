import type {
  CompanyId,
  ConnectionId,
  Effort,
  ModelId,
  Next,
  Person,
  ProjectId,
} from '@conexus/hub-api'
import {
  ConversationId,
  createAssistantConversation,
  listAssistantConnections,
  listAssistantConversations,
  ProjectId as ProjectIdSchema,
  readAssistantConversation,
  setAssistantConnections,
} from '@conexus/hub-api'
import type { AgentController } from '@mastra/core/agent-controller'
import type { StorageThreadType } from '@mastra/core/memory'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { Connectors, SessionScope } from '../../hub/connectors/public.ts'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { answer, serve } from '../../platform/http.ts'
import type { QueueDeps } from '../model-accounts/public.ts'
import type { ChosenConnections } from './chosen.ts'
import type { Owner } from './context.ts'
import { assistantOwner, SESSION_MARK, scopeOn } from './context.ts'
import { registerFile } from './file-route.ts'
import type { AssistantMachines } from './machine.ts'
import type { assistantMemory } from './memory.ts'
import {
  admitted,
  automationOf,
  conversationIdOf,
  offeredOnly,
  openConversation,
  placeOf,
} from './open.ts'
import type { AssistantProjects } from './ports.ts'

/**
 * A page of the person's conversations (code C44): a page number the token carries, never
 * authority.
 */
const PER_PAGE = 30
const PageNumber = z.coerce.number().int().min(1).max(100_000)

type Deps = {
  database: Database
  identity: IdentityPorts
  connectors: Connectors['assistant']
  projects: Pick<AssistantProjects, 'liveProjectOf'>
  queue: QueueDeps
  controller: AgentController
  memory: ReturnType<typeof assistantMemory>
  machines: AssistantMachines
  chosen: ChosenConnections
  log: FailureLog
}

function ownerOf(input: { person: Person; params: { companyId: CompanyId } }): Owner {
  return { companyId: input.params.companyId, personId: input.person.id }
}

/**
 * The person's own thread of the Assistant, or `CONVERSATION_NOT_FOUND`; another's and one that
 * does not exist answer the same (S10).
 */
async function ownThread(deps: Deps, owner: Owner, conversationId: ConversationId) {
  const resourceId = assistantOwner(owner)
  const thread = await deps.memory.getThreadById({ threadId: conversationId, resourceId })
  if (thread === null) throw new Failure('CONVERSATION_NOT_FOUND')
  return thread
}

/**
 * The thread's scope, read with no session (a `GET` starts nothing): its place and choice as the
 * Hub keeps them.
 */
async function scopeOfThread(deps: Deps, owner: Owner, thread: StorageThreadType) {
  return scopeOn(owner, await deps.chosen.of(owner, ConversationId.parse(thread.id)))
}

/**
 * What the conversation answers: its summary and each connection its place offers, with whether it
 * chose it.
 */
async function conversationOf(deps: Deps, thread: StorageThreadType, scope: SessionScope) {
  const connections = await deps.connectors.connections(scope)
  return {
    id: ConversationId.parse(thread.id),
    title: thread.title || null,
    updatedAt: thread.updatedAt.toISOString(),
    projectId: scope.place.kind === 'PROJECT' ? scope.place.projectId : null,
    automation: automationOf(thread.metadata),
    connections: connections.map(({ connectionId, connector, name, chosen }) => ({
      connectionId,
      connector,
      name,
      chosen,
    })),
  }
}

type Asked = {
  model?: ModelId | undefined
  effort?: Effort | undefined
  projectId?: ProjectId | undefined
  connections: ConnectionId[]
}

/**
 * A conversation's creation, keyed by its attempt (code C37): the person and the place admitted
 * first, nothing made on a refusal (`openConversation` keeps the rest).
 */
async function created(deps: Deps, owner: Owner, input: { attemptKey: string; body: Asked }) {
  const place = placeOf(input.body.projectId)
  await admitted(deps, owner, place)
  const id = conversationIdOf(owner, input.attemptKey)
  const { body } = input
  const opened = await openConversation(deps, {
    ...{ owner, place, id, connections: body.connections },
    ...{ model: body.model, effort: body.effort },
  })
  const thread = await ownThread(deps, owner, id)
  return { made: opened.made, thread, model: opened.model }
}

function nextOf(page: number, hasMore: boolean): Next {
  return hasMore
    ? { kind: 'MORE', page: Buffer.from(String(page + 1)).toString('base64url') }
    : { kind: 'END' }
}

/** The page a token names; a token the Hub did not make finds nothing (criterion 9). */
function pageOf(token: string | undefined): number {
  if (token === undefined) return 0
  const read = PageNumber.safeParse(Buffer.from(token, 'base64url').toString('utf8'))
  if (!read.success || Buffer.from(String(read.data)).toString('base64url') !== token) {
    throw new Failure('NOT_FOUND', { details: { reason: 'PAGE' } })
  }
  return read.data
}

/** The live Projetos the page's conversations were born in, by id, with their names. */
async function projectNames(deps: Deps, owner: Owner, marks: readonly (ProjectId | null)[]) {
  const ids = new Set(marks.flatMap((mark) => (mark === null ? [] : [mark])))
  const found = await deps.database.read({ kind: 'COMPANY', ...owner }, (tx) =>
    Promise.all(
      [...ids].map(async (projectId) => {
        const live = await deps.projects.liveProjectOf(tx, {
          companyId: owner.companyId,
          projectId,
        })
        return [projectId, live?.name] as const
      }),
    ),
  )
  return new Map(found)
}

/** A conversation's Projeto as the list shows it: its name while the Projeto is live, else none. */
function projectShown(mark: ProjectId | null, names: ReadonlyMap<ProjectId, string | undefined>) {
  const name = mark === null ? undefined : names.get(mark)
  return mark === null || name === undefined ? null : { id: mark, name }
}

/** The reads: the person's conversations, one conversation, and what a new one would be offered. */
function registerReads(app: FastifyInstance, deps: Deps): void {
  serve(app, listAssistantConversations, async (input) => {
    const owner = ownerOf(input)
    const { projectId, page: token } = input.query
    await admitted(deps, owner, placeOf(projectId))
    const page = pageOf(token)
    const listed = await deps.memory.listThreads({
      filter: {
        resourceId: assistantOwner(owner),
        ...(projectId === undefined ? {} : { metadata: { [SESSION_MARK.project]: projectId } }),
      },
      page,
      perPage: PER_PAGE,
      orderBy: { field: 'updatedAt', direction: 'DESC' },
    })
    const marks = listed.threads.map((thread) =>
      ProjectIdSchema.nullable().parse(thread.metadata?.[SESSION_MARK.project] ?? null),
    )
    const names = await projectNames(deps, owner, marks)
    const conversations = listed.threads.map((thread, at) => ({
      id: ConversationId.parse(thread.id),
      title: thread.title || null,
      updatedAt: thread.updatedAt.toISOString(),
      project: projectShown(marks[at] ?? null, names),
      automation: automationOf(thread.metadata),
    }))
    return answer({ conversations, next: nextOf(page, listed.hasMore) })
  })

  serve(app, readAssistantConversation, async (input) => {
    const owner = ownerOf(input)
    await admitted(deps, owner, { kind: 'COMPANY' })
    const thread = await ownThread(deps, owner, input.params.conversationId)
    const scope = await scopeOfThread(deps, owner, thread)
    return answer({ conversation: await conversationOf(deps, thread, scope) })
  })

  serve(app, listAssistantConnections, async (input) => {
    const owner = ownerOf(input)
    const place = placeOf(input.query.projectId)
    await admitted(deps, owner, place)
    const offered = await deps.connectors.connections({ ...owner, place, chosen: [] })
    const connections = offered.map(({ connectionId, connector, name }) => ({
      connectionId,
      connector,
      name,
      chosen: true,
    }))
    return answer({ connections })
  })
}

/** The writes: a new conversation, and its choice of connections. */
function registerWrites(app: FastifyInstance, deps: Deps): void {
  serve(app, createAssistantConversation, async (input) => {
    const owner = ownerOf(input)
    const made = await created(deps, owner, { attemptKey: input.attemptKey, body: input.body })
    const scope = await scopeOfThread(deps, owner, made.thread)
    if (made.made) {
      deps.log.info(
        {
          ...owner,
          traceId: input.traceId,
          conversationId: made.thread.id,
          inProject: scope.place.kind === 'PROJECT',
        },
        'ASSISTANT_CONVERSATION_CREATED',
      )
    }
    const conversation = await conversationOf(deps, made.thread, scope)
    return answer({ conversation: { ...conversation, model: made.model } })
  })

  serve(app, setAssistantConnections, async (input) => {
    const owner = ownerOf(input)
    const { conversationId } = input.params
    await admitted(deps, owner, { kind: 'COMPANY' })
    const thread = await ownThread(deps, owner, conversationId)
    const scope = await scopeOfThread(deps, owner, thread)
    const chosen = await offeredOnly(deps, scope, input.body.connections)
    await deps.chosen.change(owner, conversationId, chosen)
    deps.log.info(
      { companyId: owner.companyId, traceId: input.traceId, conversationId, count: chosen.length },
      'ASSISTANT_CONNECTIONS_CHANGED',
    )
    const conversation = await conversationOf(deps, thread, { ...scope, chosen })
    return answer({ conversation })
  })
}

/**
 * The Assistant's conversations (step 24.1, U2): every route admits the person who may ask now
 * (`askAssistant`).
 */
export function registerAssistantRoutes(app: FastifyInstance, deps: Deps): void {
  registerReads(app, deps)
  registerWrites(app, deps)
  registerFile(app, {
    machines: deps.machines,
    log: deps.log,
    ownConversation: async (owner, conversationId) => {
      await admitted(deps, owner, { kind: 'COMPANY' })
      await ownThread(deps, owner, conversationId)
    },
  })
}

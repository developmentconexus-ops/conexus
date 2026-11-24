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
  ASSISTANT_FILE,
  ConversationId,
  createAssistantConversation,
  deleteAssistantConversation,
  listAssistantConnections,
  listAssistantConversations,
  ProjectId as ProjectIdSchema,
  readAssistantConversation,
  renameAssistantConversation,
  setAssistantConnections,
  setAssistantModel,
} from '@conexus/hub-api'
import type { AgentController } from '@mastra/core/agent-controller'
import type { StorageThreadType } from '@mastra/core/memory'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { QueueDeps } from '../../harness/model-accounts/public.ts'
import type { Access, Place } from '../../hub/access/public.ts'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { answer, serve } from '../../platform/http.ts'
import type { CompanyProjects } from '../company-tools/public.ts'
import type { Owner } from '../controller-kit/public.ts'
import {
  answerModelChange,
  attemptIdOf,
  ownThread,
  RUN_MARKS,
  releaseThreads,
} from '../controller-kit/public.ts'
import type { ConversationMachines } from '../machine/public.ts'
import { registerFile } from '../machine/public.ts'
import type { ChosenConnections } from './chosen.ts'
import type { CompanyMemory } from './company-memory.ts'
import { registerCompanyMemoryRoutes } from './company-memory-routes.ts'
import type { assistantMemory } from './memory.ts'
import {
  admitted,
  assistantMarks,
  automationOf,
  offeredAmong,
  offeredBy,
  offeredWith,
  openConversation,
  placeOf,
} from './open.ts'
import { registerProfileMemoryRoutes } from './profile-memory.ts'
import { listedPage } from './search.ts'

/**
 * A page of the person's conversations (code C44): a page number the token carries, never
 * authority.
 */
const PageNumber = z.coerce.number().int().min(1).max(100_000)

type Deps = {
  database: Database
  identity: IdentityPorts
  access: Pick<Access, 'viewOf'>
  projects: Pick<CompanyProjects, 'liveProjectOf'>
  queue: QueueDeps
  controller: AgentController
  memory: ReturnType<typeof assistantMemory>
  company: CompanyMemory
  machines: ConversationMachines
  chosen: ChosenConnections
  log: FailureLog
}

function ownerOf(input: { person: Person; params: { companyId: CompanyId } }): Owner {
  return { companyId: input.params.companyId, personId: input.person.id }
}

/** Admits the person who may ask, then reads the thread they own and its scope. */
async function ownScoped(deps: Deps, owner: Owner, conversationId: ConversationId) {
  await admitted(deps, owner, { kind: 'COMPANY' }, 'askAssistant')
  const thread = await ownThread(deps.memory, 'assistant', owner, conversationId)
  return { thread, scope: await scopeOfThread(deps, owner, thread) }
}

/** A conversation's place and choice as the Hub keeps them. */
type Kept = Readonly<{ place: Place; chosen: readonly ConnectionId[] }>

/** The thread's place and choice, read with no session (a `GET` starts nothing). */
async function scopeOfThread(deps: Deps, owner: Owner, thread: StorageThreadType): Promise<Kept> {
  const kept = await deps.chosen.of(owner, ConversationId.parse(thread.id))
  return { place: placeOf(kept.projectId), chosen: kept.connections }
}

/**
 * What the conversation answers: its summary and each connection its place offers the owner, by
 * the access door's view, with whether the row chose it.
 */
async function conversationOf(deps: Deps, owner: Owner, thread: StorageThreadType, kept: Kept) {
  return {
    id: ConversationId.parse(thread.id),
    title: thread.title || null,
    createdAt: thread.createdAt.toISOString(),
    updatedAt: thread.updatedAt.toISOString(),
    projectId: kept.place.kind === 'PROJECT' ? kept.place.projectId : null,
    automation: automationOf(thread.metadata),
    connections: await offeredWith(deps.access, owner, kept.place, kept.chosen),
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
  await admitted(deps, owner, place, 'askAssistant')
  const id = attemptIdOf('assistant', owner, input.attemptKey)
  const { body } = input
  const opened = await openConversation(deps, {
    ...{ owner, place, id, connections: body.connections },
    ...{ model: body.model, effort: body.effort },
  })
  const thread = await ownThread(deps.memory, 'assistant', owner, id)
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
    const { projectId, page: token, q, place } = input.query
    await admitted(deps, owner, placeOf(projectId), 'askAssistant')
    const page = pageOf(token)
    const listed = await listedPage(deps.memory, { owner, projectId, page, q, place })
    const marks = listed.threads.map((thread) =>
      ProjectIdSchema.nullable().parse(thread.metadata?.[RUN_MARKS.assistant.project] ?? null),
    )
    const names = await projectNames(deps, owner, marks)
    const conversations = listed.threads.map((thread, at) => ({
      id: ConversationId.parse(thread.id),
      title: thread.title || null,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
      project: projectShown(marks[at] ?? null, names),
      automation: automationOf(thread.metadata),
    }))
    return answer({ conversations, next: nextOf(page, listed.hasMore) })
  })

  serve(app, readAssistantConversation, async (input) => {
    const owner = ownerOf(input)
    const { thread, scope } = await ownScoped(deps, owner, input.params.conversationId)
    return answer({ conversation: await conversationOf(deps, owner, thread, scope) })
  })

  serve(app, listAssistantConnections, async (input) => {
    const owner = ownerOf(input)
    const place = placeOf(input.query.projectId)
    await admitted(deps, owner, place, 'askAssistant')
    const offered = await offeredBy(deps.access, owner, place)
    const connections = offered.map(({ connection, connector, name }) => ({
      connectionId: connection,
      connector,
      name,
      chosen: true,
    }))
    return answer({ connections })
  })
}

/** What the person does to a conversation she has: Renomear and Apagar. */
function registerChanges(app: FastifyInstance, deps: Deps): void {
  serve(app, renameAssistantConversation, async (input) => {
    const owner = ownerOf(input)
    const { conversationId } = input.params
    await admitted(deps, owner, { kind: 'COMPANY' }, 'askAssistant')
    await ownThread(deps.memory, 'assistant', owner, conversationId)
    const { title } = input.body
    // `titlePinned`: the memory's own titling no longer replaces the one the person chose. The
    // memory merges the metadata with what is stored.
    await deps.memory.updateThread({ id: conversationId, title, metadata: { titlePinned: true } })
    deps.log.info(
      { companyId: owner.companyId, traceId: input.traceId, conversationId },
      'ASSISTANT_CONVERSATION_RENAMED',
    )
    return answer({ title })
  })

  serve(app, deleteAssistantConversation, async (input) => {
    const owner = ownerOf(input)
    const { conversationId } = input.params
    await admitted(deps, owner, { kind: 'COMPANY' }, 'askAssistant')
    await ownThread(deps.memory, 'assistant', owner, conversationId)
    // The session first, so its answer stops; then its machines; the thread last, so a failure
    // halfway leaves what the next delete finds again. The row of its choice stays until
    // its Projeto, person or company leaves: the Hub holds no `DELETE` on it (data D11).
    await releaseThreads(deps, [conversationId], (id) => deps.machines.kill(id))
    deps.log.info(
      { companyId: owner.companyId, traceId: input.traceId, conversationId },
      'ASSISTANT_CONVERSATION_DELETED',
    )
    return answer(undefined)
  })
}

/** The writes: a new conversation, its choice of connections and its model. */
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
    const conversation = await conversationOf(deps, owner, made.thread, scope)
    return answer({ conversation: { ...conversation, model: made.model } })
  })

  serve(app, setAssistantConnections, async (input) => {
    const owner = ownerOf(input)
    const { conversationId } = input.params
    const { thread, scope } = await ownScoped(deps, owner, conversationId)
    const chosen = await offeredAmong(deps.access, owner, scope.place, input.body.connections)
    await deps.chosen.change(owner, conversationId, chosen)
    deps.log.info(
      { companyId: owner.companyId, traceId: input.traceId, conversationId, count: chosen.length },
      'ASSISTANT_CONNECTIONS_CHANGED',
    )
    const conversation = await conversationOf(deps, owner, thread, { ...scope, chosen })
    return answer({ conversation })
  })

  serve(app, setAssistantModel, (input) => {
    const owner = ownerOf(input)
    const { conversationId } = input.params
    return answerModelChange(
      {
        kind: 'assistant',
        controller: deps.controller,
        queue: deps.queue,
        owned: async () => {
          const {
            thread,
            scope: { place },
          } = await ownScoped(deps, owner, conversationId)
          const tags = assistantMarks(owner, {
            projectId: place.kind === 'PROJECT' ? place.projectId : undefined,
            automation: automationOf(thread.metadata) ?? undefined,
          })
          return { owner, id: conversationId, tags }
        },
        logged: ({ companyId, conversationId }) =>
          deps.log.info(
            { companyId, traceId: input.traceId, conversationId },
            'ASSISTANT_MODEL_SET',
          ),
      },
      input.body,
    )
  })
}

/**
 * The Assistant's conversations (step 24.1, U2): every route admits the person who may ask now
 * (`askAssistant`).
 */
export function registerAssistantRoutes(app: FastifyInstance, deps: Deps): void {
  registerReads(app, deps)
  registerWrites(app, deps)
  registerChanges(app, deps)
  registerProfileMemoryRoutes(app, deps)
  registerCompanyMemoryRoutes(app, deps)
  registerFile(app, {
    route: ASSISTANT_FILE,
    machines: deps.machines,
    log: deps.log,
    served: 'ASSISTANT_FILE_READ',
    ownConversation: async (owner, conversationId) => {
      await admitted(deps, owner, { kind: 'COMPANY' }, 'askAssistant')
      await ownThread(deps.memory, 'assistant', owner, conversationId)
    },
  })
}

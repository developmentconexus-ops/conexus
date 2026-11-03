import type {
  CompanyId,
  ConnectionId,
  ConversationId,
  HandedOff,
  HandOffRefusal,
  Person,
  ProjectId,
  ProjectName,
} from '@conexus/hub-api'
import { ASSISTANT_TOOL, handAssistantProposal, ProposedApp } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { answer, serve } from '../../platform/http.ts'
import { resourceOf } from '../controller-kit/public.ts'
import type { ChosenConnections } from './chosen.ts'
import type { Owner } from './context.ts'
import type { assistantMemory } from './memory.ts'
import { admitted, placeOf } from './open.ts'
import type { AssistantProjects } from './ports.ts'

/** The Builder's session a hand-off sends on: Mastra's, as `openSession` gives it. */
type BuilderSession = {
  sendSignal(
    input: {
      type: 'user'
      tagName: string
      contents: { type: 'text'; text: string }[]
      attributes: Record<string, string>
      author: { id: string; name: string }
    },
    options: { requireDelivery: true },
  ): { accepted: Promise<{ action: string }> }
}

/**
 * What a hand-off reaches the other subjects through (code C4): the Projects' creation, the
 * connectors' grants and the Builder's conversations, each the same door its own route uses. They
 * are made after the Assistant, so the route reaches them when called.
 */
export type HandOffDoors = {
  createProject(input: {
    person: Person
    companyId: CompanyId
    name: ProjectName
    attemptKey: string
  }): Promise<{ project: { id: ProjectId }; created: boolean; databaseCreated: boolean }>
  grants: {
    may(viewer: { person: Person; companyId: CompanyId }): Promise<boolean>
    grant(input: {
      person: Person
      companyId: CompanyId
      projectId: ProjectId
      connectionId: ConnectionId
    }): Promise<unknown>
  }
  builder: {
    open(input: {
      person: Person
      companyId: CompanyId
      projectId: ProjectId
      attemptKey: string
      body: Record<string, never>
    }): Promise<{ id: ConversationId; made: boolean; session: BuilderSession }>
    asked(owner: Owner, conversationId: ConversationId): Promise<boolean>
  }
  updating(): boolean
}

export type HandOffDeps = {
  database: Database
  identity: IdentityPorts
  projects: Pick<AssistantProjects, 'liveProjectOf'>
  memory: ReturnType<typeof assistantMemory>
  chosen: ChosenConnections
  doors: () => HandOffDoors
  log: FailureLog
}

/** A tool's call as Mastra stores it in the message's parts. */
const Invocation = z.object({
  type: z.literal('tool-invocation'),
  toolInvocation: z.object({
    state: z.literal('result'),
    toolCallId: z.string(),
    toolName: z.string(),
    result: z.unknown(),
  }),
})

/**
 * The proposal the call stored in the person's own conversation, by its id, and only of the
 * hand-off its place offers; any other is `NOT_FOUND` (S10).
 */
async function proposalOf(
  deps: HandOffDeps,
  owner: Owner,
  call: { conversationId: ConversationId; toolCallId: string; toolName: string },
): Promise<ProposedApp> {
  const { messages } = await deps.memory.recall({
    threadId: call.conversationId,
    resourceId: resourceOf('assistant', owner),
    perPage: false,
  })
  for (const part of messages.flatMap((message) => message.content.parts)) {
    const invocation = Invocation.safeParse(part)
    if (!invocation.success) continue
    const { toolCallId, toolName, result } = invocation.data.toolInvocation
    if (toolCallId !== call.toolCallId || toolName !== call.toolName) continue
    const proposal = ProposedApp.safeParse(result)
    if (proposal.success) return proposal.data
  }
  throw new Failure('NOT_FOUND', { details: { reason: 'PROPOSAL' } })
}

type Refused = { connectionId: ConnectionId; code: HandOffRefusal }

/**
 * Releases to the new Projeto each marked connection the conversation chose, when the person may
 * (`manageConnections`); one that does not work, or is gone, is refused and the others released.
 */
async function released(
  deps: HandOffDeps,
  input: { person: Person; companyId: CompanyId; projectId: ProjectId },
  marked: readonly ConnectionId[],
  chosen: readonly ConnectionId[],
): Promise<{ released: ConnectionId[]; refused: Refused[] }> {
  if (marked.length === 0) return { released: [], refused: [] }
  const { grants } = deps.doors()
  if (!(await grants.may(input))) {
    return {
      released: [],
      refused: marked.map((connectionId) => ({ connectionId, code: 'CONNECTIONS_NOT_ALLOWED' })),
    }
  }
  const done: { released: ConnectionId[]; refused: Refused[] } = { released: [], refused: [] }
  for (const connectionId of new Set(marked)) {
    if (!chosen.includes(connectionId)) {
      done.refused.push({ connectionId, code: 'CONNECTION_NOT_FOUND' })
      continue
    }
    try {
      await grants.grant({ ...input, connectionId })
    } catch (error) {
      const code = error instanceof Failure ? Refusal.safeParse(error.code) : undefined
      if (code?.success !== true) throw error
      done.refused.push({ connectionId, code: code.data })
      continue
    }
    deps.log.info(
      { by: input.person.id, companyId: input.companyId, projectId: input.projectId, connectionId },
      'PROJECT_CONNECTION_GRANTED',
    )
    done.released.push(connectionId)
  }
  return done
}

/** The grant's refusals of one connection that leave the others to release. */
const Refusal = z.enum(['CONNECTION_NOT_WORKING', 'CONNECTION_NOT_FOUND'])

/**
 * What the Builder receives, as Mastra's `createMessageInput` sends a text file with a message: the
 * summary, then the briefing labelled and fenced longer than any run of backticks it holds.
 */
function contentsOf(proposal: ProposedApp): { type: 'text'; text: string }[] {
  const { briefing } = proposal
  if (briefing === undefined) return [{ type: 'text', text: proposal.summary }]
  const longest = Math.max(0, ...[...briefing.content.matchAll(/`+/g)].map((run) => run[0].length))
  const fence = '`'.repeat(Math.max(3, longest + 1))
  const file = `[File: ${briefing.name}]\n${fence}\n${briefing.content}\n${fence}`
  return [
    { type: 'text', text: proposal.summary },
    { type: 'text', text: file },
  ]
}

type HandOffInput = {
  person: Person
  companyId: CompanyId
  conversationId: ConversationId
  attemptKey: string
  body: { toolCallId: string; projectName?: ProjectName | undefined; connections: ConnectionId[] }
  log: FailureLog
}

/** The Projeto of the hand-off: created by the attempt on the Início, the conversation's in one. */
async function projectOf(
  deps: HandOffDeps,
  input: HandOffInput,
  place: { kind: 'COMPANY' } | { kind: 'PROJECT'; projectId: ProjectId },
): Promise<ProjectId> {
  if (place.kind === 'PROJECT') return place.projectId
  const { person, companyId, attemptKey, body } = input
  if (body.projectName === undefined) {
    throw new Failure('REQUEST_MALFORMED', { details: { reason: 'PROJECT_NAME' } })
  }
  const made = await deps
    .doors()
    .createProject({ person, companyId, name: body.projectName, attemptKey })
  if (made.databaseCreated) input.log.info({ by: person.id, companyId }, 'COMPANY_DATABASE_CREATED')
  if (made.created) {
    input.log.info({ by: person.id, companyId, projectId: made.project.id }, 'PROJECT_CREATED')
  }
  return made.project.id
}

/**
 * The touch of **Criar app** or **Mandar ao Builder** (step 24.3.2, U2): the proposal read from
 * the person's conversation, the Projeto, the marked connections released, then a conversation of
 * that Projeto's Builder that receives the proposal once, as a signal marked as the Assistant's
 * (as an automation's run sends its own, `automations/run.ts`). Every step is keyed by the attempt,
 * so a second touch finds what the first made and sends only when nothing was sent.
 */
export async function handOff(deps: HandOffDeps, input: HandOffInput): Promise<HandedOff> {
  const { person, companyId, conversationId } = input
  const owner = { companyId, personId: person.id }
  const doors = deps.doors()
  if (doors.updating()) throw new Failure('HUB_UPDATING')
  const resourceId = resourceOf('assistant', owner)
  const thread = await deps.memory.getThreadById({ threadId: conversationId, resourceId })
  if (thread === null) throw new Failure('CONVERSATION_NOT_FOUND')
  const kept = await deps.chosen.of(owner, conversationId)
  const place = placeOf(kept.projectId)
  await admitted(deps, owner, place)
  const toolName =
    place.kind === 'COMPANY' ? ASSISTANT_TOOL.proposeApp : ASSISTANT_TOOL.proposeAppChange
  const proposal = await proposalOf(deps, owner, {
    conversationId,
    toolCallId: input.body.toolCallId,
    toolName,
  })
  const projectId = await projectOf(deps, input, place)
  const grants =
    place.kind === 'COMPANY'
      ? await released(
          deps,
          { person, companyId, projectId },
          input.body.connections,
          kept.connections,
        )
      : { released: [], refused: [] }
  const ids = { person, companyId, projectId }
  const opened = await doors.builder.open({ ...ids, attemptKey: input.attemptKey, body: {} })
  if (opened.made) {
    input.log.info({ companyId, conversationId: opened.id }, 'CONVERSATION_CREATED')
  }
  // A conversation that already holds a message received the proposal: never twice.
  if (!(await doors.builder.asked(owner, opened.id))) {
    const sent = opened.session.sendSignal(
      {
        type: 'user',
        tagName: 'user',
        contents: contentsOf(proposal),
        attributes: { source: 'assistant', assistantConversation: conversationId },
        author: { id: person.id, name: person.name },
      },
      { requireDelivery: true },
    )
    const { action } = await sent.accepted
    if (action !== 'wake' && action !== 'deliver') throw new Failure('HANDOFF_NOT_DELIVERED')
    input.log.info({ companyId, conversationId: opened.id, projectId }, 'ASSISTANT_HANDED_OFF')
  }
  return { projectId, conversationId: opened.id, ...grants }
}

/** The hand-off's route, beside the Assistant's own (`routes.ts`). */
export function registerHandOff(app: FastifyInstance, deps: HandOffDeps): void {
  serve(app, handAssistantProposal, async ({ person, params, body, attemptKey, log }) =>
    answer(await handOff(deps, { person, ...params, attemptKey, body, log }), 201),
  )
}

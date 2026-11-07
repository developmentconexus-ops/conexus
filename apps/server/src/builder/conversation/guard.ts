import type { ServerResponse } from 'node:http'
import type { CompanyId, ConnectionId, FailureCode, Person } from '@conexus/hub-api'
import { BUILDER_ROUTES, ConversationId, PersonId, ToolCallId } from '@conexus/hub-api'
import type { Mastra } from '@mastra/core/mastra'
import type { RequestContext } from '@mastra/core/request-context'
import { MASTRA_MESSAGE_AUTHOR_KEY } from '@mastra/core/request-context'
import { SERVER_ROUTES } from '@mastra/server/server-adapter'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { sessionOf } from '../../platform/access.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { ControllerKind } from '../controller-kit/public.ts'
import { CONTROLLER_KINDS, ownerOfResource } from '../controller-kit/public.ts'
import type { Builder } from './builder.ts'
import { BuilderServer } from './stream.ts'

const SESSION = '/agent-controller/:controllerId/sessions/:sessionId'

/**
 * The only routes of Mastra's server the Hub exposes (security S39, decision 0050): a session's
 * state, stream, a message, Parar, a card's answer, a write's Aprovar or Recusar (step 24.5) and
 * the transcript. Any other is not registered, so it is a 404.
 */
const FIXED_LIST: ReadonlySet<string> = new Set([
  `GET ${SESSION}`,
  `GET ${SESSION}/stream`,
  `POST ${SESSION}/messages`,
  `POST ${SESSION}/abort`,
  `POST ${SESSION}/tool-suspension`,
  `POST ${SESSION}/tool-approval`,
  `GET ${SESSION}/threads/:threadId/messages`,
])

/**
 * Where the guard tells the resumed run which call a person approved (step 24.5): Mastra hands the
 * answer's `requestContext` to the run it resumes, and a write's `execute` reads it to know it
 * passed a card. The browser cannot set it: a `requestContext` in a body is refused.
 */
const APPROVED_CALL = 'conexus-approved-call'
const ApprovedCall = z.object({ toolCallId: ToolCallId, personId: PersonId })

/** The call a person approved in this run, if any. */
export function approvedCallOf(requestContext: RequestContext) {
  return ApprovedCall.safeParse(requestContext.get(APPROVED_CALL)).data
}

/** What the guard writes to the log once Mastra's handler has taken the answer, and not before. */
const TOLD = 'conexus-write-answer'
const Told = z.object({ fields: z.record(z.string(), z.string()), message: z.string() })
const Taken = z.object({ ok: z.literal(true) })

const ToolAnswer = z.object({ toolCallId: ToolCallId, approved: z.boolean() })

/**
 * 30 MiB: the route's sum of files (29 360 128 characters), the message, the JSON's keys and room.
 * Without it Fastify's 1 MiB holds.
 */
const BODY_LIMIT = 31_457_280

const CONTROLLER_IDS = Object.values(CONTROLLER_KINDS).map((each) => each.id)
const Params = z.object({
  controllerId: z.enum(CONTROLLER_IDS),
  sessionId: ConversationId,
  threadId: z.string().optional(),
})
const Query = z.object({ threadId: z.string().optional() })
const FileData = z.looseObject({
  files: z.array(z.looseObject({ data: z.string().startsWith('data:') })),
})

/** What the guard and the Hub's platform answer on these routes; Mastra's handlers answer their own. */
const FAILURES = [
  'REQUEST_ORIGIN_REFUSED',
  'REQUEST_MALFORMED',
  'REQUEST_MEDIA_TYPE_REFUSED',
  'REQUEST_TOO_LARGE',
  'INTERNAL_UNEXPECTED',
  'DATABASE_UNAVAILABLE',
  'CONVERSATION_NOT_FOUND',
  'HUB_UPDATING',
] as const satisfies readonly FailureCode[]

/**
 * A run's context, or another thread's messages by id (`include`, which Mastra's storage scopes by
 * the person only), asked by the browser.
 */
function overreaches(input: unknown): boolean {
  if (typeof input !== 'object' || input === null) return false
  return Object.hasOwn(input, 'requestContext') || Object.hasOwn(input, 'include')
}

/**
 * A file whose `data` is not a `data:` URL, which the browser always sends (`readAsDataURL`).
 * Mastra downloads an http(s) one itself, internal addresses included
 * (`@mastra/core@1.79.0` `message-list-Bfir0O2V.js:12016-12041`), and its schema has no way to refuse it.
 */
function sendsFileUrl(input: unknown): boolean {
  return (
    typeof input === 'object' &&
    input !== null &&
    'files' in input &&
    !FileData.safeParse(input).success
  )
}

/** Mastra's routes of the fixed list, each found in the installed server, or the Hub does not start. */
function builderRoutes() {
  const found = SERVER_ROUTES.filter((route) => FIXED_LIST.has(`${route.method} ${route.path}`))
  if (found.length !== FIXED_LIST.size) {
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'MASTRA_ROUTE_MISSING' } })
  }
  return found
}

/** What the guard asks of the controller a thread is of: whether the person may hold it now. */
type Admission = (input: {
  person: Person
  companyId: CompanyId
  conversationId: ConversationId
}) => Promise<void>

/** The connection and operation of the write a conversation's tool names, as the agent that holds it keeps them (step 24.5). */
export type WriteOf = (input: {
  companyId: CompanyId
  personId: PersonId
  conversationId: ConversationId
  toolName: string
}) => Promise<{ connectionId: ConnectionId; operation: string } | undefined>

/** The controllers on the one `Mastra`, as the guard consults them (`builder/mastra/`). */
export type GuardedMastra = {
  mastra: Mastra
  part(kind: ControllerKind): { admit: Admission; writeOf?: WriteOf } | undefined
  updating(): boolean
}

/**
 * The conversation a request to Mastra's routes names, if it is the person's and of the controller
 * the path names: the thread's resource names its controller, company and person (`resourceOf`),
 * and that controller admits the person now (the Builder by the Hub's index and membership, the
 * Assistant by `askAssistant`); a refusal is the same 404 (S10).
 * A `requestContext` from the browser is refused: Mastra's server copies it into the run's context,
 * and `mastra__messageAuthor` is not one of its reserved keys (measured, prove2 e21-bare). So is
 * `include`, which would read messages of the person's other conversations. So is a file that is
 * not a `data:` URL. While the Hub settles before it stops, a new message is refused before Mastra
 * starts a turn (founder E1).
 */
async function guard(deps: { builder: Builder; hub: GuardedMastra }, request: FastifyRequest) {
  if (overreaches(request.body) || overreaches(request.query) || sendsFileUrl(request.body)) {
    throw new Failure('REQUEST_MALFORMED')
  }
  const { person } = sessionOf(request)
  const params = Params.safeParse(request.params)
  if (!params.success) throw new Failure('CONVERSATION_NOT_FOUND')
  const { controllerId, sessionId: conversationId, threadId } = params.data
  const asked = Query.safeParse(request.query)
  const queried = asked.success ? asked.data.threadId : undefined
  if (!asked.success) throw new Failure('REQUEST_MALFORMED')
  for (const named of [threadId, queried]) {
    if (named !== undefined && named !== conversationId) throw new Failure('CONVERSATION_NOT_FOUND')
  }
  const thread = await deps.builder.memory.getThreadById({ threadId: conversationId })
  const owner = ownerOfResource(thread?.resourceId)
  const part = owner === undefined ? undefined : deps.hub.part(owner.kind)
  if (
    owner === undefined ||
    part === undefined ||
    owner.personId !== person.id ||
    CONTROLLER_KINDS[owner.kind].id !== controllerId
  ) {
    throw new Failure('CONVERSATION_NOT_FOUND')
  }
  await admittedBy(part.admit, { person, companyId: owner.companyId, conversationId })
  if (
    deps.hub.updating() &&
    request.method === 'POST' &&
    request.routeOptions.url?.endsWith('/messages')
  ) {
    throw new Failure('HUB_UPDATING')
  }
  request.requestContext.setRaw(MASTRA_MESSAGE_AUTHOR_KEY, { id: person.id, name: person.name })
  return { person, controllerId, conversationId, companyId: owner.companyId, part }
}

/**
 * A write's Aprovar or Recusar reaches Mastra only for a gate parked in this session now (step
 * 24.5): after Parar, a new message or a restart, Mastra would answer the stored wait and run the
 * write, and the card no longer exists. The autonomy lives in the version
 * alone, so the always-allow of Mastra's body is refused. Anything else answers `not_pending`.
 */
async function toolAnswer(
  deps: { hub: GuardedMastra; log: FailureLog },
  request: FastifyRequest,
  at: Awaited<ReturnType<typeof guard>>,
): Promise<{ ok: false; reason: 'not_pending' } | undefined> {
  if (typeof request.body === 'object' && request.body !== null) {
    if (Object.hasOwn(request.body, 'alwaysAllowCategory')) throw new Failure('REQUEST_MALFORMED')
  }
  const answer = ToolAnswer.safeParse(request.body)
  if (!answer.success) throw new Failure('REQUEST_MALFORMED')
  const { toolCallId, approved } = answer.data
  const controller = deps.hub.mastra.getAgentController(at.controllerId)
  const session = await controller?.getSession(at.conversationId)
  if (session === undefined || !session.approval.isArmed({ toolCallId })) {
    return { ok: false, reason: 'not_pending' }
  }
  const toolName = session.displayState.get().pendingApprovals.get(toolCallId)?.toolName
  const write =
    toolName === undefined
      ? undefined
      : await at.part.writeOf?.({
          ...{ companyId: at.companyId, personId: at.person.id, conversationId: at.conversationId },
          toolName,
        })
  request.requestContext.set(TOLD, {
    fields: {
      ...{ companyId: at.companyId, conversationId: at.conversationId, toolCallId },
      ...{ personId: at.person.id, ...(toolName === undefined ? {} : { toolName }), ...write },
    },
    message: approved ? 'CONNECTOR_WRITE_APPROVED' : 'CONNECTOR_WRITE_DECLINED',
  })
  if (approved) {
    request.requestContext.set(APPROVED_CALL, { toolCallId, personId: at.person.id })
  }
  return undefined
}

/** A member, or someone no longer in the company, finds no conversation (criterion 10). */
async function admittedBy(admit: Admission, input: Parameters<Admission>[0]) {
  try {
    await admit(input)
  } catch (error) {
    if (error instanceof Failure && error.code === 'NOT_FOUND') {
      throw new Failure('CONVERSATION_NOT_FOUND', { cause: error })
    }
    throw error
  }
}

/**
 * Mastra's own session routes, from the fixed list, in a scope of their own behind the guard
 * (decision 0050; Conexus OS `mastra-session-routes.ts:266-367`, measured in prove E4): the context
 * Mastra's handlers read, and the guard after it. Each route declares the `session` access kind as
 * it is registered, since the Hub's access check refuses at boot a route without one; Mastra's
 * `server.auth` stays off, as the Hub already read the session. Mastra ends a stream only when its
 * request leaves, so the open ones are kept in `streams` for the Hub's close to close; its stream is
 * slimmed and paced (`stream.ts`).
 */
export function registerBuilderRoutes(
  app: FastifyInstance,
  deps: {
    hub: GuardedMastra
    builder: Builder
    streams: Set<ServerResponse>
    log: FailureLog
  },
): void {
  const routes = builderRoutes()
  app.register(async (scope) => {
    // `onError` is required by the type; the Fastify adapter never calls it, and a body over the
    // limit goes to the Hub's error handler as a 413 (`@mastra/fastify@1.5.23` `dist/index.js:542-571`).
    const server = new BuilderServer({
      app: scope,
      mastra: deps.hub.mastra,
      bodyLimitOptions: { maxSize: BODY_LIMIT, onError: (error) => error },
      log: deps.log,
    })
    server.registerContextMiddleware()
    // Mastra's multipart parser reads no body, so no limit holds it: JSON stays the only one (S25).
    scope.removeContentTypeParser('multipart/form-data')
    // A Parar between the guard's check and Mastra's handler leaves `not_pending`: no line says "approved" for a write that did not run.
    scope.addHook('onSend', async (request, _reply, payload) => {
      const told = Told.safeParse(request.requestContext?.get(TOLD))
      if (!told.success || typeof payload !== 'string') return payload
      if (Taken.safeParse(JSON.parse(payload)).success)
        deps.log.info(told.data.fields, told.data.message)
      return payload
    })
    scope.addHook('preHandler', async (request, reply) => {
      const at = await guard(deps, request)
      if (request.routeOptions.url?.endsWith('/tool-approval')) {
        const refused = await toolAnswer(deps, request, at)
        if (refused !== undefined) return reply.send(refused)
        return
      }
      if (!request.routeOptions.url?.endsWith('/stream')) return
      deps.streams.add(reply.raw)
      reply.raw.once('close', () => deps.streams.delete(reply.raw))
    })
    const declared = new Proxy(scope, {
      get(target, key) {
        if (key !== 'route') return Reflect.get(target, key)
        return (options: Parameters<FastifyInstance['route']>[0]) =>
          target.route({
            ...options,
            config: { ...options.config, access: 'session', failures: FAILURES },
          })
      },
    })
    for (const route of routes) {
      await server.registerRoute(declared, route, { prefix: BUILDER_ROUTES })
    }
  })
}

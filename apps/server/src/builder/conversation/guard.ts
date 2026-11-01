import type { ServerResponse } from 'node:http'
import type { CompanyId, FailureCode, Person } from '@conexus/hub-api'
import { ASSISTANT_CONTROLLER, BUILDER_ROUTES, ConversationId } from '@conexus/hub-api'
import type { Mastra } from '@mastra/core/mastra'
import { MASTRA_MESSAGE_AUTHOR_KEY } from '@mastra/core/request-context'
import { SERVER_ROUTES } from '@mastra/server/server-adapter'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { sessionOf } from '../../platform/access.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { Builder } from './builder.ts'
import { BUILDER_ID } from './builder.ts'
import { untilCardsKept } from './parked.ts'
import type { ConversationStore } from './store.ts'
import { BuilderServer } from './stream.ts'
import { ownerOfResource } from './turn-of.ts'

const SESSION = '/agent-controller/:controllerId/sessions/:sessionId'

/**
 * The only routes of Mastra's server the Hub exposes (security S39, decision 0050): a session's
 * state, stream, a message, Parar, a card's answer and the transcript. Any other is
 * not registered, so it is a 404.
 */
const FIXED_LIST: ReadonlySet<string> = new Set([
  `GET ${SESSION}`,
  `GET ${SESSION}/stream`,
  `POST ${SESSION}/messages`,
  `POST ${SESSION}/abort`,
  `POST ${SESSION}/tool-suspension`,
  `GET ${SESSION}/threads/:threadId/messages`,
])

/**
 * 30 MiB: the route's sum of files (29 360 128 characters), the message, the JSON's keys and room.
 * Without it Fastify's 1 MiB holds.
 */
const BODY_LIMIT = 31_457_280

const Params = z.object({
  controllerId: z.enum([BUILDER_ID, ASSISTANT_CONTROLLER]),
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

/** Whether the person may ask the Assistant in the company now; it throws `NOT_FOUND` otherwise. */
export type AssistantAdmission = (input: { person: Person; companyId: CompanyId }) => Promise<void>

/**
 * The conversation a request to Mastra's routes names, if it is the person's and of the controller
 * the path names: the thread's resource names its controller, company and person (`memoryOwner`,
 * `assistantOwner`), and, for the Builder, the Hub's index and membership decide; for the
 * Assistant, whether the person may ask it now (`askAssistant`), so a member gets the same 404 (S10).
 * A `requestContext` from the browser is refused: Mastra's server copies it into the run's context,
 * and `mastra__messageAuthor` is not one of its reserved keys (measured, prove2 e21-bare). So is
 * `include`, which would read messages of the person's other conversations. So is a file that is
 * not a `data:` URL. While the Hub settles before it stops, a new message is refused before Mastra
 * starts a turn (founder E1).
 */
async function guard(
  deps: {
    builder: Builder
    store: ConversationStore
    mayAsk: AssistantAdmission
    updating: () => boolean
  },
  request: FastifyRequest,
): Promise<void> {
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
  if (owner === undefined || owner.personId !== person.id || owner.kind !== controllerId) {
    throw new Failure('CONVERSATION_NOT_FOUND')
  }
  const { companyId } = owner
  if (owner.kind === 'builder') await deps.store.mine({ person, companyId, conversationId })
  else await admittedAsker(deps.mayAsk, { person, companyId })
  if (
    deps.updating() &&
    request.method === 'POST' &&
    request.routeOptions.url?.endsWith('/messages')
  ) {
    throw new Failure('HUB_UPDATING')
  }
  request.requestContext.setRaw(MASTRA_MESSAGE_AUTHOR_KEY, { id: person.id, name: person.name })
}

/** A member, or someone no longer in the company, finds no conversation (criterion 10). */
async function admittedAsker(mayAsk: AssistantAdmission, input: Parameters<AssistantAdmission>[0]) {
  try {
    await mayAsk(input)
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
 * slimmed and paced (`stream.ts`). Parar waits
 * for Mastra to keep an open card's run first (`parked.ts`).
 */
export function registerBuilderRoutes(
  app: FastifyInstance,
  deps: {
    mastra: Mastra
    builder: Builder
    store: ConversationStore
    mayAsk: AssistantAdmission
    streams: Set<ServerResponse>
    updating: () => boolean
    log: FailureLog
  },
): void {
  const routes = builderRoutes()
  app.register(async (scope) => {
    // `onError` is required by the type; the Fastify adapter never calls it, and a body over the
    // limit goes to the Hub's error handler as a 413 (`@mastra/fastify@1.5.23` `dist/index.js:542-571`).
    const server = new BuilderServer({
      app: scope,
      mastra: deps.mastra,
      bodyLimitOptions: { maxSize: BODY_LIMIT, onError: (error) => error },
      log: deps.log,
    })
    server.registerContextMiddleware()
    // Mastra's multipart parser reads no body, so no limit holds it: JSON stays the only one (S25).
    scope.removeContentTypeParser('multipart/form-data')
    scope.addHook('preHandler', async (request, reply) => {
      await guard(deps, request)
      const { controllerId, sessionId } = Params.parse(request.params)
      // Only the Builder parks a card (`ask_user`, `submit_plan`): the Assistant has none.
      if (
        controllerId === BUILDER_ID &&
        request.method === 'POST' &&
        request.routeOptions.url?.endsWith('/abort')
      ) {
        await untilCardsKept(
          deps.builder.agent,
          await deps.builder.controller.getSession(sessionId),
        )
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

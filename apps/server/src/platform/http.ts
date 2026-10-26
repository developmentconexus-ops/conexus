import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { IncomingMessage, ServerResponse } from 'node:http'
import type { Socket } from 'node:net'
import { join } from 'node:path'
import type { DeclaredOperation, FailureCode, Operation, Person } from '@conexus/hub-api'
import { FAILURES, failuresOf, PROBLEM_MEDIA_TYPE, Problem, phraseOf } from '@conexus/hub-api'
import fastifyHelmet from '@fastify/helmet'
import fastifyStatic from '@fastify/static'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import Fastify, { LogController } from 'fastify'
import helmet from 'helmet'
import { z } from 'zod'
import type { SessionReader } from './access.ts'
import { enforceAccess, headersOf, optionalSessionOf, sessionOf } from './access.ts'
import type { AppsDomain, Config } from './config.ts'
import type { FailureLog } from './failure.ts'
import { Failure, logFailure } from './failure.ts'
import { untilClientLeaves, whenReplyEnds } from './reply-lifetime.ts'
import { partsOf } from './request-parts.ts'
import { installPages, sendPage } from './screens.ts'

const REQUEST_TIMEOUT_MS = 30_000
// How long a socket may stay silent, the wait for an answer included: above the 100 s at which
// Cloudflare's edge cuts any answer, so the Hub never cuts one the edge would still carry.
export const CONNECTION_TIMEOUT_MS = 110_000
// Above the 90 s keep-alive of cloudflared's connection to its origin, so the Hub never closes first.
const KEEP_ALIVE_TIMEOUT_MS = 95_000

/** The Hub's headers: it frames only the apps, in the Prévia, and nothing frames it (security S24). */
function helmetOptions(appsDomain: AppsDomain) {
  return {
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'"],
        fontSrc: ["'self'"],
        manifestSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameSrc: [`https://*.${appsDomain}`],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'no-referrer' },
  } as const
}

const ErrorStatus = z.object({ statusCode: z.number().int() })

/** The HTTP status a library error carries, Fastify's or Better Auth's; 500 when it has none. */
export function statusOf(error: unknown): number {
  const status = ErrorStatus.safeParse(error)
  return status.success ? status.data.statusCode : 500
}
// A missing asset answers the JSON 404: streaming the page after the failed file stream would
// stack a second file stream on one reply.
const NOT_A_PAGE = /^\/(api|assets)(\/|\?|$)/

function problemOf(code: FailureCode, traceId: string, person?: string): Problem {
  const row = FAILURES[code]
  return Problem.parse({
    type: `urn:conexus:problem:${code}`,
    title: phraseOf(code, person),
    status: row.status,
    code,
    traceId,
    ...(person === undefined ? {} : { person }),
  })
}

const CLIENT_ERRORS: Partial<Record<number, FailureCode>> = {
  404: 'NOT_FOUND',
  413: 'REQUEST_TOO_LARGE',
  415: 'REQUEST_MEDIA_TYPE_REFUSED',
}

/** Maps by the status a library error carries, never by its text (code C50, C52). */
function failureOf(error: unknown): Failure {
  if (error instanceof Failure) return error
  const status = statusOf(error)
  if (status >= 400 && status < 500) {
    return new Failure(CLIENT_ERRORS[status] ?? 'REQUEST_MALFORMED', { cause: error })
  }
  return new Failure('INTERNAL_UNEXPECTED', { cause: error })
}

type SecurityHeaders = ReturnType<typeof helmet>

function answerClientError(
  app: FastifyInstance,
  securityHeaders: SecurityHeaders,
  error: NodeJS.ErrnoException,
  socket: Socket,
) {
  if (error.code === 'ECONNRESET' || !socket.writable) return
  const traceId = randomUUID()
  logFailure(app.log, new Failure('REQUEST_MALFORMED', { details: { traceId }, cause: error }))
  const body = JSON.stringify(problemOf('REQUEST_MALFORMED', traceId))
  const response = new ServerResponse(new IncomingMessage(socket))
  securityHeaders(response.req, response, () => undefined)
  const headers = Object.entries(response.getHeaders()).map(([name, value]) => `${name}: ${value}`)
  socket.end(
    [
      'HTTP/1.1 400 Bad Request',
      `Content-Type: ${PROBLEM_MEDIA_TYPE}`,
      `Content-Length: ${Buffer.byteLength(body)}`,
      'Connection: close',
      ...headers,
      '',
      body,
    ].join('\r\n'),
  )
}

function replyWithFailure(request: FastifyRequest, reply: FastifyReply, failure: Failure) {
  logFailure(request.log, failure)
  return reply
    .code(FAILURES[failure.code].status)
    .type(PROBLEM_MEDIA_TYPE)
    .send(problemOf(failure.code, request.id, failure.person))
}

function logServed(request: FastifyRequest, reply: FastifyReply): void {
  request.log.info(
    {
      route: request.routeOptions.url ?? '(unmatched)',
      status: reply.statusCode,
      durationMs: Math.round(reply.elapsedTime),
    },
    'REQUEST_SERVED',
  )
}

/**
 * A read of an unknown address outside /api/ and /assets/ gets the screens' page with 404, so the
 * person reads "Não encontramos o que você procurou." and the browser still learns it found nothing.
 */
export function installErrorHandling(app: FastifyInstance, page: { built: boolean }): void {
  app.setNotFoundHandler((request, reply) => {
    const read = request.method === 'GET' || request.method === 'HEAD'
    if (page.built && read && !NOT_A_PAGE.test(request.url)) return sendPage(reply, 404)
    throw new Failure('NOT_FOUND')
  })
  app.setErrorHandler((error, request, reply) => {
    replyWithFailure(request, reply, failureOf(error))
  })
  app.addHook('onResponse', async (request, reply) => logServed(request, reply))
}

/** The Fastify instance both listeners share: its limits, its logs and its failure output. */
export async function baseServer(config: Config): Promise<FastifyInstance> {
  const options = helmetOptions(config.appsDomain)
  const securityHeaders = helmet(options)
  const app: FastifyInstance = Fastify({
    logger: { level: config.logLevel },
    logController: new LogController({ disableRequestLogging: true, requestIdLogLabel: 'traceId' }),
    genReqId: () => randomUUID(),
    trustProxy: false,
    exposeHeadRoutes: false,
    requestTimeout: REQUEST_TIMEOUT_MS,
    connectionTimeout: CONNECTION_TIMEOUT_MS,
    keepAliveTimeout: KEEP_ALIVE_TIMEOUT_MS,
    frameworkErrors: (error, request, reply) => {
      securityHeaders(request.raw, reply.raw, () => undefined)
      // A malformed URL matches no route, so Fastify runs none of the hooks.
      reply.raw.once('finish', () => logServed(request, reply))
      return replyWithFailure(request, reply, new Failure('REQUEST_MALFORMED', { cause: error }))
    },
    return503OnClosing: false,
    clientErrorHandler: (error, socket) => answerClientError(app, securityHeaders, error, socket),
  })
  // Fastify answers 415 for a body with no parser; JSON is left the only one (security S25).
  app.removeContentTypeParser('text/plain')
  await app.register(fastifyHelmet, options)
  return app
}

export async function createServer(
  config: Config,
  deps: { webRoot: string; readSession: SessionReader },
): Promise<FastifyInstance> {
  const app = await baseServer(config)
  const built = existsSync(join(deps.webRoot, 'index.html'))
  // The plugin would warn about a missing root in prose; the Hub says it by its code (code C50).
  await app.register(fastifyStatic, { root: deps.webRoot, serve: false, suppressWarning: true })
  if (!built) app.log.warn('WEB_PAGE_MISSING')
  const { publicOrigin } = config
  enforceAccess(app, { kind: 'PUBLIC', publicOrigin, readSession: deps.readSession })
  installErrorHandling(app, { built })
  installPages(app)
  return app
}

/**
 * What every handler gives back: the body the operation's schema checks, the cookies to set and
 * work to run once the reply is sent, so the answer never waits for it.
 */
export type Answer<T> = Readonly<{
  body: T
  setCookie: readonly string[]
  afterReply?: (() => Promise<void>) | undefined
}>

export function answer<T>(
  body: T,
  setCookie: readonly string[] = [],
  afterReply?: () => Promise<void>,
): Answer<T> {
  return { body, setCookie, afterReply }
}

type Body<O extends Operation> = O['success'] extends {
  status: 200 | 201
  body: infer S extends z.ZodType
}
  ? z.input<S>
  : undefined
type Parsed<O extends Operation, K extends 'params' | 'query' | 'body'> = NonNullable<
  O['input']
>[K] extends infer S extends z.ZodType
  ? { [P in K]: z.output<S> }
  : unknown
type Input<O extends Operation> = {
  headers: Headers
  log: FailureLog
  /** The request's id, the one every log line of it carries as `traceId`. */
  traceId: string
  signal: AbortSignal
} & Parsed<O, 'params'> &
  Parsed<O, 'query'> &
  Parsed<O, 'body'> &
  (O['attemptKey'] extends true ? { attemptKey: string } : unknown) &
  (O['access'] extends 'session'
    ? { person: Person; sessionToken: string }
    : O['id'] extends 'getInvitation' | 'createInvitationPassword' | 'declineInvitation'
      ? { person: Person | undefined }
      : unknown)
type Handler<O extends Operation> = (input: Input<O>) => Answer<Body<O>> | Promise<Answer<Body<O>>>

/** The parts are parsed with the operation's schemas, and the reply checked before it is sent. */
export function serve<O extends DeclaredOperation>(
  app: FastifyInstance,
  operation: O,
  handler: Handler<O>,
): void
export function serve(
  app: FastifyInstance,
  operation: Operation,
  handler: (input: {
    headers: Headers
    log: FailureLog
    traceId: string
    signal: AbortSignal
    params: unknown
    query: unknown
    body: unknown
    attemptKey: string | undefined
    person: Person | undefined
    sessionToken: string | undefined
  }) => Answer<unknown> | Promise<Answer<unknown>>,
): void {
  app.route({
    method: operation.method,
    url: operation.path.replaceAll(/\{(\w+)\}/g, ':$1'),
    bodyLimit: operation.bodyLimit,
    config: { access: operation.access, failures: failuresOf(operation) },
    handler: async (request, reply) => {
      const input = {
        headers: headersOf(request),
        log: request.log,
        traceId: request.id,
        signal: untilClientLeaves(reply),
        ...partsOf(operation, request),
        ...(operation.access === 'session'
          ? sessionOf(request)
          : (optionalSessionOf(request) ?? { person: undefined, sessionToken: undefined })),
      }
      const { body, setCookie, afterReply } = await handler(input)
      if (setCookie.length > 0) reply.header('set-cookie', setCookie)
      whenReplyEnds(reply, () => {
        afterReply?.().catch((error: unknown) => logFailure(request.log, failureOf(error)))
      })
      const { success } = operation
      if ('body' in success) return reply.code(success.status).send(success.body.parse(body))
      return reply.code(success.status).send()
    },
  })
}

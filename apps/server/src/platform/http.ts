import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { IncomingMessage, ServerResponse } from 'node:http'
import type { Socket } from 'node:net'
import { join } from 'node:path'
import type { DeclaredOperation, FailureCode, Operation, Person } from '@conexus/hub-api'
import {
  ATTEMPT_KEY_HEADER,
  AttemptKey,
  FAILURES,
  failuresOf,
  PAGES,
  PROBLEM_MEDIA_TYPE,
  Problem,
} from '@conexus/hub-api'
import fastifyHelmet from '@fastify/helmet'
import fastifyStatic from '@fastify/static'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import Fastify, { LogController } from 'fastify'
import helmet from 'helmet'
import { z } from 'zod'
import type { SessionReader } from './access.ts'
import { enforceAccess, headersOf, invitationSessionOf, sessionOf } from './access.ts'
import type { Config } from './config.ts'
import type { FailureLog } from './failure.ts'
import { Failure, logFailure } from './failure.ts'

const REQUEST_TIMEOUT_MS = 30_000
const CONNECTION_TIMEOUT_MS = 30_000
// Above the 90 s keep-alive of cloudflared's connection to its origin, so the Hub never closes first.
const KEEP_ALIVE_TIMEOUT_MS = 95_000
const ONE_YEAR_MS = 31_536_000_000

const HELMET_OPTIONS = {
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'no-referrer' },
} as const
const securityHeaders = helmet(HELMET_OPTIONS)

const ErrorStatus = z.object({ statusCode: z.number().int() })

/** The HTTP status a library error carries, Fastify's or Better Auth's; 500 when it has none. */
export function statusOf(error: unknown): number {
  const status = ErrorStatus.safeParse(error)
  return status.success ? status.data.statusCode : 500
}
const WildcardParams = z.object({ '*': z.string() })
// A missing asset answers the JSON 404: streaming the page after the failed file stream would
// stack a second file stream on one reply.
const NOT_A_PAGE = /^\/(api|assets)(\/|\?|$)/

function problemOf(code: FailureCode, traceId: string): Problem {
  const row = FAILURES[code]
  return Problem.parse({
    type: `urn:conexus:problem:${code}`,
    title: row.phrase,
    status: row.status,
    code,
    traceId,
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

function answerClientError(app: FastifyInstance, error: NodeJS.ErrnoException, socket: Socket) {
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
    .send(problemOf(failure.code, request.id))
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
function installErrorHandling(app: FastifyInstance, page: { built: boolean }): void {
  app.setNotFoundHandler((request, reply) => {
    const read = request.method === 'GET' || request.method === 'HEAD'
    if (page.built && read && !NOT_A_PAGE.test(request.url)) {
      return reply.code(404).sendFile('index.html', { maxAge: 0 })
    }
    throw new Failure('NOT_FOUND')
  })
  app.setErrorHandler((error, request, reply) => {
    replyWithFailure(request, reply, failureOf(error))
  })
  app.addHook('onResponse', async (request, reply) => logServed(request, reply))
}

function installPages(app: FastifyInstance): void {
  const config = { access: 'page' } as const
  for (const page of PAGES) {
    app.route({
      method: ['GET', 'HEAD'],
      url: page.replaceAll(/\$(\w+)/g, ':$1'),
      config,
      handler: (_request, reply) => reply.sendFile('index.html', { maxAge: 0 }),
    })
  }
  app.route({
    method: ['GET', 'HEAD'],
    url: '/favicon.svg',
    config,
    handler: (_request, reply) => reply.sendFile('favicon.svg'),
  })
  app.route({
    method: ['GET', 'HEAD'],
    url: '/assets/*',
    config,
    handler: (request, reply) => {
      const { '*': file } = WildcardParams.parse(request.params)
      return reply.sendFile(`assets/${file}`, { maxAge: ONE_YEAR_MS, immutable: true })
    },
  })
}

export async function createServer(
  config: Config,
  deps: { webRoot: string; readSession: SessionReader },
): Promise<FastifyInstance> {
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
    clientErrorHandler: (error, socket) => answerClientError(app, error, socket),
  })
  // Fastify answers 415 for a body with no parser; JSON is left the only one (security S25).
  app.removeContentTypeParser('text/plain')
  await app.register(fastifyHelmet, HELMET_OPTIONS)
  const built = existsSync(join(deps.webRoot, 'index.html'))
  // The plugin would warn about a missing root in prose; the Hub says it by its code (code C50).
  await app.register(fastifyStatic, { root: deps.webRoot, serve: false, suppressWarning: true })
  if (!built) app.log.warn('WEB_PAGE_MISSING')
  enforceAccess(app, { publicOrigin: config.publicOrigin, readSession: deps.readSession })
  installErrorHandling(app, { built })
  installPages(app)
  return app
}

/** What every handler gives back: the body the operation's schema checks, and the cookies to set. */
export type Answer<T> = Readonly<{ body: T; setCookie: readonly string[] }>

export function answer<T>(body: T, setCookie: readonly string[] = []): Answer<T> {
  return { body, setCookie }
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

/**
 * The path parameters are read first: an id that cannot exist is the same not-found as one that
 * does not, and it costs no query (code C42, security S10).
 */
function partsOf(operation: Operation, request: FastifyRequest) {
  const { params, query, body } = operation.input ?? {}
  const parsedParams = params?.safeParse(request.params)
  if (parsedParams?.success === false) {
    throw new Failure('NOT_FOUND', { details: { reason: 'MALFORMED' }, cause: parsedParams.error })
  }
  const key = operation.attemptKey
    ? AttemptKey.safeParse(request.headers[ATTEMPT_KEY_HEADER.toLowerCase()])
    : undefined
  if (key?.success === false) throw new Failure('REQUEST_MALFORMED', { cause: key.error })
  const parsedQuery = query?.safeParse(request.query)
  if (parsedQuery?.success === false)
    throw new Failure('REQUEST_MALFORMED', { cause: parsedQuery.error })
  const parsedBody = body?.safeParse(request.body)
  if (parsedBody?.success === false)
    throw new Failure('REQUEST_MALFORMED', { cause: parsedBody.error })
  return {
    params: parsedParams?.data,
    query: parsedQuery?.data,
    body: parsedBody?.data,
    attemptKey: key?.data,
  }
}

/**
 * Aborts when the client leaves before the reply is sent. Fastify's `request.signal` follows the
 * request's `close` (fastify/lib/request.js:218-229), which Node emits once the body is read, so a
 * write would abort its own e-mail (docs/reference/boundaries.md).
 */
function untilClientLeaves(reply: FastifyReply): AbortSignal {
  const left = new AbortController()
  reply.raw.once('close', () => {
    if (!reply.raw.writableFinished) left.abort()
  })
  return left.signal
}

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
        signal: untilClientLeaves(reply),
        ...partsOf(operation, request),
        ...(operation.access === 'session'
          ? sessionOf(request)
          : (invitationSessionOf(request) ?? { person: undefined, sessionToken: undefined })),
      }
      const { body, setCookie } = await handler(input)
      if (setCookie.length > 0) reply.header('set-cookie', setCookie)
      const { success } = operation
      if (success.status === 204) return reply.code(204).send()
      return reply.code(success.status).send(success.body.parse(body))
    },
  })
}

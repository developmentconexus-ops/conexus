import { randomUUID } from 'node:crypto'
import type { Socket } from 'node:net'
import type { FailureCode, Operation } from '@conexus/hub-api'
import { FAILURES, Problem } from '@conexus/hub-api'
import fastifyHelmet from '@fastify/helmet'
import fastifyStatic from '@fastify/static'
import type { FastifyInstance } from 'fastify'
import Fastify, { LogController } from 'fastify'
import { z } from 'zod'
import { enforceAccess } from './access.ts'
import type { Config } from './config.ts'
import { Failure, logFailure } from './failure.ts'

const REQUEST_TIMEOUT_MS = 30_000
const CONNECTION_TIMEOUT_MS = 30_000
// Above the 90 s keep-alive of cloudflared's connection to its origin, so the Hub never closes first.
const KEEP_ALIVE_TIMEOUT_MS = 95_000
const ONE_YEAR_MS = 31_536_000_000

const ErrorStatus = z.object({ statusCode: z.number().int() })
const WildcardParams = z.object({ '*': z.string() })

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

/** Maps by the status a library error carries, never by its text (code C50, C52). */
function failureOf(error: unknown): Failure {
  if (error instanceof Failure) return error
  const status = ErrorStatus.safeParse(error)
  if (status.success && status.data.statusCode >= 400 && status.data.statusCode < 500) {
    return new Failure(status.data.statusCode === 404 ? 'NOT_FOUND' : 'REQUEST_MALFORMED', {
      cause: error,
    })
  }
  return new Failure('INTERNAL_UNEXPECTED', { cause: error })
}

function answerClientError(app: FastifyInstance, error: NodeJS.ErrnoException, socket: Socket) {
  if (error.code === 'ECONNRESET' || !socket.writable) return
  const traceId = randomUUID()
  logFailure(app.log, new Failure('REQUEST_MALFORMED', { details: { traceId }, cause: error }))
  const body = JSON.stringify(problemOf('REQUEST_MALFORMED', traceId))
  socket.end(
    [
      'HTTP/1.1 400 Bad Request',
      'Content-Type: application/problem+json',
      `Content-Length: ${Buffer.byteLength(body)}`,
      'Connection: close',
      '',
      body,
    ].join('\r\n'),
  )
}

function installErrorHandling(app: FastifyInstance): void {
  app.setNotFoundHandler(() => {
    throw new Failure('NOT_FOUND')
  })
  app.setErrorHandler((error, request, reply) => {
    const failure = failureOf(error)
    logFailure(request.log, failure)
    reply
      .code(FAILURES[failure.code].status)
      .type('application/problem+json')
      .send(problemOf(failure.code, request.id))
  })
  app.addHook('onResponse', async (request, reply) => {
    request.log.info(
      {
        route: request.routeOptions.url ?? '(unmatched)',
        status: reply.statusCode,
        durationMs: Math.round(reply.elapsedTime),
      },
      'REQUEST_SERVED',
    )
  })
}

function installPages(app: FastifyInstance): void {
  const config = { access: 'page' } as const
  app.route({
    method: ['GET', 'HEAD'],
    url: '/',
    config,
    handler: (_request, reply) => reply.sendFile('index.html', { maxAge: 0 }),
  })
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

/** The Hub's server: security headers, access law, one error handler, one log line per request. */
export async function createServer(config: Config, webRoot: string): Promise<FastifyInstance> {
  const app: FastifyInstance = Fastify({
    logger: { level: config.logLevel },
    logController: new LogController({ disableRequestLogging: true, requestIdLogLabel: 'traceId' }),
    genReqId: () => randomUUID(),
    trustProxy: false,
    exposeHeadRoutes: false,
    requestTimeout: REQUEST_TIMEOUT_MS,
    connectionTimeout: CONNECTION_TIMEOUT_MS,
    keepAliveTimeout: KEEP_ALIVE_TIMEOUT_MS,
    clientErrorHandler: (error, socket) => answerClientError(app, error, socket),
  })
  await app.register(fastifyHelmet, {
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
  })
  await app.register(fastifyStatic, { root: webRoot, serve: false })
  enforceAccess(app)
  installErrorHandling(app)
  installPages(app)
  return app
}

type Handler<O extends Operation> = () => z.output<O['success']['body']>

/** Registers an operation: its access kind and body limit come from the declaration, and the reply is checked against its schema before it is sent. */
export function serve<O extends Operation>(
  app: FastifyInstance,
  operation: O,
  handler: Handler<O>,
): void {
  app.route({
    method: operation.method,
    url: operation.path,
    bodyLimit: operation.bodyLimit,
    config: { access: operation.access },
    handler: async (_request, reply) =>
      reply.code(operation.success.status).send(operation.success.body.parse(await handler())),
  })
}

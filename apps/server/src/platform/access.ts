import type { AccessKind, Person } from '@conexus/hub-api'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import type { PublicOrigin } from './config.ts'
import { Failure } from './failure.ts'

const AccessConfig = z.looseObject({
  access: z.enum(['page', 'public', 'entry', 'session']).optional(),
})
const READS = ['GET', 'HEAD']
/** The Tunnel puts the client's address here; the attempt limits key on it (security S28, S29). */
export const CLIENT_ADDRESS_HEADER = 'cf-connecting-ip'

/** Reads the session a request carries; the identity subject owns it and main.ts hands it over. */
export type SessionReader = (request: {
  headers: Headers
}) => Promise<
  | { kind: 'SIGNED_IN'; person: Person; sessionToken: string; setCookie: readonly string[] }
  | { kind: 'SIGNED_OUT' }
>

/** The session the access check read: its person, and its token for the one route that ends it. */
type SignedIn = { person: Person; sessionToken: string }

// Written once per request by the onRequest hook below, before any handler runs.
const signedIn = new WeakMap<FastifyRequest, SignedIn>()

const INVITATION_ACCESS = /^\/api\/invitations\/[^/]+(?:\/(?:password|declination))?$/

export function invitationSessionOf(request: FastifyRequest): SignedIn | undefined {
  return signedIn.get(request)
}

type Shape = { methods: readonly string[]; path: RegExp }
const ALLOWED: Record<AccessKind, Shape> = {
  // A page is any address outside /api/, where the screens' router answers (web W1).
  page: { methods: READS, path: /^\/(?!api(\/|$))/ },
  public: { methods: ['GET'], path: /^\/api\// },
  entry: { methods: ['POST', 'PUT'], path: /^\/api\// },
  session: { methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], path: /^\/api\// },
}

function declared(config: unknown): AccessKind | undefined {
  const parsed = AccessConfig.safeParse(config ?? {})
  return parsed.success ? parsed.data.access : undefined
}

function refuse(route: string, reason: string): never {
  throw new Failure('INTERNAL_UNEXPECTED', { details: { route, reason } })
}

export function headersOf(request: FastifyRequest): Headers {
  const headers = new Headers()
  for (const [name, value] of Object.entries(request.headers)) {
    for (const one of [value ?? []].flat()) headers.append(name, one)
  }
  return headers
}

/** The session the access check read, for a route of the `session` kind. */
export function sessionOf(request: FastifyRequest): SignedIn {
  const session = signedIn.get(request)
  if (session === undefined)
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'no session read' } })
  return session
}

/** Another site's page may not make the browser call the API, reads included (security S24). */
function checkSite(request: FastifyRequest): void {
  const site = request.headers['sec-fetch-site']
  if (site !== undefined && site !== 'same-origin' && site !== 'none') {
    throw new Failure('REQUEST_ORIGIN_REFUSED')
  }
}

/** A form post from another site is the one write a browser sends with cookies and no preflight. */
function checkWrite(request: FastifyRequest, publicOrigin: PublicOrigin): void {
  const site = request.headers['sec-fetch-site']
  if (request.headers.origin !== publicOrigin || (site !== undefined && site !== 'same-origin')) {
    throw new Failure('REQUEST_ORIGIN_REFUSED')
  }
}

export function enforceAccess(
  app: FastifyInstance,
  deps: { publicOrigin: PublicOrigin; readSession: SessionReader },
): void {
  app.addHook('onRoute', (route) => {
    const methods = [route.method].flat()
    const where = `${methods.join('|')} ${route.url}`
    const access = declared(route.config)
    if (access === undefined) {
      refuse(where, 'the route declares no known access kind')
    } else {
      const allowed = ALLOWED[access]
      const outside = methods.some((method) => !allowed.methods.includes(method))
      if (outside || !allowed.path.test(route.url)) {
        refuse(where, `${access} access does not allow it`)
      }
    }
  })
  app.addHook('onRequest', async (request, reply) => {
    const access = declared(request.routeOptions.config)
    // Every route declares its kind when it is added, so none means no route. A write is refused
    // before its body is read; a read goes on to the not-found handler, which may answer the page.
    if (access === undefined) {
      if (READS.includes(request.method)) return
      throw new Failure('NOT_FOUND')
    }
    if (access === 'page') return
    checkSite(request)
    const optional = INVITATION_ACCESS.test(request.routeOptions.url ?? '')
    if (access === 'public' && !optional) return
    if (!READS.includes(request.method)) checkWrite(request, deps.publicOrigin)
    if (access === 'entry') {
      if (!request.headers[CLIENT_ADDRESS_HEADER]) throw new Failure('REQUEST_MALFORMED')
      if (!optional) return
    }
    const session = await deps.readSession({ headers: headersOf(request) })
    if (session.kind === 'SIGNED_OUT') {
      if (access === 'session') throw new Failure('SESSION_REQUIRED')
      return
    }
    signedIn.set(request, { person: session.person, sessionToken: session.sessionToken })
    if (session.setCookie.length > 0) reply.header('set-cookie', session.setCookie)
  })
}

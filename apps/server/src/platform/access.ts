import type { AccessKind, Person } from '@conexus/hub-api'
import { APP_OPEN_PATH } from '@conexus/hub-api'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import type { PublicOrigin } from './config.ts'
import { Failure } from './failure.ts'

const AccessConfig = z.looseObject({
  access: z.enum(['page', 'public', 'entry', 'session', 'edge', 'handoff']).optional(),
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

/** The session read for a route that may go without one: an invitation's, or the handoff. */
export function optionalSessionOf(request: FastifyRequest): SignedIn | undefined {
  return signedIn.get(request)
}

type Shape = { methods: readonly string[]; path: RegExp }
const ALLOWED: Record<AccessKind, Shape> = {
  // A page is any address outside /api/ but the handoff's, where the screens' router answers (W1).
  page: { methods: READS, path: new RegExp(`^/(?!api(/|$)|${APP_OPEN_PATH.slice(1)}$)`) },
  public: { methods: ['GET'], path: /^\/api\// },
  entry: { methods: ['POST', 'PUT'], path: /^\/api\// },
  session: { methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], path: /^\/api\// },
  edge: { methods: ['GET', 'POST'], path: /^\/api\// },
  handoff: { methods: ['GET'], path: new RegExp(`^${APP_OPEN_PATH}$`) },
}

/**
 * Which listener a server is: the public one, behind the Tunnel's public hostname, or the edge one
 * on `HUB_EDGE_PORT`, which only the apps' dispatcher reaches (security S48).
 */
export type Listener =
  | { kind: 'PUBLIC'; publicOrigin: PublicOrigin; readSession: SessionReader }
  | { kind: 'EDGE' }

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

/**
 * The handoff takes a navigation from any site, the app's host included, and nothing else: a fetch
 * or a frame of another site's page is refused. A browser that sends no Fetch Metadata passes, as
 * it does `checkSite`; the binding and the one-use pass still hold (security S22, S48).
 */
function checkNavigation(request: FastifyRequest): void {
  const mode = request.headers['sec-fetch-mode']
  const dest = request.headers['sec-fetch-dest']
  if ((mode !== undefined && mode !== 'navigate') || (dest !== undefined && dest !== 'document')) {
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

export function enforceAccess(app: FastifyInstance, listener: Listener): void {
  app.addHook('onRoute', (route) => {
    const methods = [route.method].flat()
    const where = `${methods.join('|')} ${route.url}`
    const access = declared(route.config)
    if (access === undefined) {
      refuse(where, 'the route declares no known access kind')
    } else if ((access === 'edge') !== (listener.kind === 'EDGE')) {
      refuse(where, `${access} access does not live on the ${listener.kind} listener`)
    } else {
      const allowed = ALLOWED[access]
      const outside = methods.some((method) => !allowed.methods.includes(method))
      if (outside || !allowed.path.test(route.url)) {
        refuse(where, `${access} access does not allow it`)
      }
    }
  })
  if (listener.kind === 'EDGE') {
    // An edge route reads no session, cookie or Origin: the dispatcher alone reaches this listener.
    app.addHook('onRequest', async (request) => {
      if (declared(request.routeOptions.config) === undefined) throw new Failure('NOT_FOUND')
    })
    return
  }
  const deps = listener
  app.addHook('onRequest', async (request, reply) => {
    const access = declared(request.routeOptions.config)
    // Every route declares its kind when it is added, so none means no route. A write is refused
    // before its body is read; a read goes on to the not-found handler, which may answer the page.
    if (access === undefined) {
      if (READS.includes(request.method)) return
      throw new Failure('NOT_FOUND')
    }
    if (access === 'page') return
    if (access === 'handoff') checkNavigation(request)
    else checkSite(request)
    const optional = access === 'handoff' || INVITATION_ACCESS.test(request.routeOptions.url ?? '')
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

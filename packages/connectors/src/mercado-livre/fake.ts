import { setTimeout as sleep } from 'node:timers/promises'
import type { OAuthFake } from '../kernel/conformance-session.ts'
import { serveOnLoopback } from '../kernel/loopback.ts'
import type { Held } from '../kernel/oauth-double.ts'
import { authorizePage, exchangeCode, nextKey, tokenRoute } from '../kernel/oauth-double.ts'
import type { Route } from './fake-data.ts'
import { APP, REDIRECT_URI as DEFAULT_REDIRECT_URI, me, SELLER } from './fake-data.ts'
import { ROUTES } from './fake-routes.ts'

/** What the fake can be told to do wrong: the Hub's tests and the QA flip these. */
type Switches = {
  /** The next authorization answers `error=access_denied`, as when the person says no. */
  refuse: boolean
  /** The next exchange answers 400 `invalid_operator_user_id` (a collaborator's login, not the owner's). */
  operator: boolean
  /** The account the next authorizations are for. */
  account: { ref: string; label: string }
  /** Every renewal answers 400 `invalid_grant`, as after the seller took the app's access away. */
  revoke: boolean
  /** Every renewal answers 401 `invalid_client`. */
  invalidClient: boolean
  /** Every renewal answers 429. */
  rateLimited: boolean
  /** The account call (`/users/me`) answers 429. */
  accountRateLimited: boolean
  /** The account call (`/users/me`) answers 403 as the permission policies do. */
  accountRefused: boolean
  /** The next reads (the account call, which is the check, and the data routes) answer 429, this many times; each is counted down. */
  busyReads: number
  /** The `Retry-After` header those 429s carry (`retry-after-ms` when it is a number of milliseconds), or none. */
  busyWait: { header: 'retry-after' | 'retry-after-ms'; value: string } | null
  /** Milliseconds each renewal is held back (`slow(ms)`). */
  slowMilliseconds: number
  /** Permission groups that answer 403 `PA_UNAUTHORIZED_RESULT_FROM_POLICIES`. */
  refuseGroups: Set<string>
  /** A single order (`/orders/{id}`) answers 206 with `X-Content-Missing`. */
  partialOrders: boolean
  /** The next revocation answers 403, as when the key cannot take the app's permission back. */
  refuseRevoke: boolean
  /** The `expires_in` the exchange and the renewal give. */
  expiresInSeconds: number
}

export type MercadoLivreFake = OAuthFake &
  Readonly<{
    switches: Switches
    /** How many renewals were answered with new keys. */
    refreshes: () => number
    /** The access keys issued so far expire (401); a renewal gives a good one. */
    expireAccess: () => void
    /** How many reads of messages did not say `mark_as_read=false`. */
    markedAsRead: () => number
    /** The account and app of each permission taken back, in order. */
    revocations: () => readonly string[]
  }>

type Account = { ref: string; label: string }
/** What the double remembers: the codes, the keys it issued and how many renewals it answered. */
type World = {
  app: typeof APP
  switches: Switches
  redirectUri: string
  codes: Map<string, Held<{ account: Account; operator: boolean }>>
  access: Map<string, { ref: string; expired: boolean }>
  refresh: Map<string, Account & { current: boolean }>
  count: { issued: number; renewals: number; unmarked: number }
  revoked: string[]
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers })
}

function oauthError(error: string, status: number): Response {
  return json({ message: error, error, status, cause: [] }, status)
}

/** New keys for an account: the refresh key it had before stops being the current one. */
function issue(world: World, account: Account): Response {
  for (const held of world.refresh.values()) if (held.ref === account.ref) held.current = false
  const accessToken = nextKey(world, 'APP_USR')
  const refreshToken = nextKey(world, 'TG')
  world.access.set(accessToken, { ref: account.ref, expired: false })
  world.refresh.set(refreshToken, { ...account, current: true })
  return json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: world.switches.expiresInSeconds,
    scope: 'offline_access read',
    user_id: Number(account.ref),
    refresh_token: refreshToken,
  })
}

function authorization(world: World, url: URL): Response {
  const { switches } = world
  return authorizePage(world, url, {
    prefix: 'TG',
    invalid: () => oauthError('invalid_request', 400),
    refuses: () => {
      const refuse = switches.refuse
      switches.refuse = false
      return refuse
    },
    extra: () => ({ account: { ...switches.account }, operator: switches.operator }),
  })
}

function exchange(world: World, form: URLSearchParams): Response {
  return exchangeCode(world, form, {
    invalid: () => oauthError('invalid_grant', 400),
    issue: (held) => {
      if (!held.operator) return issue(world, held.account)
      world.switches.operator = false
      const message = 'invalid_operator_user_id'
      return json({ message, error: 'invalid_grant', status: 400, cause: [] }, 400)
    },
  })
}

async function renew(world: World, form: URLSearchParams): Promise<Response> {
  const { switches } = world
  await sleep(switches.slowMilliseconds)
  if (switches.rateLimited) return json({ message: 'too many requests', status: 429 }, 429)
  if (switches.invalidClient) return oauthError('invalid_client', 401)
  const held = world.refresh.get(form.get('refresh_token') ?? '')
  if (switches.revoke || !held?.current) return oauthError('invalid_grant', 400)
  world.count.renewals += 1
  return issue(world, held)
}

function forbidden(): Response {
  const message = 'The caller is not authorized to access this resource'
  return json({ code: 'PA_UNAUTHORIZED_RESULT_FROM_POLICIES', message, status: 403 }, 403)
}

/** The route's answer; a key that does not cover it is refused as the permission policies do. */
function routed(
  world: World,
  route: Route,
  a: { request: Request; url: URL; ref: string; match: RegExpExecArray },
): Response {
  const { switches } = world
  const seller = a.match.groups?.seller
  if (switches.refuseGroups.has(route.group) || (seller !== undefined && seller !== a.ref))
    return forbidden()
  if (route.name === 'mensagensDoPacote' && a.url.searchParams.get('mark_as_read') !== 'false')
    world.count.unmarked += 1
  const reply = route.answer({
    query: a.url.searchParams,
    match: a.match,
    headers: a.request.headers,
  })
  if (route.name === 'pedido' && switches.partialOrders)
    return json(reply.body, 206, { 'x-content-missing': 'buyer, feedback' })
  return json(reply.body, reply.status ?? 200, reply.headers)
}

/** The live access a request's bearer holds, or the 401 the provider answers instead. */
function bearing(world: World, request: Request) {
  const given = world.access.get(
    request.headers.get('authorization')?.replace(/^Bearer /, '') ?? '',
  )
  if (given && !given.expired) return { given }
  return {
    refused: json({ message: 'invalid_token', error: 'not_found', status: 401, cause: [] }, 401),
  }
}

function read(world: World, request: Request, url: URL): Response {
  const { given, refused } = bearing(world, request)
  if (!given) return refused
  if (url.pathname === '/users/me' && world.switches.accountRefused) return forbidden()
  if (url.pathname === '/users/me' && world.switches.accountRateLimited)
    return json({ message: 'too many requests', status: 429 }, 429)
  const match = ROUTES.map((route) => ({ route, match: route.pattern.exec(url.pathname) })).find(
    (found) => found.match,
  )
  if ((match || url.pathname === '/users/me') && world.switches.busyReads > 0) {
    const { busyWait } = world.switches
    world.switches.busyReads -= 1
    return json(
      { message: 'too many requests', status: 429 },
      429,
      busyWait === null ? {} : { [busyWait.header]: busyWait.value },
    )
  }
  if (url.pathname === '/users/me')
    return json(me({ ref: given.ref, label: world.switches.account.label }))
  if (match?.match)
    return routed(world, match.route, { request, url, ref: given.ref, match: match.match })
  return json({ message: 'Resource not found', error: 'not_found', status: 404 }, 404)
}

/** `DELETE /users/{account}/applications/{app}`: the bearer's own account and this app only, then the app's keys stop working. */
function revoke(world: World, request: Request, url: URL): Response {
  const { given, refused } = bearing(world, request)
  if (!given) return refused
  const match = /^\/users\/(?<account>[^/]+)\/applications\/(?<app>[^/]+)$/.exec(url.pathname)
  if (!match || match.groups?.account !== given.ref || match.groups.app !== APP.clientId)
    return forbidden()
  if (world.switches.refuseRevoke) return forbidden()
  world.revoked.push(`${given.ref}/${APP.clientId}`)
  for (const [key, held] of world.access) if (held.ref === given.ref) world.access.delete(key)
  for (const held of world.refresh.values()) if (held.ref === given.ref) held.current = false
  return json({})
}

async function handle(world: World, request: Request): Promise<Response> {
  const url = new URL(request.url)
  if (url.pathname === '/authorization' && request.method === 'GET')
    return authorization(world, url)
  if (url.pathname === '/oauth/token' && request.method === 'POST')
    return tokenRoute(world, request, oauthError, { exchange, renew })
  if (request.method === 'DELETE' && url.pathname.startsWith('/users/'))
    return revoke(world, request, url)
  if (request.method !== 'GET') return json({ message: 'Method not allowed', status: 405 }, 405)
  return read(world, request, url)
}

/**
 * A Mercado Livre that answers like the documentation, with invented data. It takes the Hub's
 * `redirectUri` as configuration and refuses any other, as Mercado Livre does. The authorization page
 * answers 302 to the redirect; the code works once, with the verifier and the redirect it was asked
 * for; the refresh key works once and only the last one counts, and a new authorization of the same
 * account drops the previous one (the card's worst-case hypothesis, U1).
 */
export function mercadoLivreFake({
  redirectUri = DEFAULT_REDIRECT_URI,
}: Readonly<{ redirectUri?: string }> = {}): MercadoLivreFake {
  const switches: Switches = {
    refuse: false,
    operator: false,
    account: { ...SELLER },
    revoke: false,
    invalidClient: false,
    rateLimited: false,
    accountRateLimited: false,
    accountRefused: false,
    busyReads: 0,
    busyWait: null,
    slowMilliseconds: 0,
    refuseGroups: new Set(),
    partialOrders: false,
    refuseRevoke: false,
    expiresInSeconds: 21_600,
  }
  const world: World = {
    app: APP,
    switches,
    redirectUri,
    codes: new Map(),
    access: new Map(),
    refresh: new Map(),
    count: { issued: 0, renewals: 0, unmarked: 0 },
    revoked: [],
  }
  function answer(request: Request) {
    return handle(world, request)
  }
  return {
    app: APP,
    redirectUri,
    handle: answer,
    serve: () => serveOnLoopback(answer),
    switches,
    refreshes: () => world.count.renewals,
    expireAccess: () => {
      for (const given of world.access.values()) given.expired = true
    },
    markedAsRead: () => world.count.unmarked,
    revocations: () => world.revoked,
  }
}

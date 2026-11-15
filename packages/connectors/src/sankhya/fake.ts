import { setTimeout as sleep } from 'node:timers/promises'
import { z } from 'zod'
import type { CredentialFake } from '../kernel/conformance-session.ts'
import { serveOnLoopback } from '../kernel/loopback.ts'
import {
  CREDENTIAL,
  DOOR_NAMES,
  empty,
  envelope,
  executeQuery,
  json,
  loadRecords,
  nothingFound,
  OVERSIZE,
  SERVICE_PATH,
} from './fake-data.ts'
import type { OrderSwitches, StoredOrder } from './fake-orders.ts'
import { ORDERS_PATH, orderBook } from './fake-orders.ts'
import { forbidden, routeOf } from './fake-rest.ts'
import type { SalesSet } from './fake-sales.ts'
import { PADARIA_SOL_MATRIZ, salesDatabase } from './fake-sales.ts'

/** What the fake can be told to do wrong, per service: the executor's tests (U3) and the QA flip these. */
type SankhyaSwitches = {
  /** Services that refuse: a ready operation (`empresas`, `pedidos`, `vendedores`...) answers 403, a door service (`consultar`, `carregar`) `status: "0"`. */
  refuse: Set<string>
  /** Every call on a token answers 403 `GTW3403`, as an expired one does. */
  expireToken: boolean
  /** Answers 200 with a body no schema reads. */
  malformed: boolean
  /** Answers 200 with text that is not JSON. */
  notJson: boolean
  /** Every REST read answers the 404 the real gateway sends for a page with no rows, as a company with nothing to list does. */
  nothingFound: boolean
  /** Answers with a page of empresas the kit reads, above the executor's 2 MiB cap. */
  oversize: boolean
  /** Answers every call with a 307 to the same call on the fake, answered as without the switch. */
  redirect: boolean
  /** Never answers a call. */
  silent: boolean
  /** The next calls on a session answer 429, this many times; each is counted down. */
  busyReads: number
  /** The `Retry-After` header those 429s carry (`retry-after-ms` when it is a number of milliseconds), or none. */
  busyWait: { header: 'retry-after' | 'retry-after-ms'; value: string } | null
  /** Milliseconds each answer is held back, for the executor's deadline tests (U3). */
  delayMilliseconds: number
  /** Milliseconds the login is held back, for the executor's deadline tests (U3). */
  loginDelayMilliseconds: number
  /** The `expires_in` the login gives. */
  expiresInSeconds: number
}

export type SankhyaFake = CredentialFake &
  Readonly<{
    switches: SankhyaSwitches
    /** What the double does to an order add besides answering it (a lost answer, kept or not). */
    orderSwitches: OrderSwitches
    /** The orders it stored, in the order they came: a repeated call is a second order here. */
    orders: () => readonly StoredOrder[]
    logins: () => number
    /** The logouts answered so far, of live or already ended tokens. */
    logouts: () => number
    /** The tokens issued so far expire, as after their hour; a login after this gives a good one. */
    expireTokens: () => void
  }>

/** How long a call holds its token: long enough for a second call over HTTP to arrive while the first is unanswered. */
const SERVICE_MILLISECONDS = 25

type Sessions = {
  issued: Set<string>
  expired: Set<string>
  ended: Set<string> // logged out: refused with 401, as the real gateway does
  busy: Set<string>
  logins: number
  logouts: number
}

const LOGOUT = 'MobileLoginSP.logout'

const DoorBody = z.object({ requestBody: z.unknown() })

/** The query mark of a call the redirect switch already sent back to the fake. */
const REDIRECTED = 'redirected'

async function authenticate(
  request: Request,
  sessions: Sessions,
  switches: SankhyaSwitches,
): Promise<Response> {
  const form = new URLSearchParams(await request.text())
  const right =
    request.headers.get('x-token') === CREDENTIAL.xToken &&
    form.get('client_id') === CREDENTIAL.clientId &&
    form.get('client_secret') === CREDENTIAL.clientSecret &&
    form.get('grant_type') === 'client_credentials'
  if (!right) return json({ code: 'GTW2510', message: 'Credenciais inválidas' }, 401)
  sessions.logins += 1
  const token = `fake-token-${sessions.logins}`
  sessions.issued.add(token)
  return json({
    access_token: token,
    expires_in: switches.expiresInSeconds,
    refresh_expires_in: 0,
    token_type: 'Bearer',
    'not-before-policy': 0,
    scope: '',
  })
}

function restAnswer(route: ReturnType<typeof routeOf>, url: URL, switches: SankhyaSwitches) {
  if (!route) return json({ code: 'NOT_FOUND' }, 404)
  return switches.nothingFound ? nothingFound(route.entity) : route.answer(url.searchParams)
}

type Query = ReturnType<typeof salesDatabase>

/** The one POST route: the order's add, which a `refuse` of `lancarPedido` answers 403. */
function isAdd(request: Request, url: URL): boolean {
  return request.method === 'POST' && url.pathname === ORDERS_PATH
}

/** The name a `refuse` switch answers to: the order's add, a door service, or a REST route. */
function switchName(
  adding: boolean,
  door: boolean,
  service: string,
  route: { name: string } | null,
) {
  if (adding) return 'lancarPedido'
  return door ? (DOOR_NAMES[service] ?? service) : (route?.name ?? '')
}

async function serveCall(
  request: Request,
  url: URL,
  switches: SankhyaSwitches,
  query: Query,
  orders: ReturnType<typeof orderBook>,
): Promise<Response> {
  const door = url.pathname === SERVICE_PATH
  const service = door ? (url.searchParams.get('serviceName') ?? '') : ''
  const route = door ? null : routeOf(url.pathname)
  const adding = isAdd(request, url)
  if (switches.refuse.has(switchName(adding, door, service, route))) {
    return door ? envelope(service, '0') : forbidden(url.pathname, 'NO_ACCESS', 'Sem permissão')
  }
  if (switches.oversize) return json(OVERSIZE)
  if (switches.malformed) return json({ unexpected: true })
  if (switches.notJson) return new Response('<html>valor da empresa</html>', { status: 200 })
  if (adding) return orders.add(z.unknown().parse(await request.json()))
  if (!door) return restAnswer(route, url, switches)
  const { requestBody } = DoorBody.parse(await request.json())
  if (service === 'CRUDServiceProvider.loadRecords') return loadRecords(requestBody)
  return service === 'DbExplorerSP.executeQuery'
    ? executeQuery(requestBody, query)
    : envelope(service, '0')
}

/** The gateway's answer to a token past its hour. */
function tokenExpired(url: URL): Response {
  return forbidden(url.pathname, 'GTW3403', 'Bearer Token inválido ou expirado')
}

/** The switches that spoil every call, before any session is looked at; null when none is on. */
function misbehaviour(url: URL, switches: SankhyaSwitches): Response | Promise<Response> | null {
  if (switches.silent) return new Promise<Response>(() => undefined)
  if (switches.redirect && !url.searchParams.has(REDIRECTED)) {
    // 307 keeps the method and body, so a client that follows it reads the same answer.
    const target = new URL(url)
    target.searchParams.set(REDIRECTED, '1')
    return empty(307, { location: `${target.pathname}${target.search}` })
  }
  if (!switches.expireToken) return null
  return tokenExpired(url)
}

/** A token the fake never issued is refused, a logged-out one with 401; a token already in a call gets the envelope "4" (409 on REST). */
function refuseSession(url: URL, token: string, sessions: Sessions): Response | null {
  if (sessions.expired.has(token)) {
    return tokenExpired(url)
  }
  if (sessions.ended.has(token)) return json({ code: 'UNAUTHORIZED', message: 'Unauthorized' }, 401)
  if (!sessions.issued.has(token)) return json({ code: 'GTW3501', message: 'Token inválido' }, 401)
  if (!sessions.busy.has(token)) return null
  if (url.pathname !== SERVICE_PATH) return json({ code: 'BUSY' }, 409)
  return envelope(url.searchParams.get('serviceName') ?? '', '4')
}

/** The logout ends a live token's session, and answers a second time alike (measured 2026-10-30); an expired token's is refused first. */
function logout(sessions: Sessions, token: string): Response {
  sessions.ended.add(token)
  sessions.logouts += 1
  return envelope(LOGOUT, '1', {})
}

function isLogout(url: URL): boolean {
  return url.pathname === SERVICE_PATH && url.searchParams.get('serviceName') === LOGOUT
}

/** The logout's answer or the session's refusal; null when the call goes on to its service. */
function sessionAnswer(url: URL, token: string, sessions: Sessions): Response | null {
  if (isLogout(url) && sessions.ended.has(token)) return logout(sessions, token)
  const refused = refuseSession(url, token, sessions)
  return refused === null && isLogout(url) ? logout(sessions, token) : refused
}

/**
 * A Sankhya that answers in the shapes the real gateway sent, with invented rows. One token is one session: a
 * second call on a token while the first is unanswered gets the gateway's envelope "4" (409 on REST).
 * Its read queries run on the tables of `sales`, Padaria Sol's Matriz when none is given.
 */
export function sankhyaFake(options: { sales?: SalesSet } = {}): SankhyaFake {
  const query = salesDatabase(options.sales ?? PADARIA_SOL_MATRIZ)
  const orders = orderBook()
  const switches: SankhyaSwitches = {
    refuse: new Set(),
    expireToken: false,
    malformed: false,
    notJson: false,
    nothingFound: false,
    oversize: false,
    redirect: false,
    silent: false,
    busyReads: 0,
    busyWait: null,
    delayMilliseconds: 0,
    loginDelayMilliseconds: 0,
    expiresInSeconds: 300,
  }
  const sessions: Sessions = {
    issued: new Set(),
    expired: new Set(),
    ended: new Set(),
    busy: new Set(),
    logins: 0,
    logouts: 0,
  }

  async function handle(request: Request): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === '/authenticate' && request.method === 'POST') {
      await sleep(switches.loginDelayMilliseconds)
      return authenticate(request, sessions, switches)
    }
    const early = misbehaviour(url, switches)
    if (early) return early
    const token = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? ''
    const stopped = sessionAnswer(url, token, sessions)
    if (stopped) return stopped
    if (switches.busyReads > 0) {
      switches.busyReads -= 1
      const { busyWait } = switches
      return Response.json(
        { code: 'TOO_MANY_REQUESTS' },
        { status: 429, headers: busyWait === null ? {} : { [busyWait.header]: busyWait.value } },
      )
    }
    sessions.busy.add(token)
    try {
      await sleep(SERVICE_MILLISECONDS + switches.delayMilliseconds)
      return await serveCall(request, url, switches, query, orders)
    } finally {
      sessions.busy.delete(token)
    }
  }

  return {
    credential: CREDENTIAL,
    handle,
    serve: () => serveOnLoopback(handle),
    switches,
    orderSwitches: orders.switches,
    orders: orders.orders,
    logins: () => sessions.logins,
    logouts: () => sessions.logouts,
    expireTokens: () => {
      for (const token of sessions.issued) sessions.expired.add(token)
    },
  }
}

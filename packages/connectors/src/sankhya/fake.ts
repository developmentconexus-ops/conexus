import { setTimeout as sleep } from 'node:timers/promises'
import { z } from 'zod'
import type { Fake } from '../kernel/conformance.ts'
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
import { serveOnLoopback } from './fake-http.ts'
import { forbidden, routeOf } from './fake-rest.ts'

/** What the fake can be told to do wrong, per service: the executor's tests (U3) and the QA flip these. */
type SankhyaSwitches = {
  /** Services that refuse: a ready operation (`empresas`, `pedidos`, `vendedores`...) answers 403, a door service (`consultar`, `carregar`) `status: "0"`. */
  refuse: Set<string>
  /** Every call on a token answers 403 `GTW3403`, as an expired one does. */
  expireToken: boolean
  /** Answers 200 with a body no schema reads. */
  malformed: boolean
  /** Every REST read answers the 404 the real gateway sends for a page with no rows, as a company with nothing to list does. */
  nothingFound: boolean
  /** Answers with a page of empresas the kit reads, above the executor's 2 MiB cap. */
  oversize: boolean
  /** Answers every call with a 307 to the same call on the fake, answered as without the switch. */
  redirect: boolean
  /** Never answers a call. */
  silent: boolean
  /** Milliseconds each answer is held back, for the executor's deadline tests (U3). */
  delayMilliseconds: number
  /** Milliseconds the login is held back, for the executor's deadline tests (U3). */
  loginDelayMilliseconds: number
  /** The `expires_in` the login gives. */
  expiresInSeconds: number
}

export type SankhyaFake = Fake &
  Readonly<{
    switches: SankhyaSwitches
    logins: () => number
    /** The tokens issued so far expire, as after their hour; a login after this gives a good one. */
    expireTokens: () => void
  }>

/** How long a call holds its token: long enough for a second call over HTTP to arrive while the first is unanswered. */
const SERVICE_MILLISECONDS = 25

type Sessions = { issued: Set<string>; expired: Set<string>; busy: Set<string>; logins: number }

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

async function serveCall(request: Request, url: URL, switches: SankhyaSwitches): Promise<Response> {
  const door = url.pathname === SERVICE_PATH
  const service = door ? (url.searchParams.get('serviceName') ?? '') : ''
  const route = door ? null : routeOf(url.pathname)
  const name = door ? (DOOR_NAMES[service] ?? service) : (route?.name ?? '')
  if (switches.refuse.has(name)) {
    return door ? envelope(service, '0') : forbidden(url.pathname, 'NO_ACCESS', 'Sem permissão')
  }
  if (switches.oversize) return json(OVERSIZE)
  if (switches.malformed) return json({ unexpected: true })
  if (!door) return restAnswer(route, url, switches)
  const { requestBody } = DoorBody.parse(await request.json())
  if (service === 'CRUDServiceProvider.loadRecords') return loadRecords(requestBody)
  return service === 'DbExplorerSP.executeQuery'
    ? executeQuery(requestBody)
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

/** A token the fake never issued is refused; a token already in a call gets the envelope "4" (409 on REST). */
function refuseSession(url: URL, token: string, sessions: Sessions): Response | null {
  if (sessions.expired.has(token)) {
    return tokenExpired(url)
  }
  if (!sessions.issued.has(token)) return json({ code: 'GTW3501', message: 'Token inválido' }, 401)
  if (!sessions.busy.has(token)) return null
  if (url.pathname !== SERVICE_PATH) return json({ code: 'BUSY' }, 409)
  return envelope(url.searchParams.get('serviceName') ?? '', '4')
}

/**
 * A Sankhya that answers in the shapes the real gateway sent, with invented rows. One token is one session: a
 * second call on a token while the first is unanswered gets the gateway's envelope "4" (409 on REST).
 */
export function sankhyaFake(): SankhyaFake {
  const switches: SankhyaSwitches = {
    refuse: new Set(),
    expireToken: false,
    malformed: false,
    nothingFound: false,
    oversize: false,
    redirect: false,
    silent: false,
    delayMilliseconds: 0,
    loginDelayMilliseconds: 0,
    expiresInSeconds: 300,
  }
  const sessions: Sessions = { issued: new Set(), expired: new Set(), busy: new Set(), logins: 0 }

  async function handle(request: Request): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === '/authenticate' && request.method === 'POST') {
      await sleep(switches.loginDelayMilliseconds)
      return authenticate(request, sessions, switches)
    }
    const early = misbehaviour(url, switches)
    if (early) return early
    const token = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? ''
    const refused = refuseSession(url, token, sessions)
    if (refused) return refused
    sessions.busy.add(token)
    try {
      await sleep(SERVICE_MILLISECONDS + switches.delayMilliseconds)
      return await serveCall(request, url, switches)
    } finally {
      sessions.busy.delete(token)
    }
  }

  return {
    credential: CREDENTIAL,
    handle,
    serve: () => serveOnLoopback(handle),
    switches,
    logins: () => sessions.logins,
    expireTokens: () => {
      for (const token of sessions.issued) sessions.expired.add(token)
    },
  }
}

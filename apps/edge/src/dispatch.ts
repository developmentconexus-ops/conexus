import type { AppProps } from '@conexus/app-contract'
import { APP_CALL_LIMITS } from '@conexus/app-contract'
import type { AppCall, AppEnvironment } from '@conexus/hub-api'
import {
  APP_OPEN_PATH,
  APP_SESSION_COOKIE,
  AppHost,
  AppSessionToken,
  appOfHost,
  createAppSession,
  HANDOFF_PATH,
} from '@conexus/hub-api'
import type { ConnectorsProps } from './connectors.ts'
import type { DbProps } from './db.ts'
import { base64Of, sha256Of } from './digest.ts'
import { entryPage, entryScript } from './entry.ts'
import {
  appPolicyOf,
  appSessionCookies,
  BINDING_COOKIE,
  cookiesOf,
  headersFromApp,
  headersToApp,
  setCookie,
  withSecurityHeaders,
} from './headers.ts'
import type { HubPort } from './hub.ts'
import { hubOf } from './hub.ts'
import type { PageCode, PageLog } from './pages.ts'
import { failurePage } from './pages.ts'

/** A Projeto with no version on the air runs the example app of step 8. */
const EXAMPLE_SCRIPT = 'conexus-example'
/** The dispatcher's own paths on an app's host, which the app never receives. */
const DISPATCHER_PATHS = '/__conexus/'
const ENTRY_SCRIPT = `${DISPATCHER_PATHS}entry.js`
/** Where a redeemed pass lands, with the hash of the session it set in `SESSION_MARK`. */
const LANDING_PATH = `${DISPATCHER_PATHS}entrada`
const SESSION_MARK = 'sessao'
const SECRET_BYTES = 32

/** What the dispatcher needs of its own exports: a `db` stub bound to one login (decision 0043) and the `connectors` stub. */
export type Exports = {
  Db(options: { props: DbProps }): AppProps['db']
  Connectors(options: { props: ConnectorsProps }): AppProps['connectors']
}

type Visit = {
  request: Request
  env: Env
  exports: Exports
  hub: HubPort
  url: URL
  host: AppHost
  environment: AppEnvironment
  policy: string
}

function redirect(visit: Visit, location: string, cookies: string[]): Response {
  const headers = new Headers({ Location: location, 'Cache-Control': 'no-store' })
  for (const cookie of cookies) headers.append('Set-Cookie', cookie)
  return new Response(null, { status: 303, headers: withSecurityHeaders(headers, visit.policy) })
}

function failure(visit: Visit, code: PageCode, log?: PageLog) {
  const { env, environment } = visit
  return failurePage(code, { hubOrigin: env.HUB_PUBLIC_ORIGIN, environment }, log)
}

/** A write without this host's exact `Origin`, or that `Sec-Fetch-Site` calls cross-site (S24). */
function isForeignWrite(request: Request, url: URL): boolean {
  if (request.method === 'GET' || request.method === 'HEAD') return false
  const site = request.headers.get('Sec-Fetch-Site')
  return (site !== null && site !== 'same-origin') || request.headers.get('Origin') !== url.origin
}

/**
 * To the Hub, which knows the person: the browser keeps a secret bound to this host and the Hub
 * sees only its hash, so a pass made for one browser opens nothing in another (security S22). The
 * published app's host goes by `/apps/open`, framed or not. The Prévia's host is the Hub's frame:
 * there the entry page hands the hash to the Hub's page instead; anywhere else, a page that sends
 * to the Hub, with no cookie but `cleared` and no call to it. `Sec-Fetch-Dest` only chooses between
 * those two pages, never a cookie's form.
 */
async function toHub(visit: Visit, cleared: string[]): Promise<Response> {
  if (visit.environment === 'preview' && visit.request.headers.get('Sec-Fetch-Dest') !== 'iframe') {
    const page = await failure(visit, 'EDGE_PREVIEW_OUTSIDE_HUB', { host: visit.host })
    for (const cookie of cleared) page.headers.append('Set-Cookie', cookie)
    return page
  }
  const kept = createAppSession.input.body.shape.binding.safeParse(
    cookiesOf(visit.request.headers).get(BINDING_COOKIE),
  )
  const binding = kept.data ?? base64Of(crypto.getRandomValues(new Uint8Array(SECRET_BYTES)), 'url')
  const cookies = kept.success
    ? cleared
    : [...cleared, setCookie(BINDING_COOKIE, binding, visit.environment)]
  const hash = base64Of(await sha256Of(binding), 'url')
  const hubOrigin = visit.env.HUB_PUBLIC_ORIGIN
  if (visit.environment === 'preview') {
    return entryPage({
      hubOrigin,
      host: visit.host,
      binding: hash,
      script: ENTRY_SCRIPT,
      cookies,
      contentSecurityPolicy: visit.policy,
    })
  }
  const query = new URLSearchParams({ host: visit.host, binding: hash })
  return redirect(visit, `${hubOrigin}${APP_OPEN_PATH}?${query}`, cookies)
}

async function markOf(session: string): Promise<string> {
  return base64Of(await sha256Of(session), 'url')
}

/**
 * Trades the Hub's pass for the app's session, on the browser the pass was made for. It lands on
 * `LANDING_PATH`, whose address, not a cookie, says a pass was just redeemed and for which session.
 */
async function redeem(visit: Visit): Promise<Response> {
  const body = createAppSession.input.body.safeParse({
    host: visit.host,
    code: visit.url.searchParams.get('code'),
    binding: cookiesOf(visit.request.headers).get(BINDING_COOKIE),
  })
  if (!body.success) return failure(visit, 'APP_HANDOFF_INVALID')
  const answer = await visit.hub.createAppSession(body.data)
  if (answer.kind === 'DONE') {
    const { session } = answer.value
    const landing = `${LANDING_PATH}?${new URLSearchParams({ [SESSION_MARK]: await markOf(session) })}`
    return redirect(visit, landing, appSessionCookies(session, visit.environment))
  }
  if (answer.kind === 'REFUSED' && answer.code === 'APP_HANDOFF_INVALID') {
    return failure(visit, 'APP_HANDOFF_INVALID')
  }
  return failure(
    visit,
    'EDGE_HUB_UNAVAILABLE',
    answer.kind === 'NO_ANSWER' ? { reason: answer.reason } : {},
  )
}

/**
 * The browser came back from the pass with the session it set, so on to the app; or without it, and
 * this second round in a row without a session is a page, not another trip to the Hub that loops
 * until "too many redirects" (oauth2-proxy's error page, Vouch's count of tries). A stale cookie the
 * browser keeps sending instead of the new one counts as not kept.
 */
async function land(visit: Visit): Promise<Response> {
  const sent = cookiesOf(visit.request.headers).get(APP_SESSION_COOKIE)
  const mark = visit.url.searchParams.get(SESSION_MARK)
  if (sent !== undefined && (await markOf(sent)) === mark) return redirect(visit, '/', [])
  return failure(visit, 'EDGE_SESSION_NOT_KEPT', { host: visit.host, rounds: 2 })
}

/**
 * The app's Worker runs under the native limit on its subrequests, which counts each call to its
 * `db` (decision 0047); the outbound Worker refuses any other. `cpuMs` repeats the CPU limit its
 * upload carries, the one Cloudflare was seen to cut (0047, check 5); of the two, the lower applies.
 */
export const DISPATCH_OPTIONS = {
  outbound: {},
  limits: { subRequests: APP_CALL_LIMITS.dbCallsPerCall, cpuMs: APP_CALL_LIMITS.cpuMs },
} as const

/** Settles at the call's deadline: no platform limit cuts an app that only waits (decision 0047). */
export function deadlineOf(ms: number) {
  const endsAt = Date.now() + ms
  let timer: ReturnType<typeof setTimeout> | undefined
  const passed = new Promise<'PASSED'>((resolve) => {
    timer = setTimeout(() => resolve('PASSED'), ms)
  })
  return { endsAt, passed, end: () => clearTimeout(timer) }
}

/**
 * The live version's Worker with a `db` bound to its run login, or the example app, which gets only
 * the caller. Its answer leaves with the dispatcher's headers; an app that throws, its CPU limit
 * included, or a version whose Worker is gone ("Worker not found.", no code: decision 0043), gets the
 * 502 page, and so does one that has not answered at the call's deadline.
 */
async function toApp(visit: Visit, call: AppCall, session: AppSessionToken): Promise<Response> {
  const { caller } = call
  const deadline = deadlineOf(APP_CALL_LIMITS.callDeadlineMs)
  try {
    const app =
      call.database === null
        ? visit.env.DISPATCHER.get(EXAMPLE_SCRIPT, { props: { caller } }, DISPATCH_OPTIONS)
        : visit.env.DISPATCHER.get(
            call.version.worker,
            {
              props: {
                caller,
                db: visit.exports.Db({
                  props: {
                    ...{ ...call.database, endsAt: deadline.endsAt },
                    ...{ session, label: visit.host },
                  },
                }),
                connectors: visit.exports.Connectors({
                  props: { host: visit.host, session, endsAt: deadline.endsAt },
                }),
              } satisfies AppProps,
            },
            DISPATCH_OPTIONS,
          )
    const response = await Promise.race([
      app.fetch(new Request(visit.request, { headers: headersToApp(visit.request.headers) })),
      deadline.passed,
    ])
    if (response === 'PASSED') return failure(visit, 'EDGE_APP_DEADLINE')
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headersFromApp(response.headers, visit.policy),
    })
  } catch {
    // The app's own error stays in its Worker's logs.
    return failure(visit, 'EDGE_APP_FAILED')
  } finally {
    deadline.end()
  }
}

const CHECK_REFUSALS: Partial<Record<string, PageCode>> = {
  APP_ACCESS_REFUSED: 'APP_ACCESS_REFUSED',
  APP_NOT_FOUND: 'APP_NOT_FOUND',
  APP_NOT_PUBLISHED: 'APP_NOT_PUBLISHED',
}

/** The app's host the browser opened, the published app's or its Prévia's, with its environment. */
type OnHost = { host: AppHost; environment: AppEnvironment }

function onHostOf(url: URL, env: Env): OnHost | undefined {
  const domain = `.${env.APPS_DOMAIN}`
  const host = AppHost.safeParse(
    url.hostname.endsWith(domain) ? url.hostname.slice(0, -domain.length) : '',
  )
  return host.success
    ? { host: host.data, environment: appOfHost(host.data).environment }
    : undefined
}

async function dispatch(
  request: Request,
  env: Env,
  exports: Exports,
  at: { url: URL; on: OnHost | undefined },
): Promise<Response> {
  const { url, on } = at
  const page = { hubOrigin: env.HUB_PUBLIC_ORIGIN, environment: on?.environment }
  if (on === undefined) return failurePage('APP_NOT_FOUND', page)
  const { host, environment } = on
  if (isForeignWrite(request, url)) return failurePage('REQUEST_ORIGIN_REFUSED', page)
  const policy = appPolicyOf(env, environment)
  const visit: Visit = { request, env, exports, hub: hubOf(env), url, host, environment, policy }
  if (url.pathname === HANDOFF_PATH) return redeem(visit)
  if (url.pathname === LANDING_PATH) return land(visit)
  if (url.pathname === ENTRY_SCRIPT) return entryScript(policy)
  if (url.pathname.startsWith(DISPATCHER_PATHS)) return failure(visit, 'APP_NOT_FOUND')

  const session = AppSessionToken.safeParse(cookiesOf(request.headers).get(APP_SESSION_COOKIE))
  if (!session.success) return toHub(visit, [])
  const answer = await visit.hub.checkAppCall({ host, session: session.data })
  if (answer.kind === 'DONE') return toApp(visit, answer.value, session.data)
  if (answer.kind === 'REFUSED' && answer.code === 'APP_SESSION_INVALID') {
    return toHub(visit, appSessionCookies('', environment))
  }
  const refusal = answer.kind === 'REFUSED' ? CHECK_REFUSALS[answer.code] : undefined
  return failure(
    visit,
    refusal ?? 'EDGE_HUB_UNAVAILABLE',
    answer.kind === 'NO_ANSWER' ? { reason: answer.reason } : {},
  )
}

/**
 * Every request to an app's host, with the dispatcher's own exports; any throw is the 500 page,
 * framed as its host is.
 */
export async function serveDispatch(request: Request, env: Env, exports: Exports) {
  const url = new URL(request.url)
  const on = onHostOf(url, env)
  try {
    return await dispatch(request, env, exports, { url, on })
  } catch {
    const page = { hubOrigin: env.HUB_PUBLIC_ORIGIN, environment: on?.environment }
    return failurePage('INTERNAL_UNEXPECTED', page)
  }
}

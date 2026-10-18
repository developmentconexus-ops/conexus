import type { AppProps } from '@conexus/app-contract'
import { APP_CALL_LIMITS } from '@conexus/app-contract'
import type { AppCall, HostLabel as Label } from '@conexus/hub-api'
import { AppSessionToken, createAppSession, HANDOFF_PATH, HostLabel } from '@conexus/hub-api'
import type { DbProps } from './db.ts'
import { base64Of, sha256Of } from './digest.ts'
import {
  APP_SESSION_COOKIE,
  BINDING_COOKIE,
  cookiesOf,
  headersFromApp,
  headersToApp,
  setCookie,
  withSecurityHeaders,
} from './headers.ts'
import type { HubPort } from './hub.ts'
import { hubOf } from './hub.ts'
import type { PageCode } from './pages.ts'
import { failurePage } from './pages.ts'

/** A Projeto with no version on the air runs the example app of step 8. */
const EXAMPLE_SCRIPT = 'conexus-example'
/** The dispatcher's own paths on an app's host, which the app never receives. */
const DISPATCHER_PATHS = '/__conexus/'
const SECRET_BYTES = 32

/** What the dispatcher needs of its own exports: a `db` stub bound to one login (decision 0043). */
export type Exports = { Db(options: { props: DbProps }): AppProps['db'] }

type Visit = {
  request: Request
  env: Env
  exports: Exports
  hub: HubPort
  url: URL
  label: Label
}

function redirect(location: string, cookies: string[]): Response {
  const headers = new Headers({ Location: location, 'Cache-Control': 'no-store' })
  for (const cookie of cookies) headers.append('Set-Cookie', cookie)
  return new Response(null, { status: 303, headers: withSecurityHeaders(headers) })
}

/** A write without this host's exact `Origin`, or that `Sec-Fetch-Site` calls cross-site (S24). */
function isForeignWrite(request: Request, url: URL): boolean {
  if (request.method === 'GET' || request.method === 'HEAD') return false
  const site = request.headers.get('Sec-Fetch-Site')
  return (site !== null && site !== 'same-origin') || request.headers.get('Origin') !== url.origin
}

/**
 * To the Hub, which knows the person: the browser keeps a secret bound to this host and the Hub
 * sees only its hash, so a pass made for one browser opens nothing in another (security S22).
 */
async function toHub(visit: Visit, cleared: string[]): Promise<Response> {
  const kept = createAppSession.input.body.shape.binding.safeParse(
    cookiesOf(visit.request.headers).get(BINDING_COOKIE),
  )
  const binding = kept.data ?? base64Of(crypto.getRandomValues(new Uint8Array(SECRET_BYTES)), 'url')
  const cookies = kept.success ? cleared : [...cleared, setCookie(BINDING_COOKIE, binding)]
  const query = new URLSearchParams({
    host: visit.label,
    binding: base64Of(await sha256Of(binding), 'url'),
  })
  return redirect(`${visit.env.HUB_PUBLIC_ORIGIN}/apps/open?${query}`, cookies)
}

/** Trades the Hub's pass for the app's session, on the browser the pass was made for. */
async function redeem(visit: Visit): Promise<Response> {
  const body = createAppSession.input.body.safeParse({
    host: visit.label,
    code: visit.url.searchParams.get('code'),
    binding: cookiesOf(visit.request.headers).get(BINDING_COOKIE),
  })
  if (!body.success) return failurePage('APP_HANDOFF_INVALID')
  const answer = await visit.hub.createAppSession(body.data)
  if (answer.kind === 'DONE') {
    return redirect('/', [
      setCookie(APP_SESSION_COOKIE, answer.value.session),
      setCookie(BINDING_COOKIE, ''),
    ])
  }
  if (answer.kind === 'REFUSED' && answer.code === 'APP_HANDOFF_INVALID') {
    return failurePage('APP_HANDOFF_INVALID')
  }
  return failurePage(
    'EDGE_HUB_UNAVAILABLE',
    answer.kind === 'NO_ANSWER' ? answer.reason : undefined,
  )
}

/**
 * The app's Worker runs under the native limit on its subrequests, which counts each call to its
 * `db` (decision 0047); the outbound Worker refuses any other.
 */
const DISPATCH_OPTIONS = {
  outbound: {},
  limits: { subRequests: APP_CALL_LIMITS.dbCallsPerCall },
} as const

/** Settles at the call's deadline: no platform limit cuts an app that only waits (decision 0047). */
function deadlineOf(ms: number) {
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
async function toApp(visit: Visit, call: AppCall): Promise<Response> {
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
                db: visit.exports.Db({ props: { ...call.database, endsAt: deadline.endsAt } }),
              } satisfies AppProps,
            },
            DISPATCH_OPTIONS,
          )
    const response = await Promise.race([
      app.fetch(new Request(visit.request, { headers: headersToApp(visit.request.headers) })),
      deadline.passed,
    ])
    if (response === 'PASSED') return failurePage('EDGE_APP_DEADLINE')
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headersFromApp(response.headers),
    })
  } catch {
    // The app's own error stays in its Worker's logs.
    return failurePage('EDGE_APP_FAILED')
  } finally {
    deadline.end()
  }
}

const CHECK_REFUSALS: Partial<Record<string, PageCode>> = {
  APP_ACCESS_REFUSED: 'APP_ACCESS_REFUSED',
  APP_NOT_FOUND: 'APP_NOT_FOUND',
}

async function dispatch(request: Request, env: Env, exports: Exports): Promise<Response> {
  const url = new URL(request.url)
  const domain = `.${env.APPS_DOMAIN}`
  const label = HostLabel.safeParse(
    url.hostname.endsWith(domain) ? url.hostname.slice(0, -domain.length) : '',
  )
  if (!label.success) return failurePage('APP_NOT_FOUND')
  if (isForeignWrite(request, url)) return failurePage('REQUEST_ORIGIN_REFUSED')
  const visit: Visit = { request, env, exports, hub: hubOf(env), url, label: label.data }
  if (url.pathname === HANDOFF_PATH) return redeem(visit)
  if (url.pathname.startsWith(DISPATCHER_PATHS)) return failurePage('APP_NOT_FOUND')

  const session = AppSessionToken.safeParse(cookiesOf(request.headers).get(APP_SESSION_COOKIE))
  if (!session.success) return toHub(visit, [])
  const answer = await visit.hub.checkAppCall({ host: visit.label, session: session.data })
  if (answer.kind === 'DONE') return toApp(visit, answer.value)
  if (answer.kind === 'REFUSED' && answer.code === 'APP_SESSION_INVALID') {
    return toHub(visit, [setCookie(APP_SESSION_COOKIE, '')])
  }
  const refusal = answer.kind === 'REFUSED' ? CHECK_REFUSALS[answer.code] : undefined
  return failurePage(
    refusal ?? 'EDGE_HUB_UNAVAILABLE',
    answer.kind === 'NO_ANSWER' ? answer.reason : undefined,
  )
}

/** Every request to an app's host, with the dispatcher's own exports; any throw is the 500 page. */
export async function serveDispatch(request: Request, env: Env, exports: Exports) {
  try {
    return await dispatch(request, env, exports)
  } catch {
    return failurePage('INTERNAL_UNEXPECTED')
  }
}

import type { AppProps } from '@conexus/app-contract'
import type { HostLabel as Label } from '@conexus/hub-api'
import { AppSessionToken, createAppSession, HANDOFF_PATH, HostLabel } from '@conexus/hub-api'
import { base64Of, sha256Of } from './digest.ts'
import {
  APP_SESSION_COOKIE,
  BINDING_COOKIE,
  cookiesOf,
  headersFromApp,
  headersToApp,
  setCookie,
} from './headers.ts'
import type { HubPort } from './hub.ts'
import { hubOf } from './hub.ts'
import type { PageCode } from './pages.ts'
import { failurePage } from './pages.ts'

/** Every Projeto runs the example app until step 9 brings its own (card C30). */
const APP_SCRIPT = 'conexus-example'
/** The dispatcher's own paths on an app's host, which the app never receives. */
const DISPATCHER_PATHS = '/__conexus/'
const SECRET_BYTES = 32

type Visit = { request: Request; env: Env; hub: HubPort; url: URL; label: Label }

function redirect(location: string, cookies: string[]): Response {
  const headers = new Headers({ Location: location, 'Cache-Control': 'no-store' })
  for (const cookie of cookies) headers.append('Set-Cookie', cookie)
  return new Response(null, { status: 303, headers })
}

/** A write sent by another site, which the browser names in `Sec-Fetch-Site` or `Origin` (S24). */
function isCrossSiteWrite(request: Request, url: URL): boolean {
  if (request.method === 'GET' || request.method === 'HEAD') return false
  const site = request.headers.get('Sec-Fetch-Site')
  const origin = request.headers.get('Origin')
  return (site !== null && site !== 'same-origin') || (origin !== null && origin !== url.origin)
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
  return failurePage('EDGE_HUB_UNAVAILABLE')
}

/** The app's answer, with the dispatcher's headers; an app that throws gets the 502 page. */
async function toApp(visit: Visit, props: AppProps): Promise<Response> {
  const app = visit.env.DISPATCHER.get(APP_SCRIPT, { props }, { outbound: {} })
  try {
    const response = await app.fetch(
      new Request(visit.request, { headers: headersToApp(visit.request.headers) }),
    )
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headersFromApp(response.headers),
    })
  } catch {
    // The app's own error, its CPU limit included, stays in its Worker's logs.
    return failurePage('EDGE_APP_FAILED')
  }
}

const CHECK_REFUSALS: Partial<Record<string, PageCode>> = {
  APP_ACCESS_REFUSED: 'APP_ACCESS_REFUSED',
  APP_NOT_FOUND: 'APP_NOT_FOUND',
}

async function dispatch(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const domain = `.${env.APPS_DOMAIN}`
  const label = HostLabel.safeParse(
    url.hostname.endsWith(domain) ? url.hostname.slice(0, -domain.length) : '',
  )
  if (!label.success) return failurePage('APP_NOT_FOUND')
  if (isCrossSiteWrite(request, url)) return failurePage('REQUEST_ORIGIN_REFUSED')
  const visit: Visit = { request, env, hub: hubOf(env), url, label: label.data }
  if (url.pathname === HANDOFF_PATH) return redeem(visit)
  if (url.pathname.startsWith(DISPATCHER_PATHS)) return failurePage('APP_NOT_FOUND')

  const session = AppSessionToken.safeParse(cookiesOf(request.headers).get(APP_SESSION_COOKIE))
  if (!session.success) return toHub(visit, [])
  const answer = await visit.hub.checkAppCall({ host: visit.label, session: session.data })
  if (answer.kind === 'DONE') return toApp(visit, { caller: answer.value.caller })
  if (answer.kind === 'REFUSED' && answer.code === 'APP_SESSION_INVALID') {
    return toHub(visit, [setCookie(APP_SESSION_COOKIE, '')])
  }
  const refusal = answer.kind === 'REFUSED' ? CHECK_REFUSALS[answer.code] : undefined
  return failurePage(refusal ?? 'EDGE_HUB_UNAVAILABLE')
}

export default {
  async fetch(request: Request, env: Env) {
    try {
      return await dispatch(request, env)
    } catch {
      return failurePage('INTERNAL_UNEXPECTED')
    }
  },
} satisfies ExportedHandler<Env>

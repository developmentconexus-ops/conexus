import { appContentSecurityPolicy } from '@conexus/app-contract'
import type { AppEnvironment } from '@conexus/hub-api'
import { APP_SESSION_COOKIE, APP_SESSION_HEADER } from '@conexus/hub-api'

/**
 * The dispatcher's own cookies on an app's host, `APP_SESSION_COOKIE` among them; the app never reads
 * nor sets one.
 */
const COOKIE_PREFIX = '__Host-conexus-'
export const BINDING_COOKIE = `${COOKIE_PREFIX}binding`

/**
 * Who may frame a host: the Hub its Prévia; nobody the published app, or a host that is no app's
 * (security S24). Each host is its own origin, as Cloudflare serves each preview on its hostname.
 */
export function frameAncestorOf(
  hubOrigin: string,
  environment: AppEnvironment | undefined,
): string {
  return environment === 'preview' ? hubOrigin : "'none'"
}

/** The app's policy on every answer of its host. */
export function appPolicyOf(env: Env, environment: AppEnvironment): string {
  return appContentSecurityPolicy(frameAncestorOf(env.HUB_PUBLIC_ORIGIN, environment))
}

/** The headers every answer of the dispatcher carries, its own pages and the app's (security S24). */
export function withSecurityHeaders(headers: Headers, contentSecurityPolicy: string): Headers {
  headers.set('Content-Security-Policy', contentSecurityPolicy)
  headers.set('Referrer-Policy', 'no-referrer')
  headers.set('X-Content-Type-Options', 'nosniff')
  return headers
}

/** The cookies of a request, by name; a malformed pair is left out. */
export function cookiesOf(headers: Headers): Map<string, string> {
  const cookies = new Map<string, string>()
  for (const pair of (headers.get('Cookie') ?? '').split(';')) {
    const at = pair.indexOf('=')
    if (at > 0) cookies.set(pair.slice(0, at).trim(), pair.slice(at + 1).trim())
  }
  return cookies
}

/**
 * A cookie of the browser's session on this host only (security S17); the host says its form. On the
 * Prévia's, `SameSite=None` reaches the app the Hub frames and `Partitioned` keeps it to the Hub's
 * frame, as vibesdk's preview cookie (`spacePreviewToken.ts:60-83`). On the published app's,
 * `SameSite=Lax`, as vibesdk's owner cookie (`ownerPreviewToken.ts:81-97`): in WebKit a `Partitioned`
 * cookie is not reliably sent back to a tab after a redirect chain (WebKit bugs 316066 and 306194).
 * An empty value deletes it.
 */
export function setCookie(name: string, value: string, environment: AppEnvironment): string {
  const lifetime = value === '' ? '; Max-Age=0' : ''
  const site = environment === 'preview' ? 'SameSite=None; Partitioned' : 'SameSite=Lax'
  return `${name}=${value}; Path=/; Secure; HttpOnly; ${site}${lifetime}`
}

/**
 * The app session's lines; an empty session deletes it. The Prévia's host only ever had the
 * partitioned form. The published app's kept the partitioned form before it moved to `SameSite=Lax`,
 * and the browser keeps the two forms of one name apart, so a delete there names both, as GitBook's
 * logout does (`visitors.ts:419-426`), and writing the new one deletes the old form first: a browser
 * that ignores `Partitioned` reads that line as a delete of the same cookie. Revalidate by
 * 2027-02-22: once no session written before pull request 1211 can be alive, the published host
 * writes and deletes the `Lax` form only.
 */
export function appSessionCookies(session: string, environment: AppEnvironment): string[] {
  const written = setCookie(APP_SESSION_COOKIE, session, environment)
  if (environment === 'preview') return [written]
  return [setCookie(APP_SESSION_COOKIE, '', 'preview'), written]
}

/** The request's headers as the app receives them: without the dispatcher's cookies or session. */
export function headersToApp(from: Headers): Headers {
  const headers = new Headers(from)
  headers.delete(APP_SESSION_HEADER)
  const kept = [...cookiesOf(from)]
    .filter(([name]) => !name.startsWith(COOKIE_PREFIX))
    .map(([name, value]) => `${name}=${value}`)
  if (kept.length === 0) headers.delete('Cookie')
  else headers.set('Cookie', kept.join('; '))
  return headers
}

/**
 * The app's headers as the browser receives them: an app cannot set the dispatcher's cookies.
 * `Headers` strips leading whitespace from a value, so a line never starts with a space.
 */
export function headersFromApp(from: Headers, contentSecurityPolicy: string): Headers {
  const headers = new Headers(from)
  headers.delete('Set-Cookie')
  for (const line of from.getSetCookie()) {
    if (!line.startsWith(COOKIE_PREFIX)) headers.append('Set-Cookie', line)
  }
  return withSecurityHeaders(headers, contentSecurityPolicy)
}

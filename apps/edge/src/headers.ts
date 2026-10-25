import { appContentSecurityPolicy } from '@conexus/app-contract'
import { APP_SESSION_HEADER } from '@conexus/hub-api'

/** The dispatcher's own cookies on an app's host; the app never reads nor sets one. */
const COOKIE_PREFIX = '__Host-conexus-'
export const BINDING_COOKIE = `${COOKIE_PREFIX}binding`
export const APP_SESSION_COOKIE = `${COOKIE_PREFIX}app`

/** The app's policy on every answer of its host: only the Hub may frame it, in the Prévia. */
export function appPolicyOf(env: Env): string {
  return appContentSecurityPolicy(env.HUB_PUBLIC_ORIGIN)
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
 * A cookie of the browser's session on this host only (security S17), sent inside the Hub's Prévia
 * too: `SameSite=None` reaches the framed app, and `Partitioned` keeps it to the Hub's frame, as
 * vibesdk's preview cookie (`spacePreviewToken.ts:60-83`). An empty value deletes it.
 */
export function setCookie(name: string, value: string): string {
  const lifetime = value === '' ? '; Max-Age=0' : ''
  return `${name}=${value}; Path=/; Secure; HttpOnly; SameSite=None; Partitioned${lifetime}`
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

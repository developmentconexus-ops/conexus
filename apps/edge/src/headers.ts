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

/** Where the request runs: the app's own tab, or the Hub's Prévia frame (`Sec-Fetch-Dest`). */
export type Place = 'TAB' | 'FRAME'

export function placeOf(headers: Headers): Place {
  return headers.get('Sec-Fetch-Dest') === 'iframe' ? 'FRAME' : 'TAB'
}

/**
 * A cookie of the browser's session on this host only (security S17). In the Hub's Prévia,
 * `SameSite=None` reaches the framed app and `Partitioned` keeps it to the Hub's frame, as vibesdk's
 * preview cookie (`spacePreviewToken.ts:60-83`). The tab's is `SameSite=Lax`, which no frame of
 * another site receives: in WebKit a `Partitioned` cookie is not reliably sent back to a tab after
 * a redirect chain (WebKit bugs 316066 and 306194); which of them loops a tab was not reproduced.
 * An empty value deletes it.
 */
export function setCookie(name: string, value: string, place: Place): string {
  const lifetime = value === '' ? '; Max-Age=0' : ''
  const site = place === 'FRAME' ? 'SameSite=None; Partitioned' : 'SameSite=Lax'
  return `${name}=${value}; Path=/; Secure; HttpOnly; ${site}${lifetime}`
}

/**
 * The app session's lines; an empty session deletes it. The browser keeps the partitioned and the
 * unpartitioned cookie of one name apart, so a delete names both forms, as GitBook's logout does
 * (`visitors.ts:419-426`). A tab kept the partitioned form before it moved to `SameSite=Lax`, and
 * writing the new one deletes that form first: a browser that ignores `Partitioned` reads that line
 * as a delete of the same cookie.
 */
export function appSessionCookies(session: string, place: Place): string[] {
  const partitioned = setCookie(APP_SESSION_COOKIE, '', 'FRAME')
  if (session === '') return [partitioned, setCookie(APP_SESSION_COOKIE, '', 'TAB')]
  const written = setCookie(APP_SESSION_COOKIE, session, place)
  return place === 'TAB' ? [partitioned, written] : [written]
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

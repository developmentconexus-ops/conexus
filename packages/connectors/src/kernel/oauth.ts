import type { z } from 'zod'
import type { Native, ProviderAnswer, TokenRequest } from './operation.ts'
import { locateOf } from './operation.ts'

/** The installation's app: the Hub reads it from a file (S31) and hands it in; the kit never keeps it (S36). */
export type AppKeys = Readonly<{ clientId: string; clientSecret: string }>

/** Whose app the connection authorizes (W1): the installation's now; `{ from: 'connection'; fields }` later. */
export type AppSource = Readonly<{ from: 'installation' }>

/** A login the person makes at the provider and comes back from with a code, exchanged for a token and renewed with a refresh token. */
export type OAuth2CodeAuth = Readonly<{
  kind: 'oauth2_code'
  app: AppSource
  authorize: Readonly<{
    url: `https://${string}` // the browser's page, never fetched
    pkce: 'S256'
    params: Readonly<Record<string, string>> // fixed extras, `scope` among them
  }>
  token: Readonly<{ path: `/${string}` }> // on the connector's origin, form body
  // refreshToken absent: the provider keeps the old one (RFC 6749 §6), and the Hub keeps it too
  answer: z.ZodType<
    Readonly<{ accessToken: string; refreshToken?: string; expiresInSeconds: number }>
  >
  refusals: Readonly<{ grant: readonly string[]; app: readonly string[] }> // the body's `error` (RFC 6749 §5.2)
}>

/** The one way to declare an OAuth login: it refuses an authorization page that is not https and an error listed as both the grant's and the app's. */
export function oauth2Code(auth: Omit<OAuth2CodeAuth, 'kind'>): OAuth2CodeAuth {
  if (!URL.canParse(auth.authorize.url) || new URL(auth.authorize.url).protocol !== 'https:')
    throw new Error('The authorization page must be https')
  const both = auth.refusals.grant.filter((error) => auth.refusals.app.includes(error))
  if (both.length > 0)
    throw new Error(`Refusal listed as the grant's and the app's: ${both.join(', ')}`)
  return Object.freeze({
    ...auth,
    kind: 'oauth2_code',
    authorize: Object.freeze({
      ...auth.authorize,
      params: Object.freeze({ ...auth.authorize.params }),
    }),
    refusals: Object.freeze({
      grant: Object.freeze([...auth.refusals.grant]),
      app: Object.freeze([...auth.refusals.app]),
    }),
  })
}

/**
 * The page the person is sent to: the fixed params, then ours. The client secret is not an input, so
 * it cannot be in it. `origin` is a double's: the authorization path placed on it.
 */
export function authorizeUrl(
  auth: OAuth2CodeAuth,
  a: Readonly<{ clientId: string; redirectUri: string; state: string; challenge: string }>,
  origin?: string,
): URL {
  const given = new URL(auth.authorize.url)
  const url = origin === undefined ? given : new URL(given.pathname, origin)
  for (const [name, value] of Object.entries(auth.authorize.params))
    url.searchParams.set(name, value)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', a.clientId)
  url.searchParams.set('redirect_uri', a.redirectUri)
  url.searchParams.set('state', a.state)
  url.searchParams.set('code_challenge', a.challenge)
  url.searchParams.set('code_challenge_method', auth.authorize.pkce)
  return url
}

function tokenRequestOf(auth: OAuth2CodeAuth, form: Record<string, string>): TokenRequest {
  return {
    method: 'POST',
    path: auth.token.path,
    query: {},
    body: undefined,
    form: new URLSearchParams(form),
    headers: { accept: 'application/json' },
  }
}

/** The exchange of the code, everything in the form body and nothing in the URL; the executor alone sends it (S36). */
export function codeRequest(
  auth: OAuth2CodeAuth,
  app: AppKeys,
  a: Readonly<{ code: string; redirectUri: string; verifier: string }>,
): TokenRequest {
  return tokenRequestOf(auth, {
    grant_type: 'authorization_code',
    client_id: app.clientId,
    client_secret: app.clientSecret,
    code: a.code,
    redirect_uri: a.redirectUri,
    code_verifier: a.verifier,
  })
}

/** The renewal, in the same form body. */
export function refreshRequest(
  auth: OAuth2CodeAuth,
  app: AppKeys,
  refreshToken: string,
): TokenRequest {
  return tokenRequestOf(auth, {
    grant_type: 'refresh_token',
    client_id: app.clientId,
    client_secret: app.clientSecret,
    refresh_token: refreshToken,
  })
}

/** What the exchange or the renewal answered: tokens, the person's grant refused, the app refused, or a body the kit cannot read. */
export type GrantAnswered =
  | Readonly<{
      kind: 'OK'
      accessToken: string
      refreshToken: string | null
      expiresInSeconds: number
    }>
  | Readonly<{ kind: 'GRANT_REFUSED' | 'APP_REFUSED' | 'UNREADABLE'; native: Native }>

function errorOf(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || !('error' in body)) return null
  return typeof body.error === 'string' ? body.error : null
}

/** A 2xx in the schema is `OK`; a 2xx outside it carries no body (it may hold a token); a refusal is read by the body's `error`, as the connector lists it (RFC 6749 §5.2). */
export function readGrant(auth: OAuth2CodeAuth, answer: ProviderAnswer): GrantAnswered {
  if (answer.status >= 200 && answer.status < 300) {
    const token = auth.answer.safeParse(answer.body)
    if (token.success)
      return {
        kind: 'OK',
        accessToken: token.data.accessToken,
        refreshToken: token.data.refreshToken ?? null,
        expiresInSeconds: token.data.expiresInSeconds,
      }
    return {
      kind: 'UNREADABLE',
      native: { status: answer.status, ...locateOf(answer.body), body: null },
    }
  }
  const error = errorOf(answer.body)
  const located = locateOf(answer.body)
  const native = {
    status: answer.status,
    code: located.code ?? error,
    message: located.message,
    body: answer.body,
  }
  if (error !== null && auth.refusals.grant.includes(error))
    return { kind: 'GRANT_REFUSED', native }
  if (error !== null && auth.refusals.app.includes(error)) return { kind: 'APP_REFUSED', native }
  return { kind: 'UNREADABLE', native }
}

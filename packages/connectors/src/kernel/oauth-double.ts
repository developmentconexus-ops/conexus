import { createHash, randomBytes } from 'node:crypto'
import type { AppKeys } from './oauth.ts'

/** A code the double gave: the challenge it was given for, the redirect it was asked for, and whether it was spent. `E` is what the double adds (an account). */
export type Held<E> = { challenge: string; redirectUri: string; used: boolean } & E

/** What the login of a double keeps: the redirect it accepts, the codes it gave, and how many keys it issued. */
export type Flow<E> = {
  app: AppKeys
  redirectUri: string
  codes: Map<string, Held<E>>
  count: { issued: number }
}

/** A new key or code, `prefix` first. */
export function nextKey(flow: Flow<object>, prefix: string): string {
  flow.count.issued += 1
  return `${prefix}-${flow.count.issued}-${randomBytes(6).toString('hex')}`
}

function isAuthorizeRequest(q: URLSearchParams, flow: Flow<object>): boolean {
  return (
    q.get('response_type') === 'code' &&
    q.get('client_id') === flow.app.clientId &&
    q.get('redirect_uri') === flow.redirectUri &&
    q.get('code_challenge_method') === 'S256' &&
    (q.get('code_challenge') ?? '') !== '' &&
    (q.get('state') ?? '') !== ''
  )
}

/**
 * The authorization page: a request that is not the kit's for this app is `invalid`; otherwise it
 * answers 302 to the redirect with the state and a code (kept with `extra`), or `access_denied` once
 * when `refuses` says the person said no.
 */
export function authorizePage<E extends object>(
  flow: Flow<E>,
  url: URL,
  h: Readonly<{
    prefix: string
    invalid: () => Response
    refuses: () => boolean
    extra: () => E
  }>,
): Response {
  const q = url.searchParams
  if (!isAuthorizeRequest(q, flow)) return h.invalid()
  const back = new URL(flow.redirectUri)
  back.searchParams.set('state', q.get('state') ?? '')
  if (h.refuses()) back.searchParams.set('error', 'access_denied')
  else {
    const code = nextKey(flow, h.prefix)
    flow.codes.set(code, {
      challenge: q.get('code_challenge') ?? '',
      redirectUri: flow.redirectUri,
      used: false,
      ...h.extra(),
    })
    back.searchParams.set('code', code)
  }
  return new Response(null, { status: 302, headers: { location: back.href } })
}

/** The exchange: a code works once, even when the rest is wrong, with the verifier and the redirect it was given for; `issue` gives the keys. */
export function exchangeCode<E extends object>(
  flow: Flow<E>,
  form: URLSearchParams,
  h: Readonly<{ invalid: () => Response; issue: (held: Held<E>) => Response }>,
): Response {
  const held = flow.codes.get(form.get('code') ?? '')
  if (!held || held.used) return h.invalid()
  held.used = true
  const challenge = createHash('sha256')
    .update(form.get('code_verifier') ?? '')
    .digest('base64url')
  const right = challenge === held.challenge && form.get('redirect_uri') === held.redirectUri
  return right ? h.issue(held) : h.invalid()
}

/** The token route: the app's keys first (401 `invalid_client`), then the grant the form asks, answered by the double's own `exchange` and `renew`. */
export async function tokenRoute<W extends Flow<object>>(
  world: W,
  request: Request,
  error: (error: string, status: number) => Response,
  grants: Readonly<{
    exchange: (world: W, form: URLSearchParams) => Response
    renew: (world: W, form: URLSearchParams) => Promise<Response>
  }>,
): Promise<Response> {
  const form = new URLSearchParams(await request.text())
  if (
    form.get('client_id') !== world.app.clientId ||
    form.get('client_secret') !== world.app.clientSecret
  )
    return error('invalid_client', 401)
  const grant = form.get('grant_type')
  if (grant === 'authorization_code') return grants.exchange(world, form)
  if (grant === 'refresh_token') return grants.renew(world, form)
  return error('unsupported_grant_type', 400)
}

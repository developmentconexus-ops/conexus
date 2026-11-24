import type { ClientCredentialsAuth, Credential } from './auth.ts'
import { loggedOutBy, logoutRequest, readToken, tokenRequest } from './auth.ts'
import type { Native, ProviderAnswer, ProviderRequest } from './operation.ts'

/**
 * A token is renewed this long before its end, and the old one logged out first: an expired
 * Sankhya token's logout is refused and its session hangs (measured 2026-10-30).
 */
export const RENEW_BEFORE_MS = 60_000

/** A bearer token and the instant, in epoch milliseconds, the provider ends it. */
export type Grant = Readonly<{ kind: 'TOKEN'; token: string; expiresAt: number }>

/** What a source's failure carries: a kind of its own, never `TOKEN`. */
type Failed = Readonly<{ kind: string }>

/** The token being replaced, and the provider's answer when it ended the token (null: renewed before its end). */
type Replacing = Readonly<{ grant: Grant; ended: Native | null }>

/**
 * Where a session's tokens come from: the login of pasted fields (`credentialsSource`), or the
 * Hub's leased refresh of an exclusive grant, whose renewal serves once. `held` is a token the
 * connection already has, judged by the session's margin like any other.
 */
export type TokenSource<F extends Failed, E = unknown> = Readonly<{
  held: Grant | null
  open(a: Readonly<{ replacing: Replacing | null; signal: AbortSignal }>): Promise<Grant | F>
  end(grant: Grant, signal: AbortSignal): Promise<E>
}>

/** The provider's answer that the token it was sent with has ended. */
type Expired = Readonly<{ kind: 'TOKEN_EXPIRED'; native: Native }>

/** The provider ended the renewed token too: the company connects again. */
export type NeedsReauth = Readonly<{ kind: 'NEEDS_REAUTH'; native: Native }>

type State<F extends Failed> =
  | Readonly<{ kind: 'NONE' }>
  | Readonly<{ kind: 'OPEN'; grant: Grant }>
  | Readonly<{ kind: 'OPENING'; done: Promise<Grant | F> }>
  | Readonly<{ kind: 'CLOSED' }>

/** One credential's provider session: a token reused while it lives, renewed before its end, and logged out at `close`. */
export type Session<F extends Failed> = {
  token(signal: AbortSignal): Promise<string | F>
  /**
   * `work` with the token; when the provider ends it, one new token and one repeat, and a second end
   * is NEEDS_REAUTH. A session closed meanwhile opens nothing: the ended token's answer comes back.
   */
  call<T>(
    work: (token: string) => Promise<T | Expired>,
    signal: AbortSignal,
  ): Promise<T | Expired | F | NeedsReauth>
  /** `work` once, never repeated (a write); a token the provider ended is dropped, so the next call opens another. */
  once<T>(
    work: (token: string) => Promise<T | Expired>,
    signal: AbortSignal,
  ): Promise<T | Expired | F>
  /** Ends the live token's session; the session gives no token after. */
  close(signal: AbortSignal): Promise<void>
}

function isGrant<F extends Failed>(value: Grant | F): value is Grant {
  return value.kind === 'TOKEN'
}

function isExpired<T>(value: T | Expired): value is Expired {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    value.kind === 'TOKEN_EXPIRED' &&
    'native' in value
  )
}

/** The session over a token source: `now` is the clock the margin reads. */
export function sessionOf<F extends Failed>(source: TokenSource<F>, now: () => number): Session<F> {
  let state: State<F> =
    source.held === null ? { kind: 'NONE' } : { kind: 'OPEN', grant: source.held }

  /** One opening at a time: whoever asks meanwhile waits for it, and a session closed meanwhile keeps nothing. */
  function opening(start: () => Promise<Grant | F>): Promise<Grant | F> {
    const done = start().then(
      (opened) => {
        if (state.kind === 'OPENING' && state.done === done)
          state = isGrant(opened) ? { kind: 'OPEN', grant: opened } : { kind: 'NONE' }
        return opened
      },
      (error: unknown) => {
        if (state.kind === 'OPENING' && state.done === done) state = { kind: 'NONE' }
        throw error
      },
    )
    state = { kind: 'OPENING', done }
    return done
  }

  function replaced(replacing: Replacing, signal: AbortSignal): Promise<Grant | F> {
    return opening(async () => {
      if (replacing.ended === null) await source.end(replacing.grant, signal)
      return source.open({ replacing, signal })
    })
  }

  function grant(signal: AbortSignal): Promise<Grant | F> {
    switch (state.kind) {
      case 'CLOSED':
        throw new Error('A closed session gives no token')
      case 'OPENING':
        return state.done
      case 'NONE':
        return opening(() => source.open({ replacing: null, signal }))
      case 'OPEN':
        return state.grant.expiresAt - RENEW_BEFORE_MS > now()
          ? Promise.resolve(state.grant)
          : replaced({ grant: state.grant, ended: null }, signal)
      default:
        return state satisfies never
    }
  }

  /** After the provider ended `old`: the token another caller already opened, else a new one. */
  function after(old: Grant, ended: Native, signal: AbortSignal): Promise<Grant | F> {
    if (state.kind === 'OPEN' && state.grant === old) return replaced({ grant: old, ended }, signal)
    return grant(signal)
  }

  return {
    async token(signal) {
      const opened = await grant(signal)
      return isGrant(opened) ? opened.token : opened
    },

    async call(work, signal) {
      const first = await grant(signal)
      if (!isGrant(first)) return first
      const answered = await work(first.token)
      if (!isExpired(answered) || state.kind === 'CLOSED') return answered
      const again = await after(first, answered.native, signal)
      if (!isGrant(again)) return again
      const repeated = await work(again.token)
      return isExpired(repeated) ? { kind: 'NEEDS_REAUTH', native: repeated.native } : repeated
    },

    async once(work, signal) {
      const opened = await grant(signal)
      if (!isGrant(opened)) return opened
      const answered = await work(opened.token)
      if (isExpired(answered) && state.kind === 'OPEN' && state.grant === opened)
        state = { kind: 'NONE' }
      return answered
    },

    async close(signal) {
      const was = state
      state = { kind: 'CLOSED' }
      const live = was.kind === 'OPEN' ? was.grant : was.kind === 'OPENING' ? await was.done : null
      if (live !== null && isGrant(live)) await source.end(live, signal)
    },
  }
}

/** What a sender answers: the provider's answer, or the sender's own failure (not reached, unreadable), passed on as it came. */
export type ProviderSend<F extends Failed> = (
  request: ProviderRequest,
  a: Readonly<{ token: string | null; signal: AbortSignal }>,
) => Promise<ProviderAnswer | F>

/** What a logout came to: done, none declared, the provider's refusal, or the sender's failure. */
export type LoggedOut<F extends Failed> =
  | Readonly<{ kind: 'LOGGED_OUT' | 'NO_LOGOUT' }>
  | Readonly<{ kind: 'REFUSED'; answer: ProviderAnswer }>
  | Readonly<{ kind: 'FAILED'; failure: F }>

/** The login refused the key, or answered what the kit cannot read. */
export type LoginRefused = Readonly<{ kind: 'AUTH_REFUSED' | 'UNREADABLE'; native: Native }>

function isAnswer<F extends Failed>(sent: ProviderAnswer | F): sent is ProviderAnswer {
  return !('kind' in sent)
}

type CredentialsInput<F extends Failed> = Readonly<{
  auth: ClientCredentialsAuth
  credential: Credential
  send: ProviderSend<F>
  now: () => number
}>

/** The tokens of a login by pasted fields: the connector's token request, and its declared logout. */
export function credentialsSource<F extends Failed>(
  input: CredentialsInput<F>,
): TokenSource<F | LoginRefused, LoggedOut<F>> {
  const { auth, credential, send, now } = input
  return {
    held: null,
    async open({ signal }) {
      const sent = await send(tokenRequest(auth, credential), { token: null, signal })
      if (!isAnswer(sent)) return sent
      const read = readToken(auth, sent)
      if (read.kind !== 'OK') return read
      return {
        kind: 'TOKEN',
        token: read.accessToken,
        expiresAt: now() + read.expiresInSeconds * 1000,
      }
    },
    async end(grant, signal) {
      const request = logoutRequest(auth)
      if (request === null) return { kind: 'NO_LOGOUT' }
      const sent = await send(request, { token: grant.token, signal })
      if (!isAnswer(sent)) return { kind: 'FAILED', failure: sent }
      return loggedOutBy(auth, sent) ? { kind: 'LOGGED_OUT' } : { kind: 'REFUSED', answer: sent }
    },
  }
}

/** A session of a login by pasted fields, as the kit's tests open one. */
export function openSession<F extends Failed>(
  input: CredentialsInput<F>,
): Session<F | LoginRefused> {
  return sessionOf(credentialsSource(input), input.now)
}

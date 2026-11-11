import assert from 'node:assert/strict'
import { createHash, randomBytes } from 'node:crypto'
import { z } from 'zod'
import type { ClientCredentialsAuth } from './auth.ts'
import { readToken, tokenRequest } from './auth.ts'
import { SENT_AT } from './conformance-declared.ts'
import type { Connector } from './definition.ts'
import { inProbeOrder } from './definition.ts'
import type { AppKeys, OAuth2CodeAuth } from './oauth.ts'
import { authorizeUrl, codeRequest, readGrant } from './oauth.ts'
import type { Account, Operation, OperationId, ProviderAnswer } from './operation.ts'
import { requestOf } from './operation.ts'
import { toRequest } from './request.ts'

export type Serving = Readonly<{
  handle(request: Request): Promise<Response>
  serve(): Promise<Readonly<{ origin: string; close(): Promise<void> }>> // node:http on 127.0.0.1
}>

/** A provider double for a login by pasted fields. */
export type CredentialFake = Serving & Readonly<{ credential: Readonly<Record<string, string>> }> // invented values only (S40)

/** A provider double for an OAuth login: its `/authorization` answers 302 to `redirectUri` with `code` and `state`. */
export type OAuthFake = Serving & Readonly<{ app: AppKeys; redirectUri: string }> // invented values only (S40)

export type Fake = CredentialFake | OAuthFake

export async function answerOf(response: Response): Promise<ProviderAnswer> {
  const text = await response.text()
  return {
    status: response.status,
    body: text === '' ? undefined : z.unknown().parse(JSON.parse(text)),
  }
}

export async function loginWith(
  connector: Connector,
  auth: ClientCredentialsAuth,
  fake: Serving,
  credential: Readonly<Record<string, string>>,
) {
  const request = toRequest(connector, tokenRequest(auth, credential), null)
  return readToken(auth, await answerOf(await fake.handle(request)))
}

export function verifierAndChallenge() {
  const verifier = randomBytes(32).toString('base64url')
  return { verifier, challenge: createHash('sha256').update(verifier).digest('base64url') }
}

/** The person's trip through the double: the authorization page answers 302 to the redirect with the code and our state. */
export async function consent(
  auth: OAuth2CodeAuth,
  connector: Connector,
  fake: OAuthFake,
  challenge: string,
): Promise<string> {
  const state = 'company.sign-in'
  const url = authorizeUrl(
    auth,
    { clientId: fake.app.clientId, redirectUri: fake.redirectUri, state, challenge },
    connector.origin,
  )
  const page = await fake.handle(new Request(url, { redirect: 'manual' }))
  assert.equal(page.status, 302, 'the authorization page redirects')
  const back = new URL(page.headers.get('location') ?? '')
  assert.equal(`${back.origin}${back.pathname}`, fake.redirectUri)
  assert.equal(back.searchParams.get('state'), state)
  const code = back.searchParams.get('code')
  assert.ok(code, 'the redirect carries a code')
  return code
}

export async function exchange(
  auth: OAuth2CodeAuth,
  connector: Connector,
  fake: OAuthFake,
  a: Readonly<{ code: string; verifier: string }>,
) {
  const request = toRequest(
    connector,
    codeRequest(auth, fake.app, { ...a, redirectUri: fake.redirectUri }),
    null,
  )
  return readGrant(auth, await answerOf(await fake.handle(request)))
}

/** The access token and the account every read is built with. */
export type Session = Readonly<{ accessToken: string; account: Account }>

/** The whole way in: for pasted fields the login; for OAuth the page, the exchange and the question of whose account it is. */
export async function signIn(connector: Connector, fake: Fake): Promise<Session | null> {
  const { auth, account } = connector
  if (auth.kind === 'client_credentials' && 'credential' in fake) {
    const token = await loginWith(connector, auth, fake, fake.credential)
    assert.equal(token.kind, 'OK')
    return token.kind === 'OK' ? { accessToken: token.accessToken, account: { ref: null } } : null
  }
  assert.ok(auth.kind === 'oauth2_code' && 'app' in fake, 'the fake matches the login')
  if (auth.kind !== 'oauth2_code' || !('app' in fake)) return null
  const { verifier, challenge } = verifierAndChallenge()
  const code = await consent(auth, connector, fake, challenge)
  const granted = await exchange(auth, connector, fake, { code, verifier })
  assert.equal(granted.kind, 'OK')
  if (granted.kind !== 'OK') return null
  if (account.kind === 'none') return { accessToken: granted.accessToken, account: { ref: null } }
  const who = await answerOf(
    await fake.handle(
      toRequest(
        connector,
        { method: 'GET', path: account.who.path, query: {}, body: undefined },
        granted.accessToken,
      ),
    ),
  )
  assert.equal(who.status, 200)
  const reported = account.who.answer.parse(who.body)
  return { accessToken: granted.accessToken, account: { ref: reported.ref } }
}

/** Each probe in order, asked of the double and answered `OK`; `visit` sees the raw answer and its value, and a later probe reads the value from `earlier`. */
export async function answeredEach(
  connector: Connector,
  fake: Fake,
  visit: (a: {
    operation: Operation<unknown, unknown>
    input: unknown
    session: Session
    earlier: ReadonlyMap<OperationId, unknown>
    raw: ProviderAnswer
    value: unknown
  }) => Promise<void>,
): Promise<void> {
  await eachProbe(connector, fake, async (probe) => {
    const raw = await askOf(connector, fake, probe.session, probe)
    const answered = probe.operation.answer(raw)
    assert.equal(answered.kind, 'OK', probe.operation.id)
    if (answered.kind !== 'OK') return undefined
    await visit({ ...probe, raw, value: answered.value })
    return answered.value
  })
}

/** One call of an operation as the conformance makes it: the request the kit builds from `input`, sent to the double. */
export async function askOf(
  connector: Connector,
  fake: Fake,
  session: Session,
  a: Readonly<{ operation: Operation<unknown, unknown>; input: unknown }>,
): Promise<ProviderAnswer> {
  const request = toRequest(
    connector,
    requestOf(a.operation, a.input, session.account, SENT_AT),
    session.accessToken,
  )
  return answerOf(await fake.handle(request))
}

/**
 * Each operation of the connector in probe order, signed in once: the visitor gets the operation, the
 * input its probe builds from what the earlier ones read, and the session, and returns the value it read
 * (kept for the later probes) or undefined.
 */
export async function eachProbe(
  connector: Connector,
  fake: Fake,
  visit: (a: {
    operation: Operation<unknown, unknown>
    input: unknown
    session: Session
    earlier: ReadonlyMap<OperationId, unknown>
  }) => Promise<unknown>,
): Promise<void> {
  const session = await signIn(connector, fake)
  if (session === null) return
  const earlier = new Map<OperationId, unknown>()
  for (const operation of inProbeOrder(connector)) {
    const input = operation.probe(earlier)
    assert.notEqual(input, null, `${operation.id} has a probe the fake can answer`)
    const read = await visit({ operation, input, session, earlier })
    if (read !== undefined) earlier.set(operation.id, read)
  }
}

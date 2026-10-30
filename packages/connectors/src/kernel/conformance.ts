import assert from 'node:assert/strict'
import { createHash, randomBytes } from 'node:crypto'
import { describe, it } from 'node:test'
import { z } from 'zod'
import type { ClientCredentialsAuth } from './auth.ts'
import { readToken, tokenRequest } from './auth.ts'
import type { Connector } from './definition.ts'
import { inProbeOrder } from './definition.ts'
import { logoProblems } from './logo.ts'
import type { AppKeys, OAuth2CodeAuth } from './oauth.ts'
import { authorizeUrl, codeRequest, readGrant } from './oauth.ts'
import type { Account, Operation, OperationId, ProviderAnswer } from './operation.ts'
import { OPERATION_CLASSES, requestOf } from './operation.ts'
import { toRequest } from './request.ts'

type Serving = Readonly<{
  handle(request: Request): Promise<Response>
  serve(): Promise<Readonly<{ origin: string; close(): Promise<void> }>> // node:http on 127.0.0.1
}>

/** A provider double for a login by pasted fields. */
export type CredentialFake = Serving & Readonly<{ credential: Readonly<Record<string, string>> }> // invented values only (S40)

/** A provider double for an OAuth login: its `/authorization` answers 302 to `redirectUri` with `code` and `state`. */
export type OAuthFake = Serving & Readonly<{ app: AppKeys; redirectUri: string }> // invented values only (S40)

export type Fake = CredentialFake | OAuthFake

async function answerOf(response: Response): Promise<ProviderAnswer> {
  const text = await response.text()
  return {
    status: response.status,
    body: text === '' ? undefined : z.unknown().parse(JSON.parse(text)),
  }
}

async function loginWith(
  connector: Connector,
  auth: ClientCredentialsAuth,
  fake: Serving,
  credential: Readonly<Record<string, string>>,
) {
  const request = toRequest(connector, tokenRequest(auth, credential), null)
  return readToken(auth, await answerOf(await fake.handle(request)))
}

function verifierAndChallenge() {
  const verifier = randomBytes(32).toString('base64url')
  return { verifier, challenge: createHash('sha256').update(verifier).digest('base64url') }
}

/** The person's trip through the double: the authorization page answers 302 to the redirect with the code and our state. */
async function consent(
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

async function exchange(
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
type Session = Readonly<{ accessToken: string; account: Account }>

/** The whole way in: for pasted fields the login; for OAuth the page, the exchange and the question of whose account it is. */
async function signIn(connector: Connector, fake: Fake): Promise<Session | null> {
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

/** Every request the probes build, as text: the URL, the headers and the body. */
async function textOf(request: Request): Promise<string> {
  const headers = [...request.headers].map(([name, value]) => `${name}:${value}`).join('\n')
  return `${request.url}\n${headers}\n${await request.clone().text()}`
}

/** The `earlier` a probe gets, noting each key it asks for. */
class Watched extends Map<OperationId, unknown> {
  readonly asked = new Set<OperationId>()
  override get(key: OperationId) {
    this.asked.add(key)
    return super.get(key)
  }
  override has(key: OperationId) {
    this.asked.add(key)
    return super.has(key)
  }
}

/** The probe reads only the sources it declares, and has nothing to read when any one is missing. */
function assertSources(
  operation: Operation<unknown, unknown>,
  earlier: ReadonlyMap<OperationId, unknown>,
): void {
  const watched = new Watched(earlier)
  operation.probe(watched)
  for (const key of watched.asked)
    assert.ok(operation.from.includes(key), `${operation.id} reads ${key} without declaring it`)
  for (const source of operation.from) {
    const missing = new Map(earlier)
    missing.delete(source)
    assert.equal(operation.probe(missing), null, `${operation.id} without ${source}`)
  }
}

/** Each probe, in order, from the sources it declares, answered with the value its output schema reads from the body. */
async function answerInOrder(connector: Connector, fake: Fake): Promise<void> {
  const session = await signIn(connector, fake)
  if (session === null) return
  const earlier = new Map<OperationId, unknown>()
  for (const operation of inProbeOrder(connector)) {
    assertSources(operation, earlier)
    const input = operation.probe(earlier)
    assert.notEqual(input, null, `${operation.id} has a probe the fake can answer`)
    const request = toRequest(
      connector,
      requestOf(operation, input, session.account),
      session.accessToken,
    )
    const raw = await answerOf(await fake.handle(request))
    const answered = operation.answer(raw)
    assert.equal(answered.kind, 'OK', operation.id)
    if (answered.kind !== 'OK') continue
    // A ready operation's `output` reads the body itself; a door entry's is the shape of the
    // value its answer takes out of an envelope, so the value is what it must accept.
    if (connector.operations.includes(operation))
      assert.deepEqual(operation.output.parse(raw.body), answered.value, operation.id)
    else assert.ok(operation.output.safeParse(answered.value).success, operation.id)
    earlier.set(operation.id, answered.value)
  }
}

/** The ids, the version and the skill: one part per subject, naming each of its operations. */
function assertDeclared(connector: Connector): void {
  const all = inProbeOrder(connector)
  assert.equal(new Set(all.map((operation) => operation.id)).size, all.length)
  assert.match(connector.version, /^\d+\.\d+\.\d+$/)
  const { content, references } = connector.skill
  for (const [subject, label] of Object.entries(connector.subjects)) {
    assert.ok(content.includes(subject) && content.includes(label), `SKILL.md names ${subject}`)
    const operations = connector.operations.filter((operation) => operation.subject === subject)
    if (operations.length === 0) continue // the door's entries are named in SKILL.md itself
    const part = references[`${subject}.md`]
    assert.ok(part, `${subject} has a part of the skill`)
    for (const operation of operations)
      assert.ok(part.includes(operation.id), `${subject}.md names ${operation.id}`)
  }
  for (const operation of Object.values(connector.readDoor ?? {}))
    assert.ok(content.includes(operation.id), operation.id)
  assert.ok(
    content.split('\n').length < 500,
    'SKILL.md stays under the 500 lines Mastra recommends',
  )
}

/** The account, the catalog's facts, the logo and, for pasted fields, where each key comes from. */
function assertShown(connector: Connector): void {
  assert.ok(connector.account.kind, 'the account')
  assert.ok(connector.category.length > 0, 'a category')
  assert.ok(connector.summary.length > 0 && !connector.summary.includes('\n'), 'a summary line')
  assert.deepEqual(logoProblems(connector.logo), [], 'the logo')
  if (connector.auth.kind !== 'client_credentials') return
  for (const [name, field] of Object.entries(connector.auth.fields)) {
    const { text, url } = field.help
    assert.ok(text.length > 0 && !text.includes('\n'), `${name} has a line of help`)
    assert.ok(URL.canParse(url) && new URL(url).protocol === 'https:', `${name} help url`)
  }
}

/** Wrong fields are refused at the login; for OAuth a wrong verifier is, and the code is spent by the try. */
async function assertWrongKeyRefused(connector: Connector, fake: Fake): Promise<void> {
  const { auth } = connector
  if (auth.kind === 'client_credentials' && 'credential' in fake) {
    const wrong = Object.fromEntries(
      Object.keys(fake.credential).map((name) => [name, 'wrong-value']),
    )
    assert.equal((await loginWith(connector, auth, fake, wrong)).kind, 'AUTH_REFUSED')
    return
  }
  assert.ok(auth.kind === 'oauth2_code' && 'app' in fake)
  if (auth.kind !== 'oauth2_code' || !('app' in fake)) return
  const { verifier, challenge } = verifierAndChallenge()
  const code = await consent(auth, connector, fake, challenge)
  const wrong = await exchange(auth, connector, fake, { code, verifier: 'wrong-verifier' })
  assert.equal(wrong.kind, 'GRANT_REFUSED')
  const used = await exchange(auth, connector, fake, { code, verifier })
  assert.notEqual(used.kind, 'OK', 'a code that failed once is spent')
}

/** No read carries a secret: the request each probe builds, with the account the sign-in reported. */
async function assertReadsLeakNothing(
  connector: Connector,
  values: readonly string[],
  account: Account,
): Promise<void> {
  for (const operation of inProbeOrder(connector)) {
    const input = operation.probe(new Map())
    if (input === null) continue
    const text = await textOf(toRequest(connector, requestOf(operation, input, account), 'bearer'))
    for (const value of values)
      assert.ok(!text.includes(value), `${operation.id} leaks a credential value`)
  }
}

/** The authorization page has no secret and the exchange has it. */
async function assertSecretOnlyInExchange(
  auth: OAuth2CodeAuth,
  connector: Connector,
  fake: OAuthFake,
): Promise<void> {
  const { app, redirectUri } = fake
  const page = authorizeUrl(
    auth,
    { clientId: app.clientId, redirectUri, state: 's', challenge: 'c' },
    connector.origin,
  )
  const sent = toRequest(
    connector,
    codeRequest(auth, app, { code: 'c', redirectUri, verifier: 'v' }),
    null,
  )
  const text = await textOf(sent)
  assert.ok(!page.href.includes(app.clientSecret))
  assert.ok(text.includes(app.clientSecret))
}

/** The secret rides only in the login or the exchange: not in a read and not in the authorization page. */
async function assertNoCredentialLeak(connector: Connector, fake: Fake): Promise<void> {
  const { auth } = connector
  const values = 'credential' in fake ? Object.values(fake.credential) : [fake.app.clientSecret]
  const account = (await signIn(connector, fake))?.account ?? { ref: null }
  await assertReadsLeakNothing(connector, values, account)
  if (auth.kind === 'oauth2_code' && 'app' in fake)
    await assertSecretOnlyInExchange(auth, connector, fake)
  if (auth.kind === 'client_credentials' && 'credential' in fake) {
    const login = await textOf(toRequest(connector, tokenRequest(auth, fake.credential), null))
    for (const value of values) assert.ok(login.includes(value))
  }
}

/** What every connector passes, against its fake, with no network (node:test describe/it). */
export function runConformance(connector: Connector, fake: Fake): void {
  describe(connector.id, () => {
    it('declares unique ids, a semver version and subjects that each have an operation and a part of the skill', () => {
      assertDeclared(connector)
    })

    it('declares the account, what the catalog shows and where each key comes from', () => {
      assertShown(connector)
    })

    it('gives each operation a class, a summary and a probe, and each read idempotent', () => {
      for (const operation of inProbeOrder(connector)) {
        assert.ok(OPERATION_CLASSES.includes(operation.class), operation.id)
        assert.ok(operation.summary.length > 0 && operation.label.length > 0, operation.id)
        assert.equal(typeof operation.probe, 'function', operation.id)
        if (operation.class === 'read') assert.equal(operation.idempotent, true, operation.id)
      }
    })

    it('answers each probe, in order, from the sources it declares, with the value its output schema reads from the body', async () => {
      await answerInOrder(connector, fake)
    })

    it('refuses a wrong key at the login', async () => {
      await assertWrongKeyRefused(connector, fake)
    })

    it('puts no credential value in any request but the login', async () => {
      await assertNoCredentialLeak(connector, fake)
    })
  })
}

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { tokenRequest } from './auth.ts'
import { assertDeclaredByProvider, SENT_AT } from './conformance-declared.ts'
import { assertListsWalk } from './conformance-list.ts'
import type { Fake, OAuthFake } from './conformance-session.ts'
import {
  answeredEach,
  consent,
  exchange,
  loginWith,
  signIn,
  verifierAndChallenge,
} from './conformance-session.ts'
import type { Connector } from './definition.ts'
import { inProbeOrder } from './definition.ts'
import { logoProblems } from './logo.ts'
import type { OAuth2CodeAuth } from './oauth.ts'
import { authorizeUrl, codeRequest } from './oauth.ts'
import type { Account, Operation, OperationId } from './operation.ts'
import { OPERATION_CLASSES, requestOf, valueAt } from './operation.ts'
import { findUndeclared, personalRowsOf } from './personal.ts'
import { toRequest } from './request.ts'

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

/** Each declared personal path is in a row of the double's answer, and no CPF, e-mail or phone sits outside them. */
export function assertPersonal(operation: Operation<unknown, unknown>, value: unknown): void {
  const declared = operation.personal ?? []
  const rows = personalRowsOf(value)
  for (const { path } of declared)
    assert.ok(
      rows.some((row) => valueAt(row, path) !== undefined),
      `${operation.id} declares ${path}, which no row of the double carries`,
    )
  const undeclared = findUndeclared(value, declared).map(({ path, kind }) => `${kind} at ${path}`)
  assert.deepEqual(
    undeclared,
    [],
    `${operation.id} carries what it does not declare: ${undeclared.join('; ')}`,
  )
}

/** Each probe, in order, from the sources it declares, answered with the value its output schema reads from the body. */
async function answerInOrder(connector: Connector, fake: Fake): Promise<void> {
  await answeredEach(connector, fake, async ({ operation, earlier, raw, value }) => {
    assertSources(operation, earlier)
    // A ready operation's `output` reads the body itself; a door entry's is the shape of the
    // value its answer takes out of an envelope, so the value is what it must accept.
    if (connector.operations.includes(operation)) {
      assert.deepEqual(operation.output.parse(raw.body), value, operation.id)
      assertPersonal(operation, value)
    } else assert.ok(operation.output.safeParse(value).success, operation.id)
  })
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

/** Each write is a `write` that never repeats, builds a POST from its probe's input, and is no read of the connector. */
function assertWrites(connector: Connector): void {
  for (const operation of connector.writes ?? []) {
    assert.equal(operation.class, 'write', operation.id)
    assert.equal(operation.idempotent, false, `${operation.id} never repeats`)
    assert.deepEqual(operation.from, [], `${operation.id} reads nothing earlier`)
    const input = operation.probe(new Map())
    assert.notEqual(input, null, `${operation.id} has a probe`)
    assert.equal(requestOf(operation, input, { ref: null }, SENT_AT).method, 'POST', operation.id)
  }
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
  for (const operation of [...inProbeOrder(connector), ...(connector.writes ?? [])]) {
    const input = operation.probe(new Map())
    if (input === null) continue
    const text = await textOf(
      toRequest(connector, requestOf(operation, input, account, SENT_AT), 'bearer'),
    )
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

    it('declares each write as a write that never repeats', () => {
      assertWrites(connector)
    })

    it('reads each recorded refusal, puts the mark of each write in its request and names as fixed only fields of the input', () => {
      assertDeclaredByProvider(connector)
    })

    it('answers each probe, in order, from the sources it declares, with the value its output schema reads from the body', async () => {
      await answerInOrder(connector, fake)
    })

    it('walks every page of each list read of the double, each row once', async () => {
      await assertListsWalk(connector, fake)
    })

    it('refuses a wrong key at the login', async () => {
      await assertWrongKeyRefused(connector, fake)
    })

    it('puts no credential value in any request but the login', async () => {
      await assertNoCredentialLeak(connector, fake)
    })
  })
}

import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { promisify } from 'node:util'
import { Email } from '@conexus/hub-api'
import { createHub, identityOf, operationsOf } from '../../main.ts'
import type { TestDatabase } from '../../platform/test-database.ts'
import {
  createTestDatabase,
  serveEnvironment,
  silent,
  testConfig,
  WRITE_HEADERS,
} from '../../platform/test-database.ts'
import { createStatus } from '../status/public.ts'

const run = promisify(execFile)
const _ROOT = join(import.meta.dirname, '..', '..', '..', '..', '..')
const MAIN = join(import.meta.dirname, '..', '..', 'main.ts')
const ANA = { name: 'Ana Lima', email: 'ana@example.test' }
const LINK = /^https:\/\/hub\.example\.test\/set-password#token=([A-Za-z0-9]+)$/m

async function firstPerson(
  t: TestContext,
  test: TestDatabase,
  person: { name: string; email: string },
) {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-summary-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const summary = join(dir, 'summary.md')
  writeFileSync(summary, '')
  const args = [
    MAIN,
    'first-person',
    '--name',
    person.name,
    '--email',
    person.email,
    '--summary',
    summary,
  ]
  const env = serveEnvironment(t, test.runtimeUrl, 1)
  const result = await run(process.execPath, args, { env, timeout: 60_000 }).then(
    (output) => ({ code: 0, ...output }),
    (error: { code: number; stdout: string; stderr: string }) => error,
  )
  return {
    code: result.code,
    output: `${result.stdout}${result.stderr}`,
    summary: readFileSync(summary, 'utf8'),
  }
}

function tokenOf(summary: string): string {
  const match = summary.match(LINK)
  assert.ok(match?.[1], summary)
  return match[1]
}

async function hubOn(t: TestContext, test: TestDatabase) {
  const config = testConfig(test.runtimeUrl)
  const status = createStatus({ version: config.version, database: test.database })
  const identity = identityOf({ database: test.database, config, log: silent })
  const operations = operationsOf(test.database, identity)
  const app = await createHub(config, { status, identity, operations })
  t.after(() => app.close())
  return app
}

function setPassword(
  app: Awaited<ReturnType<typeof hubOn>>,
  body: unknown,
  headers: Record<string, string> = WRITE_HEADERS,
) {
  return app.inject({
    method: 'PUT',
    url: '/api/passwords',
    headers,
    payload: JSON.stringify(body),
  })
}

function signIn(app: Awaited<ReturnType<typeof hubOn>>, password: string) {
  return app.inject({
    method: 'PUT',
    url: '/api/sessions/current',
    headers: WRITE_HEADERS,
    payload: JSON.stringify({ email: ANA.email, password }),
  })
}

function codeOf(response: { json(): unknown }): unknown {
  return Object(response.json()).code
}

test('sem pessoa: cria a pessoa sem senha, administradora da instalação, e grava o link no resumo; nenhuma linha de registro traz o token', async (t) => {
  const test = await createTestDatabase(t)
  const created = await firstPerson(t, test, ANA)
  assert.equal(created.code, 0, created.output)
  const token = tokenOf(created.summary)
  assert.match(
    created.summary,
    /^Link para Ana Lima criar a senha do Conexus\. Vale 15 minutos e uma vez só\.$/m,
  )
  assert.match(created.output, /"msg":"FIRST_PERSON_LINK_GIVEN"/)
  assert.doesNotMatch(created.output, new RegExp(token))
  assert.doesNotMatch(created.output, /ana@example\.test/)
  const people = await test.asOwner(`select u.name, u.email, u.role, count(a.id)::int as accounts
    from auth.user u left join auth.account a on a.user_id = u.id group by u.id`)
  assert.deepEqual(people, [
    { name: 'Ana Lima', email: 'ana@example.test', role: 'admin', accounts: 0 },
  ])
})

test('com a pessoa ainda sem senha, dá um link novo e o antigo deixa de valer', async (t) => {
  const test = await createTestDatabase(t)
  const old = tokenOf((await firstPerson(t, test, ANA)).summary)
  const again = await firstPerson(t, test, ANA)
  assert.equal(again.code, 0, again.output)
  const fresh = tokenOf(again.summary)
  const app = await hubOn(t, test)
  assert.equal(
    codeOf(await setPassword(app, { token: old, password: 'senha-nova-1' })),
    'PASSWORD_LINK_INVALID',
  )
  assert.equal((await setPassword(app, { token: fresh, password: 'senha-nova-1' })).statusCode, 204)
})

test('com outro e-mail, ou com a pessoa já com senha: sai com 1, FIRST_PERSON_EXISTS e a frase no resumo', async (t) => {
  const test = await createTestDatabase(t)
  const app = await hubOn(t, test)
  const token = tokenOf((await firstPerson(t, test, ANA)).summary)
  const other = await firstPerson(t, test, { name: 'Bruno Reis', email: 'bruno@example.test' })
  assert.equal((await setPassword(app, { token, password: 'senha-nova-1' })).statusCode, 204)
  const same = await firstPerson(t, test, ANA)
  for (const refused of [other, same]) {
    assert.equal(refused.code, 1)
    assert.match(refused.output, /"msg":"FIRST_PERSON_EXISTS"/)
    assert.equal(refused.summary, 'Já existe uma pessoa nesta instalação.\n')
  }
  assert.deepEqual(await test.asOwner('select count(*)::int as people from auth.user'), [
    { people: 1 },
  ])
})

test('senha pelo link: 204 e a pessoa entra; nenhuma coluna guarda o token; o mesmo token ou o valor guardado no banco, 422', async (t) => {
  const test = await createTestDatabase(t)
  const app = await hubOn(t, test)
  const token = tokenOf((await firstPerson(t, test, ANA)).summary)
  const short = await setPassword(app, { token, password: 'curta' })
  assert.equal(short.statusCode, 400)
  assert.equal(codeOf(short), 'REQUEST_MALFORMED')
  const stored = await test.asOwner('select identifier, value from auth.verification')
  // A copy of the database alone opens nothing: the token is stored only as its hash (S16).
  assert.deepEqual(
    stored.filter((row) => `${String(row.identifier)} ${String(row.value)}`.includes(token)),
    [],
  )
  for (const row of stored) {
    for (const guess of [String(row.identifier), String(row.value)]) {
      assert.equal(
        codeOf(await setPassword(app, { token: guess, password: 'senha-nova-1' })),
        'PASSWORD_LINK_INVALID',
      )
    }
  }
  const set = await setPassword(app, { token, password: 'senha-nova-1' })
  assert.equal(set.statusCode, 204)
  assert.equal(set.body, '')
  assert.equal((await signIn(app, 'senha-nova-1')).statusCode, 200)
  const reused = await setPassword(app, { token, password: 'outra-senha-1' })
  assert.equal(reused.statusCode, 422)
  assert.deepEqual(
    { ...Object(reused.json()), traceId: undefined },
    {
      type: 'urn:conexus:problem:PASSWORD_LINK_INVALID',
      title: 'Este link já foi usado ou venceu.',
      status: 422,
      code: 'PASSWORD_LINK_INVALID',
      traceId: undefined,
    },
  )
})

test('senha pelo link: o link vencido, 422 PASSWORD_LINK_INVALID', async (t) => {
  const test = await createTestDatabase(t)
  const app = await hubOn(t, test)
  const token = tokenOf((await firstPerson(t, test, ANA)).summary)
  await test.asOwner(`update auth.verification set expires_at = now() - interval '1 second'`)
  const late = await setPassword(app, { token, password: 'senha-nova-1' })
  assert.equal(late.statusCode, 422)
  assert.equal(codeOf(late), 'PASSWORD_LINK_INVALID')
})

const REFUSALS: [string, Record<string, string | null>, number, string][] = [
  ['origem: sem Origin', { origin: null }, 403, 'REQUEST_ORIGIN_REFUSED'],
  [
    'origem: de outro site',
    { origin: 'https://other.example.test' },
    403,
    'REQUEST_ORIGIN_REFUSED',
  ],
  ['origem: cross-site', { 'sec-fetch-site': 'cross-site' }, 403, 'REQUEST_ORIGIN_REFUSED'],
  [
    'mídia: formulário',
    { 'content-type': 'application/x-www-form-urlencoded' },
    415,
    'REQUEST_MEDIA_TYPE_REFUSED',
  ],
  [
    'mídia: multipart',
    { 'content-type': 'multipart/form-data; boundary=x' },
    415,
    'REQUEST_MEDIA_TYPE_REFUSED',
  ],
  ['mídia: text/plain', { 'content-type': 'text/plain' }, 415, 'REQUEST_MEDIA_TYPE_REFUSED'],
  ['endereço: sem cf-connecting-ip', { 'cf-connecting-ip': null }, 400, 'REQUEST_MALFORMED'],
]
for (const [name, change, status, code] of REFUSALS) {
  test(`${name}: PUT /api/passwords, ${status} ${code}, e o link continua valendo`, async (t) => {
    const test = await createTestDatabase(t)
    const app = await hubOn(t, test)
    const token = tokenOf((await firstPerson(t, test, ANA)).summary)
    const headers: Record<string, string> = {}
    for (const [header, value] of Object.entries({ ...WRITE_HEADERS, ...change })) {
      if (value !== null) headers[header] = value
    }
    const refused = await setPassword(app, { token, password: 'senha-nova-1' }, headers)
    assert.equal(refused.statusCode, status)
    assert.equal(codeOf(refused), code)
    assert.equal((await setPassword(app, { token, password: 'senha-nova-1' })).statusCode, 204)
  })
}

test('mídia: JSON inválido 400 e corpo acima de 4 KiB 413 em PUT /api/passwords', async (t) => {
  const test = await createTestDatabase(t)
  const app = await hubOn(t, test)
  const cases: [string, number, string][] = [
    ['{"token":', 400, 'REQUEST_MALFORMED'],
    [
      JSON.stringify({ token: 'x'.repeat(4200), password: 'senha-nova-1' }),
      413,
      'REQUEST_TOO_LARGE',
    ],
  ]
  for (const [payload, status, code] of cases) {
    const response = await app.inject({
      method: 'PUT',
      url: '/api/passwords',
      headers: WRITE_HEADERS,
      payload,
    })
    assert.equal(response.statusCode, status)
    assert.equal(codeOf(response), code)
  }
})

function identityOn(test: TestDatabase) {
  return identityOf({
    database: test.database,
    config: testConfig(test.runtimeUrl),
    log: silent,
  })
}

test('ao mesmo tempo, com dois e-mails: uma pessoa só, e a outra chamada recusa FIRST_PERSON_EXISTS', async (t) => {
  const test = await createTestDatabase(t)
  const runs = await Promise.allSettled([
    identityOn(test).firstPerson({ name: ANA.name, email: Email.parse(ANA.email) }),
    identityOn(test).firstPerson({ name: 'Bruno Reis', email: Email.parse('bruno@example.test') }),
  ])
  assert.deepEqual(runs.map((run) => run.status).sort(), ['fulfilled', 'rejected'])
  const refused = runs.find((run) => run.status === 'rejected')
  assert.equal(Object(refused?.reason).code, 'FIRST_PERSON_EXISTS')
  assert.deepEqual(await test.asOwner('select count(*)::int as people from auth.user'), [
    { people: 1 },
  ])
})

test('ao mesmo tempo, a mesma pessoa duas vezes: uma pessoa e um só link que vale', async (t) => {
  const test = await createTestDatabase(t)
  const person = { name: ANA.name, email: Email.parse(ANA.email) }
  const links = await Promise.all([
    identityOn(test).firstPerson(person),
    identityOn(test).firstPerson(person),
  ])
  assert.deepEqual(await test.asOwner('select count(*)::int as people from auth.user'), [
    { people: 1 },
  ])
  assert.deepEqual(await test.asOwner('select count(*)::int as links from auth.verification'), [
    { links: 1 },
  ])
  const app = await hubOn(t, test)
  const answers = []
  for (const { link } of links) {
    const token = link.split('#token=')[1]
    answers.push((await setPassword(app, { token, password: 'senha-nova-1' })).statusCode)
  }
  assert.deepEqual(answers.sort(), [204, 422])
})

test('sem poder gravar o link, a pessoa também não fica: uma só unidade de trabalho', async (t) => {
  const test = await createTestDatabase(t)
  await test.asOwner('revoke insert on auth.verification from hub_runtime')
  await assert.rejects(
    identityOn(test).firstPerson({ name: ANA.name, email: Email.parse(ANA.email) }),
  )
  assert.deepEqual(await test.asOwner('select count(*)::int as people from auth.user'), [
    { people: 0 },
  ])
})

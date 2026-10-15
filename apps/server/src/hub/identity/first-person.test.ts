import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { promisify } from 'node:util'
import { createHub } from '../../main.ts'
import type { TestDatabase } from '../../platform/test-database.ts'
import {
  createTestDatabase,
  serveEnvironment,
  TEST_ORIGIN,
  testConfig,
} from '../../platform/test-database.ts'
import { createStatus } from '../status/public.ts'
import { createIdentity } from './public.ts'

const run = promisify(execFile)
const _ROOT = join(import.meta.dirname, '..', '..', '..', '..', '..')
const MAIN = join(import.meta.dirname, '..', '..', 'main.ts')
const silent = { info: () => undefined, error: () => undefined }
const ANA = { name: 'Ana Lima', email: 'ana@example.test' }
const LINK = /^https:\/\/hub\.example\.test\/set-password#token=([A-Za-z0-9]+)$/m
const WRITE = {
  origin: TEST_ORIGIN,
  'content-type': 'application/json',
  'cf-connecting-ip': '203.0.113.7',
}

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
  const identity = createIdentity({ database: test.database, config, log: silent })
  const app = await createHub(config, { status, identity })
  t.after(() => app.close())
  return app
}

function setPassword(
  app: Awaited<ReturnType<typeof hubOn>>,
  body: unknown,
  headers: Record<string, string> = WRITE,
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
    headers: WRITE,
    payload: JSON.stringify({ email: ANA.email, password }),
  })
}

function codeOf(response: { json(): unknown }): unknown {
  return Object(response.json()).code
}

test('sem pessoa: cria a pessoa sem senha e grava o link no resumo; nenhuma linha de registro traz o token', async (t) => {
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
  const people = await test.asOwner(`select u.name, u.email, count(a.id)::int as accounts
    from auth.user u left join auth.account a on a.user_id = u.id group by u.id`)
  assert.deepEqual(people, [{ name: 'Ana Lima', email: 'ana@example.test', accounts: 0 }])
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

test('senha pelo link: 204 e a pessoa entra; o mesmo token, o vencido ou o valor guardado no banco, 422', async (t) => {
  const test = await createTestDatabase(t)
  const app = await hubOn(t, test)
  const token = tokenOf((await firstPerson(t, test, ANA)).summary)
  const short = await setPassword(app, { token, password: 'curta' })
  assert.equal(short.statusCode, 422)
  assert.equal(codeOf(short), 'PASSWORD_TOO_SHORT')
  const stored = await test.asOwner('select identifier, value from auth.verification')
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
    for (const [header, value] of Object.entries({ ...WRITE, ...change })) {
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
      headers: WRITE,
      payload,
    })
    assert.equal(response.statusCode, status)
    assert.equal(codeOf(response), code)
  }
})

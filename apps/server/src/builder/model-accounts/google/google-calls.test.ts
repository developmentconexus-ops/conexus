import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { CompanyId, PersonId } from '@conexus/hub-api'
import { testCliProxy } from '../../../platform/test-cliproxy-binary.ts'
import { createTestDatabase, testConfig } from '../../../platform/test-database.ts'
import { testCredential, testOpened, testSealed } from '../../../platform/test-seal.ts'
import { openGoogleCalls } from '../public.ts'

type Account = Parameters<ReturnType<typeof openGoogleCalls>['googleCalls']>[0]

const COMPANY = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const ANA = PersonId.parse('person-a')
const SCOPE = { kind: 'COMPANY', companyId: COMPANY, personId: ANA } as const
const LOGIN = JSON.stringify({
  type: 'antigravity',
  access_token: 'ya29.first',
  refresh_token: 'r1',
})
const REFRESHED = JSON.stringify({
  type: 'antigravity',
  access_token: 'ya29.second',
  refresh_token: 'r1',
})

type Run = { pid: number; dir: string }

function runsOf(control: string): Run[] {
  const file = join(control, 'runs')
  if (!existsSync(file)) return []
  return readFileSync(file, 'utf8')
    .trim()
    .split('\n')
    .map((line) => ({ pid: Number(line.split(' ')[0]), dir: line.split(' ')[1] ?? '' }))
}

function alive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

async function setup(
  t: TestContext,
  idleMs?: number,
  cliProxy: Omit<ReturnType<typeof testCliProxy>, 'control'> = testCliProxy(),
) {
  const double = testCliProxy()
  rmSync(join(double.control, 'runs'), { force: true })
  rmSync(join(double.control, 'mode'), { force: true })
  const test = await createTestDatabase(t)
  const { database, asOwner } = test
  const { sealKeys } = testConfig(test.runtimeUrl)
  // The context the account's row is sealed under (S32): its id, owner, kind and provider.
  function contextOf(account: { id: string; personId: string | null }) {
    return {
      purpose: 'model-account',
      rowId: account.id,
      companyId: COMPANY,
      personId: account.personId,
      kind: 'google_cliproxy',
      provider: 'google',
    } as const
  }
  await asOwner(`
    insert into auth."user"(id, name, email) values ('person-a', 'Ana', 'ana@example.test');
    insert into auth.company(id, name, slug, created_at, attempt_key)
      values ('${COMPANY}', 'Empresa A', 'key-a', now(), 'key-a');
    insert into auth.member(id, company_id, user_id, role, created_at)
      values ('member-a', '${COMPANY}', 'person-a', 'owner', now());`)
  let positions = 0
  async function plant(): Promise<Account> {
    const id = randomUUID()
    const base = { id, companyId: COMPANY, personId: null, provider: 'google', revision: 1 }
    const sealed = testSealed(sealKeys, contextOf(base), LOGIN)
    await asOwner(
      `insert into builder.model_account(id, company_id, person_id, kind, provider, label, position,
        state, sealed, key_id, hint, linked_by, linked_at, revision, attempt_key)
        values ($1, $2, null, 'google_cliproxy', 'google', $3, $7, 'ready', $4, $5, null,
        'person-a', now(), 1, $6)`,
      [
        id,
        COMPANY,
        `Google ${id.slice(0, 4)}`,
        Buffer.from(sealed.blob),
        sealed.keyId,
        id,
        positions++,
      ],
    )
    return { ...base, credential: testCredential(LOGIN) }
  }
  async function row(account: Account) {
    const [found] = await asOwner(
      `select revision, sealed, key_id from builder.model_account where id = $1`,
      [account.id],
    )
    const held = Object(found)
    const login = testOpened(sealKeys, contextOf(account), {
      keyId: held.key_id,
      blob: held.sealed,
    })
    return { revision: held.revision, login }
  }
  const lines: string[] = []
  const log = {
    info: (fields: Record<string, unknown>, message: string) =>
      lines.push(JSON.stringify([fields, message])),
    error: (fields: Record<string, unknown>, message: string) =>
      lines.push(JSON.stringify([fields, message])),
  }
  const calls = openGoogleCalls({ cliProxy, log, database, sealKeys, idleMs })
  t.after(() => calls.stop())
  return { double, calls, plant, row, asOwner, lines }
}

test('uma conta, um processo em 127.0.0.1, chave aleatória, pasta 0700 com o login; outra conta, outro processo', async (t) => {
  const { double, calls, plant, lines } = await setup(t)
  const [one, two] = [await plant(), await plant()]
  const first = await calls.googleCalls(one, SCOPE)
  const again = await calls.googleCalls(one, SCOPE)
  assert.deepEqual(again, first)
  const other = await calls.googleCalls(two, SCOPE)
  assert.notEqual(other.apiKey, first.apiKey)
  assert.notEqual(other.url, first.url)
  const runs = runsOf(double.control)
  assert.equal(runs.length, 2)
  assert.match(first.url, /^http:\/\/127\.0\.0\.1:\d+\/v1$/)
  assert.ok(first.apiKey.length >= 32)
  const [run] = runs
  assert.ok(run !== undefined && alive(run.pid))
  assert.match(readFileSync(join(run.dir, 'config.yaml'), 'utf8'), /host: "127\.0\.0\.1"/)
  assert.equal(statSync(run.dir).mode & 0o777, 0o700)
  assert.equal(statSync(join(run.dir, 'auths')).mode & 0o777, 0o700)
  assert.equal(readFileSync(join(run.dir, 'auths', 'login.json'), 'utf8'), LOGIN)
  const status = `${first.url.replace('/v1', '')}/v0/management/get-auth-status`
  const served = await fetch(status, { headers: { authorization: `Bearer ${first.apiKey}` } })
  assert.equal(served.status, 200)
  assert.equal((await fetch(status)).status, 401)
  assert.equal(lines.join('').includes('ya29'), false)
})

test('10 minutos sem chamada: o processo sai e a pasta some; a chamada seguinte abre outro', async (t) => {
  const { double, calls, plant } = await setup(t, 400)
  const account = await plant()
  await calls.googleCalls(account, SCOPE)
  const [run] = runsOf(double.control)
  assert.ok(run !== undefined && alive(run.pid))
  await sleep(250)
  await calls.googleCalls(account, SCOPE)
  await sleep(250)
  assert.ok(alive(run.pid), 'a call restarts the idle time')
  await sleep(500)
  assert.equal(alive(run.pid), false)
  assert.equal(existsSync(run.dir), false)
  await calls.googleCalls(account, SCOPE)
  assert.equal(runsOf(double.control).length, 2)
})

test('fim do programa: o login renovado volta lacrado à conta, por revisão; sem renovação, a linha fica', async (t) => {
  const { double, calls, plant, row } = await setup(t)
  const [refreshed, same] = [await plant(), await plant()]
  for (const account of [refreshed, same]) await calls.googleCalls(account, SCOPE)
  const runs = runsOf(double.control)
  writeFileSync(join(runs[0]?.dir ?? '', 'auths', 'login.json'), REFRESHED)
  await calls.stop()
  assert.deepEqual(await row(refreshed), { revision: 2, login: REFRESHED })
  assert.deepEqual(await row(same), { revision: 1, login: LOGIN })
  for (const run of runs) {
    assert.equal(alive(run.pid), false)
    assert.equal(existsSync(run.dir), false)
  }
})

test('login renovado sobre revisão que mudou: a linha da conta fica como está', async (t) => {
  const { double, calls, plant, row, asOwner } = await setup(t)
  const account = await plant()
  await calls.googleCalls(account, SCOPE)
  const [run] = runsOf(double.control)
  writeFileSync(join(run?.dir ?? '', 'auths', 'login.json'), REFRESHED)
  await asOwner(`update builder.model_account set revision = 5 where id = $1`, [account.id])
  await calls.stop()
  assert.deepEqual(await row(account), { revision: 5, login: LOGIN })
})

test('binário diferente do sha256: não inicia; processo que não sobe: CLIPROXY_UNAVAILABLE, e a chamada seguinte tenta de novo', async (t) => {
  const real = testCliProxy()
  const different = await setup(t, undefined, { ...real, sha256: '0'.repeat(64) })
  const account = await different.plant()
  const refused = await different.calls.googleCalls(account, SCOPE).catch((error: unknown) => error)
  assert.equal(Object(refused).code, 'CLIPROXY_BINARY_REFUSED')
  assert.deepEqual(runsOf(real.control), [])

  const dir = mkdtempSync(join(tmpdir(), 'conexus-cliproxy-fail-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const text = '#!/bin/sh\nexit 1\n'
  const binary = join(dir, 'cli-proxy-api')
  writeFileSync(binary, text, { mode: 0o700 })
  const broken = await setup(t, undefined, {
    binary,
    sha256: createHash('sha256').update(text).digest('hex'),
    loginSeconds: 300,
  })
  const planted = await broken.plant()
  for (const _attempt of [1, 2]) {
    const failed = await broken.calls.googleCalls(planted, SCOPE).catch((error: unknown) => error)
    assert.equal(Object(failed).code, 'CLIPROXY_UNAVAILABLE')
  }
})

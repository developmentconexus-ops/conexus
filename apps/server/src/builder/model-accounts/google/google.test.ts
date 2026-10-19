import assert from 'node:assert/strict'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import {
  ANA_OWNER,
  codeOf,
  hubWithLog,
  personOn,
  plantCompany,
  post,
} from '../../../hub/identity/test-hub.ts'
import { testCliProxy } from '../../../platform/test-cliproxy-binary.ts'

const TOKEN = 'ya29.planted-google-token'

function alive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

async function google(t: TestContext) {
  const hub = await hubWithLog(t)
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id)
  await hub.test.asOwner(
    `insert into builder.company_account_kind (company_id, kind) values ($1, 'google_cliproxy')`,
    [companyId],
  )
  const double = testCliProxy()
  rmSync(join(double.control, 'mode'), { force: true })
  rmSync(join(double.control, 'runs'), { force: true })
  const signIns = `/api/companies/${companyId}/model-account-sign-ins`
  async function start() {
    const started = await post(hub, ana, signIns, {
      owner: 'company',
      kind: 'google_cliproxy',
      label: 'Google',
    })
    assert.equal(started.statusCode, 201, started.body)
    const body = Object(started.json())
    const state = String(new URL(body.url).searchParams.get('state'))
    const runs = readFileSync(join(double.control, 'runs'), 'utf8').trim().split('\n')
    const [pid = '', dir = ''] = (runs.at(-1) ?? '').split(' ')
    return { url: `${signIns}/${body.signInId}`, address: body.url, state, pid: Number(pid), dir }
  }
  function complete(url: string, state: string) {
    return post(hub, ana, url, {
      code: `http://localhost:51121/oauth-callback?state=${state}&code=c-1`,
    })
  }
  return { hub, double, start, complete }
}

test('o login roda num processo em 127.0.0.1, que para depois dele; o arquivo é lacrado, a pasta apagada', async (t) => {
  const { hub, start, complete } = await google(t)
  const started = await start()
  assert.equal(new URL(started.address).hostname, 'accounts.google.com')
  assert.ok(alive(started.pid))
  assert.ok(existsSync(join(started.dir, 'config.yaml')))
  assert.match(readFileSync(join(started.dir, 'config.yaml'), 'utf8'), /host: "127\.0\.0\.1"/)
  const linked = await complete(started.url, started.state)
  assert.equal(linked.statusCode, 201, linked.body)
  const { account } = Object(linked.json())
  assert.deepEqual(
    [account.kind, account.provider, account.hint],
    ['google_cliproxy', 'google', null],
  )
  assert.equal(alive(started.pid), false)
  assert.equal(existsSync(started.dir), false)
  const [row] = await hub.test.asOwner(`select sealed from builder.model_account`)
  assert.equal(Buffer.from(Object(row).sealed).includes(TOKEN), false)
  assert.equal(JSON.stringify([linked.json(), hub.lines]).includes(TOKEN), false)
  const messages = hub.lines.map(({ message }) => message)
  assert.ok(messages.includes('CLIPROXY_STARTED') && messages.includes('CLIPROXY_STOPPED'))
})

test('state errado: 410 e o processo espera; tarde: 410; login recusado: 422 e o processo para', async (t) => {
  const { hub, double, start, complete } = await google(t)
  const first = await start()
  const wrong = await complete(first.url, 'outro-estado')
  assert.deepEqual([wrong.statusCode, codeOf(wrong)], [410, 'MODEL_ACCOUNT_SIGN_IN_EXPIRED'])
  assert.ok(alive(first.pid))
  await hub.test.asOwner(
    `update builder.model_account_sign_in set expires_at = now() - interval '1 second'`,
  )
  assert.equal((await complete(first.url, first.state)).statusCode, 410)
  writeFileSync(join(double.control, 'mode'), 'refuse')
  const second = await start()
  const refused = await complete(second.url, second.state)
  assert.deepEqual([refused.statusCode, codeOf(refused)], [422, 'MODEL_ACCOUNT_REFUSED'])
  assert.equal(alive(second.pid), false)
  assert.equal(existsSync(second.dir), false)
  assert.deepEqual(await hub.test.asOwner(`select id from builder.model_account`), [])
})

test('binário diferente do sha256 fixado: não inicia', async (t) => {
  const double = testCliProxy()
  rmSync(join(double.control, 'runs'), { force: true })
  const original = readFileSync(double.binary, 'utf8')
  t.after(() => writeFileSync(double.binary, original))
  writeFileSync(double.binary, `${original}# outro\n`)
  const hub = await hubWithLog(t)
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id)
  await hub.test.asOwner(
    `insert into builder.company_account_kind (company_id, kind) values ($1, 'google_cliproxy')`,
    [companyId],
  )
  const body = { owner: 'company', kind: 'google_cliproxy', label: 'Google' }
  const refused = await post(hub, ana, `/api/companies/${companyId}/model-account-sign-ins`, body)
  assert.deepEqual([refused.statusCode, codeOf(refused)], [500, 'CLIPROXY_BINARY_REFUSED'])
  assert.equal(existsSync(join(double.control, 'runs')), false)
})

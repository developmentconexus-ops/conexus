import assert from 'node:assert/strict'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  ANA_OWNER,
  call,
  codeOf,
  hubWithLog,
  personOn,
  plantCompany,
  post,
} from '../../hub/identity/test-hub.ts'
import { testCliProxy } from '../../platform/test-cliproxy-binary.ts'
import { company, connect } from '../conversation/test-defaults.ts'

const SONNET_NEW = 'anthropic/claude-sonnet-5-5'
const SONNET_OLD = 'anthropic/claude-sonnet-4-5'

/** The models the company picker offers in a read of the accounts. */
function offered(read: { choices: { company: { models: { id: string }[] }[] } }): string[] {
  return read.choices.company.flatMap((one) => one.models.map((model) => model.id))
}

test('as contas ligadas antes de a lista ser lida têm a lista lida na partida; uma leitura que falha as deixa como estavam', async (t) => {
  const { hub, ana, accounts } = await company(t)
  await hub.test.asOwner(`delete from builder.model_account`)
  await connect(hub, ana, accounts, 'anthropic', 'company', ['claude-sonnet-5-5'])
  await hub.test.asOwner(`update builder.model_account set served_models = null, served_at = null`)
  const before = Object((await call(hub, ana, 'GET', accounts)).json())
  assert.ok(offered(before).includes(SONNET_OLD))
  assert.equal(await hub.readUnserved(), 1)
  const after = Object((await call(hub, ana, 'GET', accounts)).json())
  assert.deepEqual(offered(after), [SONNET_NEW])
  // A list the provider refuses to give leaves the account unread, to be tried at the next start.
  hub.test.lists.served.clear()
  await hub.test.asOwner(`update builder.model_account set served_models = null, served_at = null`)
  assert.equal(await hub.readUnserved(), 1)
  const [row] = await hub.test.asOwner(`select served_models from builder.model_account`)
  assert.equal(Object(row).served_models, null)
  assert.ok(offered(Object((await call(hub, ana, 'GET', accounts)).json())).includes(SONNET_OLD))
})

test('o Google lê a lista do CLIProxy ao ligar e na partida: só os ids do registro valem, e o início não cai num modelo que a conta não atende', async (t) => {
  const hub = await hubWithLog(t)
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id)
  await hub.test.asOwner(
    `insert into builder.company_account_kind (company_id, kind) values ($1, 'google_cliproxy')`,
    [companyId],
  )
  const double = testCliProxy()
  rmSync(join(double.control, 'mode'), { force: true })
  rmSync(join(double.control, 'models'), { force: true })
  const signIns = `/api/companies/${companyId}/model-account-sign-ins`
  const started = await post(hub, ana, signIns, {
    owner: 'company',
    kind: 'google_cliproxy',
    label: 'Google',
  })
  const body = Object(started.json())
  const state = String(new URL(body.url).searchParams.get('state'))
  const linked = await post(hub, ana, `${signIns}/${body.signInId}`, {
    code: `http://localhost:51121/oauth-callback?state=${state}&code=c-1`,
  })
  assert.equal(linked.statusCode, 201, linked.body)
  const listed = [
    'gemini-3.1-flash-image',
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash-high',
    'gemini-3-flash',
    'gemini-3.1-flash-lite',
  ]
  const [row] = await hub.test.asOwner(`select served_models from builder.model_account`)
  assert.deepEqual(Object(row).served_models, listed)
  const accounts = `/api/companies/${companyId}/model-accounts`
  async function read() {
    return Object((await call(hub, ana, 'GET', accounts)).json())
  }
  const models = offered(await read())
  assert.deepEqual(models.sort(), ['google/gemini-3.1-flash-lite', 'google/gemini-3.5-flash-lite'])
  assert.equal((await read()).defaults.start, null)
  const refused = await call(hub, ana, 'PUT', `/api/companies/${companyId}/default-model`, {
    model: 'google/gemini-2.5-pro',
    effort: 'low',
  })
  assert.deepEqual([refused.statusCode, codeOf(refused)], [422, 'MODEL_NO_ACCOUNT'])
  // Linked before the list was read: the start reads it.
  await hub.test.asOwner(`update builder.model_account set served_models = null, served_at = null`)
  assert.equal(await hub.readUnserved(), 1)
  const [again] = await hub.test.asOwner(`select served_models from builder.model_account`)
  assert.deepEqual(Object(again).served_models, listed)
})

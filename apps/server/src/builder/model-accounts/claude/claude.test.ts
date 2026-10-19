import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { CARLA, call, codeOf, companyOn, memberOn, post } from '../../../hub/identity/test-hub.ts'

const TOKEN_URL = 'https://console.anthropic.com/v1/oauth/token'
const ACCESS = 'sk-ant-oat01-planted-access-token'
const REFRESH = 'sk-ant-ort01-planted-refresh-token'

/** Anthropic's token endpoint, doubled in the Hub's own `fetch`: it answers as `reply` says. */
function anthropic(t: TestContext) {
  const trades: Record<string, unknown>[] = []
  const state: { status: number } = { status: 200 }
  const original = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    if (String(input) !== TOKEN_URL) return original(input, init)
    trades.push(JSON.parse(String(init?.body)))
    if (state.status !== 200) return new Response('{}', { status: state.status })
    const tokens = { access_token: ACCESS, refresh_token: REFRESH, expires_in: 28_800 }
    return Response.json(tokens)
  }
  t.after(() => {
    globalThis.fetch = original
  })
  return { trades, state }
}

async function opened(t: TestContext) {
  const { hub, ana, companyId } = await companyOn(t)
  await hub.test.asOwner(
    `insert into builder.company_account_kind (company_id, kind) values ($1, 'claude_subscription')`,
    [companyId],
  )
  const signIns = `/api/companies/${companyId}/model-account-sign-ins`
  async function start(who = ana, owner = 'company') {
    const started = await post(hub, who, signIns, {
      owner,
      kind: 'claude_subscription',
      label: 'Claude',
    })
    assert.equal(started.statusCode, 201)
    const body = Object(started.json())
    const verifier = String(new URL(body.url).searchParams.get('state'))
    return { ...body, verifier, url: `${signIns}/${body.signInId}`, address: body.url }
  }
  return { hub, ana, companyId, start }
}

test('start dá o endereço e guarda o verificador lacrado 10 min; complete troca o código e grava a conta', async (t) => {
  const vendor = anthropic(t)
  const { hub, ana, companyId, start } = await opened(t)
  const before = Date.now()
  const started = await start()
  assert.equal(new URL(started.address).origin, 'https://claude.ai')
  const expires = Date.parse(started.expiresAt) - before
  assert.ok(expires > 590_000 && expires <= 601_000, String(expires))
  const [row] = await hub.test.asOwner(`select sealed from builder.model_account_sign_in`)
  assert.equal(Buffer.from(Object(row).sealed).includes(started.verifier), false)
  const linked = await post(hub, ana, started.url, { code: ` codigo-1#${started.verifier} ` })
  assert.equal(linked.statusCode, 201)
  const { account } = Object(linked.json())
  assert.deepEqual(
    [account.kind, account.provider, account.owner, account.hint, account.position, account.label],
    ['claude_subscription', 'anthropic', 'company', null, 0, 'Claude'],
  )
  assert.deepEqual(
    vendor.trades.map(({ code, code_verifier }) => [code, code_verifier]),
    [['codigo-1', started.verifier]],
  )
  const [kept] = await hub.test.asOwner(`select sealed from builder.model_account`)
  for (const secret of [ACCESS, REFRESH]) {
    assert.equal(Buffer.from(Object(kept).sealed).includes(secret), false)
    assert.equal(JSON.stringify(linked.json()).includes(secret), false)
  }
  assert.deepEqual(await hub.test.asOwner(`select id from builder.model_account_sign_in`), [])
  const again = await post(hub, ana, started.url, { code: `codigo-1#${started.verifier}` })
  assert.deepEqual([again.statusCode, codeOf(again)], [410, 'MODEL_ACCOUNT_SIGN_IN_EXPIRED'])
  const listed = Object(
    (await call(hub, ana, 'GET', `/api/companies/${companyId}/model-accounts`)).json(),
  )
  assert.deepEqual(
    listed.company.map(({ id }: { id: string }) => id),
    [account.id],
  )
})

test('troca recusada: 422 e nada gravado, e a entrada acaba; fornecedor fora: 502; tarde ou de outro: 410', async (t) => {
  const vendor = anthropic(t)
  const { hub, ana, companyId, start } = await opened(t)
  async function attempt(code: (verifier: string) => string, status = 200) {
    vendor.state.status = status
    const started = await start()
    const answer = await post(hub, ana, started.url, { code: code(started.verifier) })
    const again = await post(hub, ana, started.url, { code: code(started.verifier) })
    assert.equal(codeOf(again), 'MODEL_ACCOUNT_SIGN_IN_EXPIRED')
    return [answer.statusCode, codeOf(answer)]
  }
  assert.deepEqual(await attempt(() => 'codigo#outro-estado'), [422, 'MODEL_ACCOUNT_REFUSED'])
  assert.equal(vendor.trades.length, 0)
  const refused = await attempt((verifier) => `codigo#${verifier}`, 400)
  assert.deepEqual(refused, [422, 'MODEL_ACCOUNT_REFUSED'])
  const down = await attempt((verifier) => `codigo#${verifier}`, 503)
  assert.deepEqual(down, [502, 'MODEL_ACCOUNT_UNAVAILABLE'])
  assert.deepEqual(await hub.test.asOwner(`select id from builder.model_account`), [])
  vendor.state.status = 200
  const started = await start()
  const carla = await memberOn(hub, companyId, CARLA, 'member')
  const others = await post(hub, carla, started.url, { code: `codigo#${started.verifier}` })
  assert.equal(others.statusCode, 410)
  await hub.test.asOwner(
    `update builder.model_account_sign_in set expires_at = now() - interval '1 second'`,
  )
  const late = await post(hub, ana, started.url, { code: `codigo#${started.verifier}` })
  assert.deepEqual([late.statusCode, codeOf(late)], [410, 'MODEL_ACCOUNT_SIGN_IN_EXPIRED'])
  assert.equal(vendor.trades.length, 2)
  assert.deepEqual(await hub.test.asOwner(`select id from builder.model_account_sign_in`), [])
})

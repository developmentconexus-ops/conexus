import assert from 'node:assert/strict'
import { test } from 'node:test'
import { codeOf, post } from '../../../hub/identity/test-hub.ts'
import { ACCESS, planted, REFRESH } from '../../../platform/test-openai-codex.ts'
import { opened } from './test-sign-in.ts'

test('tipo desligado: recusa sem chamar a OpenAI', async (t) => {
  const { hub, ana, companyId, codex, signIns } = await opened(t)
  await hub.test.asOwner(`delete from builder.company_account_kind where company_id = $1`, [
    companyId,
  ])
  const refused = await post(hub, ana, signIns, {
    owner: 'company',
    kind: 'openai_codex',
    label: 'ChatGPT',
  })
  assert.deepEqual([refused.statusCode, codeOf(refused)], [422, 'MODEL_ACCOUNT_KIND_OFF'])
  assert.deepEqual(codex.calls, [])
})

test('a partida recusada: 4xx recusa, 5xx e a rede ficam indisponíveis, e nada é gravado', async (t) => {
  const { hub, ana, companyId, codex, signIns, entries } = await opened(t)
  const body = { owner: 'company', kind: 'openai_codex', label: 'ChatGPT' }
  const cases = [
    [{ status: 400 }, 422, 'MODEL_ACCOUNT_REFUSED'],
    [{ status: 503 }, 502, 'MODEL_ACCOUNT_UNAVAILABLE'],
    [{ status: 200, body: { device_auth_id: 'sem-codigo' } }, 502, 'MODEL_ACCOUNT_UNAVAILABLE'],
  ] as const
  for (const [reply, status, code] of cases) {
    codex.usercode = () => reply
    const refused = await post(hub, ana, signIns, body)
    assert.deepEqual([refused.statusCode, codeOf(refused)], [status, code], JSON.stringify(reply))
  }
  codex.usercode = () => {
    throw new TypeError('fetch failed')
  }
  const down = await post(hub, ana, signIns, body)
  assert.deepEqual([down.statusCode, codeOf(down)], [502, 'MODEL_ACCOUNT_UNAVAILABLE'])
  assert.equal((await entries()).length, 0, companyId)
})

const REFUSALS = [
  ['um 400 da espera', 'device-token', { status: 400 }, 422, 'MODEL_ACCOUNT_REFUSED', 0],
  ['um 401 da espera', 'device-token', { status: 401 }, 422, 'MODEL_ACCOUNT_REFUSED', 0],
  ['a troca recusada', 'token', { status: 400 }, 422, 'MODEL_ACCOUNT_REFUSED', 0],
  [
    'nenhum token traz a conta do ChatGPT',
    'token',
    { status: 200, body: { access_token: planted({}), refresh_token: REFRESH } },
    422,
    'MODEL_ACCOUNT_REFUSED',
    0,
  ],
  ['um 408 da espera', 'device-token', { status: 408 }, 502, 'MODEL_ACCOUNT_UNAVAILABLE', 1],
  ['um 429 da espera', 'device-token', { status: 429 }, 502, 'MODEL_ACCOUNT_UNAVAILABLE', 1],
  ['um 500 da espera', 'device-token', { status: 500 }, 502, 'MODEL_ACCOUNT_UNAVAILABLE', 1],
  ['um 503 da troca', 'token', { status: 503 }, 502, 'MODEL_ACCOUNT_UNAVAILABLE', 1],
  ['um 429 da troca', 'token', { status: 429 }, 502, 'MODEL_ACCOUNT_UNAVAILABLE', 1],
] as const

for (const [name, endpoint, reply, status, code, left] of REFUSALS) {
  test(`recusa da espera: ${name}`, async (t) => {
    const { codex, start, poll, entries, accounts } = await opened(t)
    const { signInId } = await start()
    codex.typed = true
    if (endpoint === 'token') codex.exchange = () => reply
    else codex.deviceToken = () => reply
    const answered = await poll(signInId)
    assert.deepEqual([answered.statusCode, codeOf(answered)], [status, code])
    assert.equal((await entries()).length, left)
    assert.equal((await accounts()).length, 0)
    assert.equal(answered.body.includes(ACCESS), false)
  })
}

test('recusa da espera: a rede fora deixa a entrada, que pode ser perguntada de novo', async (t) => {
  const { hub, codex, start, poll, entries } = await opened(t)
  const { signInId } = await start()
  codex.deviceToken = () => {
    throw new TypeError('fetch failed')
  }
  const down = await poll(signInId)
  assert.deepEqual([down.statusCode, codeOf(down)], [502, 'MODEL_ACCOUNT_UNAVAILABLE'])
  assert.equal((await entries()).length, 1)
  codex.typed = true
  codex.deviceToken = () => ({
    status: 200,
    body: { authorization_code: 'planted-code', code_verifier: 'planted-pkce' },
  })
  assert.equal(Object((await poll(signInId)).json()).status, 'linked')
  assert.equal((await hub.test.asOwner(`select id from builder.model_account`)).length, 1)
})

test('depois de 15 minutos a espera diz que o código venceu', async (t) => {
  const { hub, start, poll, calls } = await opened(t)
  const { signInId } = await start()
  await hub.test.asOwner(
    `update builder.model_account_sign_in set expires_at = statement_timestamp() - interval '1 second'`,
  )
  const late = await poll(signInId)
  assert.deepEqual([late.statusCode, codeOf(late)], [410, 'MODEL_ACCOUNT_SIGN_IN_EXPIRED'])
  assert.equal(calls('device-token'), 0)
})

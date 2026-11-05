import assert from 'node:assert/strict'
import { mock, test } from 'node:test'
import { CompanyId } from '@conexus/hub-api'
import { CARLA, codeOf, memberOn, plantCompany, post } from '../../../hub/identity/test-hub.ts'
import { ACCESS, ACCOUNT_ID, REFRESH, USER_CODE } from '../../../platform/test-openai-codex.ts'
import { testOpened } from '../../../platform/test-seal.ts'
import { opened } from './test-sign-in.ts'

test('a partida mostra o código', async (t) => {
  const { hub, codex, start, entries } = await opened(t)
  const before = Date.now()
  const started = await start()
  assert.deepEqual(
    [started.entry, started.url, started.userCode, started.retryMs],
    ['device', 'https://auth.openai.com/codex/device', USER_CODE, 5000],
  )
  const minutes = (Date.parse(started.expiresAt) - before) / 60_000
  assert.ok(minutes > 14.9 && minutes <= 15.1, String(minutes))
  assert.equal(codex.calls.length, 1)
  assert.deepEqual(JSON.parse(String(codex.calls[0]?.body)), {
    client_id: 'app_EMoamEEZ73f0CkXaXp7hrann',
    originator: 'conexus',
  })
  const [row] = await hub.test.asOwner(`select sealed from builder.model_account_sign_in`)
  assert.equal(Buffer.from(Object(row).sealed).includes(USER_CODE), false)
  assert.equal((await entries()).length, 1)
})

test('a partida do Claude responde entry paste', async (t) => {
  const { hub, ana, companyId } = await opened(t)
  await hub.test.asOwner(
    `insert into builder.company_account_kind (company_id, kind) values ($1, 'claude_subscription')`,
    [companyId],
  )
  const started = await post(hub, ana, `/api/companies/${companyId}/model-account-sign-ins`, {
    owner: 'company',
    kind: 'claude_subscription',
    label: 'Claude',
  })
  assert.deepEqual([started.statusCode, Object(started.json()).entry], [201, 'paste'])
})

test('esperando: uma chamada por intervalo', async (t) => {
  const { start, poll, due, calls, codex } = await opened(t)
  const { signInId } = await start()
  const first = await poll(signInId)
  assert.deepEqual([first.statusCode, first.json()], [200, { status: 'waiting', retryMs: 5000 }])
  assert.equal(calls('device-token'), 1)
  const second = await poll(signInId)
  assert.equal(second.statusCode, 200)
  const waiting = Object(second.json())
  assert.equal(waiting.status, 'waiting')
  assert.ok(waiting.retryMs > 0 && waiting.retryMs <= 5000, String(waiting.retryMs))
  assert.equal(calls('device-token'), 1)
  await due()
  codex.deviceToken = () => ({ status: 404 })
  assert.equal(Object((await poll(signInId)).json()).status, 'waiting')
  assert.equal(calls('device-token'), 2)
})

test('ligada: a conta entra e a entrada some', async (t) => {
  const { hub, companyId, codex, start, poll, entries } = await opened(t)
  const { signInId } = await start()
  codex.typed = true
  const before = Date.now()
  const linked = await poll(signInId)
  assert.equal(linked.statusCode, 200, linked.body)
  const { status, account } = Object(linked.json())
  assert.equal(status, 'linked')
  assert.deepEqual(
    [account.kind, account.provider, account.owner, account.label, account.position],
    ['openai_codex', 'openai', 'company', 'ChatGPT', 0],
  )
  const trade = new URLSearchParams(
    codex.calls.find((made) => made.endpoint === 'token')?.body ?? '',
  )
  assert.deepEqual(
    [trade.get('grant_type'), trade.get('code'), trade.get('code_verifier')],
    ['authorization_code', 'planted-code', 'planted-pkce'],
  )
  assert.equal(trade.get('redirect_uri'), 'https://auth.openai.com/deviceauth/callback')
  const [kept] = await hub.test.asOwner(
    `select sealed, key_id from builder.model_account where id = $1`,
    [account.id],
  )
  const credential = JSON.parse(
    testOpened(
      hub.config.sealKeys,
      {
        purpose: 'model-account',
        rowId: account.id,
        companyId: CompanyId.parse(companyId),
        personId: null,
        kind: 'openai_codex',
        provider: 'openai',
      },
      { keyId: String(Object(kept).key_id), blob: Object(kept).sealed },
    ),
  )
  assert.deepEqual(
    [credential.access, credential.refresh, credential.accountId],
    [ACCESS, REFRESH, ACCOUNT_ID],
  )
  const lasts = (credential.expires - before) / 1000
  assert.ok(lasts > 3600 - 301 - 5 && lasts <= 3600 - 299, String(lasts))
  assert.equal(JSON.stringify(linked.json()).includes(ACCESS), false)
  assert.deepEqual(await entries(), [])
})

test('duas esperas ao mesmo tempo: uma conta', async (t) => {
  const { codex, start, poll, accounts, calls, entries } = await opened(t)
  const { signInId } = await start()
  codex.typed = true
  const gate = Promise.withResolvers<void>()
  const grant = codex.deviceToken
  codex.deviceToken = async () => {
    await gate.promise
    return grant()
  }
  const first = poll(signInId)
  const second = poll(signInId)
  const quick = await Promise.race([first, second])
  assert.deepEqual(
    [quick.statusCode, Object(quick.json()).status],
    [200, 'waiting'],
    'a que não reservou responde sem chamar a OpenAI',
  )
  gate.resolve()
  const both = await Promise.all([first, second])
  const statuses = both.map((each) => Object(each.json()).status).sort()
  assert.deepEqual(statuses, ['linked', 'waiting'])
  assert.equal(calls('device-token'), 1)
  assert.equal(calls('token'), 1)
  assert.equal((await accounts()).length, 1)
  assert.deepEqual(await entries(), [])
})

test('a resposta perdida volta ligada', async (t) => {
  const { codex, start, poll, accounts, calls } = await opened(t)
  const { signInId } = await start()
  codex.typed = true
  const first = Object((await poll(signInId)).json())
  const again = await poll(signInId)
  assert.deepEqual([again.statusCode, Object(again.json()).status], [200, 'linked'])
  assert.equal(Object(again.json()).account.id, first.account.id)
  assert.equal(calls('device-token'), 1)
  assert.equal((await accounts()).length, 1)
})

test('cada entrada pela sua rota', async (t) => {
  const { hub, ana, companyId, codex, signIns, start, poll, entries } = await opened(t)
  const device = await start()
  const wrong = await post(hub, ana, `${signIns}/${device.signInId}`, { code: 'qualquer' })
  assert.deepEqual([wrong.statusCode, codeOf(wrong)], [400, 'MODEL_ACCOUNT_SIGN_IN_WRONG_ENTRY'])
  assert.equal((await entries()).length, 1)
  assert.equal(codex.calls.filter((made) => made.endpoint !== 'usercode').length, 0)
  await hub.test.asOwner(
    `insert into builder.company_account_kind (company_id, kind) values ($1, 'claude_subscription')`,
    [companyId],
  )
  const paste = Object(
    (
      await post(hub, ana, signIns, {
        owner: 'company',
        kind: 'claude_subscription',
        label: 'Claude',
      })
    ).json(),
  )
  const polled = await poll(paste.signInId)
  assert.deepEqual([polled.statusCode, codeOf(polled)], [400, 'MODEL_ACCOUNT_SIGN_IN_WRONG_ENTRY'])
  assert.equal((await entries()).length, 2)
})

test('da empresa pelo mesmo caminho', async (t) => {
  const { hub, companyId, codex, start, poll } = await opened(t)
  const carla = await memberOn(hub, companyId, CARLA, 'member')
  const refused = await post(hub, carla, `/api/companies/${companyId}/model-account-sign-ins`, {
    owner: 'company',
    kind: 'openai_codex',
    label: 'Da empresa',
  })
  assert.equal(refused.statusCode, 404, refused.body)
  const own = await start(carla, 'me')
  codex.typed = true
  const mine = Object((await poll(own.signInId, carla)).json())
  assert.deepEqual([mine.status, mine.account.owner], ['linked', 'me'])
})

test('a entrada é só de quem a começou', async (t) => {
  const { hub, ana, companyId, codex, start, poll } = await opened(t)
  const carla = await memberOn(hub, companyId, CARLA, 'member')
  const { signInId } = await start()
  const never = '00000000-0000-4000-8000-000000000999'
  const stranger = await poll(signInId, carla)
  const missing = await poll(never)
  for (const refused of [stranger, missing]) {
    assert.deepEqual([refused.statusCode, codeOf(refused)], [410, 'MODEL_ACCOUNT_SIGN_IN_EXPIRED'])
  }
  assert.equal(codex.calls.filter((made) => made.endpoint === 'device-token').length, 0)
  codex.typed = true
  assert.equal(Object((await poll(signInId, ana)).json()).status, 'linked')
  const after = await poll(signInId, carla)
  assert.deepEqual([after.statusCode, codeOf(after)], [410, 'MODEL_ACCOUNT_SIGN_IN_EXPIRED'])
})

test('tipo desligado no meio: a espera recusa sem chamar a OpenAI, e a entrada fica', async (t) => {
  const { hub, companyId, codex, start, poll, entries } = await opened(t)
  const { signInId } = await start()
  await hub.test.asOwner(`delete from builder.company_account_kind where company_id = $1`, [
    companyId,
  ])
  const refused = await poll(signInId)
  assert.deepEqual([refused.statusCode, codeOf(refused)], [422, 'MODEL_ACCOUNT_KIND_OFF'])
  assert.equal(codex.calls.filter((made) => made.endpoint === 'device-token').length, 0)
  assert.equal((await entries()).length, 1)
  await hub.test.asOwner(
    `insert into builder.company_account_kind (company_id, kind) values ($1, 'openai_codex')`,
    [companyId],
  )
  codex.typed = true
  assert.equal(Object((await poll(signInId)).json()).status, 'linked')
})

test('a ligação que falha depois da troca acaba a entrada: a espera seguinte diz que venceu', async (t) => {
  const { hub, companyId, codex, start, poll, entries, accounts } = await opened(t)
  const { signInId } = await start()
  codex.typed = true
  const grant = codex.deviceToken
  codex.deviceToken = async () => {
    await hub.test.asOwner(`delete from builder.company_account_kind where company_id = $1`, [
      companyId,
    ])
    return grant()
  }
  const failed = await poll(signInId)
  assert.deepEqual([failed.statusCode, codeOf(failed)], [422, 'MODEL_ACCOUNT_KIND_OFF'])
  assert.deepEqual([(await entries()).length, (await accounts()).length], [0, 0])
  await hub.test.asOwner(
    `insert into builder.company_account_kind (company_id, kind) values ($1, 'openai_codex')`,
    [companyId],
  )
  const again = await poll(signInId)
  assert.deepEqual([again.statusCode, codeOf(again)], [410, 'MODEL_ACCOUNT_SIGN_IN_EXPIRED'])
  assert.equal(codex.calls.filter((made) => made.endpoint === 'device-token').length, 1)
})

test('a entrada de outra empresa: a espera diz que venceu, sem chamar a OpenAI', async (t) => {
  const { hub, ana, codex, start, poll, calls } = await opened(t)
  const { signInId } = await start()
  const elsewhere = await plantCompany(hub.test, ana.id, 'Outra Empresa')
  await hub.test.asOwner(
    `insert into builder.company_account_kind (company_id, kind) values ($1, 'openai_codex')`,
    [elsewhere],
  )
  codex.typed = true
  const stranger = await poll(signInId, ana, elsewhere)
  assert.deepEqual([stranger.statusCode, codeOf(stranger)], [410, 'MODEL_ACCOUNT_SIGN_IN_EXPIRED'])
  assert.equal(calls('device-token'), 0)
})

test('cada chamada à OpenAI tem o prazo de 15 s', async (t) => {
  const { hub, ana, signIns, entries } = await opened(t)
  const asked: number[] = []
  const timeout = mock.method(AbortSignal, 'timeout', (ms: number) => {
    asked.push(ms)
    return AbortSignal.abort(new DOMException('The operation timed out.', 'TimeoutError'))
  })
  t.after(() => timeout.mock.restore())
  const late = await post(hub, ana, signIns, {
    owner: 'company',
    kind: 'openai_codex',
    label: 'ChatGPT',
  })
  assert.deepEqual([late.statusCode, codeOf(late)], [502, 'MODEL_ACCOUNT_UNAVAILABLE'])
  assert.deepEqual(asked, [15_000])
  assert.equal((await entries()).length, 0)
})

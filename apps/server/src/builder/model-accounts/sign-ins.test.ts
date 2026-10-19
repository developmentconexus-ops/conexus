import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  BRUNO,
  CARLA,
  call,
  codeOf,
  companyOn,
  memberOn,
  post,
} from '../../hub/identity/test-hub.ts'

test('tipo desligado: start e complete dão 422 MODEL_ACCOUNT_KIND_OFF, na fila da empresa e na pessoal', async (t) => {
  const { hub, ana, companyId } = await companyOn(t)
  const carla = await memberOn(hub, companyId, CARLA, 'member')
  const signIns = `/api/companies/${companyId}/model-account-sign-ins`
  for (const [who, owner] of [
    [ana, 'company'],
    [ana, 'me'],
    [carla, 'me'],
  ] as const) {
    const refused = await post(hub, who, signIns, {
      owner,
      kind: 'claude_subscription',
      label: 'Assinatura',
    })
    assert.deepEqual([refused.statusCode, codeOf(refused)], [422, 'MODEL_ACCOUNT_KIND_OFF'], owner)
  }
  await hub.test.asOwner(
    `insert into builder.company_account_kind (company_id, kind) values ($1, 'claude_subscription')`,
    [companyId],
  )
  const company = await post(hub, ana, signIns, {
    owner: 'company',
    kind: 'claude_subscription',
    label: 'Time',
  })
  const own = await post(hub, carla, signIns, {
    owner: 'me',
    kind: 'claude_subscription',
    label: 'Minha',
  })
  assert.deepEqual([company.statusCode, own.statusCode], [201, 201])
  await hub.test.asOwner(`delete from builder.company_account_kind where company_id = $1`, [
    companyId,
  ])
  for (const [who, started] of [
    [ana, company],
    [carla, own],
  ] as const) {
    const url = `${signIns}/${Object(started.json()).signInId}`
    const refused = await post(hub, who, url, { code: 'codigo#estado' })
    assert.deepEqual([refused.statusCode, codeOf(refused)], [422, 'MODEL_ACCOUNT_KIND_OFF'])
  }
  assert.equal((await hub.test.asOwner(`select id from builder.model_account_sign_in`)).length, 2)
})

test('entrar: só dono e administrador pela empresa (404), o nome é conferido, e o Google ainda não tem processo', async (t) => {
  const { hub, ana, companyId } = await companyOn(t)
  const bruno = await memberOn(hub, companyId, BRUNO, 'admin')
  const carla = await memberOn(hub, companyId, CARLA, 'member')
  await hub.test.asOwner(
    `insert into builder.company_account_kind (company_id, kind) values ($1, 'claude_subscription')`,
    [companyId],
  )
  const signIns = `/api/companies/${companyId}/model-account-sign-ins`
  const body = { owner: 'company', kind: 'claude_subscription', label: 'Time' }
  assert.equal((await post(hub, carla, signIns, body)).statusCode, 404)
  assert.equal((await post(hub, bruno, signIns, body)).statusCode, 201)
  const unnamed = await post(hub, ana, signIns, { ...body, label: '  ' })
  assert.deepEqual([unnamed.statusCode, codeOf(unnamed)], [422, 'MODEL_ACCOUNT_INVALID'])
  assert.equal((await post(hub, ana, signIns, { ...body, kind: 'api_key' })).statusCode, 400)
  assert.equal(
    (await call(hub, ana, 'GET', `/api/companies/${companyId}/model-accounts`)).statusCode,
    200,
  )
})

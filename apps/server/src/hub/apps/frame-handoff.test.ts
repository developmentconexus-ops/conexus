import assert from 'node:assert/strict'
import { test } from 'node:test'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import type { Hub } from '../identity/test-hub.ts'
import { CARLA, call, codeOf, personOn, plantCompany } from '../identity/test-hub.ts'
import { browser, companyWithApps, ESTOQUE, frameHandoff, PEDIDOS, passes } from './test-handoff.ts'

function redeem(hub: Hub, body: { host: string; code: string; binding: string }) {
  return hub.edge.inject({
    method: 'POST',
    url: '/api/app-sessions',
    headers: { 'content-type': 'application/json' },
    payload: JSON.stringify(body),
  })
}

function codeIn(response: { json(): unknown }): string {
  return String(new URL(String(Object(response.json()).location)).searchParams.get('code'))
}

test('passagem do iframe: o membro com sessão recebe {location} no host do app, com o passe do vínculo', async (t) => {
  const { hub, bruno } = await companyWithApps(t)
  const { hash } = browser()
  const made = await frameHandoff(hub, bruno, { host: PEDIDOS, binding: hash })
  assert.equal(made.statusCode, 200)
  const location = new URL(String(Object(made.json()).location))
  assert.equal(location.origin, `https://${PEDIDOS}.apps.example.test`)
  assert.equal(location.pathname, '/__conexus/passagem')
  assert.match(codeIn(made), /^[A-Za-z0-9_-]{43}$/)
  const [row] = await hub.test.asOwner(`select binding_hash, host_label from apps.handoff`)
  assert.deepEqual(row, { binding_hash: hash, host_label: PEDIDOS })
  const sameOrigin = await frameHandoff(
    hub,
    bruno,
    { host: PEDIDOS, binding: hash },
    { origin: TEST_ORIGIN, 'sec-fetch-site': 'same-origin' },
  )
  assert.equal(sameOrigin.statusCode, 200)
  assert.equal(await passes(hub), 2)
})

test('passagem do iframe: outra empresa, host desconhecido ou Projeto apagado 404; sem sessão 401; de fora 403; nenhum passe', async (t) => {
  const { hub, ana, bruno, project } = await companyWithApps(t)
  const { hash } = browser()
  const carla = await personOn(hub, CARLA)
  await plantCompany(hub.test, carla.id, 'Empresa C', 'empresa-c')
  const answers: { statusCode: number; json(): unknown }[] = [
    await frameHandoff(hub, carla, { host: PEDIDOS, binding: hash }),
    await frameHandoff(hub, bruno, { host: 'nada--empresa-a', binding: hash }),
  ]
  assert.equal((await call(hub, ana, 'DELETE', project, { name: 'Pedidos' })).statusCode, 204)
  answers.push(await frameHandoff(hub, bruno, { host: PEDIDOS, binding: hash }))
  answers.push(await frameHandoff(hub, bruno, { host: ESTOQUE, binding: 'curto' }))
  answers.push(await frameHandoff(hub, undefined, { host: ESTOQUE, binding: hash }))
  answers.push(
    await frameHandoff(
      hub,
      bruno,
      { host: ESTOQUE, binding: hash },
      { origin: `https://${ESTOQUE}.apps.example.test` },
    ),
  )
  answers.push(
    await frameHandoff(
      hub,
      bruno,
      { host: ESTOQUE, binding: hash },
      { origin: TEST_ORIGIN, 'sec-fetch-site': 'cross-site' },
    ),
  )
  assert.deepEqual(
    answers.map((answer) => [answer.statusCode, codeOf(answer)]),
    [
      [404, 'NOT_FOUND'],
      [404, 'NOT_FOUND'],
      [404, 'NOT_FOUND'],
      [400, 'REQUEST_MALFORMED'],
      [401, 'SESSION_REQUIRED'],
      [403, 'REQUEST_ORIGIN_REFUSED'],
      [403, 'REQUEST_ORIGIN_REFUSED'],
    ],
  )
  assert.equal(await passes(hub), 0)
})

test('passagem do iframe: uma vez, um navegador', async (t) => {
  const { hub, bruno } = await companyWithApps(t)
  const { binding, hash } = browser()
  const made = await frameHandoff(hub, bruno, { host: PEDIDOS, binding: hash })
  const code = codeIn(made)
  const other = await redeem(hub, { host: PEDIDOS, code, binding: browser().binding })
  const right = await redeem(hub, { host: PEDIDOS, code, binding })
  const again = await redeem(hub, { host: PEDIDOS, code, binding })
  assert.deepEqual(
    [other, right, again].map((answer) => answer.statusCode),
    [403, 201, 403],
  )
  assert.deepEqual([codeOf(other), codeOf(again)], ['APP_HANDOFF_INVALID', 'APP_HANDOFF_INVALID'])
  assert.equal(await passes(hub), 0)
})

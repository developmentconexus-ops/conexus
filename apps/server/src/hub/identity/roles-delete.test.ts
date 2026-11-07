import assert from 'node:assert/strict'
import { test } from 'node:test'
import { call, codeOf, post } from './test-hub.ts'
import { ATENDENTE, roleOf, roles, world } from './test-roles.ts'

test('apagar um papel: em uso por uma pessoa ou por um convite aberto não apaga, um convite vencido não conta; sem ninguém apaga e a lista não o traz', async (t) => {
  const w = await world(t)
  await post(w.hub, w.ana, `${w.base}/roles`, ATENDENTE)
  const url = `${w.base}/roles/atendente`
  await call(w.hub, w.ana, 'PUT', `${w.base}/members/${w.bruno.id}`, {
    role: 'atendente',
    from: 'member',
  })
  assert.equal(roleOf(await roles(w), 'atendente').members, 1)
  const refused = await call(w.hub, w.ana, 'DELETE', url)
  assert.equal(refused.statusCode, 409)
  assert.equal(codeOf(refused), 'ROLE_IN_USE')
  assert.equal(roleOf(await roles(w), 'atendente').members, 1)

  await call(w.hub, w.ana, 'PUT', `${w.base}/members/${w.bruno.id}`, {
    role: 'member',
    from: 'atendente',
  })
  const invited = await post(w.hub, w.ana, `${w.base}/invitations`, {
    email: 'davi@example.test',
    role: 'atendente',
  })
  assert.equal(invited.statusCode, 201)
  assert.equal(codeOf(await call(w.hub, w.ana, 'DELETE', url)), 'ROLE_IN_USE')
  assert.ok(roleOf(await roles(w), 'atendente'))

  await w.hub.test.asOwner(
    `update auth.invitation set expires_at = now() - interval '1 minute' where company_id = $1`,
    [w.companyId],
  )
  const deleted = await call(w.hub, w.ana, 'DELETE', url)
  assert.equal(deleted.statusCode, 204)
  assert.equal(
    (await roles(w)).some((one) => one.role === 'atendente'),
    false,
  )
  assert.equal(codeOf(await call(w.hub, w.ana, 'DELETE', url)), 'ROLE_NOT_FOUND')
})

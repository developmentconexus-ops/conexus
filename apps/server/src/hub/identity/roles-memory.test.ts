import assert from 'node:assert/strict'
import { test } from 'node:test'
import { call, codeOf, memberOn, post } from './test-hub.ts'
import { ATENDENTE, world } from './test-roles.ts'

test('a memória da empresa: a permissão nasce no dono e no administrador; o desenvolvedor, o membro e um papel próprio não a têm, e quem tem o papel próprio recebe NOT_IN_ROLE ao gravar', async (t) => {
  const w = await world(t)
  assert.equal((await post(w.hub, w.ana, `${w.base}/roles`, ATENDENTE)).statusCode, 201)
  const eva = await memberOn(
    w.hub,
    w.companyId,
    { name: 'Eva Neves', email: 'eva@example.test' },
    'atendente',
  )
  const memory = `${w.base}/assistant/company-memory`
  const people = [
    ['owner', w.ana, true],
    ['admin', w.admin, true],
    ['developer', w.developer, false],
    ['member', w.bruno, false],
    ['atendente', eva, false],
  ] as const
  for (const [role, person, may] of people) {
    const listed = await call(w.hub, person, 'GET', memory)
    assert.equal(listed.statusCode, 200, listed.body)
    assert.equal(Object(listed.json()).mayManage, may, role)
  }
  const change = { body: 'Fale baixo.' }
  const path = `${memory}/instructions`
  const refused = await call(w.hub, eva, 'PUT', path, change)
  assert.equal(refused.statusCode, 409, refused.body)
  assert.equal(codeOf(refused), 'NOT_IN_ROLE')
  const written = await call(w.hub, w.admin, 'PUT', path, change)
  assert.equal(written.statusCode, 200, written.body)
})

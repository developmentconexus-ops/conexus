import assert from 'node:assert/strict'
import { test } from 'node:test'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import type { Person } from './test-hub.ts'
import { call, codeOf, personOn, post } from './test-hub.ts'
import { ATENDENTE, roles, world } from './test-roles.ts'

const INVITEE = 'davi@example.test'

test('papel próprio no membro: dá-se e tira-se como um fixo, fica abaixo do administrador, e um nome que a empresa não tem, ROLE_NOT_FOUND', async (t) => {
  const w = await world(t)
  const members = `${w.base}/members`
  await post(w.hub, w.ana, `${w.base}/roles`, ATENDENTE)
  function change(actor: Person, target: Person, role: string, from: string) {
    return call(w.hub, actor, 'PUT', `${members}/${target.id}`, { role, from })
  }

  const given = await change(w.ana, w.bruno, 'atendente', 'member')
  assert.equal(given.statusCode, 200)
  assert.equal(Object(given.json()).member.role, 'atendente')
  assert.deepEqual(Object(given.json()).member.mayChangeTo, [
    'owner',
    'admin',
    'developer',
    'member',
  ])

  const listed = await call(w.hub, w.admin, 'GET', members)
  const all: { personId: string; mayRemove: boolean; mayChangeTo: string[] }[] = Object(
    listed.json(),
  ).members
  const shown = all.find((one) => one.personId === w.bruno.id)
  assert.equal(shown?.mayRemove, true)
  assert.deepEqual(shown?.mayChangeTo, ['admin', 'developer', 'member'])
  assert.ok(all.find((one) => one.personId === w.developer.id)?.mayChangeTo.includes('atendente'))

  assert.equal((await change(w.admin, w.developer, 'atendente', 'developer')).statusCode, 200)
  assert.equal((await change(w.admin, w.developer, 'developer', 'atendente')).statusCode, 200)

  const below = await change(w.bruno, w.developer, 'admin', 'developer')
  assert.deepEqual([below.statusCode, codeOf(below)], [404, 'NOT_FOUND'])
  const removal = await call(w.hub, w.bruno, 'DELETE', `${members}/${w.developer.id}`)
  assert.equal(removal.statusCode, 404)

  const unknown = await change(w.ana, w.admin, 'fantasma', 'admin')
  assert.deepEqual([unknown.statusCode, codeOf(unknown)], [404, 'ROLE_NOT_FOUND'])
  assert.equal((await roles(w)).find((one) => one.role === 'atendente')?.members, 1)
})

test('convite com papel próprio: o administrador convida como Atendente, o e-mail diz o rótulo, quem aceita entra com ele; um nome que a empresa não tem, ROLE_NOT_FOUND', async (t) => {
  const w = await world(t)
  const url = `${w.base}/invitations`
  await post(w.hub, w.ana, `${w.base}/roles`, ATENDENTE)

  const unknown = await post(w.hub, w.admin, url, { email: INVITEE, role: 'fantasma' })
  assert.deepEqual([unknown.statusCode, codeOf(unknown)], [404, 'ROLE_NOT_FOUND'])
  const refused = await post(w.hub, w.bruno, url, { email: INVITEE, role: 'atendente' })
  assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'NOT_FOUND'])
  assert.equal(w.hub.mail.sent.length, 0)

  const response = await post(w.hub, w.admin, url, { email: INVITEE, role: 'atendente' })
  assert.equal(response.statusCode, 201)
  const { invitation } = Object(response.json())
  assert.equal(invitation.role, 'atendente')
  assert.ok(w.hub.mail.sent[0]?.text.includes('Atendente'), w.hub.mail.sent[0]?.text)

  const davi = await personOn(w.hub, { name: 'Davi Costa', email: INVITEE })
  const accepted = await w.hub.app.inject({
    method: 'PUT',
    url: `/api/invitations/${invitation.id}/acceptance`,
    headers: { origin: TEST_ORIGIN, 'content-type': 'application/json', cookie: davi.cookie },
    payload: { revision: 0 },
  })
  assert.equal(accepted.statusCode, 200)
  assert.deepEqual(
    await w.hub.test.asOwner('select role from auth.member where user_id = $1', [davi.id]),
    [{ role: 'atendente' }],
  )
})

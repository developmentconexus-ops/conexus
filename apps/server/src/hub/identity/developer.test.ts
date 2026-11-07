import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import type { Member } from '@conexus/hub-api'
import {
  ANA_OWNER,
  BRUNO,
  CARLA,
  call,
  codeOf,
  hubWithMail,
  memberOn,
  personOn,
  plantCompany,
  post,
} from './test-hub.ts'

const DAVI = { name: 'Davi Costa', email: 'davi@example.test' }
const EDU = { name: 'Edu Lima', email: 'edu@example.test' }

/** Ana owns Empresa Teste; Bruno is its administrator, Carla a developer, Davi a member. */
async function company(t: TestContext) {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id, 'Empresa Teste', 'empresa-teste')
  const bruno = await memberOn(hub, companyId, BRUNO, 'admin')
  const carla = await memberOn(hub, companyId, CARLA, 'developer')
  const davi = await memberOn(hub, companyId, DAVI, 'member')
  const base = `/api/companies/${companyId}`
  return { hub, ana, bruno, carla, davi, companyId, base }
}

async function roleOf(on: Awaited<ReturnType<typeof company>>, email: string): Promise<string> {
  const [row] = await on.hub.test.asOwner(
    `select m.role from auth.member m join auth."user" u on u.id = m.user_id
      where m.company_id = $1 and u.email = $2`,
    [on.companyId, email],
  )
  return String(Object(row).role)
}

test('o desenvolvedor: o dono e o administrador dão o papel e o veem nas opções de cada pessoa; o desenvolvedor e o membro, 404', async (t) => {
  const on = await company(t)
  const { hub, ana, bruno, carla, davi, base } = on
  function change(who: typeof ana, role: string, from: string) {
    return call(hub, who, 'PUT', `${base}/members/${davi.id}`, { role, from })
  }
  assert.equal((await change(ana, 'developer', 'member')).statusCode, 200)
  assert.equal(await roleOf(on, DAVI.email), 'developer')
  assert.equal((await change(bruno, 'member', 'developer')).statusCode, 200)
  assert.equal((await change(bruno, 'developer', 'member')).statusCode, 200)
  assert.equal((await change(ana, 'member', 'developer')).statusCode, 200)

  const listed = await call(hub, ana, 'GET', `${base}/members`)
  const options = Object.fromEntries(
    Object(listed.json()).members.map((each: Member) => [each.name, each.mayChangeTo]),
  )
  assert.deepEqual(options['Carla Dias'], ['owner', 'admin', 'member'])
  assert.deepEqual(options['Davi Costa'], ['owner', 'admin', 'developer'])

  for (const who of [carla, davi]) {
    const refused = await change(who, 'developer', 'member')
    assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'NOT_FOUND'])
  }
  assert.equal(await roleOf(on, DAVI.email), 'member')
  const byDeveloper = await call(hub, carla, 'GET', `${base}/members`)
  for (const each of Object(byDeveloper.json()).members) {
    assert.deepEqual(each.mayChangeTo, [], each.name)
  }
})

test('convidar desenvolvedor: o administrador convida com o papel e o convite o guarda; o desenvolvedor, 404 e nenhuma linha', async (t) => {
  const { hub, bruno, carla, base } = await company(t)
  const refused = await post(hub, carla, `${base}/invitations`, {
    email: EDU.email,
    role: 'developer',
  })
  assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'NOT_FOUND'])
  assert.deepEqual(await hub.test.asOwner('select id from auth.invitation'), [])
  const invited = await post(hub, bruno, `${base}/invitations`, {
    email: EDU.email,
    role: 'developer',
  })
  assert.equal(invited.statusCode, 201, invited.body)
  assert.equal(Object(invited.json()).invitation.role, 'developer')
  const saved = await hub.test.asOwner('select role from auth.invitation where email = $1', [
    EDU.email,
  ])
  assert.deepEqual(saved, [{ role: 'developer' }])
})

test('o que a pessoa pode: a empresa diz, para cada um dos quatro papéis, o que a tela mostra', async (t) => {
  const { hub, ana, bruno, carla, davi, base } = await company(t)
  const roles = [
    ['owner', ana, true],
    ['admin', bruno, true],
    ['developer', carla, true],
    ['member', davi, false],
  ] as const
  for (const [role, person, mayBuild] of roles) {
    const read = await call(hub, person, 'GET', base)
    assert.equal(read.statusCode, 200, role)
    assert.equal(Object(read.json()).role, role)
    assert.deepEqual(
      Object(read.json()).may,
      { manageAgents: mayBuild, manageAutomations: mayBuild },
      role,
    )
  }
  const outsider = await personOn(hub, EDU)
  assert.equal((await call(hub, outsider, 'GET', base)).statusCode, 404)
})

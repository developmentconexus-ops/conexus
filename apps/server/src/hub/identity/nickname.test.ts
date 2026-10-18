import assert from 'node:assert/strict'
import { test } from 'node:test'
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
} from './test-hub.ts'

const DAVI = { name: 'Davi Souza', email: 'davi@example.test' }

/** Empresa A with no nickname yet, Ana its owner, Bruno an administrator and Davi a member. */
async function companyToSet(t: Parameters<typeof hubWithMail>[0]) {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id, 'Empresa A', null)
  const bruno = await memberOn(hub, companyId, BRUNO, 'admin')
  const davi = await memberOn(hub, companyId, DAVI, 'member')
  const url = `/api/companies/${companyId}/nickname`
  return { hub, ana, bruno, davi, companyId, url }
}

test('apelido: o dono escolhe uma vez; o mesmo de novo responde igual, outro é recusado', async (t) => {
  const { hub, ana, companyId, url } = await companyToSet(t)
  const before = await call(hub, ana, 'GET', `/api/companies/${companyId}`)
  assert.deepEqual(Object(before.json()).company, {
    id: companyId,
    name: 'Empresa A',
    nickname: null,
    appsDomain: 'apps.example.test',
  })
  const chosen = await call(hub, ana, 'PUT', url, { nickname: 'empresa-a' })
  assert.equal(chosen.statusCode, 200)
  assert.deepEqual(chosen.json(), {
    company: {
      id: companyId,
      name: 'Empresa A',
      nickname: 'empresa-a',
      appsDomain: 'apps.example.test',
    },
  })
  const again = await call(hub, ana, 'PUT', url, { nickname: 'empresa-a' })
  assert.equal(again.statusCode, 200)
  const other = await call(hub, ana, 'PUT', url, { nickname: 'empresa-b' })
  assert.equal(other.statusCode, 409)
  assert.equal(codeOf(other), 'COMPANY_NICKNAME_SET')
  assert.deepEqual(await hub.test.asOwner(`select nickname from auth.company`), [
    { nickname: 'empresa-a' },
  ])
})

test('apelido: tomado por outra empresa 409, reservado 422, fora da forma 400', async (t) => {
  const { hub, ana, url } = await companyToSet(t)
  const carla = await personOn(hub, CARLA)
  const other = await plantCompany(hub.test, carla.id, 'Empresa C', null)
  const taken = await call(hub, carla, 'PUT', `/api/companies/${other}/nickname`, {
    nickname: 'metal-nobre',
  })
  assert.equal(taken.statusCode, 200)
  const answers = await Promise.all(
    ['metal-nobre', 'conexus', 'Empresa A', 'ab', 'a--b'].map((nickname) =>
      call(hub, ana, 'PUT', url, { nickname }),
    ),
  )
  assert.deepEqual(
    answers.map((response) => [response.statusCode, codeOf(response)]),
    [
      [409, 'COMPANY_NICKNAME_TAKEN'],
      [422, 'COMPANY_NICKNAME_RESERVED'],
      [400, 'REQUEST_MALFORMED'],
      [400, 'REQUEST_MALFORMED'],
      [400, 'REQUEST_MALFORMED'],
    ],
  )
})

test('apelido: administrador, membro e quem é de outra empresa recebem 404 (S10)', async (t) => {
  const { hub, bruno, davi, url } = await companyToSet(t)
  const carla = await personOn(hub, CARLA)
  await plantCompany(hub.test, carla.id, 'Empresa C')
  for (const person of [bruno, davi, carla]) {
    const answer = await call(hub, person, 'PUT', url, { nickname: 'empresa-a' })
    assert.equal(answer.statusCode, 404)
    assert.equal(codeOf(answer), 'NOT_FOUND')
  }
  assert.deepEqual(
    await hub.test.asOwner(`select nickname from auth.company where name = 'Empresa A'`),
    [{ nickname: null }],
  )
})

test('apelido: duas escolhas juntas do dono, uma vale e a outra encontra o apelido escolhido', async (t) => {
  const { hub, ana, url } = await companyToSet(t)
  const answers = await Promise.all([
    call(hub, ana, 'PUT', url, { nickname: 'empresa-a' }),
    call(hub, ana, 'PUT', url, { nickname: 'empresa-z' }),
  ])
  assert.deepEqual(answers.map((response) => response.statusCode).sort(), [200, 409])
  const [row] = await hub.test.asOwner(`select nickname from auth.company`)
  const winner = answers.find((response) => response.statusCode === 200)
  assert.equal(row?.nickname, Object(winner?.json()).company.nickname)
})

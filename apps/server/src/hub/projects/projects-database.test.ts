import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Hub } from '../identity/test-hub.ts'
import {
  BRUNO,
  CARLA,
  codeOf,
  companyOn,
  memberOn,
  personOn,
  plantCompany,
  post,
} from '../identity/test-hub.ts'

async function twoMembers(t: Parameters<typeof companyOn>[0]) {
  const { hub, companyId } = await companyOn(t)
  const bruno = await memberOn(hub, companyId, BRUNO, 'member')
  const carla = await memberOn(hub, companyId, CARLA, 'member')
  return { hub, bruno, carla, companyId, projects: `/api/companies/${companyId}/projects` }
}

function database(hub: Hub) {
  return hub.test.asOwner(
    `select state, neon_project_id, claimed_until > now() as held from projects.company_database`,
  )
}

test('banco: a recusa entre o Neon e a transação 2, com a mesma chave, deixa um banco, adotado, e um Projeto', async (t) => {
  const { hub, bruno, projects } = await twoMembers(t)
  hub.neon.whenCreated(async () => {
    await hub.test.asOwner(
      `alter table projects.company_database add constraint planted check (state <> 'ready') not valid`,
    )
  })
  const key = '0f1e2d3c-4b5a-4968-8776-655443322110'
  const refused = await post(hub, bruno, projects, { name: 'Pedidos' }, key)
  assert.equal(refused.statusCode, 500)
  assert.deepEqual(await database(hub), [{ state: 'creating', neon_project_id: null, held: false }])
  await hub.test.asOwner(`alter table projects.company_database drop constraint planted`)
  const retried = await post(hub, bruno, projects, { name: 'Pedidos' }, key)
  assert.equal(retried.statusCode, 201)
  assert.equal(hub.neon.projects().length, 1)
  assert.deepEqual(hub.neon.calls, ['find', 'create', 'find'])
  assert.deepEqual(await database(hub), [
    { state: 'ready', neon_project_id: hub.neon.projects()[0]?.id, held: null },
  ])
})

test('banco: duas pessoas sem banco dão um create, a segunda 409 preparando, depois 201', async (t) => {
  const { hub, bruno, carla, projects } = await twoMembers(t)
  const held = hub.neon.hold()
  const first = post(hub, bruno, projects, { name: 'Pedidos' })
  await held.arrived
  const [claim] = await hub.test.asOwner(
    `select extract(epoch from claimed_until - now())::int as seconds from projects.company_database`,
  )
  // The find and the create at their longest, 75 s, and the margin: 80 s.
  assert.ok(Number(claim?.seconds) >= 79 && Number(claim?.seconds) <= 80, String(claim?.seconds))
  const second = await post(hub, carla, projects, { name: 'Estoque' })
  assert.equal(second.statusCode, 409)
  assert.equal(codeOf(second), 'COMPANY_DATABASE_PREPARING')
  held.release()
  assert.equal((await first).statusCode, 201)
  assert.equal((await post(hub, carla, projects, { name: 'Estoque' })).statusCode, 201)
  assert.equal(hub.neon.calls.filter((call) => call === 'create').length, 1)
})

test('banco: a reserva viva recusa e a vencida é assumida', async (t) => {
  const { hub, bruno, projects, companyId } = await twoMembers(t)
  await hub.test.asOwner(
    `insert into projects.company_database (company_id, state, claimed_until)
     values ($1, 'creating', now() + interval '1 minute')`,
    [companyId],
  )
  assert.equal(
    codeOf(await post(hub, bruno, projects, { name: 'Pedidos' })),
    'COMPANY_DATABASE_PREPARING',
  )
  assert.deepEqual(hub.neon.calls, [])
  await hub.test.asOwner(
    `update projects.company_database set claimed_until = now() - interval '1 second'`,
  )
  assert.equal((await post(hub, bruno, projects, { name: 'Pedidos' })).statusCode, 201)
  assert.deepEqual(hub.neon.calls, ['find', 'create'])
})

test('Neon fora: a recusa solta a reserva, e o próximo pedido vai logo', async (t) => {
  const { hub, bruno, projects } = await twoMembers(t)
  hub.neon.script('find', 'REFUSED')
  const refused = await post(hub, bruno, projects, { name: 'Pedidos' })
  assert.equal(refused.statusCode, 503)
  assert.equal(codeOf(refused), 'COMPANY_DATABASE_UNAVAILABLE')
  assert.deepEqual(await database(hub), [{ state: 'creating', neon_project_id: null, held: false }])
  hub.neon.script('create', 'REFUSED')
  assert.equal(
    codeOf(await post(hub, bruno, projects, { name: 'Pedidos' })),
    'COMPANY_DATABASE_UNAVAILABLE',
  )
  assert.equal((await post(hub, bruno, projects, { name: 'Pedidos' })).statusCode, 201)
  assert.equal(hub.neon.projects().length, 1)
})

test('Neon fora: o prazo mantém a reserva até vencer, e o projeto que o Neon fez é adotado', async (t) => {
  const { hub, bruno, projects } = await twoMembers(t)
  hub.neon.script('create', 'NO_ANSWER', true)
  const silent = await post(hub, bruno, projects, { name: 'Pedidos' })
  assert.equal(silent.statusCode, 503)
  assert.equal(codeOf(silent), 'COMPANY_DATABASE_UNAVAILABLE')
  assert.deepEqual(await database(hub), [{ state: 'creating', neon_project_id: null, held: true }])
  assert.equal(
    codeOf(await post(hub, bruno, projects, { name: 'Pedidos' })),
    'COMPANY_DATABASE_PREPARING',
  )
  await hub.test.asOwner(`update projects.company_database set claimed_until = now()`)
  assert.equal((await post(hub, bruno, projects, { name: 'Pedidos' })).statusCode, 201)
  assert.equal(hub.neon.projects().length, 1)
  assert.equal(hub.neon.calls.filter((call) => call === 'create').length, 1)
})

test('Neon fora: dois projetos com o nome exato dão 500 e nenhum Projeto', async (t) => {
  const { hub, bruno, projects, companyId } = await twoMembers(t)
  hub.neon.plant(`cx-${companyId}`)
  hub.neon.plant(`cx-${companyId}`)
  const refused = await post(hub, bruno, projects, { name: 'Pedidos' })
  assert.equal(refused.statusCode, 500)
  assert.deepEqual(await hub.test.asOwner(`select count(*)::int as n from projects.project`), [
    { n: 0 },
  ])
  assert.equal(hub.neon.projects().length, 2)
})

test('banco: duas pessoas ao mesmo tempo, sem banco, nunca dão 500: uma reserva, a outra espera ou volta', async (t) => {
  const { hub } = await companyOn(t)
  for (let round = 0; round < 6; round += 1) {
    const owner = await personOn(hub, { name: `Dono ${round}`, email: `dono${round}@example.test` })
    const companyId = await plantCompany(hub.test, owner.id, `Empresa ${round}`)
    const other = await memberOn(
      hub,
      companyId,
      { name: `Outra ${round}`, email: `outra${round}@example.test` },
      'member',
    )
    const projects = `/api/companies/${companyId}/projects`
    const both = await Promise.all([
      post(hub, owner, projects, { name: 'Pedidos' }),
      post(hub, other, projects, { name: 'Estoque' }),
    ])
    const statuses = both.map((response) => response.statusCode)
    assert.ok(
      statuses.every((status) => status === 201 || status === 409),
      statuses.join(),
    )
    assert.ok(statuses.includes(201), statuses.join())
  }
  assert.equal(hub.neon.calls.filter((call) => call === 'create').length, 6)
})

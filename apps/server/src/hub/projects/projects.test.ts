import assert from 'node:assert/strict'
import { test } from 'node:test'
import { TEST_APPS_DOMAIN } from '../../platform/test-database.ts'
import {
  ANA_OWNER,
  BRUNO,
  CARLA,
  call,
  codeOf,
  companyOn,
  hubWithMail,
  memberOn,
  personOn,
  plantCompany,
  post,
} from '../identity/test-hub.ts'

/** Empresa Teste with Ana its owner and Bruno a member. */
async function companyWithMember(t: Parameters<typeof companyOn>[0]) {
  const { hub, ana, companyId } = await companyOn(t)
  const bruno = await memberOn(hub, companyId, BRUNO, 'member')
  return { hub, ana, bruno, companyId, projects: `/api/companies/${companyId}/projects` }
}

test('criar: o membro cria, só o primeiro Projeto chama o Neon e o banco da empresa fica pronto', async (t) => {
  const { hub, bruno, companyId, projects } = await companyWithMember(t)
  const first = await post(hub, bruno, projects, { name: '  Pedidos ' })
  assert.equal(first.statusCode, 201)
  const { project } = Object(first.json())
  assert.deepEqual(project, {
    id: project.id,
    name: 'Pedidos',
    createdAt: project.createdAt,
    mayDelete: false,
    mayManageVersions: false,
    address: `pedidos--empresa-${companyId.slice(0, 8)}.${TEST_APPS_DOMAIN}`,
  })
  assert.match(project.id, /^[0-9a-f]{32}$/)
  const second = await post(hub, bruno, projects, { name: 'Estoque' })
  assert.equal(second.statusCode, 201)
  assert.deepEqual(hub.neon.calls, ['find', 'create'])
  const [neonProject] = hub.neon.projects()
  assert.equal(neonProject?.name, `empresa-${companyId.slice(0, 8)}-${companyId}`)
  assert.deepEqual(
    await hub.test.asOwner(
      `select state, neon_project_id, claimed_until from projects.company_database`,
    ),
    [{ state: 'ready', neon_project_id: neonProject?.id, claimed_until: null }],
  )
  assert.deepEqual(await hub.test.asOwner(`select name from projects.project order by name`), [
    { name: 'Estoque' },
    { name: 'Pedidos' },
  ])
})

test('criar: membro de outra empresa, quem não é membro e a Central recebem 404 nas quatro rotas', async (t) => {
  const { hub, ana, projects } = await companyWithMember(t)
  const made = await post(hub, ana, projects, { name: 'Pedidos' })
  const url = `${projects}/${Object(made.json()).project.id}`
  const carla = await personOn(hub, CARLA)
  await plantCompany(hub.test, carla.id, 'Outra Empresa')
  const central = await personOn(hub, {
    name: 'Central',
    email: 'central@example.test',
    role: 'admin',
  })
  for (const outsider of [carla, central]) {
    const answers = await Promise.all([
      call(hub, outsider, 'GET', projects),
      call(hub, outsider, 'GET', url),
      post(hub, outsider, projects, { name: 'Invasor' }),
      call(hub, outsider, 'DELETE', url, { name: 'Pedidos' }),
    ])
    assert.deepEqual(
      answers.map((response) => response.statusCode),
      [404, 404, 404, 404],
    )
    assert.deepEqual(answers.map(codeOf), Array(4).fill('NOT_FOUND'))
  }
  assert.equal(hub.neon.calls.filter((name) => name === 'create').length, 1)
  assert.deepEqual(await hub.test.asOwner(`select count(*)::int as n from projects.project`), [
    { n: 1 },
  ])
})

test('repetir: dois cliques com uma chave dão um Projeto; a chave com outro nome é 409', async (t) => {
  const { hub, bruno, projects } = await companyWithMember(t)
  const key = '8f2c1d3e-5a4b-4c6d-9e7f-0a1b2c3d4e5f'
  const [one, two] = await Promise.all([
    post(hub, bruno, projects, { name: 'Pedidos' }, key),
    post(hub, bruno, projects, { name: 'Pedidos' }, key),
  ])
  const statuses = [one.statusCode, two.statusCode].sort()
  assert.ok(statuses[0] === 201 && (statuses[1] === 201 || statuses[1] === 409), String(statuses))
  const again = await post(hub, bruno, projects, { name: 'Pedidos' }, key)
  assert.equal(again.statusCode, 201)
  assert.deepEqual(await hub.test.asOwner(`select count(*)::int as n from projects.project`), [
    { n: 1 },
  ])
  const other = await post(hub, bruno, projects, { name: 'Estoque' }, key)
  assert.equal(other.statusCode, 409)
  assert.equal(codeOf(other), 'IDEMPOTENCY_CONFLICT')
})

test('repetir: o mesmo nome em outra caixa é 409 PROJECT_NAME_TAKEN, também dois ao mesmo tempo', async (t) => {
  const { hub, bruno, projects } = await companyWithMember(t)
  assert.equal((await post(hub, bruno, projects, { name: 'Ação' })).statusCode, 201)
  const taken = await post(hub, bruno, projects, { name: 'AÇÃO' })
  assert.equal(taken.statusCode, 409)
  assert.equal(codeOf(taken), 'PROJECT_NAME_TAKEN')
  const both = await Promise.all([
    post(hub, bruno, projects, { name: 'Estoque' }),
    post(hub, bruno, projects, { name: 'ESTOQUE' }),
  ])
  assert.deepEqual(both.map((response) => response.statusCode).sort(), [201, 409])
  assert.deepEqual(await hub.test.asOwner(`select count(*)::int as n from projects.project`), [
    { n: 2 },
  ])
})

test('criar: a empresa de um dono sem outro membro cria também; o nome vazio é 400', async (t) => {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id)
  const projects = `/api/companies/${companyId}/projects`
  assert.equal((await post(hub, ana, projects, { name: '   ' })).statusCode, 400)
  const made = await post(hub, ana, projects, { name: 'Pedidos' })
  assert.equal(made.statusCode, 201)
  assert.equal(Object(made.json()).project.mayDelete, true)
})

test('endereço: o nome e o apelido; "Acao" após "Ação" é 409, menos de três letras 422, sem apelido 409', async (t) => {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id, 'Empresa A', 'empresa-a')
  const projects = `/api/companies/${companyId}/projects`
  const made = await post(hub, ana, projects, { name: 'Ação' })
  assert.equal(made.statusCode, 201)
  assert.equal(Object(made.json()).project.address, `acao--empresa-a.${TEST_APPS_DOMAIN}`)
  const read = await call(hub, ana, 'GET', `${projects}/${Object(made.json()).project.id}`)
  assert.equal(Object(read.json()).project.address, `acao--empresa-a.${TEST_APPS_DOMAIN}`)
  const answers = await Promise.all(
    ['Acao', 'TI', 'R&D'].map((name) => post(hub, ana, projects, { name })),
  )
  assert.deepEqual(
    answers.map((response) => [response.statusCode, codeOf(response)]),
    [
      [409, 'PROJECT_ADDRESS_TAKEN'],
      [422, 'PROJECT_NAME_NO_ADDRESS'],
      [422, 'PROJECT_NAME_NO_ADDRESS'],
    ],
  )
  const pending = await plantCompany(hub.test, ana.id, 'Empresa B', null)
  const early = await post(hub, ana, `/api/companies/${pending}/projects`, { name: 'Pedidos' })
  assert.equal(early.statusCode, 409)
  assert.equal(codeOf(early), 'COMPANY_SETUP_PENDING')
  assert.deepEqual(hub.neon.calls, ['find', 'create'])
  assert.deepEqual(await hub.test.asOwner(`select name, host_label from projects.project`), [
    { name: 'Ação', host_label: 'acao--empresa-a' },
  ])
})

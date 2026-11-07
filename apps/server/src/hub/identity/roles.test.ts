import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { hasPermission } from 'better-auth/plugins'
import { createTestDatabase, silent, testConfig } from '../../platform/test-database.ts'
import { libraryCommandOn, ORGANIZATION } from './auth.ts'
import { KIT } from './roles.ts'
import { createAuth } from './public.ts'
import type { Hub, Person } from './test-hub.ts'
import {
  ANA_OWNER,
  BRUNO,
  CARLA,
  call,
  codeOf,
  hubWithMail,
  id,
  memberOn,
  personOn,
  plantCompany,
  post,
} from './test-hub.ts'

const OPERATOR = { name: 'Central Conexus', email: 'central@example.test', role: 'admin' }
const ATENDENTE = { label: 'Atendente', connectors: { sankhya: ['pedidos'] } }
const FINANCEIRO = ['contasAReceber', 'contasAPagar']

async function world(t: TestContext) {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id)
  const admin = await memberOn(hub, companyId, CARLA, 'admin')
  const developer = await memberOn(hub, companyId, { name: 'Dora Reis', email: 'dora@example.test' }, 'developer')
  const bruno = await memberOn(hub, companyId, BRUNO, 'member')
  const base = `/api/companies/${companyId}`
  return { hub, ana, admin, developer, bruno, companyId, base }
}
type World = Awaited<ReturnType<typeof world>>

async function roles(w: World, person: Person = w.ana) {
  const response = await call(w.hub, person, 'GET', `${w.base}/roles`)
  assert.equal(response.statusCode, 200)
  return Object(response.json()).roles as {
    role: string
    label: string
    kind: string
    connectors: Record<string, string[]>
    members: number
  }[]
}

function roleOf(list: Awaited<ReturnType<typeof roles>>, name: string) {
  const found = list.find((one) => one.role === name)
  assert.ok(found, name)
  return found
}

const everyOperation = Object.fromEntries(
  KIT.map((connector) => [connector.id, connector.operations.map(({ id }) => id)]),
)
const everyRead = Object.fromEntries(
  KIT.map((connector) => [
    connector.id,
    connector.operations.filter(({ class: kind }) => kind === 'read').map(({ id }) => id),
  ]),
)

test('a soma da linha semeada: o Better Auth soma a linha da empresa ao papel fixo, sob o adaptador Drizzle do Hub', async (t) => {
  const database = await createTestDatabase(t)
  const auth = createAuth({
    database: database.database,
    config: testConfig(database.runtimeUrl),
    log: silent,
  })
  const command = libraryCommandOn(auth, database.database)
  const ownerId = id()
  await database.asOwner('insert into auth.user (id, name, email) values ($1, $1, $2)', [
    ownerId,
    `${ownerId}@example.test`,
  ])
  const companyId = await plantCompany(database, ownerId)
  await database.asOwner(`delete from auth.organization_role where company_id = $1`, [companyId])
  const context = await auth.$context
  const permitted = (permissions: Record<string, string[]>) =>
    command({ kind: 'COMPANY', companyId, personId: ownerId } as never, () =>
      hasPermission(
        { options: ORGANIZATION, organizationId: companyId, role: 'member', permissions },
        { context } as never,
      ),
    )
  const sankhya = { connector_sankhya: ['pedidos'] }
  assert.equal(await permitted(sankhya), false)
  await database.asOwner(
    `insert into auth.organization_role (id, company_id, role, permission, label, created_at)
      values ($1, $2, 'member', $3, 'Membro', now())`,
    [randomUUID(), companyId, JSON.stringify(sankhya)],
  )
  assert.equal(await permitted(sankhya), true)
  assert.equal(await permitted({ connector_sankhya: ['clientes'] }), false)
  assert.equal(await permitted({ assistant: ['ask'] }), true)
})

test('a lista dos papéis: os quatro fixos, Dono e Administrador com toda operação, Desenvolvedor e Membro com toda leitura', async (t) => {
  const w = await world(t)
  const list = await roles(w)
  assert.deepEqual(
    list.map((one) => [one.role, one.label, one.kind, one.members]),
    [
      ['owner', 'Dono', 'ALL', 1],
      ['admin', 'Administrador', 'ALL', 1],
      ['developer', 'Desenvolvedor', 'EDITABLE', 1],
      ['member', 'Membro', 'EDITABLE', 1],
    ],
  )
  assert.deepEqual(roleOf(list, 'owner').connectors, everyOperation)
  assert.deepEqual(roleOf(list, 'admin').connectors, everyOperation)
  assert.deepEqual(roleOf(list, 'developer').connectors, everyRead)
  assert.deepEqual(roleOf(list, 'member').connectors, everyRead)
  assert.deepEqual(await roles(w, w.admin), list)
})

test('criar um papel: dono ou administrador cria Atendente, a lista o traz, e a segunda criação igual não grava', async (t) => {
  const w = await world(t)
  const created = await post(w.hub, w.ana, `${w.base}/roles`, ATENDENTE)
  assert.equal(created.statusCode, 201)
  assert.deepEqual(Object(created.json()).role, {
    role: 'atendente',
    label: 'Atendente',
    kind: 'CUSTOM',
    connectors: { sankhya: ['pedidos'] },
    members: 0,
  })
  const again = await post(w.hub, w.admin, `${w.base}/roles`, { ...ATENDENTE, label: ' atendente ' })
  assert.equal(again.statusCode, 409)
  assert.equal(codeOf(again), 'ROLE_NAME_TAKEN')
  const list = await roles(w)
  assert.equal(list.filter((one) => one.kind === 'CUSTOM').length, 1)
  assert.deepEqual(roleOf(list, 'atendente').connectors, { sankhya: ['pedidos'] })
  const accented = await post(w.hub, w.admin, `${w.base}/roles`, {
    label: 'Gerência Ágil',
    connectors: {},
  })
  assert.equal(Object(accented.json()).role.role, 'gerencia-agil')
  assert.equal(
    (await w.hub.test.asOwner('select count(*)::int as n from auth.organization_role where company_id = $1', [w.companyId]))[0]?.n,
    4,
  )

  await call(w.hub, w.ana, 'PUT', `${w.base}/members/${w.bruno.id}`, {
    role: 'atendente',
    from: 'member',
  })
  const project = await post(w.hub, w.bruno, `${w.base}/projects`, { name: 'Vendas' })
  assert.equal(project.statusCode, 201)
  const company = await call(w.hub, w.bruno, 'GET', w.base)
  assert.equal(Object(company.json()).role, 'atendente')
  assert.deepEqual(Object(company.json()).mayInviteAs, [])
})

test('o papel recusado: quem não gerencia recebe NOT_FOUND, o que o kit não tem é malformado, o nome de um fixo é tomado, Dono e Administrador não mudam, e nada muda', async (t) => {
  const w = await world(t)
  const before = await roles(w)
  const refused = [
    post(w.hub, w.developer, `${w.base}/roles`, ATENDENTE),
    post(w.hub, w.bruno, `${w.base}/roles`, ATENDENTE),
    call(w.hub, w.developer, 'PUT', `${w.base}/roles/member`, { connectors: {} }),
    call(w.hub, w.bruno, 'PUT', `${w.base}/roles/member`, { connectors: {} }),
    call(w.hub, w.developer, 'DELETE', `${w.base}/roles/member`),
    call(w.hub, w.bruno, 'DELETE', `${w.base}/roles/member`),
    call(w.hub, w.bruno, 'GET', `${w.base}/roles`),
  ]
  for (const response of await Promise.all(refused)) {
    assert.equal(response.statusCode, 404)
    assert.equal(codeOf(response), 'NOT_FOUND')
  }
  const malformed = [
    { label: 'Atendente', connectors: { nenhum: ['pedidos'] } },
    { label: 'Atendente', connectors: { sankhya: ['naoExiste'] } },
    { label: 'Atendente', connectors: { 'mercado-livre': ['consultar'] } },
    { label: '!!!', connectors: {} },
  ]
  for (const body of malformed) {
    const response = await post(w.hub, w.ana, `${w.base}/roles`, body)
    assert.equal(response.statusCode, 400, JSON.stringify(body))
    assert.equal(codeOf(response), 'REQUEST_MALFORMED')
  }
  for (const label of ['Owner', 'Admin', 'Developer', 'Member']) {
    const response = await post(w.hub, w.ana, `${w.base}/roles`, { label, connectors: {} })
    assert.equal(codeOf(response), 'ROLE_NAME_TAKEN', label)
  }
  for (const fixed of ['owner', 'admin']) {
    const change = await call(w.hub, w.ana, 'PUT', `${w.base}/roles/${fixed}`, { connectors: {} })
    assert.equal(change.statusCode, 409)
    assert.equal(codeOf(change), 'ROLE_FIXED')
    assert.equal(codeOf(await call(w.hub, w.ana, 'DELETE', `${w.base}/roles/${fixed}`)), 'ROLE_FIXED')
  }
  assert.equal(codeOf(await call(w.hub, w.ana, 'DELETE', `${w.base}/roles/member`)), 'ROLE_FIXED')
  assert.equal(codeOf(await call(w.hub, w.ana, 'PUT', `${w.base}/roles/fantasma`, { connectors: {} })), 'ROLE_NOT_FOUND')
  assert.deepEqual(await roles(w), before)
})

test('mudar o Membro: tirar o Financeiro some da lista, e um papel próprio muda sem perder a base', async (t) => {
  const w = await world(t)
  const without = {
    ...everyRead,
    sankhya: (everyRead.sankhya ?? []).filter((one) => !FINANCEIRO.includes(one)),
  }
  const changed = await call(w.hub, w.admin, 'PUT', `${w.base}/roles/member`, { connectors: without })
  assert.equal(changed.statusCode, 200)
  assert.deepEqual(Object(changed.json()).role.connectors, without)
  const list = await roles(w)
  assert.deepEqual(roleOf(list, 'member').connectors, without)
  assert.deepEqual(roleOf(list, 'developer').connectors, everyRead)

  await post(w.hub, w.ana, `${w.base}/roles`, ATENDENTE)
  const own = await call(w.hub, w.ana, 'PUT', `${w.base}/roles/atendente`, {
    connectors: { sankhya: ['clientes', 'pedidos'], 'mercado-livre': ['conta'] },
  })
  assert.equal(own.statusCode, 200)
  assert.deepEqual(roleOf(await roles(w), 'atendente').connectors, {
    sankhya: ['clientes', 'pedidos'],
    'mercado-livre': ['conta'],
  })
  const [row] = await w.hub.test.asOwner(
    `select permission from auth.organization_role where company_id = $1 and role = 'atendente'`,
    [w.companyId],
  )
  assert.deepEqual(Object(JSON.parse(String(Object(row).permission))).assistant, ['ask'])
})

test('apagar um papel: em uso por uma pessoa ou por um convite não apaga; sem ninguém apaga e a lista não o traz', async (t) => {
  const w = await world(t)
  await post(w.hub, w.ana, `${w.base}/roles`, ATENDENTE)
  const url = `${w.base}/roles/atendente`
  await call(w.hub, w.ana, 'PUT', `${w.base}/members/${w.bruno.id}`, { role: 'atendente', from: 'member' })
  assert.equal(roleOf(await roles(w), 'atendente').members, 1)
  const refused = await call(w.hub, w.ana, 'DELETE', url)
  assert.equal(refused.statusCode, 409)
  assert.equal(codeOf(refused), 'ROLE_IN_USE')
  assert.equal(roleOf(await roles(w), 'atendente').members, 1)

  await call(w.hub, w.ana, 'PUT', `${w.base}/members/${w.bruno.id}`, { role: 'member', from: 'atendente' })
  const invited = await post(w.hub, w.ana, `${w.base}/invitations`, {
    email: 'davi@example.test',
    role: 'atendente',
  })
  assert.equal(invited.statusCode, 201)
  assert.equal(codeOf(await call(w.hub, w.ana, 'DELETE', url)), 'ROLE_IN_USE')
  assert.ok(roleOf(await roles(w), 'atendente'))

  const invitationId = Object(invited.json()).invitation.id
  const canceled = await call(w.hub, w.ana, 'DELETE', `${w.base}/invitations/${invitationId}`, {
    revision: 0,
  })
  assert.ok(canceled.statusCode < 300, String(canceled.body))
  const deleted = await call(w.hub, w.ana, 'DELETE', url)
  assert.equal(deleted.statusCode, 204)
  assert.equal((await roles(w)).some((one) => one.role === 'atendente'), false)
  assert.equal(codeOf(await call(w.hub, w.ana, 'DELETE', url)), 'ROLE_NOT_FOUND')
})

test('a semente: a migração semeia Membro e Desenvolvedor em cada empresa, rodar de novo não duplica, e a empresa nova já nasce com elas', async (t) => {
  const w = await world(t)
  const seed = readdirSync(join(import.meta.dirname, '../../../migrations'))
    .filter((name) => name.endsWith('_company_roles_seed'))
    .map((name) => join(import.meta.dirname, '../../../migrations', name, 'migration.sql'))[0]
  assert.ok(seed)
  const sql = readFileSync(seed, 'utf8')
  await w.hub.test.asOwner('delete from auth.organization_role')
  const rows = () =>
    w.hub.test.asOwner(
      'select company_id, role, label, permission from auth.organization_role order by role',
    )
  await w.hub.test.asOwner(sql)
  const first = await rows()
  assert.deepEqual(
    first.map((row) => [row.company_id, row.role, row.label]),
    [
      [w.companyId, 'developer', 'Desenvolvedor'],
      [w.companyId, 'member', 'Membro'],
    ],
  )
  for (const row of first) assert.deepEqual(JSON.parse(String(row.permission)), seeded(everyRead))
  await w.hub.test.asOwner(sql)
  assert.deepEqual(await rows(), first)

  const central = await personOn(w.hub, OPERATOR)
  const registered = await post(w.hub, central, '/api/clients', {
    cnpj: '12.ABC.345/01DE-35',
    legalName: 'Empresa Nova Ltda',
    name: 'Empresa Nova',
    ownerEmail: 'novo@example.test',
  })
  assert.equal(registered.statusCode, 201)
  const born = await w.hub.test.asOwner(
    'select role from auth.organization_role where company_id = $1 order by role',
    [Object(registered.json()).client.companyId],
  )
  assert.deepEqual(born.map((row) => row.role), ['developer', 'member'])
})

function seeded(reads: Record<string, string[]>) {
  return Object.fromEntries(Object.entries(reads).map(([connector, ids]) => [`connector_${connector}`, ids]))
}

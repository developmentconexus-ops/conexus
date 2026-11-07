import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { createTestDatabase } from '../../platform/test-database.ts'
import { call, codeOf, id, plantCompany, post } from './test-hub.ts'
import {
  ATENDENTE,
  everyOperation,
  everyRead,
  FINANCEIRO,
  memberMay,
  roleOf,
  roles,
  world,
} from './test-roles.ts'

test('a soma da linha semeada: o Better Auth soma a linha da empresa ao papel fixo, sob o adaptador Drizzle do Hub', async (t) => {
  const database = await createTestDatabase(t)
  const ownerId = id()
  await database.asOwner('insert into auth.user (id, name, email) values ($1, $1, $2)', [
    ownerId,
    `${ownerId}@example.test`,
  ])
  const companyId = await plantCompany(database, ownerId)
  await database.asOwner(`delete from auth.organization_role where company_id = $1`, [companyId])
  const permitted = await memberMay(database, companyId, ownerId)
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

test('criar um papel de novo: a mesma chave devolve o mesmo papel, uma linha só, mesmo com a resposta perdida; outro nome ou outros conectores com a chave, 409 IDEMPOTENCY_CONFLICT', async (t) => {
  const w = await world(t)
  const key = randomUUID()
  const first = await post(w.hub, w.ana, `${w.base}/roles`, ATENDENTE, key)
  const lost = await post(w.hub, w.ana, `${w.base}/roles`, ATENDENTE, key)
  assert.deepEqual([first.statusCode, lost.statusCode], [201, 201])
  assert.deepEqual(lost.json(), first.json())
  const renamed = await post(w.hub, w.ana, `${w.base}/roles`, { ...ATENDENTE, label: 'Outro' }, key)
  assert.deepEqual([renamed.statusCode, codeOf(renamed)], [409, 'IDEMPOTENCY_CONFLICT'])
  const narrowed = await post(
    w.hub,
    w.ana,
    `${w.base}/roles`,
    { ...ATENDENTE, connectors: {} },
    key,
  )
  assert.deepEqual([narrowed.statusCode, codeOf(narrowed)], [409, 'IDEMPOTENCY_CONFLICT'])
  const more = { sankhya: ['pedidos', ...FINANCEIRO] }
  const widened = await post(
    w.hub,
    w.ana,
    `${w.base}/roles`,
    { ...ATENDENTE, connectors: more },
    key,
  )
  assert.deepEqual([widened.statusCode, codeOf(widened)], [409, 'IDEMPOTENCY_CONFLICT'])
  const other = await post(w.hub, w.ana, `${w.base}/roles`, ATENDENTE)
  assert.deepEqual([other.statusCode, codeOf(other)], [409, 'ROLE_NAME_TAKEN'])
  assert.equal((await roles(w)).filter((one) => one.kind === 'CUSTOM').length, 1)
})

test('criar um papel: duas tentativas ao mesmo tempo com uma chave fazem um papel só', async (t) => {
  const w = await world(t)
  const key = randomUUID()
  const both = await Promise.all([
    post(w.hub, w.ana, `${w.base}/roles`, ATENDENTE, key),
    post(w.hub, w.admin, `${w.base}/roles`, ATENDENTE, key),
  ])
  assert.deepEqual(
    both.map((one) => one.statusCode),
    [201, 201],
  )
  assert.deepEqual(both[0]?.json(), both[1]?.json())
  assert.equal((await roles(w)).filter((one) => one.kind === 'CUSTOM').length, 1)
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
  const again = await post(w.hub, w.admin, `${w.base}/roles`, {
    ...ATENDENTE,
    label: ' atendente ',
  })
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
    (
      await w.hub.test.asOwner(
        'select count(*)::int as n from auth.organization_role where company_id = $1',
        [w.companyId],
      )
    )[0]?.n,
    4,
  )

  await call(w.hub, w.ana, 'PUT', `${w.base}/members/${w.bruno.id}`, {
    role: 'atendente',
    from: 'member',
  })
  const project = await post(w.hub, w.bruno, `${w.base}/projects`, { name: 'Vendas' })
  assert.equal(project.statusCode, 201)
  const assistant = await call(w.hub, w.bruno, 'GET', `${w.base}/assistant/connections`)
  assert.equal(assistant.statusCode, 200)
  const projectId = Object(project.json()).project.id
  const publishing = await post(w.hub, w.bruno, `${w.base}/projects/${projectId}/publish-request`, {
    number: 1,
    message: 'pode publicar',
  })
  assert.equal(codeOf(publishing), 'APP_VERSION_NOT_FOUND')
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
  for (const label of [
    'Owner',
    'Admin',
    'Developer',
    'Member',
    'Dono',
    'Administrador',
    'Desenvolvedor',
    'Membro',
  ]) {
    const response = await post(w.hub, w.ana, `${w.base}/roles`, { label, connectors: {} })
    assert.equal(codeOf(response), 'ROLE_NAME_TAKEN', label)
  }
  for (const fixed of ['owner', 'admin']) {
    const change = await call(w.hub, w.ana, 'PUT', `${w.base}/roles/${fixed}`, { connectors: {} })
    assert.equal(change.statusCode, 409)
    assert.equal(codeOf(change), 'ROLE_FIXED')
    assert.equal(
      codeOf(await call(w.hub, w.ana, 'DELETE', `${w.base}/roles/${fixed}`)),
      'ROLE_FIXED',
    )
  }
  assert.equal(codeOf(await call(w.hub, w.ana, 'DELETE', `${w.base}/roles/member`)), 'ROLE_FIXED')
  assert.equal(
    codeOf(await call(w.hub, w.ana, 'PUT', `${w.base}/roles/fantasma`, { connectors: {} })),
    'ROLE_NOT_FOUND',
  )
  assert.deepEqual(await roles(w), before)
})

test('mudar o Membro: tirar o Financeiro some da lista, e um papel próprio muda sem perder a base', async (t) => {
  const w = await world(t)
  const without = {
    ...everyRead,
    sankhya: (everyRead.sankhya ?? []).filter((one) => !FINANCEIRO.includes(one)),
  }
  const changed = await call(w.hub, w.admin, 'PUT', `${w.base}/roles/member`, {
    connectors: without,
  })
  assert.equal(changed.statusCode, 200)
  assert.deepEqual(Object(changed.json()).role.connectors, without)
  const list = await roles(w)
  assert.deepEqual(roleOf(list, 'member').connectors, without)
  assert.deepEqual(roleOf(list, 'developer').connectors, everyRead)

  await post(w.hub, w.ana, `${w.base}/roles`, ATENDENTE)
  const own = await call(w.hub, w.ana, 'PUT', `${w.base}/roles/atendente`, {
    connectors: { sankhya: ['clientes', 'pedidos'], 'mercado-livre': ['anuncios'] },
  })
  assert.equal(own.statusCode, 200)
  assert.deepEqual(roleOf(await roles(w), 'atendente').connectors, {
    sankhya: ['clientes', 'pedidos'],
    'mercado-livre': ['anuncios'],
  })
  const [row] = await w.hub.test.asOwner(
    `select permission from auth.organization_role where company_id = $1 and role = 'atendente'`,
    [w.companyId],
  )
  assert.deepEqual(Object(JSON.parse(String(Object(row).permission))).assistant, ['ask'])
})

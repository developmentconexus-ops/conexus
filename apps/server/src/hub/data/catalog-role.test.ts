import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Catalog, OperationId, PersonId } from '@conexus/hub-api'
import type { Place, Principal } from '../access/public.ts'
import { readerAt, versionAt } from '../access/test-principal.ts'
import { call, memberOn, post } from '../identity/test-hub.ts'
import type { CompanyOn } from './test-company.ts'
import { rolesWorld } from './test-company.ts'

const BIA = { name: 'Bia Reis', email: 'bia@example.test' }
const DORA = { name: 'Dora Lima', email: 'dora@example.test' }

function scopeOf(on: CompanyOn, personId: PersonId, place: Place) {
  return readerAt({ companyId: on.companyId, personId, place })
}

async function systemsOf(on: CompanyOn, scope: Principal) {
  return Catalog.parse(await on.hub.data(scope, { thread: null }).describe()).systems
}

function readsOf(
  systems: readonly { connection: string; reads: readonly { operation: string }[] }[],
) {
  return systems.flatMap(({ connection, reads }) =>
    reads.map(({ operation }) => `${connection}:${operation}`),
  )
}

/** A person in a role of the company's own made with no connector, and the role's name. */
async function outsideTheSystem(on: CompanyOn) {
  const made = await post(on.hub, on.ana, `/api/companies/${on.companyId}/roles`, {
    ...{ label: 'Recepção', connectors: {} },
  })
  assert.equal(made.statusCode, 201, made.body)
  const role = String(Object(made.json()).role.role)
  const dora = await memberOn(on.hub, on.companyId, DORA, role)
  return { role, personId: PersonId.parse(dora.id) }
}

function grantSankhya(on: CompanyOn) {
  return on.hub.connectors.grants.grant({
    ...{ companyId: on.companyId, person: { id: on.anaId } },
    ...{ projectId: on.projectId, connectionId: on.connectionId },
  })
}

test('o catálogo de Bruno traz só as leituras ao vivo do papel (1138)', async (t) => {
  const w = await rolesWorld(t)
  const systems = await systemsOf(w.on, scopeOf(w.on, w.brunoId, { kind: 'COMPANY' }))
  assert.equal(systems.length, 1)
  assert.deepEqual(
    systems.map(({ connector, reads, actions }) => ({
      connector,
      reads: reads.map(({ operation }) => operation),
      actions,
    })),
    [{ connector: 'sankhya', reads: ['pedidos'], actions: [] }],
  )
  const named = systems.flatMap(({ reads, actions }) => [...reads, ...actions])
  assert.ok(named.every(({ operation }) => operation !== 'clientes'))
})

test('o catálogo e as ferramentas do Assistente nomeiam as mesmas leituras', async (t) => {
  const w = await rolesWorld(t)
  const admin = await memberOn(w.on.hub, w.on.companyId, BIA, 'admin')
  for (const person of [w.on.anaId, PersonId.parse(admin.id), w.brunoId, w.carlaId]) {
    const scope = scopeOf(w.on, person, { kind: 'COMPANY' })
    const tools = await w.on.hub.connectors.assistant.connections(scope)
    const offered = tools.map(({ connectionId, reads }) => ({ connection: connectionId, reads }))
    assert.deepEqual(
      new Set(readsOf(await systemsOf(w.on, scope))),
      new Set(readsOf(offered)),
      person,
    )
  }
})

test('o papel que não usa o sistema não recebe o sistema', async (t) => {
  const w = await rolesWorld(t)
  const outside = await outsideTheSystem(w.on)
  const scope = scopeOf(w.on, outside.personId, { kind: 'COMPANY' })
  assert.deepEqual(await systemsOf(w.on, scope), [])
  const url = `/api/companies/${w.on.companyId}/roles/${outside.role}`
  const changed = await call(w.on.hub, w.on.ana, 'PUT', url, {
    connectors: { sankhya: ['pedidos'] },
  })
  assert.equal(changed.statusCode, 200, changed.body)
  assert.deepEqual(readsOf(await systemsOf(w.on, scope)), [`${w.on.connectionId}:pedidos`])
})

test('no Projeto, o sistema liberado vem com as leituras do papel', async (t) => {
  const w = await rolesWorld(t)
  const place = { kind: 'PROJECT', projectId: w.on.projectId } as const
  const scope = scopeOf(w.on, w.brunoId, place)
  assert.deepEqual(await systemsOf(w.on, scope), [])
  await grantSankhya(w.on)
  assert.deepEqual(readsOf(await systemsOf(w.on, scope)), [`${w.on.connectionId}:pedidos`])
})

test('declara dentro do papel: o catálogo do agente é o declarado ∩ o papel de quem roda; vazio sem leitura', async (t) => {
  const w = await rolesWorld(t)
  await grantSankhya(w.on)
  const outside = await outsideTheSystem(w.on)
  const declared = [{ connectionId: w.on.connectionId, operation: OperationId.parse('pedidos') }]
  for (const [person, reads] of [
    [w.brunoId, [`${w.on.connectionId}:pedidos`]],
    [outside.personId, []],
  ] as const) {
    const scope = versionAt(
      {
        companyId: w.on.companyId,
        personId: person,
        place: { kind: 'PROJECT', projectId: w.on.projectId },
      },
      declared,
      [w.on.connectionId],
    )
    assert.deepEqual(readsOf(await systemsOf(w.on, scope)), reads, person)
  }
})

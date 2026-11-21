import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import type { PersonId, ReadAnswer } from '@conexus/hub-api'
import { Catalog, PersonId as PersonIdSchema } from '@conexus/hub-api'
import type { Principal } from '../access/public.ts'
import { principalFor } from '../access/public.ts'
import { readerAt, versionAt } from '../access/test-principal.ts'
import type { RolesWorld } from '../copies/test-readers.ts'
import { copyOf, rolesWorld } from '../copies/test-readers.ts'
import { memberOn } from '../identity/test-hub.ts'

const BIA = { name: 'Bia Reis', email: 'bia@example.test' }
const RELEASED = ['sankhya_clientes', 'sankhya_vendas']

/** Bruno in Vendas and Carla in Financeiro, in a Projeto that received sales and clients. */
async function projectWorld(t: TestContext) {
  const w = await rolesWorld(t, 'PLANTED')
  for (const name of RELEASED) {
    await w.on.copies.grant({
      ...{ companyId: w.on.companyId, personId: w.on.anaId },
      ...{ projectId: w.on.projectId, copyId: copyOf(w.copies, name) },
    })
  }
  return w
}

function where(w: RolesWorld, personId: PersonId) {
  const { companyId, projectId } = w.on
  return { companyId, personId, place: { kind: 'PROJECT', projectId } } as const
}

function assistantOf(w: RolesWorld, personId: PersonId): Principal {
  return principalFor({ consumer: 'assistant', ...where(w, personId), choice: { kind: 'ANY' } })
}

function agentOf(w: RolesWorld, personId: PersonId): Principal {
  return versionAt(where(w, personId), [], [])
}

async function tablesOf(w: RolesWorld, principal: Principal) {
  const described = await w.on.hub.data(principal, { thread: null }).describe()
  return Catalog.parse(described).tables.map(({ name }) => name)
}

function loginsAsked(t: TestContext, w: RolesWorld) {
  const reads = t.mock.method(w.on.hub.postgres.companyPostgres, 'readCopies')
  return () =>
    reads.mock.calls.map(({ arguments: [address] }) => new URL(address.reveal()).username)
}

function noRows(answer: ReadAnswer) {
  assert.equal(Object.hasOwn(answer, 'rows'), false, JSON.stringify(answer))
}

test('no Projeto, o catálogo é o que o Projeto recebeu e o papel lê', async (t) => {
  const w = await projectWorld(t)
  for (const principal of [assistantOf(w, w.brunoId), agentOf(w, w.brunoId)])
    assert.deepEqual(await tablesOf(w, principal), ['sankhya_vendas'], principal.consumer)
  const admin = await memberOn(w.on.hub, w.on.companyId, BIA, 'admin')
  for (const person of [w.on.anaId, PersonIdSchema.parse(admin.id)])
    assert.deepEqual(await tablesOf(w, assistantOf(w, person)), RELEASED, person)
})

test('no Projeto, a tabela fora do papel é recusada', async (t) => {
  const w = await projectWorld(t)
  const asked = loginsAsked(t, w)
  const bruno = w.on.hub.data(assistantOf(w, w.brunoId), { thread: null })
  const table = await bruno.read({ kind: 'TABLE', table: 'sankhya_clientes' })
  assert.deepEqual(table, { kind: 'NOT_IN_CATALOG' })
  assert.deepEqual(asked(), [], 'the table outside the role asks the database nothing')
  const query = await bruno.read({ kind: 'QUERY', sql: 'select * from sync.sankhya_clientes' })
  assert.ok(['NOT_IN_ROLE', 'NOT_IN_CATALOG'].includes(query.kind), JSON.stringify(query))
  noRows(query)
})

test('no Projeto, o banco segura o papel e o Hub o lugar', async (t) => {
  const w = await projectWorld(t)
  const asked = loginsAsked(t, w)
  const bruno = w.on.hub.data(assistantOf(w, w.brunoId), { thread: null })
  const who = await bruno.read({ kind: 'QUERY', sql: 'select current_user as login' })
  const role = `conexus_role_${w.vendas.id}`
  assert.ok(who.kind === 'QUERY', JSON.stringify(who))
  assert.deepEqual(who.rows, [[role]])
  const page = await bruno.read({ kind: 'TABLE', table: 'sankhya_vendas' })
  assert.equal(page.kind, 'TABLE', JSON.stringify(page))
  assert.deepEqual(asked(), [role, role], 'the query and the page, both as the role')
  // Vendas reads sankhya_produtos; the Projeto did not receive it.
  const kept = await bruno.read({ kind: 'TABLE', table: 'sankhya_produtos' })
  assert.deepEqual(kept, { kind: 'NOT_IN_CATALOG' })
  const sql = 'select count(*) from sync.sankhya_produtos'
  assert.deepEqual(await bruno.read({ kind: 'QUERY', sql }), { kind: 'NOT_IN_CATALOG' })
})

test('o Builder no Projeto segue a F1', async (t) => {
  const w = await projectWorld(t)
  const bruno = readerAt(where(w, w.brunoId))
  assert.equal(bruno.consumer, 'builder')
  assert.deepEqual(await tablesOf(w, bruno), ['sankhya_vendas'])
  const sample = await w.on.hub
    .data(bruno, { thread: null })
    .read({ kind: 'TABLE', table: 'sankhya_clientes' })
  assert.deepEqual(sample, { kind: 'NOT_IN_CATALOG' })
  assert.deepEqual(await tablesOf(w, readerAt(where(w, w.carlaId))), ['sankhya_clientes'])
})

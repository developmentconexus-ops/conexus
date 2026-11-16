import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import type { ReadAnswer } from '@conexus/hub-api'
import { Catalog, PersonId } from '@conexus/hub-api'
import type { SessionScope } from '../connectors/public.ts'
import type { CopiesOn } from '../copies/test-copies.ts'
import { asSync } from '../copies/test-copies.ts'
import { copyOf, logged, rolesWorld, roleTables, VENDAS } from '../copies/test-readers.ts'
import { memberOn } from '../identity/test-hub.ts'

const BIA = { name: 'Bia Reis', email: 'bia@example.test' }
const JOIN = `select count(*) from sync.sankhya_vendas v
  join sync.sankhya_clientes c on c."CODPARC" = v."CODPARC"`

function scopeOf(on: CopiesOn, personId: PersonId, place: SessionScope['place']): SessionScope {
  return { companyId: on.companyId, personId, place, chosen: [] }
}

function inCompany(on: CopiesOn, personId: PersonId) {
  return on.hub.data(scopeOf(on, personId, { kind: 'COMPANY' }))
}

async function tablesOf(on: CopiesOn, personId: PersonId, place: SessionScope['place']) {
  const described = await on.hub.data(scopeOf(on, personId, place)).describe()
  return Catalog.parse(described).tables.map(({ name }) => name)
}

function loginsAsked(t: TestContext, on: CopiesOn) {
  const reads = t.mock.method(on.hub.postgres.companyPostgres, 'readCopies')
  return () =>
    reads.mock.calls.map(({ arguments: [address] }) => new URL(address.reveal()).username)
}

function rowsOf(answer: ReadAnswer) {
  assert.equal(answer.kind, 'QUERY', JSON.stringify(answer))
  assert.ok(answer.kind === 'QUERY')
  return answer.rows
}

test('o catálogo de um papel lista exatamente as tabelas que o login do papel lê', async (t) => {
  const w = await rolesWorld(t, 'PLANTED')
  const bruno = await tablesOf(w.on, w.brunoId, { kind: 'COMPANY' })
  assert.deepEqual(bruno, VENDAS)
  assert.deepEqual(bruno, await roleTables(w.on, w.vendas.id))
  const carla = await tablesOf(w.on, w.carlaId, { kind: 'COMPANY' })
  assert.deepEqual(carla, ['sankhya_clientes'])
  assert.deepEqual(carla, await roleTables(w.on, w.financeiro.id))
})

test('a tabela que o papel não lê não aparece no catálogo', async (t) => {
  const w = await rolesWorld(t, 'PLANTED')
  const described = await inCompany(w.on, w.brunoId).describe()
  const tables = Catalog.parse(described).tables
  assert.ok(!JSON.stringify(tables).includes('sankhya_clientes'))
  assert.ok(tables.every(({ label }) => label !== 'Clientes'))
})

test('Bruno pede sankhya_clientes pelo nome e recebe NOT_IN_CATALOG, sem linha, a mesma resposta de sankhya_nao_existe', async (t) => {
  const w = await rolesWorld(t, 'PLANTED')
  const asked = loginsAsked(t, w.on)
  const data = inCompany(w.on, w.brunoId)
  const hidden = await data.read({ kind: 'TABLE', table: 'sankhya_clientes' })
  assert.deepEqual(hidden, { kind: 'NOT_IN_CATALOG' })
  assert.deepEqual(await data.read({ kind: 'TABLE', table: 'sankhya_nao_existe' }), hidden)
  assert.deepEqual(asked(), [])
})

test('uma consulta de Bruno que junta vendas e clientes é recusada pelo banco e não devolve linha', async (t) => {
  const w = await rolesWorld(t, 'PLANTED')
  const answer = await inCompany(w.on, w.brunoId).read({ kind: 'QUERY', sql: JOIN })
  assert.deepEqual(answer, { kind: 'NOT_IN_ROLE' })
})

test('DATA_READ_REFUSED leva a pessoa e não leva a consulta', async (t) => {
  const w = await rolesWorld(t, 'PLANTED')
  await inCompany(w.on, w.brunoId).read({ kind: 'QUERY', sql: JOIN })
  assert.deepEqual(logged(w.on, 'DATA_READ_REFUSED'), [
    { companyId: w.on.companyId, personId: w.brunoId },
  ])
  assert.ok(!JSON.stringify(w.on.hub.lines).includes('sankhya_clientes c'))
})

test('o papel lê com o seu login e o dono com conexus_read', async (t) => {
  const w = await rolesWorld(t, 'PLANTED')
  const asked = loginsAsked(t, w.on)
  const bruno = inCompany(w.on, w.brunoId)
  const page = await bruno.read({ kind: 'TABLE', table: 'sankhya_vendas' })
  assert.equal(page.kind, 'TABLE', JSON.stringify(page))
  assert.ok(page.kind === 'TABLE' && page.rows.length === 183)
  rowsOf(await bruno.read({ kind: 'QUERY', sql: 'select count(*) from sync.sankhya_vendas' }))
  const role = `conexus_role_${w.vendas.id}`
  assert.deepEqual(asked(), [role, role])
  rowsOf(await inCompany(w.on, w.on.anaId).read({ kind: 'QUERY', sql: JOIN }))
  assert.deepEqual(asked(), [role, role, 'conexus_read'])
})

test('o banco que perdeu o GRANT é consertado na primeira leitura', async (t) => {
  const w = await rolesWorld(t, 'PLANTED')
  await asSync(w.on.owner, (client) =>
    client.query(`revoke select on sync.sankhya_vendas from "conexus_role_${w.vendas.id}"`),
  )
  const sql = 'select count(*)::int as n from sync.sankhya_vendas'
  assert.deepEqual(rowsOf(await inCompany(w.on, w.brunoId).read({ kind: 'QUERY', sql })), [[183]])
  assert.deepEqual(logged(w.on, 'COPY_READERS_REPAIRED'), [
    { companyId: w.on.companyId, roleId: w.vendas.id },
  ])
})

test('o dono lê tudo com conexus_read', async (t) => {
  const w = await rolesWorld(t, 'PLANTED')
  const admin = await memberOn(w.on.hub, w.on.companyId, BIA, 'admin')
  for (const person of [w.on.anaId, PersonId.parse(admin.id)]) {
    assert.deepEqual(await tablesOf(w.on, person, { kind: 'COMPANY' }), [
      'sankhya_clientes',
      ...VENDAS,
    ])
    assert.ok(rowsOf(await inCompany(w.on, person).read({ kind: 'QUERY', sql: JOIN })).length > 0)
  }
})

test('no Projeto, o catálogo traz as cópias liberadas e o login é o do Projeto', async (t) => {
  const w = await rolesWorld(t, 'PLANTED')
  for (const name of ['sankhya_vendas', 'sankhya_clientes']) {
    await w.on.copies.grant({
      ...{ companyId: w.on.companyId, personId: w.on.anaId },
      ...{ projectId: w.on.projectId, copyId: copyOf(w.copies, name) },
    })
  }
  const place = { kind: 'PROJECT', projectId: w.on.projectId } as const
  assert.deepEqual(await tablesOf(w.on, w.brunoId, place), ['sankhya_clientes', 'sankhya_vendas'])
  const asked = loginsAsked(t, w.on)
  const project = w.on.hub.data(scopeOf(w.on, w.brunoId, place))
  rowsOf(await project.read({ kind: 'QUERY', sql: JOIN }))
  const host = new URL(w.on.owner.reveal()).hostname
  const login = await w.on.hub.postgres.companyPostgres.readAddress(host, w.on.projectId)
  assert.deepEqual(asked(), [new URL(login.reveal()).username])
})

test('decisão D: o login do papel lê os nomes de sync em pg_class e não as linhas', async (t) => {
  const w = await rolesWorld(t, 'PLANTED')
  const bruno = inCompany(w.on, w.brunoId)
  const names = await bruno.read({
    kind: 'QUERY',
    sql: "select relname from pg_class where relnamespace = 'sync'::regnamespace",
  })
  assert.ok(rowsOf(names).some(([relname]) => relname === 'sankhya_clientes'))
  assert.deepEqual(
    await bruno.read({ kind: 'QUERY', sql: 'select count(*) from sync.sankhya_clientes' }),
    { kind: 'NOT_IN_ROLE' },
  )
})

test('a recusa que repete depois do conserto não devolve linha', async (t) => {
  const w = await rolesWorld(t, 'PLANTED')
  await asSync(w.on.owner, (client) =>
    client.query(`revoke select on sync.sankhya_vendas from "conexus_role_${w.vendas.id}"`),
  )
  t.mock.method(w.on.hub.postgres.companyPostgres, 'reconcileReaders', async () => ({
    kind: 'DONE' as const,
    value: [],
  }))
  const bruno = inCompany(w.on, w.brunoId)
  assert.deepEqual(await bruno.read({ kind: 'TABLE', table: 'sankhya_vendas' }), {
    kind: 'TABLE_UNAVAILABLE',
  })
  assert.deepEqual(
    logged(w.on, 'DATA_ROWS_FAILED').map(({ reason }) => reason),
    ['NOT_IN_ROLE'],
  )
  assert.deepEqual(await bruno.read({ kind: 'QUERY', sql: 'select * from sync.sankhya_vendas' }), {
    kind: 'NOT_IN_ROLE',
  })
})

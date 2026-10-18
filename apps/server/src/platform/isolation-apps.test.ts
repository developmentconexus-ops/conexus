import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, PersonId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import { createTestDatabase } from './test-database.ts'

// Two companies with an addressed Project each, written as the owner; each check runs through a
// scope or the Hub's login with no filter of ours (decision 0039, B3 and B4; step 8, criterion 3).
const A = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const B = CompanyId.parse('companyBBBBBBBBBBBBBBBBBBBBBBBBB')
const ANA = PersonId.parse('person-a')

const SEED = `
  insert into auth."user"(id, name, email) values ('person-a', 'Ana', 'ana@example.test');
  insert into auth.company(id, name, slug, created_at, attempt_key, nickname) values
    ('${A}', 'Empresa A', 'key-a', now(), 'key-a', null),
    ('${B}', 'Empresa B', 'key-b', now(), 'key-b', 'empresa-b');
  insert into projects.project(id, company_id, name, attempt_key, created_at, host_label) values
    ('project-b', '${B}', 'Pedidos', 'key-b', now(), 'pedidos--empresa-b');`

function refusedWith(sqlstate: string) {
  return (error: unknown) => {
    assert.ok(error instanceof Error && error.cause instanceof Error && 'code' in error.cause)
    assert.equal(error.cause.code, sqlstate)
    return true
  }
}

test('apps: sem filtro, a empresa grava só o próprio apelido e endereço, e não alcança passagens', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  function inA(statement: ReturnType<typeof sql>) {
    return database.command({ kind: 'COMPANY', companyId: A, personId: ANA }, (tx) =>
      tx.execute(statement),
    )
  }
  const named = await inA(sql`update auth.company set nickname = 'empresa-a' returning id`)
  assert.deepEqual(named.rows, [{ id: A }])
  await assert.rejects(
    inA(sql`update auth.company set name = 'Outra' where id = ${A}`),
    refusedWith('42501'),
  )
  await assert.rejects(
    inA(sql`insert into projects.project(id, company_id, name, attempt_key, created_at, host_label)
      values ('planted', ${B}, 'Vendas', 'planted', now(), 'vendas--empresa-b')`),
    refusedWith('42501'),
  )
  await assert.rejects(
    inA(sql`update projects.project set host_label = 'outro--empresa-b'`),
    refusedWith('42501'),
  )
  await assert.rejects(inA(sql`select * from apps.handoff`), refusedWith('42501'))
  await assert.rejects(
    inA(sql`select * from projects.project_of_host('pedidos--empresa-b')`),
    refusedWith('42501'),
  )
  assert.deepEqual(await asOwner(`select id, nickname from auth.company order by id`), [
    { id: A, nickname: 'empresa-a' },
    { id: B, nickname: 'empresa-b' },
  ])
})

test('apps: a função dá ao login do Hub só o Projeto e a empresa de um endereço', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  function asHub(statement: ReturnType<typeof sql>) {
    return database.installation((tx) => tx.execute(statement))
  }
  const found = await asHub(sql`select * from projects.project_of_host('pedidos--empresa-b')`)
  assert.deepEqual(found.rows, [{ project_id: 'project-b', company_id: B }])
  const unknown = await asHub(sql`select * from projects.project_of_host('vendas--empresa-b')`)
  assert.deepEqual(unknown.rows, [])
  await assert.rejects(asHub(sql`select name from projects.project`), refusedWith('42501'))
  await assert.rejects(
    asHub(sql`update auth.company set nickname = 'tomado' where id = ${A}`),
    refusedWith('42501'),
  )
})

test('apps: um apelido e um endereço valem para uma só empresa e um só Projeto', async (t) => {
  const { asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  await assert.rejects(
    asOwner(`insert into auth.company(id, name, slug, created_at, attempt_key, nickname)
      values ('companyCCCCCCCCCCCCCCCCCCCCCCCCC', 'Empresa C', 'key-c', now(), 'key-c', 'empresa-b')`),
    /company_nickname_key/,
  )
  await assert.rejects(
    asOwner(`insert into projects.project(id, company_id, name, attempt_key, created_at, host_label)
      values ('project-a', '${A}', 'Pedidos', 'key-a', now(), 'pedidos--empresa-b')`),
    /project_host_label_key/,
  )
})

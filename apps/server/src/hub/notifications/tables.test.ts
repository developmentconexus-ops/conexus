import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { CompanyId, PersonId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import { createTestDatabase } from '../../platform/test-database.ts'

const A = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAAAAA'.slice(0, 32))
const B = CompanyId.parse('companyBBBBBBBBBBBBBBBBBBBBBBBBBBBB'.slice(0, 32))
const ANA = PersonId.parse('person-ana')
const BIA = PersonId.parse('person-bia')
const ANA_IN_A = { kind: 'COMPANY', companyId: A, personId: ANA } as const
const BIA_IN_A = { kind: 'COMPANY', companyId: A, personId: BIA } as const
const NO_ONE_IN_A = { kind: 'COMPANY', companyId: A, personId: null } as const

/** Two companies, Ana in both and Bia in the first, a notification of each of the three. */
async function seeded(t: Parameters<typeof createTestDatabase>[0]) {
  const test = await createTestDatabase(t)
  for (const [id, name] of [
    [ANA, 'Ana'],
    [BIA, 'Bia'],
  ]) {
    await test.asOwner('insert into auth.user (id, name, email) values ($1, $2, $3)', [
      id,
      name,
      `${id}@example.test`,
    ])
  }
  for (const [company, nickname] of [
    [A, 'empresa-a'],
    [B, 'empresa-b'],
  ]) {
    await test.asOwner(
      `insert into auth.company (id, name, slug, created_at, attempt_key, nickname)
        values ($1, $1, $1, now(), $1, $2)`,
      [company, nickname],
    )
  }
  for (const [company, person] of [
    [A, ANA],
    [A, BIA],
    [B, ANA],
  ]) {
    await test.asOwner(
      `insert into auth.member (id, company_id, user_id, role, created_at)
        values ($1, $2, $3, 'owner', now())`,
      [randomUUID(), company, person],
    )
  }
  for (const [company, person] of [
    [A, ANA],
    [A, BIA],
    [B, ANA],
  ]) {
    await test.asOwner(
      `insert into notifications.notification
         (id, company_id, person_id, kind, automation_id, automation_name, run_id, created_at)
       values ($1::uuid, $2, $3, 'AUTOMATION_PAUSED', 'automation', 'Resumo', $1::text, now())`,
      [randomUUID(), company, person],
    )
  }
  return test
}

/** The database refuses with 42501, the error behind the Failure the module throws. */
function refused(error: unknown) {
  assert.ok(error instanceof Error && error.cause instanceof Error && 'code' in error.cause)
  assert.equal(error.cause.code, '42501')
  return true
}

type Seeded = Awaited<ReturnType<typeof seeded>>

function ownersIn(database: Seeded['database'], scope: typeof ANA_IN_A | typeof NO_ONE_IN_A) {
  return database.read(
    scope,
    async (tx) =>
      (await tx.execute(sql`select person_id, company_id from notifications.notification`)).rows,
  )
}

function rowOf(person: string) {
  return sql`insert into notifications.notification
      (id, company_id, person_id, kind, automation_id, automation_name, run_id, created_at)
    values (${randomUUID()}, ${A}, ${person}, 'AUTOMATION_PAUSED', 'automation', 'Resumo', ${randomUUID()}, now())`
}

test('a política: cada pessoa lê e marca só as suas, na sua empresa; nenhuma sem pessoa; o mais, o login do Hub não faz', async (t) => {
  const { database, asOwner } = await seeded(t)
  assert.deepEqual(await ownersIn(database, ANA_IN_A), [{ person_id: ANA, company_id: A }])
  assert.deepEqual(await ownersIn(database, BIA_IN_A), [{ person_id: BIA, company_id: A }])
  assert.deepEqual(await ownersIn(database, NO_ONE_IN_A), [])

  const marked = await database.command(BIA_IN_A, async (tx) =>
    tx.execute(sql`update notifications.notification set read_at = now() returning person_id`),
  )
  assert.deepEqual(marked.rows, [{ person_id: BIA }], 'só a dela')
  assert.deepEqual(
    await asOwner('select person_id from notifications.notification where read_at is not null'),
    [{ person_id: BIA }],
  )

  await assert.rejects(
    database.command(ANA_IN_A, (tx) => tx.execute(rowOf(BIA))),
    refused,
  )
  for (const change of [
    sql`update notifications.notification set kind = 'AUTOMATION_DONE'`,
    sql`update notifications.notification set person_id = ${BIA}`,
    sql`delete from notifications.notification`,
  ]) {
    await assert.rejects(
      database.command(ANA_IN_A, (tx) => tx.execute(change)),
      refused,
    )
  }
})

test('o que cada tipo carrega: a conversa no pronta, um código conhecido no falhou, nenhum dos dois na pausa; o mais o banco recusa', async (t) => {
  const { asOwner } = await seeded(t)
  function insert(kind: string, conversation: string | null, code: string | null) {
    return asOwner(
      `insert into notifications.notification
         (id, company_id, person_id, kind, automation_id, automation_name, conversation_id, failure_code, run_id, created_at)
       values ($1::uuid, $2, $3, $4, 'automation', 'Resumo', $5::uuid, $6, $1::text, now())`,
      [randomUUID(), A, ANA, kind, conversation, code],
    )
  }
  function checked(name: string) {
    return (error: unknown) => {
      assert.ok(error instanceof Error && 'constraint' in error)
      assert.equal(error.constraint, name)
      return true
    }
  }
  const conversation = randomUUID()
  await assert.rejects(insert('AUTOMATION_DONE', null, null), checked('notification_done'))
  await assert.rejects(
    insert('AUTOMATION_DONE', conversation, 'MODEL_CALL_FAILED'),
    checked('notification_done'),
  )
  await assert.rejects(insert('AUTOMATION_FAILED', null, null), checked('notification_failed'))
  await assert.rejects(insert('AUTOMATION_FAILED', null, 'NOPE'), checked('notification_failed'))
  await assert.rejects(
    insert('AUTOMATION_PAUSED', conversation, null),
    checked('notification_paused'),
  )
  await assert.rejects(
    insert('AUTOMATION_PAUSED', null, 'MODEL_CALL_FAILED'),
    checked('notification_paused'),
  )
  await insert('AUTOMATION_DONE', conversation, null)
  await insert('AUTOMATION_FAILED', null, 'MODEL_CALL_FAILED')
  await insert('AUTOMATION_FAILED', conversation, 'MACHINE_LOST')
  await insert('AUTOMATION_PAUSED', null, null)
})

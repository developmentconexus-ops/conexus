import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, PersonId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import { createTestDatabase } from '../../platform/test-database.ts'

const A = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const B = CompanyId.parse('companyBBBBBBBBBBBBBBBBBBBBBBBBB')
const ANA = PersonId.parse('person-a')
const VERSION = '00000000-0000-4000-8000-0000000000a1'
const CONNECTION = '00000000-0000-4000-8000-00000000000a'

const SEED = `
  insert into auth.company(id, name, slug, created_at, attempt_key) values
    ('${A}', 'Empresa A', 'key-a', now(), 'key-a'), ('${B}', 'Empresa B', 'key-b', now(), 'key-b');`

/** A record of a send: by a version (agent uuid and number) or by a person talking to a draft. */
function record(
  company: string,
  call: string,
  speaker: [string | null, number | null, string | null],
  state = 'SENDING',
) {
  const [agent, number, person] = speaker.map((value) => (value === null ? 'null' : `'${value}'`))
  return `insert into connectors.connector_write(company_id, thread_id, tool_call_id, connection_id,
    operation_id, input_hash, agent_id, version_number, person_id, state, created_at) values
    ('${company}', 'thread-1', '${call}', '${CONNECTION}', 'lancarPedido', 'hash-1', ${agent},
     ${number}, ${person}, '${state}', now())`
}

const BY_VERSION: [string, number, null] = [VERSION, 1, null]
const BY_PERSON: [null, null, string] = [null, null, 'person-a']

test('o registro de um envio: uma conversa e um toolCallId só uma vez, de uma versão ou de uma pessoa, em um estado conhecido', async (t) => {
  const { asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  await asOwner(record(A, 'call-1', BY_VERSION))
  await asOwner(record(A, 'call-2', BY_PERSON))
  await asOwner(record(B, 'call-1', BY_VERSION))
  await assert.rejects(asOwner(record(A, 'call-1', BY_PERSON)), {
    code: '23505',
    constraint: 'connector_write_pkey',
  })
  for (const speaker of [
    [VERSION, 1, 'person-a'],
    [null, null, null],
    [VERSION, null, null],
    [null, 1, 'person-a'],
  ] as const)
    await assert.rejects(asOwner(record(A, 'call-3', [...speaker])), {
      code: '23514',
      constraint: 'connector_write_speaker',
    })
  await assert.rejects(asOwner(record(A, 'call-3', BY_VERSION, 'SENT')), {
    code: '23514',
    constraint: 'connector_write_state',
  })
})

test('o registro de um envio: a empresa lê e grava só o seu, termina só o estado e a resposta, e não apaga', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  await asOwner(record(B, 'call-1', BY_VERSION))
  function as(company: CompanyId, statement: string) {
    const run = sql.raw(statement)
    return database.command({ kind: 'COMPANY', companyId: company, personId: ANA }, (tx) =>
      tx.execute(run),
    )
  }
  function denied(error: unknown) {
    assert.ok(error instanceof Error && error.cause instanceof Error && 'code' in error.cause)
    assert.equal(error.cause.code, '42501')
    return true
  }
  await as(A, record(A, 'call-1', BY_VERSION))
  await assert.rejects(as(A, record(B, 'call-2', BY_VERSION)), denied)
  const count = 'select count(*)::int as n from connectors.connector_write'
  assert.deepEqual((await as(A, count)).rows, [{ n: 1 }])
  assert.deepEqual((await as(B, count)).rows, [{ n: 1 }])
  const finish = `update connectors.connector_write set state = 'DONE', answer = '{"codigoPedido":1}'`
  assert.equal((await as(A, `${finish} returning 1`)).rows.length, 1)
  assert.equal((await as(A, `${finish} where company_id = '${B}' returning 1`)).rows.length, 0)
  for (const column of ["input_hash = 'other'", "operation_id = 'other'", `person_id = 'person-a'`])
    await assert.rejects(as(A, `update connectors.connector_write set ${column}`), denied)
  await assert.rejects(as(A, 'delete from connectors.connector_write'), denied)
})

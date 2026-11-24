import assert from 'node:assert/strict'
import { CompanyId, PersonId } from '@conexus/hub-api'
import { createTestDatabase } from '../../platform/test-database.ts'

export const A = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
export const B = CompanyId.parse('companyBBBBBBBBBBBBBBBBBBBBBBBBB')
export const ANA = PersonId.parse('person-a')
export const BRUNO = PersonId.parse('person-b')
export const CONNECTION_A1 = '00000000-0000-4000-8000-0000000000a1'
export const CONNECTION_A2 = '00000000-0000-4000-8000-0000000000a2'
export const CONNECTION_B1 = '00000000-0000-4000-8000-0000000000b1'
export const RUN_A1 = '00000000-0000-4000-8000-0000000001a1'
export const RUN_B1 = '00000000-0000-4000-8000-0000000001b1'
export const TABLE_A1 = '00000000-0000-4000-8000-0000000002a1'
export const TABLE_A2 = '00000000-0000-4000-8000-0000000002a2'
export const TABLE_B1 = '00000000-0000-4000-8000-0000000002b1'

export const SEED = `
  insert into auth."user"(id, name, email) values
    ('person-a', 'Ana', 'ana@example.test'), ('person-b', 'Bruno', 'bruno@example.test');
  insert into auth.company(id, name, slug, created_at, attempt_key) values
    ('${A}', 'Empresa A', 'key-a', now(), 'key-a'), ('${B}', 'Empresa B', 'key-b', now(), 'key-b');
  insert into auth.member(id, company_id, user_id, role, created_at) values
    ('member-a', '${A}', 'person-a', 'owner', now()), ('member-b', '${B}', 'person-b', 'owner', now());
  insert into connectors.connection(id, company_id, connector_id, name, connector_version, state,
    sealed, key_id, linked_by, linked_at, attempt_key) values
    ('${CONNECTION_A1}', '${A}', 'sankhya', 'Matriz', '1.0.0', 'ACTIVE', '\\x01', 'k1', 'person-a', now(), 'a1'),
    ('${CONNECTION_A2}', '${A}', 'hubspot', 'Vendas', '1.0.0', 'ACTIVE', '\\x01', 'k1', 'person-a', now(), 'a2'),
    ('${CONNECTION_B1}', '${B}', 'sankhya', 'Matriz', '1.0.0', 'ACTIVE', '\\x01', 'k1', 'person-b', now(), 'b1');`

export function copyOf(company: string, connector: string, connection: string, interval = '24h') {
  return `insert into copies.lake_copy(company_id, connector_id, connection_id, interval, created_at)
    values ('${company}', '${connector}', '${connection}', '${interval}', now())`
}

export function tableOf(
  id: string,
  company: string,
  connection: string,
  source: string,
  name: string,
  columns = '[]',
) {
  return `insert into copies.lake_table(id, company_id, connection_id, source_table, name, label, columns)
    values ('${id}', '${company}', '${connection}', '${source}', '${name}', 'Notas', '${columns}'::jsonb)`
}

export function runOf(id: string, company: string, connection: string, extra = '', open = true) {
  const ended = open ? 'null, null' : `now(), 'COMPLETE'`
  return `insert into copies.lake_run(id, company_id, connection_id, started_at, ended_at, outcome, whole, attempt)
    values ('${id}', '${company}', '${connection}', now(), ${ended}, false, 1) ${extra}`
}

export function refusedWith(sqlstate: string) {
  return (error: unknown) => {
    assert.ok(error instanceof Error && error.cause instanceof Error && 'code' in error.cause)
    assert.equal(error.cause.code, sqlstate)
    return true
  }
}

export async function seeded(t: Parameters<typeof createTestDatabase>[0]) {
  const test = await createTestDatabase(t)
  await test.asOwner(SEED)
  return test
}

export async function freshRun(
  asOwner: (statement: string) => Promise<unknown>,
  company: string,
  connection: string,
) {
  const id = crypto.randomUUID()
  await asOwner(
    `update copies.lake_run set ended_at = now(), outcome = 'COMPLETE' where connection_id = '${connection}' and ended_at is null`,
  )
  await asOwner(runOf(id, company, connection))
  return id
}

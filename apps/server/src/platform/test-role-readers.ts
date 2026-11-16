import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { RoleId } from '@conexus/hub-api'
import pg from 'pg'
import { testAppsConfig } from './test-cloudflare.ts'
import {
  createCompanyDatabase,
  roleLoginOf,
  syncLoginOf,
  testCompanyPostgres,
} from './test-company-postgres.ts'

export const KEY = testAppsConfig().appLoginKey
export const postgres = testCompanyPostgres(KEY)

export type DatabaseUrl = Awaited<ReturnType<typeof createCompanyDatabase>>
type CopyTable = Parameters<typeof postgres.ensureCopyTable>[1]
type Wanted = Parameters<typeof postgres.reconcileReaders>[2]

export function loginOf(roleId: RoleId) {
  return `conexus_role_${roleId}`
}

export function libraryRole() {
  return RoleId.parse(randomBytes(16).toString('hex').replace(/^./, 'R'))
}

export function seededRole() {
  return RoleId.parse(randomUUID())
}

const ONE_COLUMN = {
  columns: [{ name: 'id', type: 'text' }],
  key: ['id'],
  changedSince: null,
} as const

export function tableOf(name: string): CopyTable {
  return { name, definition: ONE_COLUMN, accounts: false, instants: 'OFFSET' }
}

export async function asUrl(url: DatabaseUrl, ...texts: string[]) {
  const client = new pg.Client({ connectionString: url.reveal() })
  await client.connect()
  const answers: (unknown[] | { refused: string })[] = []
  try {
    for (const text of texts) {
      try {
        answers.push((await client.query(text)).rows)
      } catch (error) {
        if (!(error instanceof pg.DatabaseError) || error.code === undefined) throw error
        answers.push({ refused: error.code })
      }
    }
    return answers
  } finally {
    await client.end()
  }
}

export async function asRole(owner: DatabaseUrl, roleId: RoleId, ...texts: string[]) {
  return asUrl(await roleLoginOf(owner, KEY, roleId), ...texts)
}

export function reads(owner: DatabaseUrl, roleId: RoleId, ...names: string[]) {
  return asRole(owner, roleId, ...names.map((name) => `select * from sync.${name}`))
}

export async function asSync(owner: DatabaseUrl, text: string) {
  const [answer] = await asUrl(await syncLoginOf(owner, KEY), text)
  return answer
}

export async function companyOf(t: TestContext, tables: readonly string[] = ['a', 'b', 'c']) {
  const owner = await createCompanyDatabase(t)
  assert.equal((await postgres.ensureSync(owner)).kind, 'DONE')
  const sync = await syncLoginOf(owner, KEY)
  for (const name of tables) {
    assert.equal((await postgres.ensureCopyTable(sync, tableOf(name))).kind, 'DONE')
  }
  assert.equal((await postgres.ensureReader(owner)).kind, 'DONE')
  return { owner, sync }
}

export async function ticketOf(owner: DatabaseUrl): Promise<bigint> {
  const taken = await postgres.takeReadersTicket(owner)
  assert.equal(taken.kind, 'DONE', JSON.stringify(taken))
  return taken.kind === 'DONE' ? BigInt(String(taken.value.at(-1)?.[0]?.ticket)) : 0n
}

export async function applied(owner: DatabaseUrl, wanted: Wanted) {
  const done = await postgres.reconcileReaders(owner, await ticketOf(owner), wanted)
  assert.equal(done.kind, 'DONE', JSON.stringify(done))
}

export async function grantsOf(owner: DatabaseUrl) {
  const [tables, logins] = await asUrl(
    owner,
    `select c.relname, r.rolname from pg_class c, aclexplode(c.relacl) a
       join pg_roles r on r.oid = a.grantee
      where c.relnamespace = 'sync'::regnamespace and r.rolname like 'conexus\\_role\\_%'
        and a.privilege_type = 'SELECT' order by 1, 2`,
    `select rolname, rolconfig from pg_roles where rolname like 'conexus\\_role\\_%'
        and has_schema_privilege(oid, 'sync', 'USAGE') order by 1`,
  )
  return { tables: Array.isArray(tables) ? tables : [], logins }
}

export function ledgerOf(owner: DatabaseUrl) {
  return asSync(owner, 'select single, ticket from sync._readers_applied')
}

export async function loginExists(owner: DatabaseUrl, login: string) {
  const [rows] = await asUrl(owner, `select 1 from pg_roles where rolname = '${login}'`)
  return Array.isArray(rows) && rows.length === 1
}

export const REFUSED = { refused: '42501' }

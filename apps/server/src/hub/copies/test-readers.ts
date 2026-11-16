import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import type { CopyId } from '@conexus/hub-api'
import { PersonId, RoleId } from '@conexus/hub-api'
import pg from 'pg'
import type { DatabaseUrl } from '../../platform/database.ts'
import { testAppsConfig } from '../../platform/test-cloudflare.ts'
import { roleLoginOf } from '../../platform/test-company-postgres.ts'
import type { Person } from '../identity/test-hub.ts'
import { BRUNO, call, memberOn, post } from '../identity/test-hub.ts'
import { ATENDENTE } from '../identity/test-roles.ts'
import type { CopiesOn } from './test-copies.ts'
import { copiesOn } from './test-copies.ts'

const KEY = testAppsConfig().appLoginKey

/** What Vendas reads in the roles' world, by table name. */
export const VENDAS = [
  'sankhya_itens_venda',
  'sankhya_produtos',
  'sankhya_vendas',
  'sankhya_vendedores',
]

export async function roleOn(on: CopiesOn, label: string) {
  const made = await post(on.hub, on.ana, `/api/companies/${on.companyId}/roles`, {
    ...ATENDENTE,
    label,
  })
  assert.equal(made.statusCode, 201, made.body)
  const role = String(Object(made.json()).role.role)
  const [row] = await on.hub.test.asOwner(
    'select id from auth.organization_role where company_id = $1 and role = $2',
    [on.companyId, role],
  )
  return { role, id: RoleId.parse(row?.id) }
}

async function mark(on: CopiesOn, copyId: CopyId, roleId: RoleId) {
  await on.hub.test.asOwner(
    `insert into copies.copy_reader (company_id, copy_id, role_id, granted_by, granted_at)
      values ($1, $2, $3, $4, now())`,
    [on.companyId, copyId, roleId, on.ana.id],
  )
}

export function copyOf(copies: ReadonlyMap<string, CopyId>, name: string): CopyId {
  const copyId = copies.get(name)
  assert.ok(copyId, name)
  return copyId
}

/**
 * Empresa A with its five copies run, Bruno in Vendas and Carla in Financeiro. With `PLANTED`,
 * Vendas reads sales, sale items, sellers and products and Financeiro the clients, marked in the
 * Hub before the runs; with `NONE`, no role reads a copy.
 */
export async function rolesWorld(t: TestContext, marks: 'PLANTED' | 'NONE') {
  const on = await copiesOn(t)
  const copies = new Map<string, CopyId>()
  for (const model of ['clientes', 'vendedores', 'produtos', 'vendas', 'itens_venda']) {
    copies.set(`sankhya_${model}`, await on.enable(model))
  }
  const vendas = await roleOn(on, 'Vendas')
  const financeiro = await roleOn(on, 'Financeiro')
  if (marks === 'PLANTED') {
    for (const name of VENDAS) await mark(on, copyOf(copies, name), vendas.id)
    await mark(on, copyOf(copies, 'sankhya_clientes'), financeiro.id)
  }
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, vendas.role)
  const url = `/api/companies/${on.companyId}/members/${on.carla.id}`
  const moved = await call(on.hub, on.ana, 'PUT', url, { role: financeiro.role, from: 'member' })
  assert.equal(moved.statusCode, 200, moved.body)
  for (const copyId of copies.values()) assert.equal((await on.run(copyId)).kind, 'ENDED')
  return {
    ...{ on, copies, vendas, financeiro },
    brunoId: PersonId.parse(bruno.id),
    carlaId: PersonId.parse(on.carla.id),
  }
}

export type RolesWorld = Awaited<ReturnType<typeof rolesWorld>>

/** The `sync` tables a login sees in `information_schema.tables`, as PostgreSQL filters them. */
export async function seenBy(login: DatabaseUrl) {
  const client = new pg.Client({ connectionString: login.reveal() })
  await client.connect()
  try {
    const found = await client.query(
      `select table_name from information_schema.tables where table_schema = 'sync' order by 1`,
    )
    return found.rows.map((row) => String(row.table_name))
  } finally {
    await client.end()
  }
}

/** The rows a role's login counts in a copy's table, or the SQLSTATE PostgreSQL refuses it with. */
export async function asRole(on: CopiesOn, roleId: RoleId, table: string) {
  const client = new pg.Client({
    connectionString: (await roleLoginOf(on.owner, KEY, roleId)).reveal(),
  })
  await client.connect()
  try {
    return { rows: (await client.query(`select * from sync.${table}`)).rowCount }
  } catch (error) {
    if (error instanceof pg.DatabaseError) return { refused: error.code }
    throw error
  } finally {
    await client.end()
  }
}

export function roleTables(on: CopiesOn, roleId: RoleId) {
  return roleLoginOf(on.owner, KEY, roleId).then(seenBy)
}

export function logged(on: CopiesOn, message: string) {
  return on.hub.lines.filter((line) => line.message === message).map((line) => line.fields)
}

export function copiesUrl(w: RolesWorld, role: string, companyId: string = w.on.companyId) {
  return `/api/companies/${companyId}/roles/${role}/copies`
}

export function put(w: RolesWorld, who: Person, role: string, copies: readonly string[]) {
  return call(w.on.hub, who, 'PUT', copiesUrl(w, role), { copies })
}

export function idsOf(w: RolesWorld, names: readonly string[]): CopyId[] {
  return names.map((name) => copyOf(w.copies, name))
}

export async function hubMarks(w: RolesWorld, roleId: string) {
  return w.on.hub.test.asOwner(
    `select c.name, r.granted_by, r.granted_at from copies.copy_reader r
      join copies.copy c on c.id = r.copy_id where r.role_id = $1 order by c.name`,
    [roleId],
  )
}

export async function hubNames(w: RolesWorld, roleId: string) {
  return (await hubMarks(w, roleId)).map((row) => String(row.name))
}

export function erred(w: RolesWorld, message: string) {
  return w.on.hub.errors.filter((line) => line.message === message).map((line) => line.fields)
}

export function silentReconcile(t: TestContext, w: RolesWorld) {
  return t.mock.method(w.on.hub.postgres.companyPostgres, 'reconcileReaders', async () => ({
    kind: 'NO_ANSWER' as const,
  }))
}

export function holdNextReconcile(t: TestContext, w: RolesWorld) {
  const postgres = w.on.hub.postgres.companyPostgres
  const real = postgres.reconcileReaders
  const arrived = Promise.withResolvers<void>()
  const released = Promise.withResolvers<void>()
  let held = false
  const answers: string[] = []
  t.mock.method(postgres, 'reconcileReaders', async (...input: Parameters<typeof real>) => {
    const first = !held
    held = true
    if (first) {
      arrived.resolve()
      await released.promise
    }
    const answer = await Reflect.apply(real, postgres, input)
    if (first) answers.push(answer.kind)
    return answer
  })
  return { arrived: arrived.promise, release: () => released.resolve(), answers }
}

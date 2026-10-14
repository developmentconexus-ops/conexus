import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { sql } from 'drizzle-orm'
import { z } from 'zod'
import { migrate } from './migrate.ts'
import type { TestDatabase } from './test-database.ts'
import { createTestDatabase, databaseWithPassword, withRoleLock } from './test-database.ts'

const EXPECTED = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', '..', 'database-roles.json'), 'utf8'),
)

const ROLES = `select rolname as name, rolcanlogin as login, rolsuper as superuser,
    rolinherit as inherit, rolcreatedb as "createDatabase", rolcreaterole as "createRole",
    rolbypassrls as "bypassRls", rolreplication as replication, rolconnlimit as "connectionLimit",
    coalesce(rolconfig, '{}') as settings, oid::text as oid
  from pg_roles
  where rolname not like 'pg\\_%' and not rolsuper and rolname <> current_user`
const GRANTS = `select a.privilege_type || ' ON SCHEMA ' || n.nspname as grant, a.grantee::text as role
    from pg_namespace n, aclexplode(n.nspacl) a
    where n.nspname not like 'pg\\_%' and n.nspname <> 'information_schema' and a.grantee <> 0
  union all
  select a.privilege_type || ' ON TABLE ' || n.nspname || '.' || c.relname, a.grantee::text
    from pg_class c join pg_namespace n on n.oid = c.relnamespace, aclexplode(c.relacl) a
    where n.nspname not like 'pg\\_%' and n.nspname <> 'information_schema' and a.grantee <> 0
  union all
  select a.privilege_type || ' ON COLUMN ' || n.nspname || '.' || c.relname || '.' || t.attname, a.grantee::text
    from pg_attribute t join pg_class c on c.oid = t.attrelid
      join pg_namespace n on n.oid = c.relnamespace, aclexplode(t.attacl) a
    where n.nspname not like 'pg\\_%' and n.nspname <> 'information_schema' and a.grantee <> 0`

const RoleRow = z.object({
  name: z.string(),
  oid: z.string(),
  settings: z.array(z.string()),
  login: z.boolean(),
  superuser: z.boolean(),
  inherit: z.boolean(),
  createDatabase: z.boolean(),
  createRole: z.boolean(),
  bypassRls: z.boolean(),
  replication: z.boolean(),
  connectionLimit: z.number(),
})
const GrantRow = z.object({ grant: z.string(), role: z.string() })
type Catalog = Record<
  string,
  { attributes: Record<string, unknown>; settings: string[]; grants: string[] }
>

async function catalogOf({ asOwner }: TestDatabase): Promise<Catalog> {
  const grants = (await asOwner(GRANTS)).map((row) => GrantRow.parse(row))
  const catalog: Catalog = {}
  for (const row of await asOwner(ROLES)) {
    const { name, oid, settings, ...attributes } = RoleRow.parse(row)
    catalog[name] = {
      attributes,
      settings: settings.sort(),
      grants: grants
        .filter((grant) => grant.role === oid)
        .map((grant) => grant.grant)
        .sort(),
    }
  }
  return catalog
}

test('o catálogo depois de migrate é o de database-roles.json', async (t) => {
  assert.deepEqual(await catalogOf(await createTestDatabase(t)), EXPECTED)
})

async function plantedCatalog(t: Parameters<typeof createTestDatabase>[0], statements: string[]) {
  const test = await createTestDatabase(t)
  return withRoleLock(async () => {
    try {
      for (const statement of statements) await test.asOwner(statement)
      return await catalogOf(test)
    } finally {
      await test.asOwner('alter role hub_runtime nocreatedb')
      await test.asOwner('drop role if exists planted_login')
    }
  })
}

const PLANTED: [string, string[], (catalog: Catalog) => unknown][] = [
  [
    'um papel a mais',
    ['create role planted_login login'],
    (catalog) => Object.keys(catalog).sort(),
  ],
  [
    'um atributo a mais',
    ['alter role hub_runtime createdb'],
    (catalog) => catalog.hub_runtime?.attributes.createDatabase,
  ],
  [
    'uma concessão a mais',
    ['grant insert on drizzle.__drizzle_migrations to hub_runtime'],
    (catalog) => catalog.hub_runtime?.grants,
  ],
  [
    'uma concessão de coluna a mais',
    ['grant update (hash) on drizzle.__drizzle_migrations to hub_runtime'],
    (catalog) => catalog.hub_runtime?.grants,
  ],
]
const SHOWN = [
  ['hub_runtime', 'planted_login'],
  true,
  [
    'INSERT ON TABLE drizzle.__drizzle_migrations',
    'SELECT ON TABLE drizzle.__drizzle_migrations',
    'USAGE ON SCHEMA drizzle',
  ],
  [
    'SELECT ON TABLE drizzle.__drizzle_migrations',
    'UPDATE ON COLUMN drizzle.__drizzle_migrations.hash',
    'USAGE ON SCHEMA drizzle',
  ],
]
for (const [index, [name, statements, shown]] of PLANTED.entries()) {
  test(`o catálogo recusa ${name}`, async (t) => {
    const actual = await plantedCatalog(t, statements)
    assert.notDeepEqual(actual, EXPECTED)
    assert.deepEqual(shown(actual), SHOWN[index])
  })
}

test('o login do Hub recebe 42501 em DELETE e em DDL', async (t) => {
  const { database } = await createTestDatabase(t)
  for (const statement of [
    sql`delete from drizzle.__drizzle_migrations`,
    sql`create table public.planted (id int)`,
  ]) {
    await assert.rejects(
      database.command((tx) => tx.execute(statement)),
      (error: unknown) => {
        assert.ok(error instanceof Error && error.cause instanceof Error && 'code' in error.cause)
        assert.equal(error.cause.code, '42501')
        return true
      },
    )
  }
})

test('migrate duas vezes: a segunda não aplica nada, e só a senha do arquivo entra', async (t) => {
  const test = await createTestDatabase(t)
  const applied = `select count(*)::int as applied from drizzle.__drizzle_migrations`
  const first = await test.asOwner(applied)
  await withRoleLock(() => migrate({ ownerUrl: test.ownerUrl, runtimeUrl: test.runtimeUrl }))
  assert.deepEqual(await test.asOwner(applied), first)
  const right = await test.database.read((tx) => tx.execute(sql`select current_user as login`))
  assert.deepEqual(right.rows, [{ login: 'hub_runtime' }])
  const other = databaseWithPassword(test, 'not-the-file-password')
  await assert.rejects(
    other.read((tx) => tx.execute(sql`select 1`)),
    (error: unknown) => {
      assert.ok(error instanceof Error && error.cause instanceof Error && 'code' in error.cause)
      assert.equal(error.cause.code, '28P01')
      return true
    },
  )
  await other.close()
})

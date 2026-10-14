import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { z } from 'zod'
import type { TestDatabase } from './test-database.ts'
import { createTestDatabase, withRoleLock } from './test-database.ts'

const EXPECTED = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', '..', 'database-roles.json'), 'utf8'),
)

const USER_SCHEMA = `n.nspname !~ '^pg_' and n.nspname <> 'information_schema'`
const DATABASE_OID = `(select oid from pg_database where datname = current_database())`

const ROLES = `select r.rolname as name, r.oid::text as oid, r.rolcanlogin as login,
    r.rolsuper as superuser, r.rolinherit as inherit, r.rolcreatedb as "createDatabase",
    r.rolcreaterole as "createRole", r.rolbypassrls as "bypassRls",
    r.rolreplication as replication, r.rolconnlimit as "connectionLimit",
    coalesce(r.rolconfig, '{}') as settings,
    coalesce((select array_agg(x order by x) from pg_db_role_setting d, unnest(d.setconfig) x
      where d.setrole = r.oid and d.setdatabase = ${DATABASE_OID}), '{}') as "databaseSettings",
    coalesce((select array_agg(g.rolname::text order by g.rolname) from pg_auth_members m
      join pg_roles g on g.oid = m.roleid where m.member = r.oid), '{}') as "memberOf"
  from pg_roles r
  where r.rolname !~ '^pg_' and not r.rolsuper and r.rolname <> current_user`

// A NULL ACL is the default one (public EXECUTE on a function), so it is expanded, not skipped.
const GRANTS = `with acls as (
    select 'DATABASE' as kind, '' as object, d.datdba as owner,
        coalesce(d.datacl, acldefault('d'::"char", d.datdba)) as acl
      from pg_database d where d.datname = current_database()
    union all
    select 'SCHEMA', n.nspname, n.nspowner, coalesce(n.nspacl, acldefault('n'::"char", n.nspowner))
      from pg_namespace n where ${USER_SCHEMA}
    union all
    select 'TABLE', n.nspname || '.' || c.relname, c.relowner,
        coalesce(c.relacl, acldefault((case when c.relkind = 'S' then 's' else 'r' end)::"char", c.relowner))
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where ${USER_SCHEMA} and c.relkind in ('r', 'p', 'v', 'm', 'f', 'S')
    union all
    select 'FUNCTION', n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')',
        p.proowner, coalesce(p.proacl, acldefault('f'::"char", p.proowner))
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace where ${USER_SCHEMA}
  )
  select x.grantee::text as role,
      x.privilege_type || ' ON ' || trim(acls.kind || ' ' || acls.object)
        || case when x.is_grantable then ' WITH GRANT OPTION' else '' end as grant
    from acls, aclexplode(acls.acl) as x(grantor, grantee, privilege_type, is_grantable)
    where x.grantee <> acls.owner
  union all
  select x.grantee::text,
      x.privilege_type || ' ON COLUMN ' || n.nspname || '.' || c.relname || '.' || t.attname
        || case when x.is_grantable then ' WITH GRANT OPTION' else '' end
    from pg_attribute t join pg_class c on c.oid = t.attrelid
      join pg_namespace n on n.oid = c.relnamespace,
      aclexplode(t.attacl) as x(grantor, grantee, privilege_type, is_grantable)
    where ${USER_SCHEMA} and x.grantee <> c.relowner`

const PUBLIC_SETTINGS = `select coalesce(array_agg(x order by x), '{}') as settings
  from pg_db_role_setting d, unnest(d.setconfig) x
  where d.setrole = 0 and d.setdatabase = ${DATABASE_OID}`

const DEFINERS = `select n.nspname || '.' || p.proname as name
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where p.prosecdef and ${USER_SCHEMA} order by 1`

const RoleRow = z.object({
  name: z.string(),
  oid: z.string(),
  settings: z.array(z.string()),
  databaseSettings: z.array(z.string()),
  memberOf: z.array(z.string()),
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
const SettingsRow = z.object({ settings: z.array(z.string()) })
const DefinerRow = z.object({ name: z.string() })

type Catalog = {
  roles: Record<
    string,
    {
      attributes: Record<string, unknown>
      settings: string[]
      databaseSettings: string[]
      memberOf: string[]
      grants: string[]
    }
  >
  public: { grants: string[]; databaseSettings: string[] }
  securityDefiner: string[]
}

const PUBLIC_ROLE = '0'

async function catalogOf({ asOwner }: TestDatabase): Promise<Catalog> {
  const grants = (await asOwner(GRANTS)).map((row) => GrantRow.parse(row))
  function grantsOf(role: string): string[] {
    return grants
      .filter((grant) => grant.role === role)
      .map((grant) => grant.grant)
      .sort()
  }
  const roles: Catalog['roles'] = {}
  for (const row of await asOwner(ROLES)) {
    const { name, oid, settings, databaseSettings, memberOf, ...attributes } = RoleRow.parse(row)
    roles[name] = {
      attributes,
      settings: settings.sort(),
      databaseSettings,
      memberOf,
      grants: grantsOf(oid),
    }
  }
  return {
    roles,
    public: {
      grants: grantsOf(PUBLIC_ROLE),
      databaseSettings: SettingsRow.parse((await asOwner(PUBLIC_SETTINGS))[0]).settings,
    },
    securityDefiner: (await asOwner(DEFINERS)).map((row) => DefinerRow.parse(row).name),
  }
}

test('o catálogo depois de migrate é o de database-roles.json', async (t) => {
  assert.deepEqual(await catalogOf(await createTestDatabase(t)), EXPECTED)
})

const SERVER_WIDE_REVERTS = [
  'alter role hub_runtime nocreatedb',
  'alter role hub_runtime reset work_mem',
  'drop role if exists planted_login',
  'drop role if exists planted_group',
]

async function plantedCatalog(t: Parameters<typeof createTestDatabase>[0], statements: string[]) {
  const test = await createTestDatabase(t)
  return withRoleLock(async () => {
    try {
      for (const statement of statements) await test.asOwner(statement)
      return await catalogOf(test)
    } finally {
      for (const statement of SERVER_WIDE_REVERTS) await test.asOwner(statement)
    }
  })
}

function onDatabase(statement: string): string {
  return `do $$ begin execute format('${statement}', current_database()); end $$`
}

const GRANTED = [
  'INSERT ON TABLE hub.starts',
  'SELECT ON TABLE drizzle.__drizzle_migrations',
  'SELECT ON TABLE hub.starts',
  'USAGE ON SCHEMA drizzle',
  'USAGE ON SCHEMA hub',
]
const PUBLIC_GRANTS = EXPECTED.public.grants

const PLANTED: [string, string[], (catalog: Catalog) => unknown, unknown][] = [
  [
    'um papel a mais',
    ['create role planted_login login'],
    (catalog) => Object.keys(catalog.roles).sort(),
    ['hub_runtime', 'planted_login'],
  ],
  [
    'um atributo a mais',
    ['alter role hub_runtime createdb'],
    (catalog) => catalog.roles.hub_runtime?.attributes.createDatabase,
    true,
  ],
  [
    'uma configuração do papel a mais',
    ["alter role hub_runtime set work_mem = '1MB'"],
    (catalog) => catalog.roles.hub_runtime?.settings,
    ['idle_in_transaction_session_timeout=10s', 'statement_timeout=10s', 'work_mem=1MB'],
  ],
  [
    'uma configuração do papel neste banco',
    [onDatabase(`alter role hub_runtime in database %I set work_mem = ''1MB''`)],
    (catalog) => catalog.roles.hub_runtime?.databaseSettings,
    ['work_mem=1MB'],
  ],
  [
    'uma configuração de todos os papéis neste banco',
    [onDatabase(`alter role all in database %I set work_mem = ''1MB''`)],
    (catalog) => catalog.public.databaseSettings,
    ['work_mem=1MB'],
  ],
  [
    'uma participação em outro papel',
    ['create role planted_group', 'grant planted_group to hub_runtime'],
    (catalog) => catalog.roles.hub_runtime?.memberOf,
    ['planted_group'],
  ],
  [
    'uma concessão a mais',
    ['grant insert on drizzle.__drizzle_migrations to hub_runtime'],
    (catalog) => catalog.roles.hub_runtime?.grants,
    ['INSERT ON TABLE drizzle.__drizzle_migrations', ...GRANTED],
  ],
  [
    'uma concessão de coluna a mais',
    ['grant update (hash) on drizzle.__drizzle_migrations to hub_runtime'],
    (catalog) => catalog.roles.hub_runtime?.grants,
    [
      'INSERT ON TABLE hub.starts',
      'SELECT ON TABLE drizzle.__drizzle_migrations',
      'SELECT ON TABLE hub.starts',
      'UPDATE ON COLUMN drizzle.__drizzle_migrations.hash',
      'USAGE ON SCHEMA drizzle',
      'USAGE ON SCHEMA hub',
    ],
  ],
  [
    'uma concessão com direito de repassar',
    ['grant select on hub.starts to hub_runtime with grant option'],
    (catalog) => catalog.roles.hub_runtime?.grants.filter((grant) => grant.includes('GRANT')),
    ['SELECT ON TABLE hub.starts WITH GRANT OPTION'],
  ],
  [
    'uma concessão a PUBLIC',
    ['grant delete on hub.starts to public'],
    (catalog) => catalog.public.grants,
    [...PUBLIC_GRANTS, 'DELETE ON TABLE hub.starts'].sort(),
  ],
  [
    'uma concessão de CREATE no banco',
    [onDatabase('grant create on database %I to hub_runtime')],
    (catalog) => catalog.roles.hub_runtime?.grants[0],
    'CREATE ON DATABASE',
  ],
  [
    'uma função SECURITY DEFINER, que o PUBLIC executa pelo ACL vazio',
    ['create function hub.planted() returns int language sql security definer as $$ select 1 $$'],
    (catalog) => [
      catalog.securityDefiner,
      catalog.public.grants.includes('EXECUTE ON FUNCTION hub.planted()'),
    ],
    [['hub.planted'], true],
  ],
]
for (const [name, statements, shown, expected] of PLANTED) {
  test(`o catálogo recusa ${name}`, async (t) => {
    const actual = await plantedCatalog(t, statements)
    assert.notDeepEqual(actual, EXPECTED)
    assert.deepEqual(shown(actual), expected)
  })
}

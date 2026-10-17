import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { promisify } from 'node:util'
import { CompanyId, InvitationId, PersonId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import type { TestDatabase } from './test-database.ts'
import { createTestDatabase, withRoleLock } from './test-database.ts'

// Two companies with a person of each, one of both and one of none, written as the owner: the rows
// every check below reads through a scope, unfiltered (decision 0039, B1 to B5).
const A = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const B = CompanyId.parse('companyBBBBBBBBBBBBBBBBBBBBBBBBB')
const ANA = PersonId.parse('person-a')
const BRUNO = PersonId.parse('person-b')
const CARLA = PersonId.parse('person-ab')
const DAVI = PersonId.parse('person-none')
const OPERATOR = PersonId.parse('person-op')
const INVITATION_B = InvitationId.parse('invitationBBBBBBBBBBBBBBBBBBBBBB')

const SEED = `
  insert into auth."user"(id, name, email) values
    ('person-a', 'Ana', 'ana@example.test'), ('person-b', 'Bruno', 'bruno@example.test'),
    ('person-ab', 'Carla', 'carla@example.test'), ('person-none', 'Davi', 'davi@example.test');
  insert into auth."user"(id, name, email, role) values
    ('person-op', 'Operadora', 'op@example.test', 'admin');
  insert into auth.company(id, name, slug, created_at, attempt_key) values
    ('companyAAAAAAAAAAAAAAAAAAAAAAAAA', 'Empresa A', 'key-a', now(), 'key-a'),
    ('companyBBBBBBBBBBBBBBBBBBBBBBBBB', 'Empresa B', 'key-b', now(), 'key-b');
  insert into auth.member(id, company_id, user_id, role, created_at) values
    ('member-a', 'companyAAAAAAAAAAAAAAAAAAAAAAAAA', 'person-a', 'owner', now()),
    ('member-b', 'companyBBBBBBBBBBBBBBBBBBBBBBBBB', 'person-b', 'owner', now()),
    ('member-ab-a', 'companyAAAAAAAAAAAAAAAAAAAAAAAAA', 'person-ab', 'member', now()),
    ('member-ab-b', 'companyBBBBBBBBBBBBBBBBBBBBBBBBB', 'person-ab', 'admin', now());
  insert into auth.invitation(id, company_id, email, role, status, expires_at, created_at,
    inviter_id, attempt_key) values
    ('invitationAAAAAAAAAAAAAAAAAAAAAA', 'companyAAAAAAAAAAAAAAAAAAAAAAAAA', 'erin@example.test', 'member', 'pending',
      now() + interval '1 day', now(), 'person-a', 'attempt-a'),
    ('invitationBBBBBBBBBBBBBBBBBBBBBB', 'companyBBBBBBBBBBBBBBBBBBBBBBBBB', 'davi@example.test', 'member', 'pending',
      now() + interval '1 day', now(), 'person-b', 'attempt-b');
  insert into operations.client(company_id, cnpj, legal_name, attempt_key, registered_at) values
    ('companyAAAAAAAAAAAAAAAAAAAAAAAAA', '11222333000181', 'A Ltda', 'key-a', now()),
    ('companyBBBBBBBBBBBBBBBBBBBBBBBBB', '11444777000161', 'B Ltda', 'key-b', now());`

type Database = TestDatabase['database']
type Scope = Parameters<Database['read']>[0]
type CommandTx = Parameters<Parameters<Database['command']>[1]>[0]

async function seeded(t: TestContext): Promise<TestDatabase> {
  const test = await createTestDatabase(t)
  await test.asOwner(SEED)
  return test
}

function inA(personId: PersonId): Scope {
  return { kind: 'COMPANY', companyId: A, personId }
}

/** Every company row a transaction sees, by table, with no filter of ours. */
async function everything(tx: Pick<CommandTx, 'execute'>) {
  const rows = await tx.execute(sql`select
    (select coalesce(array_agg(id order by id), '{}') from auth.company) as companies,
    (select coalesce(array_agg(id order by id), '{}') from auth.member) as members,
    (select coalesce(array_agg(id order by id), '{}') from auth.invitation) as invitations,
    (select coalesce(array_agg(id order by id), '{}') from auth."user") as people`)
  return rows.rows[0]
}

const NOTHING = { companies: [], members: [], invitations: [], people: [] }

function refusedWith(sqlstate: string) {
  return (error: unknown) => {
    assert.ok(error instanceof Error && error.cause instanceof Error && 'code' in error.cause)
    assert.equal(error.cause.code, sqlstate)
    return true
  }
}

async function backendOf(tx: Pick<CommandTx, 'execute'>): Promise<number> {
  return Number((await tx.execute(sql`select pg_backend_pid()::int as pid`)).rows[0]?.pid)
}

test('sem contexto: um papel de escopo lê zero e não grava, também no segundo uso da conexão', async (t) => {
  const { database } = await seeded(t)
  const first = await database.read(inA(ANA), backendOf)
  for (const role of ['hub_company', 'hub_person', 'hub_invitation', 'hub_operator']) {
    const [backend, seen] = await database.installation(async (tx) => {
      await tx.execute(sql.raw(`set local role ${role}`))
      return [await backendOf(tx), await everything(tx)]
    })
    assert.equal(backend, first, 'the same connection, after a scoped transaction')
    assert.deepEqual(seen, NOTHING, role)
  }
  await assert.rejects(
    database.installation(async (tx) => {
      await tx.execute(sql`set local role hub_company`)
      await tx.execute(sql`insert into auth.invitation(id, company_id, email, role, status,
        expires_at, created_at, inviter_id, attempt_key) values ('planted', 'companyAAAAAAAAAAAAAAAAAAAAAAAAA',
        'x@example.test', 'member', 'pending', now(), now(), 'person-a', 'planted')`)
    }),
    refusedWith('42501'),
  )
})

test('positivo: cada pessoa lê e grava a sua empresa; quem está nas duas vê só a do contexto', async (t) => {
  const { database } = await seeded(t)
  const ofA = await database.read(inA(ANA), everything)
  assert.deepEqual(ofA, {
    companies: ['companyAAAAAAAAAAAAAAAAAAAAAAAAA'],
    members: ['member-a', 'member-ab-a'],
    invitations: ['invitationAAAAAAAAAAAAAAAAAAAAAA'],
    people: ['person-a', 'person-ab'],
  })
  const ofB = await database.read({ kind: 'COMPANY', companyId: B, personId: CARLA }, everything)
  assert.deepEqual(ofB, {
    companies: ['companyBBBBBBBBBBBBBBBBBBBBBBBBB'],
    members: ['member-ab-b', 'member-b'],
    invitations: ['invitationBBBBBBBBBBBBBBBBBBBBBB'],
    people: ['person-ab', 'person-b'],
  })
  const renamed = await database.command(inA(CARLA), (tx) =>
    tx.execute(sql`update auth.company set name = 'Empresa A Nova' returning id`),
  )
  assert.deepEqual(renamed.rows, [{ id: 'companyAAAAAAAAAAAAAAAAAAAAAAAAA' }])
  const own = await database.read({ kind: 'PERSON', personId: CARLA }, async (tx) => {
    const rows = await tx.execute(sql`select c.id, m.role from auth.member m
      join auth.company c on c.id = m.company_id order by c.id`)
    return rows.rows
  })
  assert.deepEqual(own, [
    { id: 'companyAAAAAAAAAAAAAAAAAAAAAAAAA', role: 'member' },
    { id: 'companyBBBBBBBBBBBBBBBBBBBBBBBBB', role: 'admin' },
  ])
  const none = await database.read({ kind: 'PERSON', personId: DAVI }, everything)
  assert.deepEqual(none, {
    ...NOTHING,
    invitations: ['invitationBBBBBBBBBBBBBBBBBBBBBB'],
    people: ['person-none'],
  })
})

test('filtro esquecido: no contexto A, junções e a âncora da página não trazem linha de B', async (t) => {
  const { database } = await seeded(t)
  const [joined, anchor] = await database.read(inA(ANA), async (tx) => {
    const rows = await tx.execute(sql`select c.name, u.email, m.role from auth.member m
      join auth.company c on c.id = m.company_id join auth."user" u on u.id = m.user_id
      order by u.email`)
    const page = await tx.execute(sql`select id from auth.member
      where (company_id, id) > ('companyBBBBBBBBBBBBBBBBBBBBBBBBB', '') order by id`)
    return [rows.rows, page.rows]
  })
  assert.deepEqual(joined, [
    { name: 'Empresa A', email: 'ana@example.test', role: 'owner' },
    { name: 'Empresa A', email: 'carla@example.test', role: 'member' },
  ])
  assert.deepEqual(anchor, [])
  await assert.rejects(
    database.read(inA(ANA), (tx) => tx.execute(sql`select company_id from operations.client`)),
    refusedWith('42501'),
  )
  const link = await database.read(
    { kind: 'INVITATION', invitationId: INVITATION_B, personId: null },
    everything,
  )
  assert.deepEqual(link, {
    companies: ['companyBBBBBBBBBBBBBBBBBBBBBBBBB'],
    members: ['member-ab-b', 'member-b'],
    invitations: ['invitationBBBBBBBBBBBBBBBBBBBBBB'],
    people: ['person-b', 'person-none'],
  })
})

test('escrita: no contexto A, gravar em B é recusado e UPDATE ou DELETE sem filtro não mudam B', async (t) => {
  const { database, asOwner } = await seeded(t)
  function write(statement: ReturnType<typeof sql>) {
    return database.command(inA(ANA), (tx) => tx.execute(statement))
  }
  await assert.rejects(
    write(sql`insert into auth.invitation(id, company_id, email, role, status, expires_at,
      created_at, inviter_id, attempt_key) values ('planted', 'companyBBBBBBBBBBBBBBBBBBBBBBBBB', 'x@example.test',
      'member', 'pending', now(), now(), 'person-a', 'planted')`),
    refusedWith('42501'),
  )
  await assert.rejects(
    write(
      sql`update auth.invitation set company_id = 'companyBBBBBBBBBBBBBBBBBBBBBBBBB' where id = 'invitationAAAAAAAAAAAAAAAAAAAAAA'`,
    ),
    refusedWith('42501'),
  )
  const changed = await write(sql`update auth.invitation set role = 'admin' returning id`)
  assert.deepEqual(changed.rows, [{ id: 'invitationAAAAAAAAAAAAAAAAAAAAAA' }])
  await assert.rejects(write(sql`delete from auth.member`), refusedWith('42501'))
  assert.deepEqual(await asOwner(`select id, company_id, role from auth.invitation order by id`), [
    {
      id: 'invitationAAAAAAAAAAAAAAAAAAAAAA',
      company_id: 'companyAAAAAAAAAAAAAAAAAAAAAAAAA',
      role: 'admin',
    },
    {
      id: 'invitationBBBBBBBBBBBBBBBBBBBBBB',
      company_id: 'companyBBBBBBBBBBBBBBBBBBBBBBBBB',
      role: 'member',
    },
  ])
  assert.deepEqual(await asOwner(`select count(*)::int as members from auth.member`), [
    { members: 4 },
  ])
})

test('operador sem papel: em OPERATOR, quem não é administrador, ou sem pessoa, lê zero e não grava', async (t) => {
  const { database, asOwner } = await seeded(t)
  const clients = sql`select coalesce(array_agg(company_id order by company_id), '{}') as ids
    from operations.client`
  for (const personId of [ANA, PersonId.parse('nobody')]) {
    const scope: Scope = { kind: 'OPERATOR', personId, companyId: A }
    const seen = await database.read(scope, async (tx) => ({
      ...(await everything(tx)),
      clients: (await tx.execute(clients)).rows[0]?.ids,
    }))
    assert.deepEqual(seen, { ...NOTHING, clients: [] }, personId)
    const changed = await database.command(scope, (tx) =>
      tx.execute(sql`update operations.client set legal_name = 'Outra' returning company_id`),
    )
    assert.deepEqual(changed.rows, [], personId)
    await assert.rejects(
      database.command(scope, (tx) =>
        tx.execute(sql`insert into auth.company(id, name, slug, created_at, attempt_key)
          values ('planted', 'Plantada', 'planted', now(), 'planted')`),
      ),
      refusedWith('42501'),
    )
  }
  const operated = await database.read(
    { kind: 'OPERATOR', personId: OPERATOR, companyId: null },
    async (tx) => ({
      ...(await everything(tx)),
      clients: (await tx.execute(clients)).rows[0]?.ids,
    }),
  )
  assert.deepEqual(operated, {
    companies: [A, B],
    members: ['member-a', 'member-b'],
    invitations: [],
    people: ['person-a', 'person-b', 'person-op'],
    clients: [A, B],
  })
  assert.deepEqual(
    await asOwner(`select count(*)::int as renamed from operations.client
    where legal_name = 'Outra'`),
    [{ renamed: 0 }],
  )
})

test('conexão reciclada: A, B e sem contexto, com commit, rollback e savepoint, não deixam contexto', async (t) => {
  const { database, asOwner } = await seeded(t)
  const settings = sql`select current_user as role,
    current_setting('conexus.company_id', true) as company,
    current_setting('conexus.person_id', true) as person`
  const backends = new Set<number>()
  const seen: unknown[] = []
  async function look(tx: CommandTx) {
    backends.add(await backendOf(tx))
    seen.push((await tx.execute(settings)).rows[0])
  }
  await database.command(inA(ANA), look)
  await assert.rejects(
    database.command({ kind: 'COMPANY', companyId: B, personId: BRUNO }, async (tx) => {
      await look(tx)
      // The library's nested transaction is a savepoint on the same connection.
      await tx.transaction(async (nested) => {
        seen.push((await nested.execute(settings)).rows[0])
        throw new Error('rolled back')
      })
    }),
  )
  await database.installation(look)
  assert.equal(backends.size, 1, 'one connection served the three')
  assert.deepEqual(seen, [
    { role: 'hub_company', company: 'companyAAAAAAAAAAAAAAAAAAAAAAAAA', person: 'person-a' },
    { role: 'hub_company', company: 'companyBBBBBBBBBBBBBBBBBBBBBBBBB', person: 'person-b' },
    { role: 'hub_company', company: 'companyBBBBBBBBBBBBBBBBBBBBBBBBB', person: 'person-b' },
    { role: 'hub_runtime', company: '', person: '' },
  ])
  // A membership belongs to the whole server, so it is taken and given back inside the lock.
  let ran = false
  await withRoleLock(async () => {
    await asOwner('revoke hub_person from hub_runtime')
    try {
      await assert.rejects(
        database.read({ kind: 'PERSON', personId: ANA }, async () => {
          ran = true
        }),
        (error: unknown) => {
          assert.ok(error instanceof Error && 'code' in error)
          assert.equal(error.code, 'DATABASE_UNAVAILABLE')
          return true
        },
      )
    } finally {
      await asOwner('grant hub_person to hub_runtime with inherit false, set true')
    }
  })
  assert.equal(ran, false, 'nothing runs outside its scope')
})

const SERVER = join(import.meta.dirname, '..', '..')
const ROOT = join(SERVER, '..', '..')
const TSC = join(ROOT, 'node_modules', '.bin', 'tsc')

test('o tipo: abrir transação sem escopo, ou com um id que nenhum parse fez, não compila', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-check-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const config = join(dir, 'tsconfig.json')
  writeFileSync(
    config,
    JSON.stringify({
      extends: join(SERVER, 'tsconfig.json'),
      // A configuration outside the tree finds the tree's type packages only by this path.
      compilerOptions: { typeRoots: [join(ROOT, 'node_modules', '@types')] },
      include: [],
      files: [join(SERVER, 'src', 'platform', 'database.check.ts')],
    }),
  )
  const compiled = await promisify(execFile)(TSC, ['--noEmit', '-p', config], {
    timeout: 90_000,
    killSignal: 'SIGKILL',
  }).then(
    () => 'compiled',
    (error: unknown) => String(Object(error).stdout),
  )
  assert.equal(compiled, 'compiled')
})

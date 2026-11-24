import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, PersonId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import { createTestDatabase } from '../../platform/test-database.ts'

const A = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const B = CompanyId.parse('companyBBBBBBBBBBBBBBBBBBBBBBBBB')
const ANA = PersonId.parse('person-a')

const SEED = `
  insert into auth."user"(id, name, email) values
    ('person-a', 'Ana', 'ana@example.test'), ('person-b', 'Bruno', 'bruno@example.test');
  insert into auth.company(id, name, slug, created_at, attempt_key) values
    ('${A}', 'Empresa A', 'key-a', now(), 'key-a'), ('${B}', 'Empresa B', 'key-b', now(), 'key-b');
  insert into auth.member(id, company_id, user_id, role, created_at) values
    ('member-a', '${A}', 'person-a', 'owner', now()), ('member-b', '${B}', 'person-b', 'owner', now());`

function refusedWith(sqlstate: string) {
  return (error: unknown) => {
    assert.ok(error instanceof Error && error.cause instanceof Error && 'code' in error.cause)
    assert.equal(error.cause.code, sqlstate)
    return true
  }
}

const SECRET_A = 'a'.repeat(64)
const SECRET_B = 'b'.repeat(64)
const LINK_A = '00000000-0000-4000-8000-0000000000a1'
const LINK_B = '00000000-0000-4000-8000-0000000000b1'

function link(
  id: string,
  company: string,
  digest: string,
  extra: {
    name?: string
    asked?: string
    seal?: string
    minutes?: number
    connector?: string
  } = {},
) {
  const {
    name = 'Filial',
    asked = `'{"user","password"}'`,
    seal,
    minutes = 30,
    connector = 'sankhya',
  } = extra
  return `insert into connectors.connection_link(id, company_id, connector_id, name, secret_hash, asked, sealed, key_id, created_by, expires_at)
    values ('${id}', '${company}', '${connector}', '${name}', '${digest}', ${asked},
      ${seal === undefined ? 'null' : `'${seal}'`}, ${seal === undefined ? 'null' : `'k1'`}, 'person-b', now() + interval '${minutes} minutes')`
}

test('o link: o resumo do segredo, os campos pedidos, os selados com a chave', async (t) => {
  const { asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  await asOwner(link(LINK_A, A, SECRET_A, { seal: '\\x0102' }))
  await asOwner(link(LINK_B, B, SECRET_B))

  await assert.rejects(asOwner(link(crypto.randomUUID(), A, SECRET_A)), {
    code: '23505',
    constraint: 'connection_link_secret_hash_key',
  })
  for (const digest of ['A'.repeat(64), 'a'.repeat(63), 'a'.repeat(65), `${'a'.repeat(63)}g`, '']) {
    await assert.rejects(asOwner(link(crypto.randomUUID(), A, digest)), {
      code: '23514',
      constraint: 'connection_link_secret_hash',
    })
  }
  for (const name of ['', ' Filial', 'Filial ', 'x'.repeat(61)]) {
    await assert.rejects(asOwner(link(crypto.randomUUID(), A, 'c'.repeat(64), { name })), {
      code: '23514',
      constraint: 'connection_link_name',
    })
  }
  await asOwner(link(crypto.randomUUID(), A, 'd'.repeat(64), { name: 'x'.repeat(60) }))
  await assert.rejects(asOwner(link(crypto.randomUUID(), A, 'e'.repeat(64), { asked: `'{}'` })), {
    code: '23514',
    constraint: 'connection_link_asked',
  })
  await assert.rejects(
    asOwner(link(crypto.randomUUID(), A, 'e'.repeat(64), { connector: 'Sankhya' })),
    { code: '23514', constraint: 'connection_link_connector_id' },
  )
  await assert.rejects(
    asOwner(`update connectors.connection_link set key_id = null where id = '${LINK_A}'`),
    { code: '23514', constraint: 'connection_link_sealed' },
  )
  await assert.rejects(
    asOwner(`update connectors.connection_link set sealed = null where id = '${LINK_A}'`),
    { code: '23514', constraint: 'connection_link_sealed' },
  )
})

test('o link: a empresa o faz, o lê e o gasta, e nunca lê o resumo nem o link de outra', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  await asOwner(link(LINK_A, A, SECRET_A, { seal: '\\x0102' }))
  await asOwner(link(LINK_B, B, SECRET_B))
  function inA(statement: ReturnType<typeof sql>) {
    return database.command({ kind: 'COMPANY', companyId: A, personId: ANA }, (tx) =>
      tx.execute(statement),
    )
  }
  const made = crypto.randomUUID()
  await inA(sql.raw(link(made, A, 'f'.repeat(64))))
  assert.deepEqual(
    (
      await inA(sql`select id from connectors.connection_link where name = 'Filial' order by id`)
    ).rows
      .map((row) => row.id)
      .sort(),
    [LINK_A, made].sort(),
  )
  await assert.rejects(
    inA(sql`select secret_hash from connectors.connection_link`),
    refusedWith('42501'),
  )
  await assert.rejects(inA(sql`select * from connectors.connection_link`), refusedWith('42501'))
  await assert.rejects(
    inA(sql`update connectors.connection_link set name = 'Outra' where id = ${LINK_A}`),
    refusedWith('42501'),
  )
  await assert.rejects(
    inA(sql.raw(link(crypto.randomUUID(), B, `${'f'.repeat(63)}1`))),
    refusedWith('42501'),
  )
  assert.deepEqual(
    (await inA(sql`delete from connectors.connection_link where id = ${LINK_B} returning id`)).rows,
    [],
  )
  const spent = await inA(
    sql`delete from connectors.connection_link where id = ${LINK_A} returning asked, encode(sealed, 'hex') as sealed, key_id`,
  )
  assert.deepEqual(spent.rows, [{ asked: ['user', 'password'], sealed: '0102', key_id: 'k1' }])
  assert.deepEqual(
    (await asOwner(`select id from connectors.connection_link where id = '${LINK_B}'`)).length,
    1,
  )
})

test('o link: o login do Hub o acha só por connectors.link_of, vivo, pelo resumo', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  await asOwner(link(LINK_A, A, SECRET_A))
  await asOwner(link(LINK_B, B, SECRET_B, { minutes: -1 }))
  function found(digest: string) {
    return database.installation(
      async (tx) =>
        (
          await tx.execute(
            sql`select id, company_id, created_by from connectors.link_of(${digest})`,
          )
        ).rows,
    )
  }

  assert.deepEqual(await found(SECRET_A), [{ id: LINK_A, company_id: A, created_by: 'person-b' }])
  assert.deepEqual(await found(SECRET_B), [], 'um link vencido')
  assert.deepEqual(await found('c'.repeat(64)), [], 'um resumo que nenhum link tem')
  await assert.rejects(
    database.installation((tx) => tx.execute(sql`select id from connectors.connection_link`)),
    refusedWith('42501'),
  )
  await assert.rejects(
    database.installation((tx) =>
      tx.execute(sql`select secret_hash from connectors.connection_link`),
    ),
    refusedWith('42501'),
  )
  await assert.rejects(
    database.command({ kind: 'COMPANY', companyId: A, personId: ANA }, (tx) =>
      tx.execute(sql`select * from connectors.link_of(${SECRET_A})`),
    ),
    refusedWith('42501'),
  )
  assert.deepEqual(
    await asOwner(
      `select r.rolname, r.rolcanlogin, r.rolbypassrls, r.rolsuper, p.prosecdef, p.provolatile
         from pg_proc p join pg_roles r on r.oid = p.proowner
        where p.oid = 'connectors.link_of(text)'::regprocedure`,
    ),
    [
      {
        rolname: 'hub_links',
        rolcanlogin: false,
        rolbypassrls: false,
        rolsuper: false,
        prosecdef: true,
        provolatile: 's',
      },
    ],
  )
  assert.deepEqual(
    await asOwner(
      `select count(*)::int as n from pg_class c join pg_roles r on r.oid = c.relowner where r.rolname = 'hub_links'`,
    ),
    [{ n: 0 }],
  )
})

test('o link: sai com a empresa', async (t) => {
  const { asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  await asOwner(link(LINK_A, A, SECRET_A))
  await asOwner(link(LINK_B, B, SECRET_B))
  await asOwner(
    `delete from auth.member where company_id = '${A}'; delete from auth.company where id = '${A}'`,
  )
  assert.deepEqual(await asOwner(`select id from connectors.connection_link`), [{ id: LINK_B }])
})

import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import type { ReadAnswer } from '@conexus/hub-api'
import { ConversationId, PersonId } from '@conexus/hub-api'
import pg from 'pg'
import { testAppsConfig } from '../../platform/test-cloudflare.ts'
import { readLoginOf } from '../../platform/test-company-postgres.ts'
import type { Place } from '../access/public.ts'
import { readerAt } from '../access/test-principal.ts'
import type { CopiesOn } from '../copies/test-copies.ts'
import { asSync, copiesOn, syncRows } from '../copies/test-copies.ts'
import { personOn } from '../identity/test-hub.ts'

const JOIN = `select v."APELIDO", sum(c."VLRNOTA") from sync.sankhya_vendas c
  join sync.sankhya_vendedores v using ("CODVEND") group by 1`

function scopeOf(on: CopiesOn, place: Place, personId = on.anaId) {
  return readerAt({ companyId: on.companyId, personId, place })
}

function inCompany(on: CopiesOn, personId = on.anaId) {
  return on.hub.data(scopeOf(on, { kind: 'COMPANY' }, personId), { thread: null })
}

async function withCopies(t: Parameters<typeof copiesOn>[0]) {
  const on = await copiesOn(t)
  await on.plant('vendas')
  const sellers = await on.plant('vendedores')
  return { on, sellers }
}

async function queried(on: CopiesOn, sql: string) {
  return inCompany(on).read({ kind: 'QUERY', sql })
}

function queryOf(answer: ReadAnswer) {
  assert.equal(answer.kind, 'QUERY', JSON.stringify(answer))
  assert.ok(answer.kind === 'QUERY')
  return answer
}

test('o plano de EXPLAIN (VERBOSE, FORMAT JSON) traz Schema e Relation Name', async (t) => {
  const { on } = await withCopies(t)
  const reader = await readLoginOf(on.owner, testAppsConfig().appLoginKey)
  const read = await on.hub.postgres.companyPostgres.readCopies(
    reader,
    [{ text: 'EXPLAIN (VERBOSE, FORMAT JSON) select * from sync.sankhya_vendas' }],
    AbortSignal.timeout(10_000),
  )
  assert.ok(read.kind === 'ROWS')
  const [plan] = read.results
  assert.equal(plan?.rows.length, 1)
  assert.equal(plan?.columns.length, 1)
  const [{ Plan }] = Object(plan?.rows[0]?.[0])
  assert.equal(Plan['Relation Name'], 'sankhya_vendas')
  assert.equal(Plan.Schema, 'sync')
})

test('a junção nomeia as duas tabelas', async (t) => {
  const { on } = await withCopies(t)
  const catalog = await inCompany(on).describe()
  assert.ok(catalog.kind === 'CATALOG')
  const answer = queryOf(await queried(on, JOIN))
  assert.deepEqual(answer.tables.map(({ table }) => table).sort(), [
    'sankhya_vendas',
    'sankhya_vendedores',
  ])
  for (const { table, kept } of answer.tables) {
    assert.deepEqual(kept, catalog.tables.find(({ name }) => name === table)?.kept)
  }
  assert.ok(answer.rows.length > 0)
})

test('a mesma tabela lida duas vezes nomeia a tabela uma vez só', async (t) => {
  const { on } = await withCopies(t)
  const answer = queryOf(
    await queried(
      on,
      `select count(*) from (select "NUNOTA" from sync.sankhya_vendas
        union all select "NUNOTA" from sync.sankhya_vendas) u`,
    ),
  )
  assert.deepEqual(
    answer.tables.map(({ table }) => table),
    ['sankhya_vendas'],
  )
})

test('uma CTE e uma subconsulta nomeiam a tabela de baixo', async (t) => {
  const { on } = await withCopies(t)
  const cte = queryOf(
    await queried(on, 'with v as (select * from sync.sankhya_vendas) select count(*) from v'),
  )
  assert.deepEqual(
    cte.tables.map(({ table }) => table),
    ['sankhya_vendas'],
  )
  const sub = queryOf(
    await queried(on, 'select count(*) from (select * from sync.sankhya_vendedores) s'),
  )
  assert.deepEqual(
    sub.tables.map(({ table }) => table),
    ['sankhya_vendedores'],
  )
})

test('não grava: a escrita é NOT_IN_ROLE, CREATE nomeia uma tabela fora do catálogo e mais de uma instrução é 42601', async (t) => {
  const { on } = await withCopies(t)
  const before = await syncRows(on.owner, 'sankhya_vendas', ['NUNOTA'])
  const writes = [
    'delete from sync.sankhya_vendas',
    'insert into sync.sankhya_vendas select * from sync.sankhya_vendas',
    `update sync.sankhya_vendas set "VLRNOTA" = 0`,
  ]
  for (const sql of writes) assert.deepEqual(await queried(on, sql), { kind: 'NOT_IN_ROLE' }, sql)
  assert.deepEqual(await queried(on, 'create table sync.x (a int)'), { kind: 'NOT_IN_CATALOG' })
  const answer = await queried(on, 'select 1; select 2')
  assert.ok(answer.kind === 'QUERY_REFUSED')
  assert.equal(answer.sqlstate, '42601')
  assert.deepEqual(await syncRows(on.owner, 'sankhya_vendas', ['NUNOTA']), before)
})

test('o corte em 200', async (t) => {
  const { on } = await withCopies(t)
  const cut = queryOf(await queried(on, 'select generate_series(1, 201) as n'))
  assert.equal(cut.rows.length, 200)
  assert.equal(cut.complete, false)
  const whole = queryOf(await queried(on, 'select generate_series(1, 200) as n'))
  assert.equal(whole.rows.length, 200)
  assert.equal(whole.complete, true)
})

test('sem _pass', async (t) => {
  const { on } = await withCopies(t)
  const answer = queryOf(await queried(on, 'select * from sync.sankhya_vendas limit 1'))
  assert.ok(answer.columns.length > 1)
  assert.ok(!answer.columns.includes('_pass'))
  assert.equal(answer.rows[0]?.length, answer.columns.length)
})

test('a tabela fora do catálogo dá NOT_IN_CATALOG', async (t) => {
  const { on } = await withCopies(t)
  await asSync(on.owner, async (client) => {
    await client.query('create table sync.fora (a int)')
    await client.query('insert into sync.fora values (1)')
  })
  assert.deepEqual(await queried(on, 'select * from sync.fora'), { kind: 'NOT_IN_CATALOG' })
})

test('a empresa sem banco pronto dá TABLE_UNAVAILABLE com a causa NO_DATABASE', async (t) => {
  const { on } = await withCopies(t)
  const client = new pg.Client({ connectionString: on.hub.test.ownerUrl.reveal() })
  await client.connect()
  try {
    await client.query('update projects.company_database set host = null where company_id = $1', [
      on.companyId,
    ])
  } finally {
    await client.end()
  }
  assert.deepEqual(await queried(on, 'select 1'), { kind: 'TABLE_UNAVAILABLE' })
  const failed = on.hub.lines.find(({ message }) => message === 'DATA_QUERY_FAILED')
  assert.equal(failed?.fields.cause, 'NO_DATABASE')
})

test('a recusa inteira: o SQLSTATE e a mensagem vão ao modelo e o log não tem a consulta nem a mensagem', async (t) => {
  const { on } = await withCopies(t)
  const answer = await queried(on, 'select nao_existe from sync.sankhya_vendas')
  assert.ok(answer.kind === 'QUERY_REFUSED')
  assert.equal(answer.sqlstate, '42703')
  assert.match(answer.message, /nao_existe/)
  const logged = JSON.stringify(on.hub.lines)
  assert.ok(!logged.includes('nao_existe'))
  assert.ok(!logged.includes(answer.message))
})

test('num Projeto, a tabela que o papel lê e o Projeto não recebeu dá NOT_IN_CATALOG e o log não tem a consulta', async (t) => {
  const { on, sellers } = await withCopies(t)
  await on.copies.grant({
    ...{ companyId: on.companyId, personId: on.anaId },
    ...{ copyId: sellers, projectId: on.projectId },
  })
  const project = on.hub.data(scopeOf(on, { kind: 'PROJECT', projectId: on.projectId }), {
    thread: null,
  })
  const sql = 'select * from sync.sankhya_vendas'
  assert.deepEqual(await project.read({ kind: 'QUERY', sql }), { kind: 'NOT_IN_CATALOG' })
  const granted = queryOf(
    await project.read({ kind: 'QUERY', sql: 'select * from sync.sankhya_vendedores limit 1' }),
  )
  assert.deepEqual(
    granted.tables.map(({ table }) => table),
    ['sankhya_vendedores'],
  )
  assert.ok(!JSON.stringify(on.hub.lines).includes(sql))
})

test('o prazo dá DEADLINE e registra TIMEOUT', async (t) => {
  const { on } = await withCopies(t)
  const slow = 'select count(*) from generate_series(1, 100000) a, generate_series(1, 100000) b'
  assert.deepEqual(await queried(on, slow), { kind: 'DEADLINE' })
  const failed = on.hub.lines.find(({ message }) => message === 'DATA_QUERY_FAILED')
  assert.equal(failed?.fields.cause, 'TIMEOUT')
})

test('o membro no Início não lê: a tabela fora do catálogo dele é NOT_IN_CATALOG', async (t) => {
  const { on } = await withCopies(t)
  const answer = await inCompany(on, PersonId.parse(on.carla.id)).read({
    ...{ kind: 'QUERY' },
    sql: 'select count(*) from sync.sankhya_vendas',
  })
  assert.deepEqual(answer, { kind: 'NOT_IN_CATALOG' })
})

test('quem não é da empresa é recusado e a consulta não chega ao banco da empresa', async (t) => {
  const { on } = await withCopies(t)
  const stranger = await personOn(on.hub, { name: 'Zé Fora', email: 'ze@example.test' })
  const reads = t.mock.method(on.hub.postgres.companyPostgres, 'readCopies')
  await assert.rejects(
    () => inCompany(on, PersonId.parse(stranger.id)).read({ kind: 'QUERY', sql: 'select 1' }),
    (error: unknown) => Object(error).code === 'NOT_FOUND',
  )
  assert.equal(reads.mock.callCount(), 0)
})

test('a assinatura única: o contexto não muda a resposta', async (t) => {
  const { on } = await withCopies(t)
  const scope = scopeOf(on, { kind: 'COMPANY' })
  const sql = 'select generate_series(1, 3) as n'
  const plain = await on.hub.data(scope, { thread: null }).read({ kind: 'QUERY', sql })
  const thread = ConversationId.parse(randomUUID())
  const bound = await on.hub.data(scope, { thread }).read({ kind: 'QUERY', sql })
  assert.deepEqual(bound, plain)
})

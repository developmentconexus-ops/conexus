import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { APP_CALL_LIMITS } from '@conexus/app-contract'
import type { ReadAnswer } from '@conexus/hub-api'
import { ConversationId, PersonId } from '@conexus/hub-api'
import pg from 'pg'
import { testAppsConfig } from '../../platform/test-cloudflare.ts'
import { readLoginOf } from '../../platform/test-company-postgres.ts'
import type { SessionScope } from '../connectors/public.ts'
import type { CopiesOn } from '../copies/test-copies.ts'
import { asSync, copiesOn, syncRows } from '../copies/test-copies.ts'
import { personOn } from '../identity/test-hub.ts'

const JOIN = `select v."APELIDO", sum(c."VLRNOTA") from sync.sankhya_vendas c
  join sync.sankhya_vendedores v using ("CODVEND") group by 1`

function scopeOf(on: CopiesOn, place: SessionScope['place'], personId = on.anaId): SessionScope {
  return { companyId: on.companyId, personId, place, chosen: [] }
}

function inCompany(on: CopiesOn, personId = on.anaId) {
  return on.hub.data(scopeOf(on, { kind: 'COMPANY' }, personId))
}

async function withCopies(t: Parameters<typeof copiesOn>[0]) {
  const on = await copiesOn(t)
  const sales = await on.enable('vendas')
  const sellers = await on.enable('vendedores')
  for (const copyId of [sales, sellers]) assert.equal((await on.run(copyId)).kind, 'ENDED')
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

test('o catálogo do sistema não conta', async (t) => {
  const { on } = await withCopies(t)
  assert.deepEqual(queryOf(await queried(on, 'select count(*) from pg_roles')).tables, [])
})

test('não grava: a escrita é NOT_IN_ROLE, CREATE e mais de uma instrução são 42601', async (t) => {
  const { on } = await withCopies(t)
  const before = await syncRows(on.owner, 'sankhya_vendas', ['NUNOTA'])
  const writes = [
    'delete from sync.sankhya_vendas',
    'insert into sync.sankhya_vendas select * from sync.sankhya_vendas',
    `update sync.sankhya_vendas set "VLRNOTA" = 0`,
  ]
  for (const sql of writes) assert.deepEqual(await queried(on, sql), { kind: 'NOT_IN_ROLE' }, sql)
  for (const sql of ['create table sync.x (a int)', 'select 1; select 2']) {
    const answer = await queried(on, sql)
    assert.ok(answer.kind === 'QUERY_REFUSED', sql)
    assert.equal(answer.sqlstate, '42601', sql)
  }
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

test('42501 num Projeto: a tabela não liberada dá NOT_IN_ROLE e o log não tem a consulta', async (t) => {
  const { on, sellers } = await withCopies(t)
  await on.copies.grant({
    ...{ companyId: on.companyId, personId: on.anaId },
    ...{ copyId: sellers, projectId: on.projectId },
  })
  const project = on.hub.data(scopeOf(on, { kind: 'PROJECT', projectId: on.projectId }))
  const sql = 'select * from sync.sankhya_vendas'
  assert.deepEqual(await project.read({ kind: 'QUERY', sql }), { kind: 'NOT_IN_ROLE' })
  const granted = queryOf(
    await project.read({ kind: 'QUERY', sql: 'select * from sync.sankhya_vendedores limit 1' }),
  )
  assert.deepEqual(
    granted.tables.map(({ table }) => table),
    ['sankhya_vendedores'],
  )
  const line = on.hub.lines.find(({ message }) => message === 'DATA_READ_REFUSED')
  assert.ok(line)
  assert.ok(!JSON.stringify(on.hub.lines).includes(sql))
})

test('o prazo dá DEADLINE e registra TIMEOUT', async (t) => {
  const { on } = await withCopies(t)
  const seconds = Math.ceil(APP_CALL_LIMITS.callDeadlineMs / 1000) + 2
  assert.deepEqual(await queried(on, `select pg_sleep(${seconds})`), { kind: 'DEADLINE' })
  const failed = on.hub.lines.find(({ message }) => message === 'DATA_QUERY_FAILED')
  assert.equal(failed?.fields.cause, 'TIMEOUT')
})

test('o membro no Início não lê: NOT_IN_ROLE', async (t) => {
  const { on } = await withCopies(t)
  const answer = await inCompany(on, PersonId.parse(on.carla.id)).read({
    ...{ kind: 'QUERY' },
    sql: 'select count(*) from sync.sankhya_vendas',
  })
  assert.deepEqual(answer, { kind: 'NOT_IN_ROLE' })
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
  const plain = await on.hub.data(scope).read({ kind: 'QUERY', sql })
  const bound = await on.hub
    .data(scope, { by: { agent: 'ASSISTANT', threadId: ConversationId.parse(randomUUID()) } })
    .read({ kind: 'QUERY', sql })
  assert.deepEqual(bound, plain)
})

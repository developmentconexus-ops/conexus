import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sql } from 'drizzle-orm'
import {
  A,
  ANA,
  B,
  BRUNO,
  CONNECTION_A1,
  CONNECTION_A2,
  CONNECTION_B1,
  copyOf,
  RUN_A1,
  RUN_B1,
  refusedWith,
  runOf,
  seeded,
  TABLE_A1,
  TABLE_A2,
  TABLE_B1,
  tableOf,
} from './test-lake-tables.ts'

test('as contagens da rodada por tabela: uma por par, não negativas, da empresa da rodada e da tabela', async (t) => {
  const { asOwner } = await seeded(t)
  await asOwner(copyOf(A, 'sankhya', CONNECTION_A1))
  await asOwner(copyOf(B, 'sankhya', CONNECTION_B1))
  await asOwner(tableOf(TABLE_A1, A, CONNECTION_A1, 'TGFCAB', 'sankhya_notas'))
  await asOwner(tableOf(TABLE_B1, B, CONNECTION_B1, 'TGFCAB', 'sankhya_notas'))
  await asOwner(runOf(RUN_A1, A, CONNECTION_A1))
  await asOwner(runOf(RUN_B1, B, CONNECTION_B1))
  function counted(run: string, table: string, company: string, counts = '10, 10, 100') {
    return `insert into copies.lake_table_run(run_id, table_id, company_id, read, written, rows, whole)
      values ('${run}', '${table}', '${company}', ${counts}, false)`
  }
  await asOwner(counted(RUN_A1, TABLE_A1, A))
  await assert.rejects(asOwner(counted(RUN_A1, TABLE_A1, A, '1, 1, 1')), {
    code: '23505',
    constraint: 'lake_table_run_pkey',
  })
  const second = crypto.randomUUID()
  await asOwner(runOf(second, A, CONNECTION_A1, '', false))
  for (const counts of ['-1, 0, 0', '0, -1, 0', '0, 0, -1']) {
    await assert.rejects(asOwner(counted(second, TABLE_A1, A, counts)), {
      code: '23514',
      constraint: 'lake_table_run_counts',
    })
  }
  await assert.rejects(
    asOwner(counted(RUN_B1, TABLE_A1, A)),
    { code: '23503' },
    'a rodada de outra empresa',
  )
  await assert.rejects(
    asOwner(counted(RUN_A1, TABLE_B1, A)),
    { code: '23503' },
    'a tabela de outra empresa',
  )
  await assert.rejects(
    asOwner(`update copies.lake_table set last_run_id = '${RUN_B1}' where id = '${TABLE_A1}'`),
    { code: '23503', constraint: 'lake_table_last_run_id_fkey' },
    'a última rodada de outra empresa',
  )
})

test('apagar: a ligação leva a cópia, as tabelas e as rodadas; a rodada apagada solta a tabela', async (t) => {
  const { asOwner } = await seeded(t)
  await asOwner(copyOf(A, 'sankhya', CONNECTION_A1))
  await asOwner(copyOf(A, 'hubspot', CONNECTION_A2))
  await asOwner(tableOf(TABLE_A1, A, CONNECTION_A1, 'TGFCAB', 'sankhya_notas'))
  await asOwner(tableOf(TABLE_A2, A, CONNECTION_A2, 'deals', 'hubspot_deals'))
  await asOwner(runOf(RUN_A1, A, CONNECTION_A1, '', false))
  await asOwner(
    `insert into copies.lake_table_run(run_id, table_id, company_id, read, written, rows, whole)
     values ('${RUN_A1}', '${TABLE_A1}', '${A}', 1, 1, 1, true)`,
  )
  await asOwner(`update copies.lake_table set last_run_id = '${RUN_A1}'`)

  await asOwner(`delete from copies.lake_run where id = '${RUN_A1}'`)
  assert.deepEqual(
    await asOwner(
      `select count(*)::int as n, count(last_run_id)::int as linked from copies.lake_table`,
    ),
    [{ n: 2, linked: 0 }],
  )
  assert.deepEqual(await asOwner(`select count(*)::int as n from copies.lake_table_run`), [
    { n: 0 },
  ])

  await asOwner(runOf(RUN_A1, A, CONNECTION_A1, '', false))
  await asOwner(
    `insert into copies.lake_table_run(run_id, table_id, company_id, read, written, rows, whole)
     values ('${RUN_A1}', '${TABLE_A1}', '${A}', 1, 1, 1, true)`,
  )
  await asOwner(`delete from connectors.connection where id = '${CONNECTION_A1}'`)
  assert.deepEqual(
    await asOwner(
      `select (select count(*)::int from copies.lake_copy) as copies,
              (select count(*)::int from copies.lake_table) as tables,
              (select count(*)::int from copies.lake_run) as runs,
              (select count(*)::int from copies.lake_table_run) as counts`,
    ),
    [{ copies: 1, tables: 1, runs: 0, counts: 0 }],
  )
  await asOwner(
    `delete from auth.member where company_id = '${A}'; delete from auth.company where id = '${A}'`,
  )
  assert.deepEqual(await asOwner(`select count(*)::int as n from copies.lake_copy`), [{ n: 0 }])
})

test('a empresa lê e grava as quatro tabelas da sua cópia, e de nenhuma outra', async (t) => {
  const { database, asOwner } = await seeded(t)
  await asOwner(copyOf(B, 'sankhya', CONNECTION_B1))
  await asOwner(tableOf(TABLE_B1, B, CONNECTION_B1, 'TGFCAB', 'sankhya_notas'))
  await asOwner(runOf(RUN_B1, B, CONNECTION_B1))
  const inA = { kind: 'COMPANY', companyId: A, personId: ANA } as const
  const inB = { kind: 'COMPANY', companyId: B, personId: BRUNO } as const
  function runAs(scope: typeof inA | typeof inB, statement: string) {
    return database.command(scope, (tx) => tx.execute(sql.raw(statement)))
  }

  await runAs(inA, copyOf(A, 'sankhya', CONNECTION_A1))
  await runAs(inA, tableOf(TABLE_A1, A, CONNECTION_A1, 'TGFCAB', 'sankhya_notas_a'))
  await runAs(inA, runOf(RUN_A1, A, CONNECTION_A1))
  await runAs(
    inA,
    `insert into copies.lake_table_run(run_id, table_id, company_id, read, written, rows, whole)
     values ('${RUN_A1}', '${TABLE_A1}', '${A}', 3, 3, 3, false)`,
  )
  await runAs(inA, `update copies.lake_copy set interval = 'MANUAL', start_date = '2026-03-01'`)
  await runAs(inA, `update copies.lake_table set rows = 3, last_run_id = '${RUN_A1}'`)
  await runAs(inA, `update copies.lake_run set ended_at = now(), outcome = 'COMPLETE'`)
  await runAs(inA, `update copies.lake_table_run set rows = 4`)

  for (const table of ['lake_copy', 'lake_table', 'lake_run', 'lake_table_run']) {
    const seen = await runAs(inA, `select company_id from copies.${table}`)
    assert.deepEqual(seen.rows, [{ company_id: A }], `${table}: a empresa A só vê a sua`)
  }
  assert.deepEqual((await runAs(inB, `select id from copies.lake_table`)).rows, [{ id: TABLE_B1 }])

  for (const statement of [
    copyOf(B, 'sankhya', CONNECTION_B1),
    tableOf(crypto.randomUUID(), B, CONNECTION_B1, 'TGFITE', 'sankhya_x'),
    runOf(crypto.randomUUID(), B, CONNECTION_B1, '', false),
  ]) {
    await assert.rejects(runAs(inA, statement), refusedWith('42501'))
  }
  await runAs(inA, `update copies.lake_table set label = 'outro' where id = '${TABLE_B1}'`)
  await runAs(inA, `delete from copies.lake_run where id = '${RUN_B1}'`)
  assert.deepEqual(await asOwner(`select label from copies.lake_table where id = '${TABLE_B1}'`), [
    { label: 'Notas' },
  ])
  assert.deepEqual(await asOwner(`select id from copies.lake_run where id = '${RUN_B1}'`), [
    { id: RUN_B1 },
  ])
  await runAs(inA, `delete from copies.lake_table_run`)
  await runAs(inA, `delete from copies.lake_run`)
  await runAs(inA, `delete from copies.lake_table`)
  await runAs(inA, `delete from copies.lake_copy`)
  assert.deepEqual(await asOwner(`select company_id from copies.lake_copy`), [{ company_id: B }])
})

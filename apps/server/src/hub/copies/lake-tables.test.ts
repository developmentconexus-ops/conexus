import assert from 'node:assert/strict'
import { test } from 'node:test'
import { LakeInterval, LakeRunFailureCode } from '@conexus/hub-api'
import { createTestDatabase } from '../../platform/test-database.ts'
import {
  A,
  B,
  CONNECTION_A1,
  CONNECTION_A2,
  CONNECTION_B1,
  copyOf,
  freshRun,
  RUN_A1,
  runOf,
  seeded,
  TABLE_A1,
  TABLE_A2,
  TABLE_B1,
  tableOf,
} from './test-lake-tables.ts'

test('a cópia: uma por ligação, o intervalo do contrato e a data inicial nula ou um dia', async (t) => {
  const { asOwner } = await seeded(t)
  await asOwner(copyOf(A, 'sankhya', CONNECTION_A1))
  await assert.rejects(asOwner(copyOf(A, 'sankhya', CONNECTION_A1, '1h')), {
    code: '23505',
    constraint: 'lake_copy_pkey',
  })
  for (const interval of LakeInterval.options.filter((each) => each !== '24h')) {
    await asOwner(`delete from copies.lake_copy`)
    await asOwner(copyOf(A, 'sankhya', CONNECTION_A1, interval))
  }
  for (const interval of ['5m', '24H', 'manual', '']) {
    await assert.rejects(asOwner(copyOf(A, 'hubspot', CONNECTION_A2, interval)), {
      code: '23514',
      constraint: 'lake_copy_interval',
    })
  }
  await asOwner(`delete from copies.lake_copy`)
  await assert.rejects(asOwner(copyOf(B, 'sankhya', CONNECTION_A1)), { code: '23503' })
  await assert.rejects(asOwner(copyOf(A, 'hubspot', CONNECTION_A1)), { code: '23503' })

  await asOwner(copyOf(A, 'sankhya', CONNECTION_A1))
  await asOwner(`update copies.lake_copy set start_date = '2026-01-01'`)
  assert.deepEqual(
    await asOwner(`select start_date::text as day from copies.lake_copy`),
    [{ day: '2026-01-01' }],
    'a data da cópia',
  )
  await asOwner(`update copies.lake_copy set start_date = null`)
  await assert.rejects(asOwner(`update copies.lake_copy set start_date = '2026-02-30'`), {
    code: '22008',
  })
})

test('a tabela marcada: uma por fonte e ligação, um nome por empresa, o nome e o id da fonte pelo padrão', async (t) => {
  const { asOwner } = await seeded(t)
  await asOwner(copyOf(A, 'sankhya', CONNECTION_A1))
  await asOwner(copyOf(A, 'hubspot', CONNECTION_A2))
  await asOwner(copyOf(B, 'sankhya', CONNECTION_B1))
  await asOwner(tableOf(TABLE_A1, A, CONNECTION_A1, 'TGFCAB', 'sankhya_notas'))

  await assert.rejects(
    asOwner(tableOf(crypto.randomUUID(), A, CONNECTION_A1, 'TGFCAB', 'sankhya_outra')),
    { code: '23505', constraint: 'lake_table_source_key' },
    'a mesma fonte duas vezes',
  )
  await assert.rejects(
    asOwner(tableOf(crypto.randomUUID(), A, CONNECTION_A2, 'deals', 'sankhya_notas')),
    { code: '23505', constraint: 'lake_table_name_key' },
    'o mesmo nome em duas ligações da empresa',
  )
  await asOwner(tableOf(TABLE_A2, A, CONNECTION_A2, 'TGFCAB', 'hubspot_notas'))
  await asOwner(tableOf(TABLE_B1, B, CONNECTION_B1, 'TGFCAB', 'sankhya_notas'))

  assert.deepEqual(
    await asOwner(`select indexdef from pg_indexes where indexname = 'lake_table_name_key'`),
    [
      {
        indexdef:
          'CREATE UNIQUE INDEX lake_table_name_key ON copies.lake_table USING btree (company_id, lower(name))',
      },
    ],
    'o nome é único sem caixa',
  )
  for (const name of ['Sankhya_notas', '1notas', '_notas', 'notas-fiscais', '', 'a'.repeat(61)]) {
    await assert.rejects(
      asOwner(tableOf(crypto.randomUUID(), A, CONNECTION_A1, 'TGFITE', name)),
      { code: '23514', constraint: 'lake_table_name' },
      name,
    )
  }
  await asOwner(tableOf(crypto.randomUUID(), A, CONNECTION_A1, 'TGFITE', 'a'.repeat(60)))
  for (const source of ['1TGF', '_TGF', 'TGF-CAB', '', 'T'.repeat(61)]) {
    await assert.rejects(
      asOwner(tableOf(crypto.randomUUID(), A, CONNECTION_A1, source, 'sankhya_x')),
      { code: '23514', constraint: 'lake_table_source_table' },
      source,
    )
  }
  await assert.rejects(
    asOwner(tableOf(crypto.randomUUID(), A, CONNECTION_A1, 'TGFPRO', 'sankhya_pro', '{}')),
    { code: '23514', constraint: 'lake_table_columns' },
  )
  await assert.rejects(
    asOwner(tableOf(crypto.randomUUID(), A, CONNECTION_A2, 'TGFPRO', 'sankhya_pro').replace(A, B)),
    { code: '23503' },
    'uma tabela sem a cópia da ligação, da empresa',
  )
})

test('a rodada: uma aberta por ligação, a hora e o fim juntos', async (t) => {
  const { asOwner } = await seeded(t)
  await asOwner(copyOf(A, 'sankhya', CONNECTION_A1))
  await asOwner(copyOf(A, 'hubspot', CONNECTION_A2))
  await asOwner(runOf(RUN_A1, A, CONNECTION_A1))
  await assert.rejects(
    asOwner(runOf(crypto.randomUUID(), A, CONNECTION_A1)),
    { code: '23505', constraint: 'lake_run_open_key' },
    'a segunda rodada aberta',
  )
  await asOwner(runOf(crypto.randomUUID(), A, CONNECTION_A2))
  await asOwner(
    `update copies.lake_run set ended_at = now(), outcome = 'INTERRUPTED' where id = '${RUN_A1}'`,
  )
  await asOwner(runOf(crypto.randomUUID(), A, CONNECTION_A1))
  await asOwner(runOf(crypto.randomUUID(), A, CONNECTION_A1, '', false))

  const stray = await freshRun(asOwner, A, CONNECTION_A1)
  await assert.rejects(
    asOwner(`update copies.lake_run set ended_at = now() where id = '${stray}'`),
    { code: '23514', constraint: 'lake_run_ended' },
  )
  await assert.rejects(
    asOwner(`update copies.lake_run set outcome = 'COMPLETE' where id = '${stray}'`),
    { code: '23514', constraint: 'lake_run_ended' },
  )
  await assert.rejects(
    asOwner(
      `update copies.lake_run set ended_at = now(), outcome = 'PARTIAL' where id = '${stray}'`,
    ),
    { code: '23514', constraint: 'lake_run_outcome' },
  )
})

test('a rodada: o código só com ERROR e da lista do contrato', async (t) => {
  const { asOwner } = await seeded(t)
  await asOwner(copyOf(A, 'sankhya', CONNECTION_A1))
  async function ended(set: string) {
    const id = await freshRun(asOwner, A, CONNECTION_A1)
    await asOwner(`update copies.lake_run set ended_at = now(), ${set} where id = '${id}'`)
  }
  for (const code of LakeRunFailureCode.options) {
    await ended(`outcome = 'ERROR', code = '${code}'`)
  }
  await assert.rejects(ended(`outcome = 'ERROR', code = 'COPY_OUTRO'`), {
    code: '23514',
    constraint: 'lake_run_code',
  })
  for (const outcome of ['COMPLETE', 'INTERRUPTED']) {
    await assert.rejects(
      ended(`outcome = '${outcome}', code = 'COPY_TASK_LOST'`),
      { code: '23514', constraint: 'lake_run_code' },
      outcome,
    )
  }
  const system = [
    'system_status = 503',
    `system_code = 'EDGE'`,
    `system_message = 'fora do ar'`,
    `failed_table = 'TGFCAB'`,
  ]
  for (const outcome of ['COMPLETE', 'INTERRUPTED']) {
    for (const field of system) {
      await assert.rejects(
        ended(`outcome = '${outcome}', ${field}`),
        { code: '23514', constraint: 'lake_run_system' },
        `${outcome} ${field}`,
      )
    }
  }
  await ended(`outcome = 'ERROR', ${system.join(', ')}`)
})

test('a rodada: o teto do código do sistema (#1135) e da mensagem, a tarefa e a tentativa', async (t) => {
  const { asOwner } = await seeded(t)
  await asOwner(copyOf(A, 'sankhya', CONNECTION_A1))
  const refused = await freshRun(asOwner, A, CONNECTION_A1)
  function set(change: string) {
    return asOwner(`update copies.lake_run set ${change} where id = '${refused}'`)
  }
  await set(`system_code = '${'c'.repeat(64)}', system_message = '${'m'.repeat(1000)}'`)
  await assert.rejects(set(`system_code = '${'c'.repeat(65)}'`), {
    code: '23514',
    constraint: 'lake_run_system_code',
  })
  await assert.rejects(set(`system_message = '${'m'.repeat(1001)}'`), {
    code: '23514',
    constraint: 'lake_run_system_message',
  })
  await set(`task_arn = 'arn:aws:ecs:us-east-2:123456789012:task/c/abc'`)
  for (const arn of ['arn:aws:s3:::bucket', 'ecs', '']) {
    await assert.rejects(
      set(`task_arn = '${arn}'`),
      { code: '23514', constraint: 'lake_run_task_arn' },
      arn,
    )
  }
  for (const attempt of [0, -1]) {
    await assert.rejects(set(`attempt = ${attempt}`), {
      code: '23514',
      constraint: 'lake_run_attempt',
    })
  }
})

test('a rodada: a máquina vem inteira ou não vem, só de rodada fechada, com picos não negativos', async (t) => {
  const { asOwner } = await seeded(t)
  await asOwner(copyOf(A, 'sankhya', CONNECTION_A1))
  const id = await freshRun(asOwner, A, CONNECTION_A1)
  const whole = `cpu_allocated = 1, memory_allocated_mib = 2048, cpu_peak = 0.97, memory_peak_mib = 771, machine_samples = '{"everySeconds":5,"samples":[[0.97,771]]}'`
  function set(change: string) {
    return asOwner(`update copies.lake_run set ${change} where id = '${id}'`)
  }
  await assert.rejects(set(whole), { code: '23514', constraint: 'lake_run_machine' })
  await set(`ended_at = now(), outcome = 'COMPLETE'`)
  for (const part of [`cpu_allocated = 1`, `memory_peak_mib = 771`, `machine_samples = '{}'`]) {
    await assert.rejects(set(part), { code: '23514', constraint: 'lake_run_machine' }, part)
  }
  await assert.rejects(set(whole.replace('cpu_peak = 0.97', 'cpu_peak = -1')), {
    code: '23514',
    constraint: 'lake_run_machine',
  })
  await assert.rejects(set(whole.replace('memory_peak_mib = 771', 'memory_peak_mib = -1')), {
    code: '23514',
    constraint: 'lake_run_machine',
  })
  await set(whole)
  await set(
    `cpu_allocated = null, memory_allocated_mib = null, cpu_peak = null, memory_peak_mib = null, machine_samples = null`,
  )
})

test('o catálogo das cópias: a segurança por linha e a política da empresa nas quatro tabelas', async (t) => {
  const { asOwner } = await createTestDatabase(t)
  assert.deepEqual(
    await asOwner(
      `select relname, relrowsecurity as secured from pg_class
        where relnamespace = 'copies'::regnamespace and relkind = 'r' order by relname`,
    ),
    ['lake_copy', 'lake_run', 'lake_table', 'lake_table_run'].map((relname) => ({
      relname,
      secured: true,
    })),
  )
  assert.deepEqual(
    (
      await asOwner(
        `select tablename || ' ' || policyname || ' ' || roles::text || ' ' || cmd as policy
           from pg_policies where schemaname = 'copies' order by tablename`,
      )
    ).map((row) => row.policy),
    [
      'lake_copy company_all {hub_company} ALL',
      'lake_run company_all {hub_company} ALL',
      'lake_table company_all {hub_company} ALL',
      'lake_table_run company_all {hub_company} ALL',
    ],
  )
})

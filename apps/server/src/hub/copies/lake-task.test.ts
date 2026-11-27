import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  COPY_TASK_SCHEMA,
  CopyTaskProgress,
  CopyTaskResult,
  CopyTaskSpec,
  copyTaskSchema,
} from './public.ts'

test('o esquema da tarefa guardado é o que o Zod gera hoje', () => {
  assert.deepEqual(JSON.parse(readFileSync(COPY_TASK_SCHEMA, 'utf8')), copyTaskSchema())
})

test('o resultado é completo, ou erro com o código', () => {
  const result = { type: 'RESULT', version: 1, runId: randomUUID(), attempt: 1, tables: [] }
  const failed = { kind: 'ERROR', table: null, system: null }
  assert.equal(CopyTaskResult.safeParse({ ...result, outcome: { kind: 'COMPLETE' } }).success, true)
  assert.equal(CopyTaskResult.safeParse({ ...result, outcome: failed }).success, false)
  const coded = { ...failed, code: 'COPY_LAKE_WRITE_FAILED' }
  assert.equal(CopyTaskResult.safeParse({ ...result, outcome: coded }).success, true)
})

test('o resultado: sem machine ainda vale, com machine só o inteiro e o que cabe', () => {
  const result = {
    ...{ type: 'RESULT', version: 1, runId: randomUUID(), attempt: 1, tables: [] },
    outcome: { kind: 'COMPLETE' },
  }
  const machine = {
    allocated: { vcpu: 1, memoryMib: 2048 },
    peak: { vcpu: 0.97, memoryMib: 771 },
    everySeconds: 5,
    samples: [[0.97, 771]],
  }
  function accepted(change: object) {
    return CopyTaskResult.safeParse({ ...result, ...change }).success
  }
  assert.equal(accepted({}), true, 'a task of the earlier image')
  assert.equal(accepted({ machine: null }), true, 'not measured')
  assert.equal(accepted({ machine }), true)
  assert.equal(accepted({ machine: { ...machine, everySeconds: 4 } }), false)
  assert.equal(accepted({ machine: { ...machine, samples: Array(361).fill([0, 0]) } }), false)
  assert.equal(accepted({ machine: { ...machine, peak: { vcpu: -1, memoryMib: 1 } } }), false)
  assert.equal(accepted({ machine: { ...machine, allocated: { vcpu: 0, memoryMib: 1 } } }), false)
})

test('a especificação pede ao menos uma tabela', () => {
  const spec = {
    version: 1,
    runId: randomUUID(),
    attempt: 1,
    companyId: 'Aa0Bb1Cc2Dd3Ee4Ff5Gg6Hh7Ii8Jj9Kk',
    connector: 'sankhya',
    connectionId: randomUUID(),
    account: null,
    startDate: null,
    credential: { usuario: 'inventado' },
    tables: [{ source: 'TGFCAB', name: 'sankhya_notas', whole: true }],
    lake: { bucketArn: 'arn:aws:s3tables:us-east-2:111122223333:bucket/x', region: 'us-east-2' },
    queueUrl: 'https://sqs.us-east-2.amazonaws.com/111122223333/conexus-copia-fim',
  }
  assert.equal(CopyTaskSpec.safeParse(spec).success, true)
  assert.equal(CopyTaskSpec.safeParse({ ...spec, tables: [] }).success, false)
})

test('o placar: a fase é copiando ou atualizando uma tabela, e a tabela leva só nome, números e horas', () => {
  const table = {
    ...{ name: 'sankhya_notas', read: 3, written: 2, failed: false },
    ...{ startedAt: '2026-11-27T14:02:30Z', endedAt: null },
  }
  const progress = {
    ...{ type: 'PROGRESS', version: 1, runId: randomUUID(), attempt: 1, seq: 1 },
    ...{ at: '2026-11-27T14:03:00Z', phase: { kind: 'COPYING' }, tables: [table] },
  }
  function accepted(change: object) {
    return CopyTaskProgress.safeParse({ ...progress, ...change }).success
  }
  assert.equal(accepted({}), true)
  assert.equal(accepted({ phase: { kind: 'UPDATING', table: 'sankhya_notas' } }), true)
  assert.equal(accepted({ phase: { kind: 'UPDATING' } }), false, 'the table of the turn is asked')
  assert.equal(accepted({ seq: 0 }), false)
  assert.equal(accepted({ tables: [{ ...table, read: -1 }] }), false)
  assert.equal(accepted({ tables: [{ ...table, startedAt: 'ontem' }] }), false)
})

test('o resultado: o início e o fim da tabela valem ou faltam, como numa imagem antiga', () => {
  const entry = { name: 'sankhya_notas', read: 1, written: 1, rounded: 0, rows: 1, whole: false }
  const result = {
    ...{ type: 'RESULT', version: 1, runId: randomUUID(), attempt: 1 },
    outcome: { kind: 'COMPLETE' },
  }
  function accepted(change: object) {
    return CopyTaskResult.safeParse({ ...result, tables: [{ ...entry, ...change }] }).success
  }
  assert.equal(accepted({}), true, 'a task of the earlier image')
  assert.equal(accepted({ startedAt: null, endedAt: null }), true)
  assert.equal(
    accepted({ startedAt: '2026-11-27T14:02:30Z', endedAt: '2026-11-27T14:05:10Z' }),
    true,
  )
  assert.equal(accepted({ startedAt: 'ontem' }), false)
})

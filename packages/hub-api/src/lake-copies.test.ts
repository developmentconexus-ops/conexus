import assert from 'node:assert/strict'
import { test } from 'node:test'
import { FAILURES } from './failures.ts'
import {
  getLakeTablesOfConnection,
  LAKE_RUN_FAILURE_CODES,
  LakeRun,
  listLakeTableRuns,
  listLakeTables,
  RunLakeCopy,
  runLakeCopy,
  SetLakeCopy,
  setLakeCopy,
} from './lake-copies.ts'
import { failuresOf } from './operation.ts'

const RUN = {
  id: '00000000-0000-4000-8000-0000000000a1',
  startedAt: '2026-11-24T10:00:00.000Z',
  whole: false,
}
const ENDED = { endedAt: '2026-11-24T10:01:00.000Z', read: 3, written: 3, machine: null }

test('a rodada é uma união por resultado: só a que terminou tem contagens, e só o erro tem código', () => {
  assert.ok(LakeRun.safeParse({ ...RUN, outcome: 'RUNNING', stopping: false }).success)
  assert.ok(LakeRun.safeParse({ ...RUN, ...ENDED, outcome: 'COMPLETE' }).success)
  const interrupted = { ...RUN, ...ENDED, outcome: 'INTERRUPTED' }
  assert.ok(LakeRun.safeParse({ ...interrupted, stoppedBy: null }).success)
  assert.ok(LakeRun.safeParse({ ...interrupted, stoppedBy: { name: 'Ana' } }).success)
  assert.equal(LakeRun.safeParse({ ...RUN, outcome: 'COMPLETE' }).success, false)
  const error = { ...RUN, ...ENDED, outcome: 'ERROR', failedTable: null, system: null }
  assert.equal(LakeRun.safeParse(error).success, false)
  for (const code of LAKE_RUN_FAILURE_CODES) {
    assert.ok(LakeRun.safeParse({ ...error, code }).success, code)
  }
})

test('a rodada fechada leva a máquina medida ou null; a parada do ECS diz a frase sem status', () => {
  const machine = {
    allocated: { vcpu: 1, memoryMib: 2048 },
    peak: { vcpu: 0.97, memoryMib: 771 },
    everySeconds: 5,
    samples: [[0.97, 771]],
  }
  assert.ok(LakeRun.safeParse({ ...RUN, ...ENDED, machine, outcome: 'COMPLETE' }).success)
  assert.equal(
    LakeRun.safeParse({ ...RUN, ...ENDED, machine: undefined, outcome: 'COMPLETE' }).success,
    false,
  )
  const lost = { ...RUN, ...ENDED, outcome: 'ERROR', code: 'COPY_TASK_LOST', failedTable: null }
  const system = { status: null, code: null, message: 'Essential container in task exited' }
  assert.ok(LakeRun.safeParse({ ...lost, system }).success)
})

test('gravar a cópia aceita até 60 tabelas e uma data só em dia; rodar agora lê inteiro só se pedido', () => {
  const table = { source: 'TGFCAB', name: 'sankhya_notas' }
  const set = { tables: [table], interval: '24h', startDate: null, fullPass: 'OFF' }
  assert.ok(SetLakeCopy.safeParse(set).success)
  assert.ok(SetLakeCopy.safeParse({ ...set, startDate: '2026-01-31' }).success)
  assert.equal(SetLakeCopy.safeParse({ ...set, startDate: '31/01/2026' }).success, false)
  assert.equal(SetLakeCopy.safeParse({ ...set, tables: Array(61).fill(table) }).success, false)
  assert.ok(
    SetLakeCopy.safeParse({ ...set, tables: [{ ...table, name: 'Notas' }] }).success,
    'a name off the pattern reaches the Hub, which answers COPY_NAME_INVALID',
  )
  assert.equal(
    SetLakeCopy.safeParse({ ...set, tables: [{ ...table, name: 'n'.repeat(121) }] }).success,
    false,
  )
  assert.deepEqual(RunLakeCopy.parse({}), { whole: false })
})

test('as rotas de Dados e da ligação são declaradas, e cada falha delas tem a sua frase', () => {
  const marked = failuresOf(setLakeCopy)
  for (const code of [
    'COPY_LAKE_NOT_READY',
    'COPY_RUN_OPEN',
    'COPY_NAME_TAKEN',
    'COPY_NAME_FIXED',
    'COPY_TABLE_NOT_DECLARED',
    'COPY_NAME_INVALID',
    'COPY_START_DATE_INVALID',
    'COPY_AWS_UNAVAILABLE',
  ] as const) {
    assert.ok(marked.includes(code), code)
    assert.ok(FAILURES[code].phrase.length > 0, code)
  }
  assert.deepEqual(
    [getLakeTablesOfConnection, setLakeCopy, runLakeCopy, listLakeTables, listLakeTableRuns].map(
      ({ method, path }) => `${method} ${path.replaceAll(/\{\w+\}/g, '_')}`,
    ),
    [
      'GET /api/companies/_/connections/_/lake-tables',
      'PUT /api/companies/_/connections/_/lake-copy',
      'POST /api/companies/_/connections/_/lake-copy/run',
      'GET /api/companies/_/lake-tables',
      'GET /api/companies/_/lake-tables/_/runs',
    ],
  )
  assert.equal(FAILURES.COPY_NAME_TAKEN.status, 409)
  assert.equal(FAILURES.COPY_NAME_INVALID.status, 422)
})

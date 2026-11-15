import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { CopyId } from '@conexus/hub-api'
import type { CopiesOn } from './test-copies.ts'
import { copiesOn, copyRowOf, plantSource, syncRows, TEST_TUNING } from './test-copies.ts'

async function ended(on: CopiesOn, copyId: CopyId, whole = false) {
  const end = await on.run(copyId, undefined, whole)
  assert.equal(end.kind, 'ENDED', JSON.stringify(end))
  return end.kind === 'ENDED' ? end.outcome : undefined
}

const CLIENTES = ['CODPARC']

function codparcsOf(rows: string[][]) {
  return rows.map((row) => Number(row[0]))
}

function wholeOf(on: CopiesOn, copyId: CopyId) {
  return on.hub.test.asOwner(
    'select whole from copies.copy_run where copy_id = $1 order by started_at',
    [copyId],
  )
}

test('a passada inteira começa do zero mesmo no meio de uma passada', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('clientes')
  assert.deepEqual(await ended(on, copyId), { kind: 'COMPLETE' })
  const before = await syncRows(on.owner, 'sankhya_clientes', CLIENTES)
  const middle = Number(before[Math.floor(before.length / 2)]?.[0])
  await plantSource(on, copyId, 'position = $2', [{ kind: 'KEY', after: [middle] }])
  assert.deepEqual(await ended(on, copyId, true), { kind: 'COMPLETE' })
  const after = await syncRows(on.owner, 'sankhya_clientes', CLIENTES)
  assert.deepEqual(codparcsOf(after), codparcsOf(before), 'nenhuma linha sai')
  assert.equal(Number((await copyRowOf(on, copyId)).rows), before.length)
})

test('a rodada inteira fica marcada', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('clientes')
  await ended(on, copyId)
  await ended(on, copyId, true)
  assert.deepEqual(await wholeOf(on, copyId), [{ whole: false }, { whole: true }])
})

test('a passada inteira apaga o que sumiu numa cópia incremental', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('clientes')
  await ended(on, copyId)
  const before = await syncRows(on.owner, 'sankhya_clientes', CLIENTES)
  const gone = String(before[0]?.[0])
  on.gate.gone.add(gone)
  assert.deepEqual(await ended(on, copyId), { kind: 'COMPLETE' })
  assert.equal(
    (await syncRows(on.owner, 'sankhya_clientes', CLIENTES)).length,
    before.length,
    'a rodada normal não apaga',
  )
  assert.deepEqual(await ended(on, copyId, true), { kind: 'COMPLETE' })
  const after = codparcsOf(await syncRows(on.owner, 'sankhya_clientes', CLIENTES))
  assert.ok(!after.includes(Number(gone)), 'a inteira apaga o que sumiu')
  assert.equal(after.length, before.length - 1, 'as outras linhas ficam')
})

test('a passada inteira que falha não apaga', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('clientes')
  await ended(on, copyId)
  const before = await syncRows(on.owner, 'sankhya_clientes', CLIENTES)
  on.gate.gone.add(String(before[0]?.[0]))
  on.fake.switches.refuse.add('consultar')
  assert.deepEqual(await ended(on, copyId, true), { kind: 'ERROR', code: 'COPY_SOURCE_REFUSED' })
  assert.deepEqual(await syncRows(on.owner, 'sankhya_clientes', CLIENTES), before)
  on.fake.switches.refuse.delete('consultar')
  assert.deepEqual(await ended(on, copyId), { kind: 'COMPLETE' })
  assert.equal((await syncRows(on.owner, 'sankhya_clientes', CLIENTES)).length, before.length - 1)
})

test('a passada inteira que não cabe numa rodada continua na seguinte', async (t) => {
  const on = await copiesOn(t, { ...TEST_TUNING, runPages: 1 })
  const copyId = await on.enable('clientes')
  await onceComplete(on, copyId)
  const before = await syncRows(on.owner, 'sankhya_clientes', CLIENTES)
  on.gate.gone.add(String(before[0]?.[0]))
  assert.deepEqual(await ended(on, copyId, true), { kind: 'PARTIAL', reason: 'CAP' })
  assert.equal((await syncRows(on.owner, 'sankhya_clientes', CLIENTES)).length, before.length)
  await onceComplete(on, copyId)
  assert.equal((await syncRows(on.owner, 'sankhya_clientes', CLIENTES)).length, before.length - 1)
})

/** Runs until the copy's pass closes, one page a run. */
async function onceComplete(on: CopiesOn, copyId: CopyId) {
  for (let turn = 0; turn < 50; turn += 1) {
    const outcome = await ended(on, copyId)
    if (outcome?.kind === 'COMPLETE') return
    assert.equal(outcome?.kind, 'PARTIAL')
  }
  assert.fail('a passada não fechou')
}

test('a passada inteira no meio de uma passada apaga o que a passada interrompida gravou e sumiu', async (t) => {
  const on = await copiesOn(t, { ...TEST_TUNING, runPages: 1 })
  const copyId = await on.enable('clientes')
  assert.deepEqual(await ended(on, copyId), { kind: 'PARTIAL', reason: 'CAP' })
  const written = await syncRows(on.owner, 'sankhya_clientes', CLIENTES)
  assert.ok(written.length > 0, 'a primeira página ficou gravada')
  on.gate.gone.add(String(written[0]?.[0]))
  assert.deepEqual(await ended(on, copyId, true), { kind: 'PARTIAL', reason: 'CAP' })
  await onceComplete(on, copyId)
  const after = codparcsOf(await syncRows(on.owner, 'sankhya_clientes', CLIENTES))
  assert.ok(!after.includes(Number(written[0]?.[0])), 'a linha que sumiu sai')
})

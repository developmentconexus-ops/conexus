import assert from 'node:assert/strict'
import { LakeRun, LakeTableSummary } from '@conexus/hub-api'
import { z } from 'zod'
import { call } from '../identity/test-hub.ts'
import type { lakeCopyOn } from './test-lake-copy.ts'
import { finished, NOTAS, PARCEIROS } from './test-lake-copy.ts'

const ORIGENS = { source: 'TGFVAR', name: 'sankhya_origens' }
export const Summaries = z.array(LakeTableSummary)
const Runs = z.array(LakeRun)

export type On = Awaited<ReturnType<typeof lakeCopyOn>>

export function read(on: On, path: string, who = on.ana) {
  return call(on.hub, who, 'GET', path)
}

export async function listed(on: On) {
  const answered = await read(on, `/api/companies/${on.companyId}/lake-tables`)
  assert.equal(answered.statusCode, 200, answered.body)
  return Summaries.parse(answered.json())
}

export function named(tables: readonly LakeTableSummary[], name: string) {
  const found = tables.find((table) => table.name === name)
  assert.ok(found !== undefined, name)
  return found
}

export async function runsOf(on: On, table: LakeTableSummary) {
  const answered = await read(on, `/api/companies/${on.companyId}/lake-tables/${table.id}/runs`)
  assert.equal(answered.statusCode, 200, answered.body)
  return Runs.parse(answered.json())
}

export const SINCE = '2024-01-01'

export async function twoConnections(on: On) {
  const matriz = await on.linked('Matriz')
  const filial = await on.linked('Filial')
  const body = { tables: [NOTAS, PARCEIROS, ORIGENS], interval: '24h', startDate: SINCE }
  assert.equal((await on.put(matriz, body)).statusCode, 200)
  const own = { tables: [{ source: 'TGFCAB', name: 'sankhya_filial_notas' }], interval: 'MANUAL' }
  assert.equal((await on.put(filial, { ...own, startDate: null })).statusCode, 200)
  await finished(on, matriz, ['sankhya_notas', 'sankhya_parceiros', 'sankhya_origens'])
  await finished(on, filial, ['sankhya_filial_notas'])
  return { matriz, filial }
}

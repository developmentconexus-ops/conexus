import { LakeTableName } from '@conexus/hub-api'
import { expect, test } from 'vitest'
import { TABLES } from './lake-fixtures.ts'
import type { Table } from './lake-pick.ts'
import { copyBody, isFuture, NO_PICKS, prefixOf, shownPrefix } from './lake-pick.ts'

function tableOf(source: string): Table {
  const found = TABLES.find((one) => one.source === source)
  if (found === undefined) throw new Error(`the fixtures hold no table ${source}`)
  return found
}

function suggested(table: Table, name: string): Table {
  return { ...table, copy: { kind: 'UNMARKED', suggested: LakeTableName.parse(name) } }
}

test('o prefixo de um conector com hífen troca o hífen por _ e termina em _', () => {
  expect(prefixOf('mercado-livre')).toBe('mercado_livre_')
  expect(prefixOf('sankhya')).toBe('sankhya_')
})

test('o nome de uma tabela sugerida sem o prefixo é editado inteiro, sem o prefixo ao lado', () => {
  const plain = suggested(tableOf('TGFCAB'), 'notas')
  expect(shownPrefix('sankhya_', plain)).toBe('')
  const picks = { ...NO_PICKS, marked: new Set(['TGFCAB']) }
  expect(
    copyBody({ prefix: 'sankhya_', tables: [plain], picks, interval: '24h', since: '' }).tables,
  ).toEqual([{ source: 'TGFCAB', name: 'notas' }])
  expect(shownPrefix('sankhya_', tableOf('TGFCAB'))).toBe('sankhya_')
})

test('a data de hoje não é futura, a de amanhã é, e vazia não é', () => {
  const day = new Date()
  expect(isFuture(day.toLocaleDateString('sv-SE'))).toBe(false)
  day.setDate(day.getDate() + 1)
  expect(isFuture(day.toLocaleDateString('sv-SE'))).toBe(true)
  expect(isFuture('')).toBe(false)
})

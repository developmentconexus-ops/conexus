import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ConceptCall } from '../kernel/concepts.ts'
import { ConceptRefused } from '../kernel/concepts.ts'
import { sankhyaConceptRead as read } from './concept-read.ts'
import { QueriedRows } from './door.ts'
import { PADARIA_SOL_FILIAL, PADARIA_SOL_MATRIZ, salesDatabase } from './fake-sales.ts'
import { isOneReadStatement } from './read-only-sql.ts'
import { INVENTED_CELLS } from './refusals.ts'

const NOTES = 'SELECT NUNOTA, CODTIPOPER, CODVEND, VLRNOTA, DTNEG, TIPMOV FROM TGFCAB'
const CALL: ConceptCall = {
  sql: NOTES,
  columns: [
    { column: 'NUNOTA', type: 'ID' },
    { column: 'CODTIPOPER', type: 'CODE' },
    { column: 'CODVEND', type: 'ID' },
    { column: 'VLRNOTA', type: 'MONEY' },
    { column: 'DTNEG', type: 'DATE' },
    { column: 'TIPMOV', type: 'TEXT' },
  ],
  select: ['NUNOTA', 'VLRNOTA'],
  filters: [],
  limit: 5,
  order: ['NUNOTA'],
}

function refused(call: Partial<ConceptCall>) {
  assert.throws(() => read.compile({ ...CALL, ...call }), ConceptRefused, JSON.stringify(call))
}

test('a leitura de um conceito no Sankhya: conta, mostra a forma e mede pelo dublê, cada saída uma leitura só', () => {
  const query = salesDatabase(PADARIA_SOL_MATRIZ)
  const counted = query(read.count(NOTES))
  assert.deepEqual(counted?.rows, [[PADARIA_SOL_MATRIZ.notas.length]])
  const shaped = query(read.shape(NOTES))
  assert.equal(shaped?.rows.length, 1)
  assert.deepEqual(shaped?.fields, [
    'NUNOTA',
    'CODTIPOPER',
    'CODVEND',
    'VLRNOTA',
    'DTNEG',
    'TIPMOV',
  ])
  assert.deepEqual(shaped?.types, ['I', 'I', 'I', 'F', 'D', 'S'])
  const measured = read.compile({
    ...CALL,
    filters: [
      { column: 'CODVEND', op: 'equals', value: 1 },
      { column: 'DTNEG', op: 'from', value: '2026-10-01' },
    ],
    measure: { count: true, sum: ['VLRNOTA'], groupBy: ['CODTIPOPER'] },
  })
  assert.ok(isOneReadStatement(measured), measured)
  const grouped = query(measured)
  const october = PADARIA_SOL_MATRIZ.notas.filter(
    (nota) => nota.codvend === 1 && nota.dtneg >= '2026-10-01',
  )
  assert.deepEqual(grouped?.fields, ['CODTIPOPER', 'count', 'sum_VLRNOTA', 'EXTRA'])
  assert.equal(grouped?.rows[0]?.[1], october.length)
  const page = query(read.compile(CALL))
  assert.equal(page?.rows.length, 6, 'five and one more, marked')
  assert.equal(page?.rows.at(-1)?.at(-1), 'S')
})

test('a leitura de um conceito no Sankhya: injeções: cada valor fora do seu tipo volta recusado antes de virar SQL', () => {
  for (const value of ["101' OR '1'='1", '1;', '1 -- x', '/* x */', "q'[x]'", '10%', 'a\\b', '[x]'])
    refused({ filters: [{ column: 'CODTIPOPER', op: 'equals', value }] })
  for (const value of ['12a', '1e309', 'DROP'])
    refused({ filters: [{ column: 'VLRNOTA', op: 'equals', value }] })
  refused({ filters: [{ column: 'VLRNOTA', op: 'equals', value: Number.NaN }] })
  refused({ filters: [{ column: 'NUNOTA', op: 'equals', value: 1.5 }] })
  for (const value of ['01/10/2026', "2026-10-01' OR 1=1", '2026-13-01'])
    refused({ filters: [{ column: 'DTNEG', op: 'from', value }] })
  refused({ filters: [{ column: 'CODTIPOPER', op: 'in', values: ['101', "1' OR '1"] }] })
  refused({
    filters: [
      { column: 'CODTIPOPER', op: 'in', values: Array.from({ length: 51 }, (_, at) => at) },
    ],
  })
  refused({ filters: [{ column: 'CODTIPOPER', op: 'in', values: [1, '2'] }] })
  for (const text of ['a; DELETE FROM TGFPAR', 'a -- b', 'a /* b'])
    refused({ filters: [{ column: 'TIPMOV', op: 'contains', text }] })
  refused({ filters: [{ column: 'CODTIPOPER', op: 'contains', text: 'ven' }] })
  refused({ filters: [{ column: 'SENHA', op: 'equals', value: 1 }] })
  refused({ select: ['SENHA'] })
  refused({ select: ['NUNOTA"; DROP'] })
  refused({ measure: { count: true, sum: ['TIPMOV'], groupBy: [] } })
  refused({ measure: { count: true, sum: [], groupBy: ['VLRNOTA'] } })
  refused({ measure: { count: true, sum: [], groupBy: ['NUNOTA', 'CODVEND', 'CODTIPOPER'] } })
  refused({ measure: { count: false, sum: [], groupBy: [] } })
  refused({ limit: 101 })
  refused({ sql: 'DELETE FROM TGFCAB' })
})

test('a leitura de um conceito no Sankhya: o texto de uma busca entra escapado: aspa, %, _, \\ e [ valem por si', () => {
  const query = salesDatabase(PADARIA_SOL_MATRIZ)
  for (const text of ["d'agua", '10%', 'A_B', 'a\\b', '[x]', "q'[x]'"]) {
    const sql = read.compile({ ...CALL, filters: [{ column: 'TIPMOV', op: 'contains', text }] })
    assert.ok(isOneReadStatement(sql), sql)
    assert.deepEqual(query(sql)?.rows, [], text)
  }
})

test('a leitura de um conceito no Sankhya: o subconjunto: conta as linhas do papel sem par na base', () => {
  const base = 'SELECT CODPARC FROM TGFPAR'
  const clients = "SELECT CODPARC FROM TGFPAR WHERE CLIENTE = 'S'"
  const sellers = 'SELECT CODVEND, CODPARC FROM TGFVEN'
  const keys = [['CODPARC', 'CODPARC']] as const
  const matriz = salesDatabase(PADARIA_SOL_MATRIZ)
  assert.deepEqual(matriz(read.subset(clients, base, keys))?.rows, [[0]])
  // One seller of the Filial is linked to a partner the double never registered.
  const filial = salesDatabase(PADARIA_SOL_FILIAL)
  assert.deepEqual(
    filial(read.subset('SELECT CODPARC FROM TGFVEN WHERE CODVEND IN (4, 5)', base, keys))?.rows,
    [[1]],
  )
  assert.ok(isOneReadStatement(read.subset(sellers, base, keys)))
  for (const pair of [
    ["CODPARC'", 'CODPARC'],
    ['COD PARC', 'CODPARC'],
    ['CODPARC', 'DELETE'],
  ] as const)
    assert.throws(() => read.subset(clients, base, [pair]), ConceptRefused, pair.join())
  const five = Array.from({ length: 5 }, () => ['CODPARC', 'CODPARC'] as const)
  assert.throws(() => read.subset(clients, base, five), ConceptRefused)
  assert.throws(() => read.subset(clients, base, []), ConceptRefused)
})

test('a leitura de um conceito no Sankhya: consultar responde as colunas com o tipo do DbExplorer, como a resposta gravada', () => {
  const answered = QueriedRows.parse(INVENTED_CELLS.body.responseBody)
  assert.deepEqual(answered.colunas, [
    { nome: 'D', tipo: 'H' },
    { nome: 'V', tipo: 'F' },
  ])
  const untyped = QueriedRows.parse({ fieldsMetadata: [{ name: 'N' }], rows: [[1]] })
  assert.deepEqual(untyped.colunas, [{ nome: 'N', tipo: null }])
})

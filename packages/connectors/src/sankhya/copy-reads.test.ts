import assert from 'node:assert/strict'
import { test } from 'node:test'
import { discoverTables, sankhyaFake } from '../index.ts'
import { tableReachOf } from '../kernel/conformance-tables.ts'
import { descobrirTabelas } from './copy-reads.ts'
import { sankhya } from './definition.ts'
import { DECLARED_DECIMAL } from './fake-tables.ts'

const FIELDS = [
  'NOMETAB',
  'DESCRTAB',
  'NOMECAMPO',
  'DESCRCAMPO',
  'TIPCAMPO',
  'DATA_TYPE',
  'DATA_PRECISION',
  'DATA_SCALE',
]

/** The decimal the dictionary's one numeric row (`TIPCAMPO` F) gives its column. */
function decimalOf(dataType: string, precision: unknown, scale: unknown) {
  const row = ['TGFCAB', 'Cabeçalho', 'CAMPO', 'Campo', 'F', dataType, precision, scale]
  const answered = descobrirTabelas.answer({
    status: 200,
    body: {
      status: '1',
      responseBody: { fieldsMetadata: FIELDS.map((name) => ({ name })), rows: [row] },
    },
  })
  if (answered.kind !== 'OK') return assert.fail(answered.kind)
  return answered.value.tables[0]?.columns[0]?.decimal
}

async function columnOf(table: string, name: string) {
  const found = await discoverTables(await tableReachOf(sankhya, sankhyaFake()))
  const columns = found.find(({ declaration }) => declaration.name === table)?.columns
  return columns?.find((column) => column.name === name) ?? assert.fail(name)
}

test('o dicionário declara a precisão e a escala: o NUMBER com escala as leva, e o número sem escala fica sem elas', async () => {
  const media = await columnOf('efd_st_media_diaria', DECLARED_DECIMAL.column)
  assert.deepEqual(media.decimal, { precision: 18, scale: 4 })
  const nota = await columnOf('notas', 'VLRNOTA')
  assert.equal(nota.type, 'numeric')
  assert.equal(nota.decimal, undefined)
})

test('o que o Oracle declara: NUMBER(p, s) e NUMBER(*, s), o texto também; FLOAT, NUMBER sem nada e escala fora da precisão não declaram', () => {
  assert.deepEqual(decimalOf('NUMBER', 18, 4), { precision: 18, scale: 4 })
  assert.deepEqual(decimalOf('NUMBER', '10', '0'), { precision: 10, scale: 0 })
  assert.deepEqual(decimalOf('NUMBER', null, 2), { precision: 38, scale: 2 })
  assert.equal(decimalOf('NUMBER', null, null), undefined)
  assert.equal(decimalOf('FLOAT', 126, null), undefined, 'a precisão do FLOAT é binária')
  assert.equal(decimalOf('NUMBER', 3, 5), undefined)
  assert.equal(decimalOf('NUMBER', 18, -2), undefined)
})

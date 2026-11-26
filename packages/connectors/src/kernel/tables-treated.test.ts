import assert from 'node:assert/strict'
import { test } from 'node:test'
import { LakeTableName, lakeNameOf, treatedColumnType, treatedSelect } from '../index.ts'

test('o SELECT de um molde lê a atual, dá a cada coluna o nome e o tipo declarados, sem filtro nem junção', () => {
  const sql = treatedSelect(lakeNameOf('sankhya_', 'notas'), {
    description: 'Notas.',
    columns: [
      { column: 'nunota', as: 'nota', cast: 'KEEP' },
      { column: 'numnota', as: 'numero', cast: 'TEXT' },
      { column: 'codemp', as: 'empresa', cast: 'INTEGER' },
      { column: 'dtneg', as: 'negociada', cast: 'DATE' },
      { column: 'dtalter', as: 'alterada', cast: 'TIMESTAMP' },
    ],
  })
  assert.equal(
    sql,
    [
      'SELECT',
      '  "nunota" AS "nota",',
      '  CAST("numnota" AS VARCHAR) AS "numero",',
      '  CAST("codemp" AS INTEGER) AS "empresa",',
      '  CAST("dtneg" AS DATE) AS "negociada",',
      '  CAST("dtalter" AS TIMESTAMP(6)) AS "alterada"',
      'FROM "current"."sankhya_notas"',
    ].join('\n'),
  )
})

test('um nome no lago fora do formato não vira nome', () => {
  for (const name of ['Notas', '1notas', 'notas"."outra', `n${'x'.repeat(60)}`])
    assert.equal(LakeTableName.safeParse(name).success, false, name)
})

test('o tipo de uma coluna tratada: o da cópia quando o molde mantém, o do Athena quando converte', () => {
  assert.equal(treatedColumnType('KEEP', 'bigint'), 'bigint')
  assert.equal(treatedColumnType('KEEP', null), null)
  assert.equal(treatedColumnType('TEXT', 'bigint'), 'varchar')
  assert.equal(treatedColumnType('INTEGER', null), 'integer')
  assert.equal(treatedColumnType('DATE', 'text'), 'date')
  assert.equal(treatedColumnType('TIMESTAMP', 'text'), 'timestamp(6)')
})

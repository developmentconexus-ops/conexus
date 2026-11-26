import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  CONNECTORS,
  LAKE_NAME_PATTERN,
  lakeNameOf,
  sourceOf,
  TABLE_SOURCE_FAILURES,
  tablePrefixOf,
} from '@conexus/connectors'
import {
  LAKE_RUN_FAILURE_CODES,
  LAKE_TABLE_NAME_PATTERN,
  LakeTableName,
  SourceTableId,
} from '@conexus/hub-api'

test('o id da tabela: todo nome e origem que o kit declara passam no esquema do fio', () => {
  let seen = 0
  for (const connector of CONNECTORS) {
    for (const table of connector.tables?.declared ?? []) {
      seen += 1
      assert.ok(
        SourceTableId.safeParse(sourceOf(table)).success,
        `${connector.id} ${sourceOf(table)}`,
      )
      const name = lakeNameOf(tablePrefixOf(connector.id), table.name)
      assert.ok(LakeTableName.safeParse(name).success, name)
    }
  }
  assert.ok(seen > 0)
})

test('o nome no lago que o kit faz é o do contrato do Hub: a mesma regex e a mesma marca', () => {
  assert.equal(LAKE_NAME_PATTERN.source, LAKE_TABLE_NAME_PATTERN.source)
  assert.equal(LAKE_NAME_PATTERN.flags, LAKE_TABLE_NAME_PATTERN.flags)
  const named: LakeTableName = lakeNameOf('sankhya_', 'notas')
  assert.equal(named, 'sankhya_notas')
})

test('os códigos da fonte: todo código de TABLE_SOURCE_FAILURES do kit é um código de rodada', () => {
  for (const code of TABLE_SOURCE_FAILURES)
    assert.ok(
      LAKE_RUN_FAILURE_CODES.some((known) => known === code),
      code,
    )
})

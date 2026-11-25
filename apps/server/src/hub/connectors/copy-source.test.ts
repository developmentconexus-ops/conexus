import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  CONNECTORS,
  lakeNameOf,
  sourceOf,
  TABLE_SOURCE_FAILURES,
  tablePrefixOf,
} from '@conexus/connectors'
import { LAKE_RUN_FAILURE_CODES, LakeTableName, SourceTableId } from '@conexus/hub-api'

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

test('os códigos da fonte: todo código de TABLE_SOURCE_FAILURES do kit é um código de rodada', () => {
  for (const code of TABLE_SOURCE_FAILURES)
    assert.ok(
      LAKE_RUN_FAILURE_CODES.some((known) => known === code),
      code,
    )
})

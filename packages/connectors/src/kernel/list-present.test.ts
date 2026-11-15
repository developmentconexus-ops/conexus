import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CopyDefinitionV2 } from './copy.ts'
import { listPageOf } from './list.ts'
import { RIGHT } from './list-fixture.ts'

test('a página diz quais colunas vieram', () => {
  const definition = CopyDefinitionV2.parse({
    version: 2,
    source: { kind: 'OPERATION', operation: 'lista', input: { kind: 'a' } },
    description: 'Lista.',
    columns: [
      { name: 'id', type: 'text', path: 'id' },
      { name: 'status', type: 'text', path: 'status' },
      { name: 'falta', type: 'text', path: 'nao.existe' },
    ],
    key: ['id'],
    changedSince: null,
  })
  const rows = { temMais: false, linhas: [{ id: 1 }, { id: 2, status: null }] }
  const page = listPageOf({ list: RIGHT, definition, position: null, rows, at: new Date() })
  assert.equal(page.kind, 'PAGE')
  if (page.kind !== 'PAGE') return
  assert.deepEqual(page.present, ['id', 'status'])
})

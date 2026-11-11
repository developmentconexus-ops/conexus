import assert from 'node:assert/strict'
import { test } from 'node:test'
import { assertListsWalk } from './conformance.ts'
import { listingConnector, listingFake, RIGHT, SWAPPED } from './list-fixture.ts'

test('a conformidade anda todas as páginas do dublê de uma leitura de lista', async () => {
  await assertListsWalk(listingConnector(RIGHT), listingFake)
  await assert.rejects(
    assertListsWalk(listingConnector(SWAPPED), listingFake),
    'o tamanho e o deslocamento trocados na declaração falham',
  )
  await assert.rejects(
    assertListsWalk(
      listingConnector({ ...RIGHT, changed: { input: 'changedFrom', field: 'id' } }),
      listingFake,
    ),
    'o campo de alteração que não é um instante falha',
  )
})

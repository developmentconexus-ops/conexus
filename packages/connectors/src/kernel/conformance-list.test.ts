import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { assertListsWalk } from './conformance.ts'
import { listingConnector, listingFake, RIGHT, SWAPPED } from './list-fixture.ts'

test('a conformidade anda todas as páginas do dublê de uma leitura de lista', async () => {
  await assertListsWalk(listingConnector(RIGHT), listingFake())
  await assert.rejects(
    assertListsWalk(listingConnector(SWAPPED), listingFake()),
    z.ZodError,
    'o tamanho e o deslocamento trocados: o esquema da leitura recusa o tamanho 0',
  )
  await assert.rejects(
    assertListsWalk(listingConnector(RIGHT), listingFake('IGNORES_OFFSET')),
    /repeats a row/,
    'um dublê que ignora o deslocamento repete as linhas da primeira página',
  )
  await assert.rejects(
    assertListsWalk(listingConnector(RIGHT), listingFake('DROPS_LAST')),
    /lacks rows/,
    'um total que não bate com as linhas entregues',
  )
  await assert.rejects(
    assertListsWalk(
      listingConnector({ ...RIGHT, changed: { input: 'changedFrom', field: 'ausente' } }),
      listingFake(),
    ),
    /carry/,
    'o campo de alteração que as linhas não trazem',
  )
})

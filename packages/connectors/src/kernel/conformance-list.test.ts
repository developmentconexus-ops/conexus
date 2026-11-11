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
  const requested: string[] = []
  const counting = listingFake('EMPTY_AFTER_FIRST')
  const handle = counting.handle
  await assert.rejects(
    assertListsWalk(listingConnector(RIGHT), {
      ...counting,
      handle: (request) => {
        requested.push(new URL(request.url).search)
        return handle(request)
      },
    }),
    /lacks rows/,
    'uma página vazia que diz ter mais termina a caminhada, sem erro e sem repetir a posição',
  )
  const things = requested.filter((search) => search.includes('limit=50'))
  assert.equal(new Set(things).size, things.length, 'nenhuma leitura repetida')
  assert.equal(
    things.filter((search) => search.includes('offset=50')).length,
    1,
    'a página vazia é lida uma vez e a caminhada para',
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

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { CANONICAL_CELL, CopyDefinitionV2 } from './copy.ts'
import { defineConnector } from './definition.ts'
import type { ListRead } from './list.ts'
import { listInputOf, listPageOf } from './list.ts'
import { listingConnector, RIGHT } from './list-fixture.ts'
import { defineOperation, get, requestOf } from './operation.ts'
import type { Rows } from './rows.ts'

const ACCOUNT = { ref: null }
const Scalars = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
const AT = new Date('2026-11-10T12:00:00.000Z')

const CURSOR: ListRead = {
  paging: {
    kind: 'CURSOR',
    cursor: 'scrollId',
    limit: 'limit',
    max: 100,
    start: { scan: true },
    ttlMs: 300_000,
  },
  changed: null,
}

const Asked = z.object({
  offset: z.number().int().optional(),
  limit: z.number().int(),
  scrollId: z.string().optional(),
  scan: z.literal(true).optional(),
  changedFrom: z.string().optional(),
  kind: z.string().optional(),
})

function reading(list: ListRead | undefined, input: z.ZodType = Asked, operationClass = 'read') {
  return () =>
    defineOperation({
      id: 'lista',
      class: operationClass === 'read' ? 'read' : 'destructive',
      subject: 'coisas',
      idempotent: true,
      summary: 'Lista.',
      label: 'Lista',
      input,
      output: z.unknown(),
      ...(list === undefined ? {} : { list }),
      probe: () => null,
      request: (input) => get('/lista', Scalars.parse(input)),
      answer: () => ({ kind: 'OK', value: null }),
    })
}

test('a declaração da lista', () => {
  for (const list of [RIGHT, CURSOR, { paging: { kind: 'NONE' }, changed: null } as const])
    assert.doesNotThrow(reading(list), list.paging.kind)
  assert.throws(reading(RIGHT, Asked, 'destructive'), /not a read/)
  assert.throws(
    reading({ ...RIGHT, changed: { input: 'semEntrada', field: 'x' } }),
    /names semEntrada/,
  )
  assert.throws(
    reading({
      paging: { kind: 'OFFSET', offset: 'deslocamento', limit: 'limit', max: 5, ceiling: null },
      changed: null,
    }),
    /names deslocamento/,
  )
  assert.throws(
    reading(
      RIGHT,
      z.preprocess((value) => value, Asked),
    ),
    /not an object/,
  )

  const lone = listingConnector(RIGHT)
  const { id: _id, callLimit: _limit, ...rest } = lone
  assert.throws(() => defineConnector({ ...rest, id: 'listing' }), /without callLimit/)
  for (const countedBy of ['APP', 'ACCOUNT'] as const)
    assert.doesNotThrow(() => defineConnector({ ...rest, id: 'listing', callLimit: { countedBy } }))
})

function definitionOf(changedSince: boolean, input: Record<string, unknown> = { kind: 'a' }) {
  return CopyDefinitionV2.parse({
    version: 2,
    source: { kind: 'OPERATION', operation: 'lista', input },
    description: 'Lista.',
    columns: [
      { name: 'id', type: 'text', path: 'id' },
      { name: 'changed', type: 'timestamp', path: 'changed' },
    ],
    key: ['id'],
    changedSince: changedSince ? { column: 'changed' } : null,
  })
}

type Position = Parameters<typeof listInputOf>[0]['position']

function offsetAt(position: Position, since: string | null) {
  return listInputOf({ list: RIGHT, definition: definitionOf(true), position, since })
}

function cursorAt(position: Position) {
  return listInputOf({
    list: CURSOR,
    definition: definitionOf(false),
    position,
    since: null,
  })
}

function offsetInputs() {
  const since = '2026-11-09T00:00:00.000-03:00'
  assert.deepEqual(offsetAt(null, null), { kind: 'a', offset: 0, limit: 50 }, 'sem posição')
  assert.deepEqual(offsetAt({ kind: 'OFFSET', offset: 150 }, null), {
    kind: 'a',
    offset: 150,
    limit: 50,
  })
  assert.equal(offsetAt(null, since).changedFrom, since, 'com alteração e data')
  assert.equal('changedFrom' in offsetAt(null, null), false, 'passada sem marca: sem filtro')
  const unchanged = listInputOf({
    list: RIGHT,
    definition: definitionOf(false),
    position: null,
    since,
  })
  assert.equal('changedFrom' in unchanged, false, 'a definição sem changedSince não filtra')
  const listed = reading(RIGHT)()
  assert.deepEqual(
    requestOf(listed, offsetAt({ kind: 'OFFSET', offset: 100 }, since), ACCOUNT, AT).query,
    { offset: '100', limit: '50', changedFrom: since, kind: 'a' },
  )
  assert.throws(
    () => requestOf(listed, { offset: 'x', limit: 50 }, ACCOUNT, AT),
    z.ZodError,
    'a entrada sai pelo esquema da operação',
  )
}

function cursorInputs() {
  assert.deepEqual(cursorAt(null), { kind: 'a', scan: true, limit: 100 }, 'a primeira página')
  assert.deepEqual(
    cursorAt({ kind: 'CURSOR', cursor: 'abc', at: AT.toISOString() }),
    { kind: 'a', scrollId: 'abc', limit: 100 },
    'com posição: o cursor',
  )
}

function fixedInputRefused() {
  for (const name of ['offset', 'limit', 'changedFrom'])
    assert.throws(
      () =>
        listInputOf({
          list: RIGHT,
          definition: definitionOf(true, { [name]: 1 }),
          position: null,
          since: null,
        }),
      /fixed input/,
      name,
    )
}

test('a entrada de cada página', () => {
  offsetInputs()
  cursorInputs()
  fixedInputRefused()
})

function pageOf(
  list: ListRead,
  rows: Partial<Rows> & Pick<Rows, 'linhas'>,
  position: Parameters<typeof listPageOf>[0]['position'] = null,
  columns: readonly { name: string; type: string; path: string }[] = [],
) {
  const definition = CopyDefinitionV2.parse({
    ...definitionOf(false),
    columns: [{ name: 'id', type: 'text', path: 'id' }, ...columns],
  })
  return listPageOf({ list, definition, position, rows: { temMais: false, ...rows }, at: AT })
}

function cellsAreCanonical() {
  const columns = [
    { name: 'qtd', type: 'bigint', path: 'qtd' },
    { name: 'preco', type: 'numeric', path: 'valor.preco' },
    { name: 'ativo', type: 'boolean', path: 'ativo' },
    { name: 'dia', type: 'date', path: 'dia' },
    { name: 'criado', type: 'timestamp', path: 'criado' },
    { name: 'itens', type: 'json', path: 'itens' },
    { name: 'falta', type: 'text', path: 'nao.existe' },
  ] as const
  const row = {
    id: 7,
    qtd: 3,
    valor: { preco: 12.5 },
    ativo: true,
    dia: '2026-11-10',
    criado: '2026-11-10T12:30:45.000-03:00',
    itens: [{ sku: 'a' }],
  }
  const page = pageOf(RIGHT, { linhas: [row] }, null, columns)
  assert.equal(page.kind, 'PAGE')
  if (page.kind !== 'PAGE') return
  assert.deepEqual(page.rows, [
    [
      '7',
      '3',
      '12.5',
      'true',
      '2026-11-10',
      '2026-11-10T12:30:45.000-03:00',
      '[{"sku":"a"}]',
      null,
    ],
  ])
  const types = ['text', ...columns.map((column) => column.type)] as const
  page.rows[0]?.forEach((cell, at) => {
    const type = types[at]
    if (cell !== null && type !== undefined) assert.match(cell, CANONICAL_CELL[type], `${type}`)
  })

  for (const preco of [1e-7, 1e21])
    assert.deepEqual(
      pageOf(RIGHT, { linhas: [{ id: 'a', preco }] }, null, [
        { name: 'preco', type: 'numeric', path: 'preco' },
      ]),
      { kind: 'MISFIT', column: 'preco', path: 'preco' },
      `${preco}: sem notação de expoente`,
    )
  const inherited = pageOf(RIGHT, { linhas: [{ id: 'a' }] }, null, [
    { name: 'proto', type: 'json', path: '__proto__' },
  ])
  assert.deepEqual(
    inherited.kind === 'PAGE' && inherited.rows,
    [['a', null]],
    'só propriedades próprias',
  )

  const misfit = pageOf(RIGHT, { linhas: [{ id: 'a', qtd: 'três' }] }, null, [columns[0]])
  assert.deepEqual(misfit, { kind: 'MISFIT', column: 'qtd', path: 'qtd' }, 'nunca nulo')
  assert.equal(
    pageOf(RIGHT, { linhas: [{ id: 'a', qtd: 1.5 }] }, null, [columns[0]]).kind,
    'MISFIT',
    'um decimal não é bigint',
  )
}

function offsetPages() {
  const more = pageOf(RIGHT, { linhas: [{ id: 'a' }, { id: 'b' }], temMais: true, total: 9 })
  assert.deepEqual(more, {
    kind: 'PAGE',
    rows: [['a'], ['b']],
    more: true,
    next: { kind: 'OFFSET', offset: 2 },
    total: 9,
  })
  const later = pageOf(
    RIGHT,
    { linhas: [{ id: 'a' }], temMais: true },
    { kind: 'OFFSET', offset: 50 },
  )
  assert.equal(later.kind === 'PAGE' && later.next?.kind === 'OFFSET' && later.next.offset, 51)
  const last = pageOf(RIGHT, { linhas: [{ id: 'a' }], temMais: false })
  assert.equal(last.kind === 'PAGE' && last.next, null, 'a última página não tem próxima')
  assert.deepEqual(pageOf(RIGHT, { linhas: [{ id: 'a' }], temMais: null }), {
    kind: 'UNREADABLE',
    reason: 'NO_MORE_SIGNAL',
  })
}

function cursorAndCeiling() {
  const cursor = pageOf(CURSOR, { linhas: [{ id: 'a' }], temMais: true, seguinte: 'proximo' })
  assert.deepEqual(cursor.kind === 'PAGE' && cursor.next, {
    kind: 'CURSOR',
    cursor: 'proximo',
    at: AT.toISOString(),
  })
  assert.deepEqual(pageOf(CURSOR, { linhas: [{ id: 'a' }], temMais: true }), {
    kind: 'UNREADABLE',
    reason: 'NO_CURSOR',
  })

  const ceiling: ListRead = {
    ...RIGHT,
    paging: { kind: 'OFFSET', offset: 'offset', limit: 'limit', max: 50, ceiling: 3 },
  }
  assert.deepEqual(
    pageOf(
      ceiling,
      { linhas: [{ id: 'a' }, { id: 'b' }], temMais: true },
      { kind: 'OFFSET', offset: 1 },
    ),
    { kind: 'CEILING', ceiling: 3 },
  )
  assert.equal(
    pageOf(
      ceiling,
      { linhas: [{ id: 'a' }, { id: 'b' }], temMais: false },
      { kind: 'OFFSET', offset: 1 },
    ).kind,
    'PAGE',
    'sem mais páginas o teto não importa',
  )
}

test('a página na forma da cópia', () => {
  cellsAreCanonical()
  offsetPages()
  cursorAndCeiling()
})

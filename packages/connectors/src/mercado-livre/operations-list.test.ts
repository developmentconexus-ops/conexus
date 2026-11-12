import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { SENT_AT } from '../kernel/conformance-declared.ts'
import { answerOf } from '../kernel/conformance-session.ts'
import type { CopyDefinitionV2, CopyPosition } from '../kernel/copy.ts'
import { CopyDefinitionV2 as CopyDefinitionV2Schema } from '../kernel/copy.ts'
import { listInputOf, listPageOf } from '../kernel/list.ts'
import type { Operation } from '../kernel/operation.ts'
import { requestOf } from '../kernel/operation.ts'
import { toRequest } from '../kernel/request.ts'
import { Rows } from '../kernel/rows.ts'
import { mercadoLivre } from './definition.ts'
import { mercadoLivreFake } from './fake.ts'
import { mensagensDoPacote } from './operations/mensagens.ts'
import { recording } from './recordings.ts'
import { ACCOUNT, authorize } from './test-session.ts'

function scanned(results: unknown[], extra: Record<string, unknown>) {
  return operationOf('anuncios').answer({ status: 200, body: { results, ...extra } })
}

function operationOf(id: string) {
  const found = mercadoLivre.operations.find((operation) => operation.id === id)
  assert.ok(found, id)
  return found
}

test('pedidos pelo que mudou', () => {
  const pedidos = operationOf('pedidos')
  const changedFrom = '2026-11-09T10:00:00.000-03:00'
  const query = requestOf(pedidos, { offset: 0, limit: 50, changedFrom }, ACCOUNT, SENT_AT).query
  assert.equal(query['order.date_last_updated.from'], changedFrom)
  assert.equal(query.offset, '0')
  assert.equal(query.limit, '50')
  assert.equal(
    'order.date_last_updated.from' in
      requestOf(pedidos, { offset: 0, limit: 5 }, ACCOUNT, SENT_AT).query,
    false,
    'sem a entrada, a leitura de hoje sai igual',
  )
  assert.equal(
    pedidos.input.safeParse({ offset: 0, limit: 5, changedFrom: '2026-11-09' }).success,
    false,
  )
})

test('a varredura: a primeira página manda scan, as seguintes o scroll_id', () => {
  for (const id of ['anuncios', 'perguntas']) {
    const read = operationOf(id)
    const first = requestOf(read, { scan: true, limit: 50 }, ACCOUNT, SENT_AT).query
    assert.equal(first.search_type, 'scan', id)
    assert.equal(first.scroll_id, undefined, id)
    assert.equal(first.offset, undefined, id)
    const next = requestOf(read, { scrollId: 'abc', limit: 50 }, ACCOUNT, SENT_AT).query
    assert.equal(next.scroll_id, 'abc', id)
    assert.equal(next.search_type, 'scan', id)
    assert.equal(
      'search_type' in requestOf(read, { offset: 0, limit: 50 }, ACCOUNT, SENT_AT).query,
      false,
      `${id}: por deslocamento, como hoje`,
    )
    assert.equal(read.input.safeParse({ scan: false, limit: 50 }).success, false, id)
    for (const extra of [{ scan: true }, { scrollId: 'abc' }])
      assert.equal(read.input.safeParse({ ...extra, offset: 0, limit: 50 }).success, false, id)
    assert.equal(read.input.safeParse({ scrollId: '', limit: 50 }).success, false, id)
  }
})

test('o cursor da resposta gravada de uma varredura vai em seguinte, e a página sem linhas é o fim', () => {
  const page = recording('anuncios-varredura-1').body
  const ids = z.array(z.string()).parse(page.results)
  assert.deepEqual(operationOf('anuncios').answer({ status: 200, body: page }), {
    kind: 'OK',
    value: {
      linhas: ids.map((id) => ({ id })),
      temMais: true,
      seguinte: z.string().parse(page.scroll_id),
      total: ids.length,
    },
  })
  assert.deepEqual(
    operationOf('anuncios').answer({ status: 200, body: recording('anuncios-varredura-2').body }),
    { kind: 'OK', value: { linhas: [], temMais: false, total: ids.length } },
    'a página sem linhas traz o scroll_id e é o fim',
  )
  const questions = recording('perguntas-varredura').body
  const asked = operationOf('perguntas').answer({ status: 200, body: questions })
  assert.equal(asked.kind, 'OK')
  if (asked.kind !== 'OK') return
  const { linhas, ...rest } = Rows.parse(asked.value)
  assert.equal(linhas.length, 1)
  assert.deepEqual(rest, {
    temMais: true,
    seguinte: z.string().parse(questions.scroll_id),
    total: z.number().parse(questions.total),
  })
  assert.deepEqual(scanned(['a'], { paging: { total: 1, offset: 0, limit: 5 } }), {
    kind: 'OK',
    value: { linhas: [{ id: 'a' }], temMais: false, total: 1 },
  })
})

test('o total e o temMais saem das mesmas contagens: sem deslocamento só o total, e um total quebrado nenhum dos dois', () => {
  assert.deepEqual(scanned(['a'], { paging: { total: 9 } }), {
    kind: 'OK',
    value: { linhas: [{ id: 'a' }], temMais: null, total: 9 },
  })
  assert.deepEqual(scanned(['a'], { paging: { total: 9.5, offset: 0, limit: 1 } }), {
    kind: 'OK',
    value: { linhas: [{ id: 'a' }], temMais: null },
  })
})

/** Every page of a list read of the double, through the copy's own input and page: the cells of each row. */
async function walked(
  operation: Operation<unknown, unknown>,
  definition: CopyDefinitionV2,
  since: string | null = null,
) {
  const list = operation.list ?? assert.fail(`${operation.id} declares no list`)
  const fake = mercadoLivreFake()
  const granted = await authorize(fake)
  if (granted.kind !== 'OK') return assert.fail('authorize')
  const cells: (string | null)[][] = []
  let position: CopyPosition | null = null
  for (let pages = 0; pages < 100; pages++) {
    const input = operation.input.parse(listInputOf({ list, definition, position, since }))
    const request = requestOf(operation, input, ACCOUNT, SENT_AT)
    const answered = operation.answer(
      await answerOf(await fake.handle(toRequest(mercadoLivre, request, granted.accessToken))),
    )
    if (answered.kind !== 'OK') return assert.fail(`${operation.id}: ${answered.kind}`)
    const rows = Rows.parse(answered.value)
    const page = listPageOf({ list, definition, position, rows, at: SENT_AT })
    if (page.kind !== 'PAGE') return assert.fail(`${operation.id}: ${page.kind}`)
    cells.push(...page.rows.map((row) => [...row]))
    if (!page.more) return { cells, pages: pages + 1 }
    position = page.next
  }
  return assert.fail(`${operation.id} never ends`)
}

function definitionOf(
  operation: Operation<unknown, unknown>,
  columns: { name: string; type: string; path: string }[],
  changed: string | null = null,
) {
  return CopyDefinitionV2Schema.parse({
    version: 2,
    source: { kind: 'OPERATION', operation: operation.id, input: {} },
    description: 'Teste.',
    columns,
    key: [columns[0]?.name],
    changedSince: changed === null ? null : { column: changed },
  })
}

test('pedidos declara a lista por deslocamento e o filtro do que mudou', async () => {
  const pedidos = operationOf('pedidos')
  assert.deepEqual(pedidos.list, {
    paging: { kind: 'OFFSET', offset: 'offset', limit: 'limit', max: 50, ceiling: null },
    changed: { input: 'changedFrom', field: 'date_last_updated' },
  })
  const definition = definitionOf(
    pedidos,
    [
      { name: 'id', type: 'bigint', path: 'id' },
      { name: 'alterado', type: 'timestamp', path: 'date_last_updated' },
    ],
    'alterado',
  )
  const all = await walked(pedidos, definition)
  assert.equal(all.cells.length, 120, 'os 120 pedidos do dublê')
  assert.equal(all.pages, 3)
  const changed = await walked(pedidos, definition, '2026-09-10T14:50:00.000Z')
  assert.deepEqual(
    changed.cells.map((row) => row[1]),
    all.cells
      .map((row) => row[1])
      .filter((at) => Date.parse(at ?? '') >= Date.parse('2026-09-10T14:50:00.000Z')),
    'só o que mudou desde o instante',
  )
  assert.equal(changed.cells.length, 10)
})

test('a varredura passa de mil', async () => {
  for (const [id, max] of [
    ['anuncios', 100],
    ['perguntas', 50],
  ] as const) {
    assert.deepEqual(
      operationOf(id).list,
      {
        paging: {
          kind: 'CURSOR',
          cursor: 'scrollId',
          limit: 'limit',
          max,
          start: { scan: true },
          ttlMs: 300_000,
        },
        changed: null,
      },
      id,
    )
  }
  const anuncios = operationOf('anuncios')
  const all = await walked(
    anuncios,
    definitionOf(anuncios, [{ name: 'id', type: 'text', path: 'id' }]),
  )
  assert.equal(all.cells.length, 1300, 'os 1.300 anúncios, passando de mil')
  assert.equal(new Set(all.cells.map((row) => row[0])).size, 1300, 'nenhum repete')
  const list = anuncios.list ?? assert.fail('list')
  const definition = definitionOf(anuncios, [{ name: 'id', type: 'text', path: 'id' }])
  function pageOf(body: Record<string, unknown>) {
    const answered = scanned(['MLB1'], body)
    if (answered.kind !== 'OK') return assert.fail(answered.kind)
    return listPageOf({
      list,
      definition,
      position: null,
      rows: Rows.parse(answered.value),
      at: SENT_AT,
    })
  }
  assert.deepEqual(
    pageOf({ paging: { total: 9, offset: 0, limit: 1 } }),
    { kind: 'UNREADABLE', reason: 'NO_CURSOR' },
    'linhas, mais por vir e sem scroll_id',
  )
  assert.deepEqual(
    pageOf({ paging: { total: 9, limit: 1 } }),
    { kind: 'UNREADABLE', reason: 'NO_MORE_SIGNAL' },
    'linhas sem scroll_id e sem deslocamento: nenhum sinal de fim',
  )
})

test('as outras listas por deslocamento, e as mensagens de um pacote sem lista', () => {
  for (const [id, max] of [
    ['reclamacoes', 30],
    ['periodosDeFaturamento', 12],
  ] as const)
    assert.deepEqual(
      operationOf(id).list,
      {
        paging: { kind: 'OFFSET', offset: 'offset', limit: 'limit', max, ceiling: null },
        changed: null,
      },
      id,
    )
  assert.equal(mensagensDoPacote.list, undefined, 'pede o packId de um pacote')
  const listed = mercadoLivre.operations.filter((operation) => operation.list !== undefined)
  assert.deepEqual(listed.map((operation) => operation.id).sort(), [
    'anuncios',
    'pedidos',
    'perguntas',
    'periodosDeFaturamento',
    'reclamacoes',
  ])
})

test('o comprador não chega à cópia', async () => {
  const personal = ['maria.ficticia', '988776655', '52998224725', 'Fictícia', 'COMPRADORFICTICIO']
  for (const id of ['pedidos', 'perguntas']) {
    const operation = operationOf(id)
    const fields = ['id', 'buyer', 'from', 'status', 'order_items', 'text', 'date_created']
    const columns = [
      { name: 'id', type: 'bigint', path: 'id' },
      ...fields.slice(1).map((field) => ({ name: field, type: 'json', path: field })),
    ]
    const all = await walked(operation, definitionOf(operation, columns))
    assert.ok(all.cells.length > 0, id)
    const text = JSON.stringify(all.cells)
    for (const value of personal) assert.ok(!text.includes(value), `${id} copia ${value}`)
    function at(name: string) {
      return columns.findIndex((column) => column.name === name)
    }
    assert.ok(
      all.cells.every((row) => row[at(id === 'pedidos' ? 'buyer' : 'from')] === null),
      `${id}: o objeto cortado é nulo`,
    )
  }
})

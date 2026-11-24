import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { SENT_AT } from '../kernel/conformance-declared.ts'
import { tableReachOf, walkTable } from '../kernel/conformance-tables.ts'
import type { Operation } from '../kernel/operation.ts'
import { requestOf } from '../kernel/operation.ts'
import { Rows } from '../kernel/rows.ts'
import type { DeclaredColumn } from '../kernel/tables.ts'
import { defineTables } from '../kernel/tables.ts'
import type { TableReach } from '../kernel/tables-call.ts'
import { readTablePage } from '../kernel/tables-read.ts'
import { mercadoLivre } from './definition.ts'
import { mercadoLivreFake } from './fake.ts'
import { mensagensDoPacote } from './operations/mensagens.ts'
import { recording } from './recordings.ts'
import { ACCOUNT } from './test-session.ts'

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

test('pedidos lê sem deslocamento nem tamanho, e a API usa o seu padrão', () => {
  const pedidos = operationOf('pedidos')
  assert.equal(pedidos.input.safeParse({ status: 'paid' }).success, true)
  const query = requestOf(pedidos, { status: 'paid' }, ACCOUNT, SENT_AT).query
  assert.equal('offset' in query, false)
  assert.equal('limit' in query, false)
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

/** A list read as a declared table of these columns: changed since `changed` when given, whole otherwise. */
function tableOf(
  operation: Operation<unknown, unknown>,
  columns: Omit<DeclaredColumn, 'description'>[],
  changed: string | null = null,
) {
  const [table] = defineTables({
    declared: [
      {
        name: 'teste',
        label: operation.label,
        description: 'Teste.',
        group: operation.subject,
        source: { kind: 'OPERATION', operation: operation.id, input: {} },
        key: [columns[0]?.name ?? ''],
        mode:
          changed === null
            ? { kind: 'FULL' }
            : { kind: 'CHANGED', column: changed, registry: true },
        history: false,
        columns: {
          kind: 'DECLARED',
          columns: columns.map((column) => ({ ...column, description: null })),
        },
      },
    ],
  }).declared
  return table ?? assert.fail('the table')
}

/** Every page of the double through `readTablePage`: the cells of each row, in the order of the columns. */
async function walked(
  operation: Operation<unknown, unknown>,
  columns: Omit<DeclaredColumn, 'description'>[],
  a: { changed?: string; since?: string } = {},
) {
  const reach = await tableReachOf(mercadoLivre, mercadoLivreFake())
  const table = tableOf(operation, columns, a.changed ?? null)
  const rows = await walkTable(
    reach,
    table,
    a.since === undefined || a.changed === undefined
      ? { kind: 'ALL' }
      : { kind: 'SINCE', column: a.changed, after: a.since },
  )
  return rows.map((row) => columns.map(({ name }) => row[name] ?? null))
}

test('pedidos declara a lista por deslocamento e o filtro do que mudou', async () => {
  const pedidos = operationOf('pedidos')
  assert.deepEqual(pedidos.list, {
    paging: { kind: 'OFFSET', offset: 'offset', limit: 'limit', max: 50, ceiling: null },
    changed: { input: 'changedFrom', field: 'date_last_updated' },
  })
  const columns = [
    { name: 'id', type: 'bigint', path: 'id' },
    { name: 'alterado', type: 'timestamp', path: 'date_last_updated' },
  ] as const
  const all = await walked(pedidos, [...columns], { changed: 'alterado' })
  assert.equal(all.length, 120, 'os 120 pedidos do dublê')
  const since = '2026-09-10T14:50:00.000Z'
  const changed = await walked(pedidos, [...columns], { changed: 'alterado', since })
  assert.deepEqual(
    changed.map((row) => row[1]),
    all.map((row) => row[1]).filter((at) => Date.parse(at ?? '') >= Date.parse(since)),
    'só o que mudou desde o instante',
  )
  assert.equal(changed.length, 10)
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
  const id = [{ name: 'id', type: 'text', path: 'id' }] as const
  const all = await walked(anuncios, [...id])
  assert.equal(all.length, 1300, 'os 1.300 anúncios, passando de mil')
  assert.equal(new Set(all.map((row) => row[0])).size, 1300, 'nenhum repete')
  const reach = await tableReachOf(mercadoLivre, mercadoLivreFake())
  function pageOf(body: Record<string, unknown>) {
    const answering: TableReach = {
      ...reach,
      send: async () => ({ status: 200, body: { results: ['MLB1'], ...body } }),
    }
    const table = tableOf(anuncios, [...id])
    return readTablePage({ ...answering, table, columns: [], filter: { kind: 'ALL' }, after: null })
  }
  const unreadable = { kind: 'FAILED', code: 'COPY_SOURCE_UNREADABLE', system: null, waitMs: null }
  assert.deepEqual(
    await pageOf({ paging: { total: 9, offset: 0, limit: 1 } }),
    unreadable,
    'linhas, mais por vir e sem scroll_id',
  )
  assert.deepEqual(
    await pageOf({ paging: { total: 9, limit: 1 } }),
    unreadable,
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

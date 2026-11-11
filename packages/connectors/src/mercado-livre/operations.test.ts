import assert from 'node:assert/strict'
import { test } from 'node:test'
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
import { ACCOUNT, authorize, probeAll } from './test-session.ts'

test('não marca como lida', async () => {
  const request = requestOf(mensagensDoPacote, { packId: '2000000000099' }, ACCOUNT, SENT_AT)
  assert.equal(request.query.mark_as_read, 'false')
  assert.equal(request.query.tag, 'post_sale')
  const withPaging = requestOf(
    mensagensDoPacote,
    { packId: '2000000000099', offset: 10, limit: 20 },
    ACCOUNT,
    SENT_AT,
  )
  assert.equal(withPaging.query.mark_as_read, 'false')

  const fake = mercadoLivreFake()
  await probeAll(fake)
  assert.equal(fake.markedAsRead(), 0)
})

test('sem dados do comprador', async () => {
  const fake = mercadoLivreFake()
  const values = await probeAll(fake)
  assert.equal(values.length, 27, 'the double answers every read')
  const text = JSON.stringify(values)
  for (const buyer of [
    'maria.ficticia',
    '988776655',
    '52998224725',
    'Maria',
    'Fictícia',
    'COMPRADORFICTICIO',
    'Rua Inventada',
    '11988776655',
    'dono@exemplo.test',
  ])
    assert.ok(!text.includes(buyer), `an output carries ${buyer}`)
})

test('o 404 de um vendedor sem tempo de resposta é uma resposta vazia; outro 404, e o mesmo 404 em outra leitura, é recusa', () => {
  const tempo = mercadoLivre.operations.find((operation) => operation.id === 'tempoDeResposta')
  const conta = mercadoLivre.operations.find((operation) => operation.id === 'conta')
  assert.ok(tempo && conta)
  const none = {
    message: 'Response time not found for user id: 1',
    error: 'not_found',
    status: 404,
    cause: [],
  }
  assert.deepEqual(tempo.answer({ status: 404, body: none }), {
    kind: 'OK',
    value: { linhas: [], temMais: false },
    empty: true,
  })
  assert.equal(
    tempo.answer({ status: 404, body: { ...none, message: 'Resource not found' } }).kind,
    'REFUSED',
  )
  assert.equal(tempo.answer({ status: 404, body: { ...none, error: 'other' } }).kind, 'REFUSED')
  assert.equal(conta.answer({ status: 404, body: none }).kind, 'REFUSED')
})

test('cada resposta que não é 2xx vira o resultado do kit, sem o corpo de um 2xx', () => {
  const conta = mercadoLivre.operations.find((operation) => operation.id === 'conta')
  assert.ok(conta)
  const answerOf = conta.answer
  function kind(status: number, body: unknown = { message: 'x' }) {
    return answerOf({ status, body }).kind
  }
  assert.equal(kind(401), 'TOKEN_EXPIRED')
  assert.equal(kind(403), 'REFUSED')
  assert.equal(kind(404), 'REFUSED')
  assert.equal(kind(429), 'BUSY')
  assert.equal(kind(500), 'UNREADABLE')
  assert.deepEqual(conta.answer({ status: 206, body: { id: 1, nickname: 'x' } }), {
    kind: 'OK',
    value: { linhas: [{ id: 1, nickname: 'x' }], temMais: null, parcial: true },
  })
  const pedidos = mercadoLivre.operations.find((operation) => operation.id === 'pedidos')
  assert.ok(pedidos)
  assert.equal(pedidos.answer({ status: 200, body: { orders: [] } }).kind, 'UNREADABLE')
  assert.equal(pedidos.answer({ status: 200, body: { results: 'x' } }).kind, 'UNREADABLE')
  const odd = pedidos.answer({ status: 200, body: { results: 'seller data' } })
  assert.ok(!JSON.stringify(odd).includes('seller data'))
  const refused = conta.answer({
    status: 403,
    body: { code: 'PA_UNAUTHORIZED_RESULT_FROM_POLICIES', message: 'no' },
  })
  assert.ok('native' in refused)
  assert.equal(refused.native.code, 'PA_UNAUTHORIZED_RESULT_FROM_POLICIES')
})

test('uma linha passa como o Mercado Livre a mandou, com campo a mais ou de outro tipo', () => {
  const pedidos = mercadoLivre.operations.find((operation) => operation.id === 'pedidos')
  assert.ok(pedidos)
  const answered = pedidos.answer({
    status: 200,
    body: {
      results: [
        { id: 1, extra: { novo: true }, total_amount: 'dez', buyer: { email: 'a@b.test' } },
      ],
      paging: { total: 3, offset: 0, limit: 1 },
    },
  })
  assert.deepEqual(answered, {
    kind: 'OK',
    value: {
      linhas: [{ id: 1, extra: { novo: true }, total_amount: 'dez' }],
      temMais: true,
      total: 3,
    },
  })
})

test('o envio pede o formato novo pelo cabeçalho, e o pedido sai com ele', () => {
  const shipment = mercadoLivre.operations.find((operation) => operation.id === 'envio')
  assert.ok(shipment)
  const request = requestOf(shipment, { shipmentId: '40000000001' }, ACCOUNT, SENT_AT)
  assert.equal(request.headers?.['x-format-new'], 'true')
  assert.equal(toRequest(mercadoLivre, request, 'bearer').headers.get('x-format-new'), 'true')
})

test('o envio no formato novo não deixa sair o comprador: nome, telefone e endereço de destination', () => {
  const shipment = mercadoLivre.operations.find((operation) => operation.id === 'envio')
  assert.ok(shipment)
  const answered = shipment.answer({
    status: 200,
    body: {
      id: 40000000001,
      status: 'delivered',
      substatus: null,
      origin: { type: 'selling_address', sender_id: 1, shipping_address: { address_line: 'loja' } },
      destination: {
        comments: null,
        receiver_id: 77001,
        receiver_name: 'Maria Fictícia',
        receiver_phone: '11988776655',
        shipping_address: { address_line: 'Rua Inventada 1', zip_code: '99887766' },
      },
    },
  })
  assert.equal(answered.kind, 'OK')
  const text = JSON.stringify(answered)
  for (const buyer of ['Maria', '11988776655', 'Rua Inventada', '99887766', 'destination'])
    assert.ok(!text.includes(buyer), `the shipment carries ${buyer}`)
  assert.ok(text.includes('delivered'))
})

test('o resumo do faturamento é uma linha, e as duas leituras mandam document_type', async () => {
  const fake = mercadoLivreFake()
  const granted = await authorize(fake)
  assert.equal(granted.kind, 'OK')
  const sent = (await probeAll(fake)).filter(({ operation }) =>
    ['periodosDeFaturamento', 'cobrancasDoPeriodo'].includes(operation.id),
  )
  assert.equal(sent.length, 2)
  for (const { request } of sent) assert.equal(request.query.document_type, 'BILL')
  const summary = sent.find(({ operation }) => operation.id === 'cobrancasDoPeriodo')
  assert.ok(summary)
  assert.ok(isRows(summary.value))
  assert.equal(summary.value.linhas.length, 1)
  assert.equal(summary.value.temMais, null)
  const credit = requestOf(
    mercadoLivre.operations.find((operation) => operation.id === 'periodosDeFaturamento') ??
      assert.fail('periodosDeFaturamento'),
    { documentType: 'CREDIT_NOTE' },
    ACCOUNT,
    SENT_AT,
  )
  assert.equal(credit.query.document_type, 'CREDIT_NOTE')
})

function isRows(value: unknown): value is { linhas: unknown[]; temMais: boolean | null } {
  return typeof value === 'object' && value !== null && 'linhas' in value && 'temMais' in value
}

/** Two pages of a read of the double: the first, and the one after it. */
async function twoPages(
  id: string,
  first: Record<string, unknown>,
  second: Record<string, unknown>,
) {
  const fake = mercadoLivreFake()
  const granted = await authorize(fake)
  assert.equal(granted.kind, 'OK')
  if (granted.kind !== 'OK') return assert.fail('authorize')
  const operation = mercadoLivre.operations.find((candidate) => candidate.id === id)
  assert.ok(operation)
  async function page(input: Record<string, unknown>) {
    const request = requestOf(operation ?? assert.fail(id), input, ACCOUNT, SENT_AT)
    const answered = (operation ?? assert.fail(id)).answer(
      await answerOf(
        await fake.handle(
          toRequest(mercadoLivre, request, granted.kind === 'OK' ? granted.accessToken : ''),
        ),
      ),
    )
    assert.equal(answered.kind, 'OK', id)
    return answered.kind === 'OK' && isRows(answered.value) ? answered.value : assert.fail(id)
  }
  return [await page(first), await page(second)] as const
}

for (const [id, total] of [
  ['anuncios', 1300],
  ['perguntas', 12],
  ['periodosDeFaturamento', 14],
] as const) {
  test(`${id}: a segunda página difere da primeira e temMais vira false no fim`, async () => {
    const limit = id === 'periodosDeFaturamento' ? 6 : 5
    const [first, second] = await twoPages(id, { offset: 0, limit }, { offset: total - 2, limit })
    assert.equal(first.linhas.length, limit)
    assert.equal(first.temMais, true)
    assert.notDeepEqual(second.linhas, first.linhas)
    assert.equal(second.linhas.length, 2)
    assert.equal(second.temMais, false)
  })
}

test('as visitas mandam as datas como a documentação mostra, só o dia', () => {
  const visitas = mercadoLivre.operations.find((operation) => operation.id === 'visitas')
  assert.ok(visitas)
  const input = { dateFrom: '2026-09-01', dateTo: '2026-09-30' }
  assert.deepEqual(requestOf(visitas, input, ACCOUNT, SENT_AT).query, {
    date_from: '2026-09-01',
    date_to: '2026-09-30',
  })
  assert.equal(
    visitas.input.safeParse({ dateFrom: '2026-09-01T00:00:00Z', dateTo: '2026-09-30' }).success,
    false,
  )
  const probe = visitas.probe(new Map())
  assert.ok(visitas.input.safeParse(probe).success)
})

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
    assert.equal(read.input.safeParse({ scrollId: '', limit: 50 }).success, false, id)
  }
})

test('o cursor da resposta de uma varredura vai em seguinte, e a página sem linhas é o fim', () => {
  assert.deepEqual(scanned(['a', 'b'], { scroll_id: 'cursor-1', paging: { total: 9, limit: 2 } }), {
    kind: 'OK',
    value: { linhas: [{ id: 'a' }, { id: 'b' }], temMais: true, seguinte: 'cursor-1', total: 9 },
  })
  assert.deepEqual(scanned([], { scroll_id: 'cursor-2', paging: { total: 9, limit: 2 } }), {
    kind: 'OK',
    value: { linhas: [], temMais: false, total: 9 },
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
    const at = (name: string) => columns.findIndex((column) => column.name === name)
    assert.ok(
      all.cells.every((row) => row[at(id === 'pedidos' ? 'buyer' : 'from')] === null),
      `${id}: o objeto cortado é nulo`,
    )
  }
})

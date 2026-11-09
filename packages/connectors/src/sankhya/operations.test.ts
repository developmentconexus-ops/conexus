import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { readToken, tokenRequest } from '../kernel/auth.ts'
import { defineConnector } from '../kernel/definition.ts'
import type { ProviderAnswer, ProviderRequest } from '../kernel/operation.ts'
import { requestOf } from '../kernel/operation.ts'
import { toRequest } from '../kernel/request.ts'
import { sankhya } from './definition.ts'
import { sankhyaDoor } from './door.ts'
import { sankhyaFake } from './fake.ts'
import { estoqueDoProduto } from './operations/estoque.ts'
import { LancarPedidoInput, lancarPedido } from './operations/vendas.ts'
import { refusals } from './refusals.ts'

/** The instant the requests below are built at. */
const AT = new Date('2026-11-09T13:00:00Z')

function answer(id: string, status: number, body: unknown) {
  const found = sankhya.operations.find((operation) => operation.id === id)
  assert.ok(found, id)
  return found.answer({ status, body })
}

test('as 23 operações prontas ficam nos assuntos, na ordem do Testar, e nenhuma é do RH', () => {
  const bySubject = Object.groupBy(sankhya.operations, (operation) => operation.subject)
  assert.deepEqual(
    Object.entries(bySubject).map(([subject, operations]) => [
      subject,
      operations?.map((operation) => operation.id),
    ]),
    [
      [
        'cadastros',
        ['empresas', 'clientes', 'vendedores', 'tiposOperacao', 'naturezas', 'centrosResultado'],
      ],
      ['produtos', ['produtos', 'gruposProduto']],
      ['vendas', ['pedidos', 'notasFiscais', 'notaFiscal', 'devolucoes', 'notasCanceladas']],
      ['estoque', ['estoque', 'estoqueDoProduto', 'locaisEstoque']],
      ['financeiro', ['contasAReceber', 'contasAPagar', 'tiposPagamento']],
      ['precos', ['precosDoProduto', 'precosDaTabela']],
      ['logistica', ['transportadoras', 'ordensCarga']],
    ],
  )
  assert.equal(sankhya.operations.length, 23)
})

test('cada operação pronta lê a recusa, o pedido errado e o corpo ilegível', () => {
  for (const { id } of sankhya.operations) {
    assert.partialDeepStrictEqual(answer(id, 403, { code: 'NO_ACCESS' }), { kind: 'REFUSED' }, id)
    assert.partialDeepStrictEqual(
      answer(id, 403, { code: 'GTW3403' }),
      { kind: 'TOKEN_EXPIRED' },
      id,
    )
    assert.partialDeepStrictEqual(answer(id, 400, { code: 'X' }), { kind: 'REFUSED' }, id)
    assert.partialDeepStrictEqual(answer(id, 401, undefined), { kind: 'TOKEN_EXPIRED' }, id)
    assert.partialDeepStrictEqual(answer(id, 200, { unexpected: true }), { kind: 'UNREADABLE' }, id)
  }
})

test('o carregar aceita os cinco tipos de parâmetro e recusa outro', () => {
  function input(tipo: string) {
    return {
      entidade: 'Empresa',
      campos: ['CODEMP'],
      criterio: { expressao: 'this.CODEMP = ?', parametros: [{ valor: '1', tipo }] },
      pagina: 0,
    }
  }
  for (const tipo of ['D', 'H', 'F', 'I', 'S'])
    assert.equal(sankhyaDoor.carregar.input.safeParse(input(tipo)).success, true, tipo)
  assert.equal(sankhyaDoor.carregar.input.safeParse(input('X')).success, false)
})

async function answerOf(response: Response): Promise<ProviderAnswer> {
  const text = await response.text()
  return {
    status: response.status,
    body: text === '' ? undefined : z.unknown().parse(JSON.parse(text)),
  }
}

/** The double without a socket: signed in once, each request sent through `handle`. */
async function withDouble(
  use: (
    call: (request: ProviderRequest) => Promise<ProviderAnswer>,
    fake: ReturnType<typeof sankhyaFake>,
  ) => Promise<void>,
) {
  const fake = sankhyaFake()
  const login = readToken(
    sankhya.auth,
    await answerOf(
      await fake.handle(toRequest(sankhya, tokenRequest(sankhya.auth, fake.credential), null)),
    ),
  )
  assert.equal(login.kind, 'OK')
  if (login.kind !== 'OK') return
  await use(
    async (request) => answerOf(await fake.handle(toRequest(sankhya, request, login.accessToken))),
    fake,
  )
}

function itensOf(input: unknown) {
  return z
    .object({ itens: z.array(z.record(z.string(), z.unknown())) })
    .parse(requestOf(lancarPedido, input, { ref: null }, AT).body).itens
}

const ITEM = { codigoProduto: 11, quantidade: 2, valorUnitario: 50 }
const PEDIDO = { notaModelo: 12, codigoCliente: 1, codigoLocalEstoque: 1, itens: [ITEM] }

test('lançar pedido é a escrita do conector, que nunca se repete, e fica fora das leituras', () => {
  assert.deepEqual(
    sankhya.writes?.map((operation) => [operation.id, operation.class, operation.idempotent]),
    [['lancarPedido', 'write', false]],
  )
  assert.equal(sankhya.operations.includes(lancarPedido), false)
  assert.equal(Object.keys(sankhya.readDoor ?? {}).includes(lancarPedido.id), false)
})

test('lançar pedido manda só os campos do cartão ao POST dos pedidos, e recusa o resto', () => {
  const sent = requestOf(
    lancarPedido,
    { ...PEDIDO, observacao: 'Conexus abc', codigoVendedor: 7, extra: 'não vai' },
    { ref: null },
    AT,
  )
  assert.equal(sent.method, 'POST')
  assert.equal(sent.path, '/v1/vendas/pedidos')
  assert.deepEqual(sent.body, {
    notaModelo: 12,
    codigoCliente: 1,
    data: '09/11/2026',
    hora: '10:00',
    codigoVendedor: 7,
    observacao: 'Conexus abc',
    itens: [{ ...ITEM, sequencia: 1, codigoLocalEstoque: 1, controle: '' }],
  })
  for (const bad of [
    { ...PEDIDO, itens: [] },
    { ...PEDIDO, notaModelo: 0 },
    { ...PEDIDO, observacao: 'x'.repeat(151) },
    { ...PEDIDO, itens: [{ ...ITEM, quantidade: 0 }] },
    { ...PEDIDO, itens: [{ codigoProduto: 11, quantidade: 2 }] },
  ])
    assert.equal(LancarPedidoInput.safeParse(bad).success, false)
})

test('o pedido que o kit monta: itens numerados, o controle ou vazio e um local, o do cabeçalho primeiro', () => {
  function item(codigoProduto: number, more = {}) {
    return { ...ITEM, codigoProduto, ...more }
  }
  const sent = itensOf({
    ...PEDIDO,
    codigoLocalEstoque: undefined,
    itens: [
      item(11, { codigoLocalEstoque: 4 }),
      item(12, { codigoLocalEstoque: 5, controle: 'L1' }),
      item(13, { codigoLocalEstoque: 6 }),
    ],
  })
  assert.deepEqual(
    sent.map((each) => [
      each.sequencia,
      each.codigoProduto,
      each.codigoLocalEstoque,
      each.controle,
    ]),
    [
      [1, 11, 4, ''],
      [2, 12, 5, 'L1'],
      [3, 13, 6, ''],
    ],
  )
  assert.equal(
    PEDIDO.itens.some((each) => 'sequencia' in each),
    false,
  )
  const given = LancarPedidoInput.safeParse({ ...PEDIDO, itens: [{ ...ITEM, sequencia: 9 }] })
  assert.equal(given.success && 'sequencia' in (given.data.itens[0] ?? {}), false)
})

test('o local fixo vale para todo item, e sem local o esquema manda ler o estoque', () => {
  const locais = requestOf(
    lancarPedido,
    { ...PEDIDO, codigoLocalEstoque: 3, itens: [{ ...ITEM, codigoLocalEstoque: 5 }, ITEM] },
    { ref: null },
    AT,
  )
  assert.deepEqual(
    z.object({ itens: z.array(z.object({ codigoLocalEstoque: z.number() })) }).parse(locais.body)
      .itens,
    [{ codigoLocalEstoque: 3 }, { codigoLocalEstoque: 3 }],
  )
  const bare = { ...PEDIDO, codigoLocalEstoque: undefined }
  const refused = LancarPedidoInput.safeParse(bare)
  assert.equal(refused.success, false)
  assert.match(refused.error?.issues[0]?.message ?? '', /estoqueDoProduto/)
  assert.throws(() => requestOf(lancarPedido, bare, { ref: null }, AT))
  assert.deepEqual(lancarPedido.fixed, ['notaModelo'])
})

test('o que a escrita declara: o incerto só no GTW3503, a marca no fim da observação, o id no codigoPedido', () => {
  function native(code: string | null) {
    return { status: 504, code, message: null, body: null }
  }
  assert.equal(lancarPedido.uncertain(native('GTW3503')), true)
  assert.equal(lancarPedido.uncertain(native('GTW3403')), false)
  assert.equal(lancarPedido.uncertain(native(null)), false)
  assert.deepEqual(lancarPedido.mark(PEDIDO, 'Conexus 1'), { ...PEDIDO, observacao: 'Conexus 1' })
  assert.deepEqual(lancarPedido.mark({ ...PEDIDO, observacao: 'Pedido' }, 'Conexus 1'), {
    ...PEDIDO,
    observacao: 'Pedido Conexus 1',
  })
  assert.equal(lancarPedido.idOf({ codigoPedido: 98001 }), 98001)
})

test('o estoque de um produto: a rota por produto devolve as linhas e o 404 sem linhas é OK vazio', async () => {
  const sent = requestOf(estoqueDoProduto, { codigoProduto: 12 }, { ref: null }, AT)
  assert.equal(sent.path, '/v1/estoque/produtos/12')
  await withDouble(async (call) => {
    const found = estoqueDoProduto.answer(await call(sent))
    assert.partialDeepStrictEqual(found, {
      kind: 'OK',
      value: { linhas: [{ codigoEmpresa: 1, codigoLocal: 1, controle: 'L1', estoque: 12.5 }] },
    })
    const none = requestOf(estoqueDoProduto, { codigoProduto: 999 }, { ref: null }, AT)
    assert.partialDeepStrictEqual(estoqueDoProduto.answer(await call(none)), {
      kind: 'OK',
      empty: true,
    })
  })
})

test('o pedido recusado pelo dublê: todo produto fora do catálogo dá a recusa gravada, como ela está', async () => {
  await withDouble(async (call, fake) => {
    const request = requestOf(
      lancarPedido,
      { ...PEDIDO, itens: [{ ...ITEM, codigoProduto: 999 }] },
      { ref: null },
      AT,
    )
    const answered = await call(request)
    assert.deepEqual(
      { status: answered.status, body: answered.body },
      {
        status: refusals[0]?.status,
        body: refusals[0]?.body,
      },
    )
    assert.equal(fake.orders().length, 0)
  })
})

test('lançar pedido: só o retorno.codigoPedido é sucesso', () => {
  const sucesso = { codigo: 1, tipo: 'SUCESSO', mensagem: 'ok', retorno: { codigoPedido: 98001 } }
  assert.deepEqual(lancarPedido.answer({ status: 200, body: sucesso }), {
    kind: 'OK',
    value: { codigoPedido: 98001 },
  })
})

test('o pedido recusado: o 200 sem codigoPedido ou com [CORE_E…] e o 400 dão REFUSED com o texto', () => {
  const semCodigo = lancarPedido.answer({ status: 200, body: { codigo: 0, mensagem: 'Nada.' } })
  assert.partialDeepStrictEqual(semCodigo, { kind: 'REFUSED', native: { message: 'Nada.' } })
  const core = lancarPedido.answer({
    status: 200,
    body: { mensagem: '[CORE_E0001] Parceiro 9 não encontrado', retorno: { codigoPedido: 5 } },
  })
  assert.partialDeepStrictEqual(core, { kind: 'REFUSED', native: { code: 'CORE_E0001' } })
  const invalid = lancarPedido.answer({
    status: 400,
    body: {
      statusCode: 400,
      error: 'Bad Request',
      mensagem: { code: 'INVALID_REQUEST', message: 'Erro.', details: 'O produto [9] não existe.' },
    },
  })
  assert.partialDeepStrictEqual(invalid, {
    kind: 'REFUSED',
    native: { code: 'INVALID_REQUEST', message: 'Erro. O produto [9] não existe.' },
  })
  assert.equal(lancarPedido.answer({ status: 200, body: 'texto' }).kind, 'UNREADABLE')
})

test('lançar pedido: o token vencido e o corte do gateway não viram sucesso nem recusa', () => {
  assert.equal(lancarPedido.answer({ status: 401, body: undefined }).kind, 'TOKEN_EXPIRED')
  assert.equal(
    lancarPedido.answer({ status: 403, body: { code: 'GTW3403' } }).kind,
    'TOKEN_EXPIRED',
  )
  for (const status of [502, 503, 504])
    assert.equal(lancarPedido.answer({ status, body: { code: 'GTW3503' } }).kind, 'UNREADABLE')
})

test('as escritas do conector são só write, sem id repetido e de um assunto dele', () => {
  function redefine(changes: Record<string, unknown>) {
    return defineConnector({ ...sankhya, ...changes })
  }
  assert.equal(redefine({ writes: [lancarPedido] }).writes?.length, 1)
  assert.throws(() => redefine({ writes: [{ ...lancarPedido, class: 'read' }] }), /Write not write/)
  assert.throws(() => redefine({ writes: [lancarPedido, lancarPedido] }), /Repeated/)
  assert.throws(() => redefine({ writes: [{ ...lancarPedido, id: 'pedidos' }] }), /Repeated/)
  assert.throws(
    () => redefine({ writes: [{ ...lancarPedido, subject: 'nothing' }] }),
    /Unknown subject/,
  )
})

test('um 200 de sucesso cujo codigoPedido não é inteiro é ilegível, nunca recusa: o pedido pode existir', () => {
  const sucesso = 'Pedido Incluído/Atualizado/Cancelado com sucesso.'
  for (const retorno of [{ codigoPedido: '98001' }, { codigoPedido: 98001.5 }, {}, 'texto']) {
    const answered = lancarPedido.answer({ status: 200, body: { mensagem: sucesso, retorno } })
    assert.equal(answered.kind, 'UNREADABLE', JSON.stringify(retorno))
  }
})

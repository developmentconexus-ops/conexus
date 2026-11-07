import assert from 'node:assert/strict'
import { test } from 'node:test'
import { defineConnector } from '../kernel/definition.ts'
import { requestOf } from '../kernel/operation.ts'
import { sankhya } from './definition.ts'
import { sankhyaDoor } from './door.ts'
import { LancarPedidoInput, lancarPedido } from './operations/vendas.ts'

function answer(id: string, status: number, body: unknown) {
  const found = sankhya.operations.find((operation) => operation.id === id)
  assert.ok(found, id)
  return found.answer({ status, body })
}

test('as 22 operações prontas ficam nos assuntos, na ordem do Testar, e nenhuma é do RH', () => {
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
      ['estoque', ['estoque', 'locaisEstoque']],
      ['financeiro', ['contasAReceber', 'contasAPagar', 'tiposPagamento']],
      ['precos', ['precosDoProduto', 'precosDaTabela']],
      ['logistica', ['transportadoras', 'ordensCarga']],
    ],
  )
  assert.equal(sankhya.operations.length, 22)
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

const PEDIDO = { notaModelo: 12, codigoCliente: 1, itens: [{ codigoProduto: 11, quantidade: 2 }] }

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
  )
  assert.equal(sent.method, 'POST')
  assert.equal(sent.path, '/v1/vendas/pedidos')
  assert.deepEqual(sent.body, { ...PEDIDO, observacao: 'Conexus abc', codigoVendedor: 7 })
  for (const bad of [
    { ...PEDIDO, itens: [] },
    { ...PEDIDO, notaModelo: 0 },
    { ...PEDIDO, observacao: 'x'.repeat(151) },
    { ...PEDIDO, itens: [{ codigoProduto: 11, quantidade: 0 }] },
  ])
    assert.equal(LancarPedidoInput.safeParse(bad).success, false)
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

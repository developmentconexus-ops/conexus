import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sankhya } from './definition.ts'
import { sankhyaDoor } from './door.ts'

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
      [
        'vendas',
        [
          'pedidos',
          'impostosDoPedido',
          'notasFiscais',
          'notaFiscal',
          'devolucoes',
          'notasCanceladas',
        ],
      ],
      ['estoque', ['estoque', 'locaisEstoque']],
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
    assert.partialDeepStrictEqual(answer(id, 401, undefined), { kind: 'AUTH_REFUSED' }, id)
    assert.partialDeepStrictEqual(answer(id, 200, { unexpected: true }), { kind: 'UNREADABLE' }, id)
  }
})

test('os tipos de operação aceitam a lista ou o objeto único da documentação', () => {
  const tipo = { codigoTipoOperacao: 1100, nome: 'Venda' }
  const expected = {
    kind: 'OK',
    value: { tiposOperacao: [{ ...tipo, tipoMovimento: null, ativo: null }] },
  }
  assert.deepEqual(answer('tiposOperacao', 200, tipo), expected)
  assert.deepEqual(answer('tiposOperacao', 200, [tipo]), expected)
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

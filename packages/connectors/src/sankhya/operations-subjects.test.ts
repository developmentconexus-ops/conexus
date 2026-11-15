import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sankhya } from './definition.ts'

test('as 27 operações prontas ficam nos assuntos, na ordem do Testar, e nenhuma é do RH', () => {
  const bySubject = Object.groupBy(sankhya.operations, (operation) => operation.subject)
  assert.deepEqual(
    Object.entries(bySubject).map(([subject, operations]) => [
      subject,
      operations?.map((operation) => operation.id),
    ]),
    [
      [
        'cadastros',
        [
          'empresas',
          'clientes',
          'vendedores',
          'tiposOperacao',
          'naturezas',
          'centrosResultado',
          'buscarParceiros',
          'buscarVendedores',
        ],
      ],
      ['produtos', ['produtos', 'gruposProduto', 'buscarProdutos']],
      ['vendas', ['pedidos', 'notasFiscais', 'notaFiscal', 'devolucoes', 'notasCanceladas']],
      ['estoque', ['estoque', 'estoqueDoProduto', 'locaisEstoque', 'estoqueDosProdutos']],
      ['financeiro', ['contasAReceber', 'contasAPagar', 'tiposPagamento']],
      ['precos', ['precosDoProduto', 'precosDaTabela']],
      ['logistica', ['transportadoras', 'ordensCarga']],
    ],
  )
  assert.equal(sankhya.operations.length, 27)
})

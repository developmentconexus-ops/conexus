import assert from 'node:assert/strict'
import { test } from 'node:test'
import { lancarPedido } from './operations/vendas.ts'

test('um 200 cujo codigoPedido vem em texto de dígitos é sucesso, com o número', () => {
  const sucesso = 'Pedido Incluído/Atualizado/Cancelado com sucesso.'
  const answered = lancarPedido.answer({
    status: 200,
    body: { mensagem: sucesso, retorno: { codigoPedido: '98001' } },
  })
  assert.deepEqual(answered, { kind: 'OK', value: { codigoPedido: 98001 } })
})

test('um 200 cujo codigoPedido não lê é ilegível, nunca recusa: o pedido pode existir', () => {
  const sucesso = 'Pedido Incluído/Atualizado/Cancelado com sucesso.'
  const sem = [{ codigoPedido: 98001.5 }, {}, 'texto', 98115, ['x'], null]
  for (const retorno of [
    ...sem,
    ...['0', '-1', '12a', ''].map((codigoPedido) => ({ codigoPedido })),
  ]) {
    const answered = lancarPedido.answer({ status: 200, body: { mensagem: sucesso, retorno } })
    assert.equal(answered.kind, 'UNREADABLE', JSON.stringify(retorno))
  }
})

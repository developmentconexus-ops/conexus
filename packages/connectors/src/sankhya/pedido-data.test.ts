import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { requestOf } from '../kernel/operation.ts'
import { lancarPedido } from './operations/vendas.ts'

const PEDIDO = {
  notaModelo: 12,
  codigoCliente: 1,
  codigoLocalEstoque: 1,
  itens: [{ codigoProduto: 11, quantidade: 2, valorUnitario: 50 }],
}

test('o pedido leva a data e a hora do envio em Brasília, inclusive na virada do dia', () => {
  function stamped(at: string) {
    return z
      .object({ data: z.string(), hora: z.string() })
      .parse(requestOf(lancarPedido, PEDIDO, { ref: null }, new Date(at)).body)
  }
  assert.deepEqual(stamped('2026-11-09T13:00:00Z'), { data: '09/11/2026', hora: '10:00' })
  assert.deepEqual(stamped('2026-11-09T02:30:00Z'), { data: '08/11/2026', hora: '23:30' })
  assert.deepEqual(stamped('2026-11-09T03:00:00Z'), { data: '09/11/2026', hora: '00:00' })
  assert.deepEqual(stamped('2026-12-31T23:59:00Z'), { data: '31/12/2026', hora: '20:59' })
})

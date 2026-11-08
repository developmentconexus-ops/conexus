import { z } from 'zod'
import { json } from './fake-data.ts'
import { CLIENTES, PRODUTOS } from './fake-rows.ts'
import { lancarPedido } from './operations/vendas.ts'
import { refusals } from './refusals.ts'

// Invented orders only (S40). The real gateway has no idempotency key, so the double stores every
// order it is sent and says nothing else about a repeat: counting what it holds is how a test sees a repeat.

export const ORDERS_PATH = '/v1/vendas/pedidos'

/** A stored order: always "a confirmar", as the documentation says of an add. */
export type StoredOrder = Readonly<{
  codigoPedido: number
  estado: 'A_CONFIRMAR'
  observacao: string
  body: Readonly<Record<string, unknown>>
}>

/** What the double does to an add besides answering it; each switch loses the answer (a 504 `GTW3503`), the first keeps the order, the second never stores it. */
export type OrderSwitches = { lostAfterStore: boolean; lostBeforeStore: boolean }

const FIRST_CODE = 98001

const OrderBody = z.looseObject({
  codigoCliente: z.number().int(),
  observacao: z.string().optional(),
  itens: z.array(z.looseObject({ codigoProduto: z.number().int() })).min(1),
})

/** The gateway's recorded answer to an add that names a product it does not have, sent as it was kept. */
function unknownProduct(): Response {
  const recorded = refusals.find((each) => each.operation === lancarPedido.id)
  if (recorded === undefined) throw new Error('no recorded refusal for lancarPedido')
  return json(recorded.body, recorded.status)
}

function gatewayTimeout(): Response {
  return json({ code: 'GTW3503', message: 'Tempo limite do gateway esgotado' }, 504)
}

export type OrderBook = Readonly<{
  switches: OrderSwitches
  orders: () => readonly StoredOrder[]
  add: (body: unknown) => Response
}>

export function orderBook(): OrderBook {
  const stored: StoredOrder[] = []
  const switches: OrderSwitches = { lostAfterStore: false, lostBeforeStore: false }

  function add(raw: unknown): Response {
    const parsed = OrderBody.safeParse(raw)
    // The kit's schema refuses an order without a client or items before it leaves: one that arrives is a test's mistake.
    if (!parsed.success) throw new Error('the double was sent an order the kit does not build')
    const body = parsed.data
    const known = new Set(PRODUTOS.map((produto) => produto.codigoProduto))
    const unknown = body.itens.find((item) => !known.has(item.codigoProduto))
    if (unknown) return unknownProduct()
    if (!CLIENTES.some((cliente) => Number(cliente.codigoCliente) === body.codigoCliente))
      return json({
        codigo: 0,
        tipo: 'ERRO',
        mensagem: `[CORE_E0001] O parceiro ${body.codigoCliente} não foi encontrado.`,
      })
    if (switches.lostBeforeStore) return gatewayTimeout()
    const codigoPedido = FIRST_CODE + stored.length
    stored.push({
      codigoPedido,
      estado: 'A_CONFIRMAR',
      observacao: body.observacao ?? '',
      body,
    })
    if (switches.lostAfterStore) return gatewayTimeout()
    return json({
      codigo: 1,
      tipo: 'SUCESSO',
      mensagem: 'Pedido Incluído/Atualizado/Cancelado com sucesso.',
      retorno: { codigoPedido },
    })
  }

  return { switches, orders: () => stored, add }
}

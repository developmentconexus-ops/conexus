import { z } from 'zod'

/** One line of the card's list: what a field is called and what the write puts in it. */
export type Field = { label: string; lines: string[] }

const Order = z.looseObject({
  codigoCliente: z.number().optional(),
  codigoVendedor: z.number().optional(),
  observacao: z.string().optional(),
  itens: z
    .array(
      z.looseObject({
        codigoProduto: z.number(),
        quantidade: z.number(),
        valorUnitario: z.number().optional(),
      }),
    )
    .default([]),
})

const REAIS = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** Reais as the card says them, with an ordinary space after "R$". */
function reais(value: number): string {
  return REAIS.format(value).replace(' ', ' ')
}

function quantity(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

/** The fields of an order the model filled: client, items, and the total when every item has a price. */
function orderFields(args: unknown): Field[] | undefined {
  const order = Order.safeParse(args)
  if (!order.success) return undefined
  const { codigoCliente, codigoVendedor, observacao, itens } = order.data
  const priced = itens.every((item) => item.valorUnitario !== undefined)
  const total = itens.reduce((sum, item) => sum + item.quantidade * (item.valorUnitario ?? 0), 0)
  return [
    ...(codigoCliente === undefined ? [] : [{ label: 'Cliente', lines: [String(codigoCliente)] }]),
    ...(codigoVendedor === undefined
      ? []
      : [{ label: 'Vendedor', lines: [String(codigoVendedor)] }]),
    {
      label: 'Itens',
      lines: itens.map((item) =>
        item.valorUnitario === undefined
          ? `${quantity(item.quantidade)} × produto ${item.codigoProduto}`
          : `${quantity(item.quantidade)} × produto ${item.codigoProduto} a ${reais(item.valorUnitario)}`,
      ),
    },
    ...(priced && itens.length > 0 ? [{ label: 'Total', lines: [reais(total)] }] : []),
    ...(observacao === undefined ? [] : [{ label: 'Observação', lines: [observacao] }]),
  ]
}

/** Any other write: each field the model filled, named as the write names it. */
function plainFields(args: unknown): Field[] {
  if (typeof args !== 'object' || args === null) return []
  return Object.entries(args).map(([label, value]) => ({
    label,
    lines: [typeof value === 'string' ? value : JSON.stringify(value)],
  }))
}

/** What the card lists of the write the agent asks about, by the operation the kit names. */
export function fieldsOf(operation: string | undefined, args: unknown): Field[] {
  return (operation === 'lancarPedido' ? orderFields(args) : undefined) ?? plainFields(args)
}

import { z } from 'zod'

/** One line of the card's list: what a field is called and what the write puts in it. */
export type Field = { label: string; lines: string[] }

const Order = z.looseObject({
  notaModelo: z.number().optional(),
  codigoLocalEstoque: z.number().optional(),
  codigoCliente: z.number().optional(),
  codigoVendedor: z.number().optional(),
  observacao: z.string().optional(),
  itens: z
    .array(
      z.looseObject({
        codigoProduto: z.number(),
        quantidade: z.number(),
        valorUnitario: z.number().optional(),
        codigoLocalEstoque: z.number().optional(),
        controle: z.string().optional(),
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

type Item = z.infer<typeof Order>['itens'][number]

/** One item as the card says it: what, how many, at what price, from where in the stock, and the lot when there is one (Sankhya's "no control" is a blank, a space too). The order's own place wins over the item's, as the write does. */
function itemLine(item: Item, orderPlace: number | undefined): string {
  const place = orderPlace ?? item.codigoLocalEstoque
  const what = `${quantity(item.quantidade)} × produto ${item.codigoProduto}`
  return [
    item.valorUnitario === undefined ? what : `${what} a ${reais(item.valorUnitario)}`,
    ...(place === undefined ? [] : [`local ${place}`]),
    ...(item.controle === undefined || item.controle.trim() === ''
      ? []
      : [`lote ${item.controle}`]),
  ].join(' · ')
}

/** The fields of an order the model filled: client, items, the total when every item has a price, and the date and hour, which are the send's. */
function orderFields(args: unknown): Field[] | undefined {
  const order = Order.safeParse(args)
  if (!order.success) return undefined
  const { notaModelo, codigoCliente, codigoVendedor, observacao, itens } = order.data
  const place = order.data.codigoLocalEstoque
  const priced = itens.every((item) => item.valorUnitario !== undefined)
  const total = itens.reduce((sum, item) => sum + item.quantidade * (item.valorUnitario ?? 0), 0)
  return [
    ...(notaModelo === undefined ? [] : [{ label: 'Nota modelo', lines: [String(notaModelo)] }]),
    ...(codigoCliente === undefined ? [] : [{ label: 'Cliente', lines: [String(codigoCliente)] }]),
    ...(codigoVendedor === undefined
      ? []
      : [{ label: 'Vendedor', lines: [String(codigoVendedor)] }]),
    {
      label: 'Itens',
      lines: itens.map((item) => itemLine(item, place)),
    },
    ...(priced && itens.length > 0 ? [{ label: 'Total', lines: [reais(total)] }] : []),
    // The Hub dates the order when it sends it, after Aprovar, so the card has no value to show yet.
    { label: 'Data e hora', lines: ['as do envio'] },
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

/**
 * What the card lists of the write the agent asks about, by the operation the kit names: what the
 * model filled over what the version fixes, `{ ...args, ...bound }`, as the tool's `execute` sends it.
 */
export function fieldsOf(
  operation: string | undefined,
  args: unknown,
  bound: Readonly<Record<string, unknown>> = {},
): Field[] {
  const sent = typeof args === 'object' && args !== null ? { ...args, ...bound } : args
  return (operation === 'lancarPedido' ? orderFields(sent) : undefined) ?? plainFields(sent)
}

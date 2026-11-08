import { z } from 'zod'
import { defineOperation, get, post } from '../../kernel/operation.ts'
import { placed, rows } from '../answers.ts'
import { empresaPage, empresas } from './cadastros.ts'
import { Code, DashDate, Date_, firstCode, Page } from './shared.ts'

/** The filters the orders and the invoices share; the order route ignores `codigoNota` (measured 2026-10-30), so only the invoices take it. */
const Janela = z.object({
  codigoEmpresa: Code,
  page: Page(0),
  dataNegociacaoInicio: Date_.optional(),
  dataNegociacaoFinal: Date_.optional(),
  codigoCliente: Code.optional(),
})

export const pedidos = defineOperation({
  id: 'pedidos',
  class: 'read' as const,
  subject: 'vendas',
  idempotent: true,
  summary:
    'Lista os pedidos de venda de uma empresa (nota, cliente, vendedor, valor e itens), uma página por chamada; a página começa em 0.',
  label: 'Pedidos',
  input: Janela.extend({ confirmada: z.boolean().optional(), pendente: z.boolean().optional() }),
  ...rows({ list: 'pedido' }),
  from: [empresas.id],
  probe: empresaPage(0),
  request: (input) => get('/v1/vendas/pedidos', input),
})

export const notasFiscais = defineOperation({
  id: 'notasFiscais',
  class: 'read' as const,
  subject: 'vendas',
  idempotent: true,
  summary:
    'Lista as notas fiscais de venda de uma empresa (número, cliente, tipo de operação, valor, status da NF-e), sem os itens; a página começa em 0.',
  label: 'Notas fiscais',
  input: Janela.extend({ statusNFe: z.number().int().optional(), codigoNota: Code.optional() }),
  ...rows({ list: 'nota' }),
  from: [empresas.id],
  probe: empresaPage(0),
  request: (input) => get('/v1/vendas/nfe', input),
})

export const notaFiscal = defineOperation({
  id: 'notaFiscal',
  class: 'read' as const,
  subject: 'vendas',
  idempotent: true,
  summary: 'Lê uma nota fiscal de venda inteira pelo código: itens, impostos e parcelas.',
  label: 'Nota fiscal com itens',
  input: z.object({ codigoNota: Code }),
  ...rows({ list: 'nota' }),
  from: [notasFiscais.id],
  probe: (earlier) => {
    const codigoNota = firstCode(earlier, notasFiscais.id, 'codigoNota')
    return codigoNota === undefined ? null : { codigoNota }
  },
  request: ({ codigoNota }) => get(`/v1/vendas/nfe/${codigoNota}`, {}),
})

export const devolucoes = defineOperation({
  id: 'devolucoes',
  class: 'read' as const,
  subject: 'vendas',
  idempotent: true,
  summary:
    'Lista as notas de devolução de venda de uma empresa, sem os itens; a página começa em 0 e as datas vão como dd-mm-aaaa.',
  label: 'Devoluções',
  input: z.object({
    codigoEmpresa: Code,
    page: Page(0),
    dataNegociacaoInicio: DashDate.optional(),
    dataNegociacaoFinal: DashDate.optional(),
    codigoCliente: Code.optional(),
  }),
  ...rows({ list: 'nota' }),
  from: [empresas.id],
  probe: empresaPage(0),
  request: (input) => get('/v1/vendas/nfe/devolucoes', input),
})

export const notasCanceladas = defineOperation({
  id: 'notasCanceladas',
  class: 'read' as const,
  subject: 'vendas',
  idempotent: true,
  summary:
    'Lista as notas fiscais canceladas de uma empresa (número, cliente, motivo, data); a página começa em 0 e as datas de cancelamento vão como dd-mm-aaaa.',
  label: 'Notas canceladas',
  input: z.object({
    codigoEmpresa: Code,
    page: Page(0),
    dataCancelamentoInicio: DashDate.optional(),
    dataCancelamentoFinal: DashDate.optional(),
  }),
  ...rows({ list: 'registros' }),
  from: [empresas.id],
  probe: empresaPage(0),
  request: (input) => get('/v1/vendas/nfe/canceladas', input),
})

const Place = z.number().int().positive()

const ItemPedido = z.object({
  codigoProduto: z.number().int().positive(),
  quantidade: z.number().positive(),
  valorUnitario: z.number().nonnegative(),
  codigoLocalEstoque: Place.optional(),
  controle: z.string().optional(),
})

export const LancarPedidoInput = z
  .object({
    notaModelo: z.number().int().positive(),
    codigoCliente: z.number().int().positive(),
    codigoVendedor: z.number().int().positive().optional(),
    observacao: z
      .string()
      .max(150)
      .describe('Até 150 caracteres menos 17: o Conexus acrescenta a sua marca no fim.')
      .optional(),
    codigoLocalEstoque: Place.describe(
      'O local de estoque do pedido; quando vem, vale para todo item e vence o de cada um.',
    ).optional(),
    itens: z.array(ItemPedido).min(1),
  })
  .superRefine((input, context) => {
    input.itens.forEach((item, index) => {
      if (input.codigoLocalEstoque === undefined && item.codigoLocalEstoque === undefined)
        context.addIssue({
          code: 'custom',
          path: ['itens', index, 'codigoLocalEstoque'],
          message:
            'o item não tem local de estoque e o pedido também não: leia o estoque do produto (estoqueDoProduto) e escolha o local',
        })
    })
  })

type Pedido = z.infer<typeof LancarPedidoInput>

/** The order as the page asks it: each item numbered from 1, with the order's place when it gave one (it wins) or else the item's own, and its control or ''. */
function pedidoOf({ codigoLocalEstoque, itens, ...header }: Pedido) {
  return {
    ...header,
    itens: itens.map((item, index) => ({
      sequencia: index + 1,
      codigoProduto: item.codigoProduto,
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitario,
      codigoLocalEstoque: codigoLocalEstoque ?? item.codigoLocalEstoque,
      controle: item.controle ?? '',
    })),
  }
}

export const lancarPedido = defineOperation({
  id: 'lancarPedido',
  class: 'write' as const,
  subject: 'vendas',
  idempotent: false,
  summary:
    'Lança um pedido de venda no Sankhya, sempre "a confirmar": nota modelo, cliente, itens com o valor unitário e o local de estoque (leia o estoque do produto) e, se quiser, vendedor e observação. Devolve o código do pedido.',
  label: 'Lançar pedido',
  input: LancarPedidoInput,
  fixed: ['notaModelo'],
  ...placed(),
  probe: (): Pedido => ({
    notaModelo: 1,
    codigoCliente: 1,
    codigoLocalEstoque: 1,
    itens: [{ codigoProduto: 1, quantidade: 1, valorUnitario: 1 }],
  }),
  request: (input) => post('/v1/vendas/pedidos', pedidoOf(input)),
  // The gateway's own timeout answers for the provider after it took the request: the order may exist.
  uncertain: (native) => native.code === 'GTW3503',
  // `observacao` is the one free text the person finds in the order.
  mark: (input, mark) => ({
    ...input,
    observacao:
      input.observacao === undefined || input.observacao === ''
        ? mark
        : `${input.observacao} ${mark}`,
  }),
  idOf: (value) => value.codigoPedido,
})

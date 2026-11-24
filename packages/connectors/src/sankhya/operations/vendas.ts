import { z } from 'zod'
import { defineOperation, get, post } from '../../kernel/operation.ts'
import { Placed, placedAnswer } from '../answers.ts'
import { companyProbe, empresas } from './cadastros.ts'
import { Code, DashDay, Day, defineRoute, firstCode, Page } from './route.ts'

/** The window the orders and the invoices share; the order route ignores `codigoNota` (measured 2026-10-30), so only the invoices take it. */
const Window = z.strictObject({
  codigoEmpresa: Code,
  page: Page(0),
  dataNegociacaoInicio: Day.optional(),
  dataNegociacaoFinal: Day.optional(),
  codigoCliente: Code.optional(),
})

const ofCompany = { from: [empresas.id], probe: companyProbe(0) }

export const pedidos = defineRoute({
  id: 'pedidos',
  subject: 'vendas',
  summary:
    'Lista os pedidos de venda de uma empresa (nota, cliente, vendedor, valor e itens), uma página por chamada; a página começa em 0.',
  label: 'Pedidos',
  input: Window.extend({ confirmada: z.boolean().optional(), pendente: z.boolean().optional() }),
  rowsAt: 'pedido',
  ...ofCompany,
  request: (input) => get('/v1/vendas/pedidos', input),
})

export const notasFiscais = defineRoute({
  id: 'notasFiscais',
  subject: 'vendas',
  summary:
    'Lista as notas fiscais de venda de uma empresa (número, cliente, tipo de operação, valor, status da NF-e), sem os itens; a página começa em 0.',
  label: 'Notas fiscais',
  input: Window.extend({ statusNFe: z.number().int().optional(), codigoNota: Code.optional() }),
  rowsAt: 'nota',
  ...ofCompany,
  request: (input) => get('/v1/vendas/nfe', input),
})

export const notaFiscal = defineRoute({
  id: 'notaFiscal',
  subject: 'vendas',
  summary: 'Lê uma nota fiscal de venda inteira pelo código: itens, impostos e parcelas.',
  label: 'Nota fiscal com itens',
  input: z.strictObject({ codigoNota: Code }),
  rowsAt: 'nota',
  from: [notasFiscais.id],
  probe: (earlier) => {
    const codigoNota = firstCode(earlier, notasFiscais.id, 'codigoNota')
    return codigoNota === undefined ? null : { codigoNota }
  },
  request: ({ codigoNota }) => get(`/v1/vendas/nfe/${codigoNota}`),
})

export const devolucoes = defineRoute({
  id: 'devolucoes',
  subject: 'vendas',
  summary:
    'Lista as notas de devolução de venda de uma empresa, sem os itens; a página começa em 0 e as datas vão como dd-mm-aaaa.',
  label: 'Devoluções',
  input: z.strictObject({
    codigoEmpresa: Code,
    page: Page(0),
    dataNegociacaoInicio: DashDay.optional(),
    dataNegociacaoFinal: DashDay.optional(),
    codigoCliente: Code.optional(),
  }),
  rowsAt: 'nota',
  ...ofCompany,
  request: (input) => get('/v1/vendas/nfe/devolucoes', input),
})

export const notasCanceladas = defineRoute({
  id: 'notasCanceladas',
  subject: 'vendas',
  summary:
    'Lista as notas fiscais canceladas de uma empresa (número, cliente, motivo, data); a página começa em 0 e as datas de cancelamento vão como dd-mm-aaaa.',
  label: 'Notas canceladas',
  input: z.strictObject({
    codigoEmpresa: Code,
    page: Page(0),
    dataCancelamentoInicio: DashDay.optional(),
    dataCancelamentoFinal: DashDay.optional(),
  }),
  rowsAt: 'registros',
  ...ofCompany,
  request: (input) => get('/v1/vendas/nfe/canceladas', input),
})

const Place = z.number().int().positive()

const Item = z.object({
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
    itens: z.array(Item).min(1),
  })
  .superRefine((pedido, context) => {
    if (pedido.codigoLocalEstoque !== undefined) return
    for (const [at, item] of pedido.itens.entries())
      if (item.codigoLocalEstoque === undefined)
        context.addIssue({
          code: 'custom',
          path: ['itens', at, 'codigoLocalEstoque'],
          message:
            'o item não tem local de estoque e o pedido também não: leia o estoque do produto (estoqueDoProduto) e escolha o local',
        })
  })

type Pedido = z.infer<typeof LancarPedidoInput>

// Sankhya keeps dates and hours without a zone, on the company's clock; the companies are in Brasília.
const BRASILIA = { timeZone: 'America/Sao_Paulo' } as const
const DAY = new Intl.DateTimeFormat('pt-BR', { ...BRASILIA, dateStyle: 'short' })
const HOUR = new Intl.DateTimeFormat('pt-BR', { ...BRASILIA, timeStyle: 'short', hourCycle: 'h23' })

/** The body the page asks: the send's date (dd/MM/yyyy) and hour (HH:mm), each item numbered from 1 with the order's place if it gave one, else its own, and its control or ''. */
function bodyOf({ codigoLocalEstoque, itens, ...header }: Pedido, at: Date) {
  return {
    ...header,
    data: DAY.format(at),
    hora: HOUR.format(at),
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
  output: Placed,
  probe: (): Pedido => ({
    notaModelo: 1,
    codigoCliente: 1,
    codigoLocalEstoque: 1,
    itens: [{ codigoProduto: 1, quantidade: 1, valorUnitario: 1 }],
  }),
  request: (pedido, _account, at) => post('/v1/vendas/pedidos', bodyOf(pedido, at)),
  answer: placedAnswer,
  // The gateway's own timeout, after it took the request: the order may exist.
  uncertain: (native) => native.code === 'GTW3503',
  mark: (pedido, mark) => ({
    ...pedido,
    observacao: pedido.observacao ? `${pedido.observacao} ${mark}` : mark,
  }),
  idOf: (placed) => placed.codigoPedido,
})

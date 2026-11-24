import { z } from 'zod'
import { get } from '../../kernel/operation.ts'
import { Code, defineRoute, FirstPage } from './route.ts'

export const estoque = defineRoute({
  id: 'estoque',
  subject: 'estoque',
  summary:
    'Lista o saldo de estoque por produto, empresa e local (até 50 por página); a página começa em 0. Só traz produto que já teve movimento.',
  label: 'Estoque por produto',
  input: FirstPage,
  rowsAt: 'estoque',
  probe: () => ({ page: 0 }),
  request: (input) => get('/v1/estoque/produtos', input),
})

export const estoqueDoProduto = defineRoute({
  id: 'estoqueDoProduto',
  subject: 'estoque',
  summary:
    'Lê o saldo de estoque de um produto, por empresa, local e controle. Leia antes de lançar um pedido: o local de cada item vem daqui. Sem linha, o produto não tem estoque lido.',
  label: 'Estoque de um produto',
  input: z.strictObject({ codigoProduto: Code.positive() }),
  rowsAt: 'estoque',
  probe: () => ({ codigoProduto: 11 }),
  request: ({ codigoProduto }) => get(`/v1/estoque/produtos/${codigoProduto}`),
})

export const locaisEstoque = defineRoute({
  id: 'locaisEstoque',
  subject: 'estoque',
  summary: 'Lista os locais de estoque (código, descrição, local pai); a página começa em 0.',
  label: 'Locais de estoque',
  input: FirstPage,
  rowsAt: 'locais',
  probe: () => ({ page: 0 }),
  request: (input) => get('/v1/estoque/locais', input),
})

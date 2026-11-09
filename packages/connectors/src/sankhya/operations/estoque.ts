import { z } from 'zod'
import { defineOperation, get } from '../../kernel/operation.ts'
import { rows } from '../answers.ts'
import { Code, Page } from './shared.ts'

export const estoque = defineOperation({
  id: 'estoque',
  class: 'read' as const,
  subject: 'estoque',
  idempotent: true,
  summary:
    'Lista o saldo de estoque por produto, empresa e local (até 50 por página); a página começa em 0. Só traz produto que já teve movimento.',
  label: 'Estoque por produto',
  input: z.object({ page: Page(0) }),
  ...rows({ list: 'estoque' }),
  probe: () => ({ page: 0 }),
  request: ({ page }) => get('/v1/estoque/produtos', { page }),
})

export const estoqueDoProduto = defineOperation({
  id: 'estoqueDoProduto',
  class: 'read' as const,
  subject: 'estoque',
  idempotent: true,
  summary:
    'Lê o saldo de estoque de um produto, por empresa, local e controle. Leia antes de lançar um pedido: o local de cada item vem daqui. Sem linha, o produto não tem estoque lido.',
  label: 'Estoque de um produto',
  input: z.object({ codigoProduto: Code.positive() }),
  ...rows({ list: 'estoque' }),
  probe: () => ({ codigoProduto: 11 }),
  request: ({ codigoProduto }) => get(`/v1/estoque/produtos/${codigoProduto}`),
})

export const locaisEstoque = defineOperation({
  id: 'locaisEstoque',
  class: 'read' as const,
  subject: 'estoque',
  idempotent: true,
  summary: 'Lista os locais de estoque (código, descrição, local pai); a página começa em 0.',
  label: 'Locais de estoque',
  input: z.object({ page: Page(0) }),
  ...rows({ list: 'locais' }),
  probe: () => ({ page: 0 }),
  request: ({ page }) => get('/v1/estoque/locais', { page }),
})

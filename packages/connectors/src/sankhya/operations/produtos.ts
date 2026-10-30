import { z } from 'zod'
import { defineOperation, get } from '../../kernel/operation.ts'
import { rows } from '../answers.ts'
import { Page } from './shared.ts'

export const produtos = defineOperation({
  id: 'produtos',
  class: 'read' as const,
  subject: 'produtos',
  idempotent: true,
  summary:
    'Lista os produtos do Sankhya (código, nome, grupo, marca, NCM), uma página por chamada; a página começa em 0.',
  label: 'Produtos',
  input: z.object({ page: Page(0) }),
  ...rows({ list: 'produtos' }),
  probe: () => ({ page: 0 }),
  request: ({ page }) => get('/v1/produtos', { page }),
})

export const gruposProduto = defineOperation({
  id: 'gruposProduto',
  class: 'read' as const,
  subject: 'produtos',
  idempotent: true,
  summary: 'Lista os grupos de produto (código, nome, grupo pai); a página começa em 0.',
  label: 'Grupos de produto',
  input: z.object({ page: Page(0) }),
  ...rows({ list: 'grupos' }),
  probe: () => ({ page: 0 }),
  request: ({ page }) => get('/v1/grupos-produto', { page }),
})

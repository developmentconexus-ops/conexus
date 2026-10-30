import { z } from 'zod'
import { defineOperation } from '../../kernel/operation.ts'
import { rows } from '../answers.ts'
import { get, Page } from './shared.ts'

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

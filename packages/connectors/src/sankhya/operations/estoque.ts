import { z } from 'zod'
import { defineOperation } from '../../kernel/operation.ts'
import { restAnswer } from '../answers.ts'
import { Code, get, maybe, Page } from './shared.ts'

const Estoque = z.object({
  estoque: z.array(
    z.object({
      codigoProduto: Code,
      codigoEmpresa: Code,
      codigoLocal: Code,
      controle: maybe(z.string()),
      estoque: z.number(),
    }),
  ),
})

export const estoque = defineOperation({
  id: 'estoque',
  class: 'read' as const,
  subject: 'estoque',
  idempotent: true,
  summary:
    'Lista o saldo de estoque por produto, empresa e local (até 50 por página); a página começa em 1 e a lista não diz quando acaba. Só traz produto que já teve movimento.',
  label: 'Estoque por produto',
  input: z.object({ page: Page(1) }),
  output: Estoque,
  probe: () => ({ page: 1 }),
  request: ({ page }) => get('/v1/estoque/produtos', { page }),
  answer: (answer) => restAnswer(answer, Estoque, { estoque: [] }),
})

const LocaisEstoque = z
  .array(
    z.object({
      codigoLocal: Code,
      codigoLocalPai: maybe(Code),
      descricaoLocal: maybe(z.string()),
      grau: maybe(Code),
      analitico: maybe(z.boolean()),
      ativo: maybe(z.boolean()),
    }),
  )
  .transform((locais) => ({ locais }))

export const locaisEstoque = defineOperation({
  id: 'locaisEstoque',
  class: 'read' as const,
  subject: 'estoque',
  idempotent: true,
  summary:
    'Lista os locais de estoque (código, descrição, local pai); a página começa em 0 e a lista não diz quando acaba.',
  label: 'Locais de estoque',
  input: z.object({ page: Page(0) }),
  output: LocaisEstoque,
  probe: () => ({ page: 0 }),
  request: ({ page }) => get('/v1/estoque/locais', { page }),
  answer: (answer) => restAnswer(answer, LocaisEstoque),
})

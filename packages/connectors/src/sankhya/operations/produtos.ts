import { z } from 'zod'
import type { OperationId } from '../../kernel/operation.ts'
import { defineOperation } from '../../kernel/operation.ts'
import { restAnswer } from '../answers.ts'
import { Code, get, maybe, Page } from './shared.ts'

const Produtos = z.object({
  produtos: z.array(
    z.object({
      codigoProduto: Code,
      nome: maybe(z.string()),
      complemento: maybe(z.string()),
      referencia: maybe(z.string()),
      codigoGrupoProduto: maybe(Code),
      nomeGrupoProduto: maybe(z.string()),
      volume: maybe(z.string()),
      marca: maybe(z.string()),
      ativo: maybe(z.union([z.boolean(), z.string()])),
      ncm: maybe(z.string()),
      dataAltercao: maybe(z.string()),
    }),
  ),
})

export const produtos = defineOperation({
  id: 'produtos',
  class: 'read' as const,
  subject: 'produtos',
  idempotent: true,
  summary:
    'Lista os produtos do Sankhya (código, nome, grupo, marca, NCM), uma página por chamada; a página começa em 0.',
  label: 'Produtos',
  input: z.object({ page: Page(0) }),
  output: Produtos,
  probe: () => ({ page: 0 }),
  request: ({ page }) => get('/v1/produtos', { page }),
  answer: (answer) => restAnswer(answer, Produtos),
})

/** The first product an earlier probe read. */
export function firstProduto(earlier: ReadonlyMap<OperationId, unknown>) {
  return Produtos.safeParse(earlier.get(produtos.id)).data?.produtos[0]
}

const GruposProduto = z.object({
  grupos: z.array(
    z.object({
      codigoGrupoProduto: Code,
      nome: maybe(z.string()),
      codigoGrupoProdutoPai: maybe(Code),
      grau: maybe(Code),
      analitico: maybe(z.boolean()),
      ativo: maybe(z.boolean()),
    }),
  ),
})

export const gruposProduto = defineOperation({
  id: 'gruposProduto',
  class: 'read' as const,
  subject: 'produtos',
  idempotent: true,
  summary:
    'Lista os grupos de produto (código, nome, grupo pai); a página começa em 0 e a lista não diz quando acaba.',
  label: 'Grupos de produto',
  input: z.object({ page: Page(0) }),
  output: GruposProduto,
  probe: () => ({ page: 0 }),
  request: ({ page }) => get('/v1/grupos-produto', { page }),
  answer: (answer) => restAnswer(answer, GruposProduto),
})

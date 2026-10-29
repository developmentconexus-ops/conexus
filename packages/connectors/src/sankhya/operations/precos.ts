import { z } from 'zod'
import type { OperationId } from '../../kernel/operation.ts'
import { defineOperation } from '../../kernel/operation.ts'
import { restAnswer } from '../answers.ts'
import { firstProduto } from './produtos.ts'
import { Code, get, maybe, Page } from './shared.ts'

const Precos = z.object({
  precos: z.array(
    z.object({
      codigoProduto: Code,
      codigoTabela: maybe(Code),
      codigoLocalEstoque: maybe(Code),
      controle: maybe(z.string()),
      unidade: maybe(z.string()),
      valor: z.number(),
    }),
  ),
  temMaisRegistros: z.boolean(),
})

export const precosDoProduto = defineOperation({
  id: 'precosDoProduto',
  class: 'read' as const,
  subject: 'precos',
  idempotent: true,
  summary:
    'Lista os preços de um produto em cada tabela de preço (até 50 por página); a página se chama `pagina` e começa em 1.',
  label: 'Preços de um produto',
  input: z.object({ codigoProduto: Code, pagina: Page(1) }),
  output: Precos,
  probe: (earlier) => {
    const first = firstProduto(earlier)
    return first ? { codigoProduto: first.codigoProduto, pagina: 1 } : null
  },
  request: ({ codigoProduto, pagina }) => get(`/v1/precos/produto/${codigoProduto}`, { pagina }),
  answer: (answer) => restAnswer(answer, Precos),
})

/** The first price table an earlier probe read. */
function firstTabela(earlier: ReadonlyMap<OperationId, unknown>) {
  const rows = Precos.safeParse(earlier.get(precosDoProduto.id)).data?.precos ?? []
  return rows.find((row) => row.codigoTabela !== null)?.codigoTabela
}

export const precosDaTabela = defineOperation({
  id: 'precosDaTabela',
  class: 'read' as const,
  subject: 'precos',
  idempotent: true,
  summary:
    'Lista os preços de uma tabela de preço, de todos os produtos (até 50 por página); a página se chama `pagina` e começa em 1.',
  label: 'Preços de uma tabela',
  input: z.object({ codigoTabela: Code, pagina: Page(1) }),
  output: Precos,
  probe: (earlier) => {
    const codigoTabela = firstTabela(earlier)
    return codigoTabela === undefined ? null : { codigoTabela, pagina: 1 }
  },
  request: ({ codigoTabela, pagina }) => get(`/v1/precos/tabela/${codigoTabela}`, { pagina }),
  answer: (answer) => restAnswer(answer, Precos),
})

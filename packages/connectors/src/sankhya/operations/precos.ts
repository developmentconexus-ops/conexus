import { z } from 'zod'
import { defineOperation, get } from '../../kernel/operation.ts'
import { rows } from '../answers.ts'
import { produtos } from './produtos.ts'
import { Code, firstCode, Page } from './shared.ts'

export const precosDoProduto = defineOperation({
  id: 'precosDoProduto',
  class: 'read' as const,
  subject: 'precos',
  idempotent: true,
  summary:
    'Lista os preços de um produto em cada tabela de preço; a página se chama `pagina` e começa em 1.',
  label: 'Preços de um produto',
  input: z.object({ codigoProduto: Code, pagina: Page(1) }),
  ...rows({ list: 'produtos' }),
  from: [produtos.id],
  probe: (earlier) => {
    const codigoProduto = firstCode(earlier, produtos.id, 'codigoProduto')
    return codigoProduto === undefined ? null : { codigoProduto, pagina: 1 }
  },
  request: ({ codigoProduto, pagina }) => get(`/v1/precos/produto/${codigoProduto}`, { pagina }),
})

export const precosDaTabela = defineOperation({
  id: 'precosDaTabela',
  class: 'read' as const,
  subject: 'precos',
  idempotent: true,
  summary:
    'Lista os preços de uma tabela de preço, de todos os produtos; a página se chama `pagina` e começa em 1.',
  label: 'Preços de uma tabela',
  input: z.object({ codigoTabela: Code, pagina: Page(1) }),
  ...rows({ list: 'produtos' }),
  from: [precosDoProduto.id],
  probe: (earlier) => {
    const codigoTabela = firstCode(earlier, precosDoProduto.id, 'codigoTabela')
    return codigoTabela === undefined ? null : { codigoTabela, pagina: 1 }
  },
  request: ({ codigoTabela, pagina }) => get(`/v1/precos/tabela/${codigoTabela}`, { pagina }),
})

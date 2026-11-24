import { z } from 'zod'
import { get } from '../../kernel/operation.ts'
import { produtos } from './produtos.ts'
import { Code, defineRoute, firstCode, Page } from './route.ts'

export const precosDoProduto = defineRoute({
  id: 'precosDoProduto',
  subject: 'precos',
  summary:
    'Lista os preços de um produto em cada tabela de preço; a página se chama `pagina` e começa em 1.',
  label: 'Preços de um produto',
  input: z.strictObject({ codigoProduto: Code, pagina: Page(1) }),
  rowsAt: 'produtos',
  from: [produtos.id],
  probe: (earlier) => {
    const codigoProduto = firstCode(earlier, produtos.id, 'codigoProduto')
    return codigoProduto === undefined ? null : { codigoProduto, pagina: 1 }
  },
  request: ({ codigoProduto, pagina }) => get(`/v1/precos/produto/${codigoProduto}`, { pagina }),
})

export const precosDaTabela = defineRoute({
  id: 'precosDaTabela',
  subject: 'precos',
  summary:
    'Lista os preços de uma tabela de preço, de todos os produtos; a página se chama `pagina` e começa em 1.',
  label: 'Preços de uma tabela',
  input: z.strictObject({ codigoTabela: Code, pagina: Page(1) }),
  rowsAt: 'produtos',
  from: [precosDoProduto.id],
  probe: (earlier) => {
    const codigoTabela = firstCode(earlier, precosDoProduto.id, 'codigoTabela')
    return codigoTabela === undefined ? null : { codigoTabela, pagina: 1 }
  },
  request: ({ codigoTabela, pagina }) => get(`/v1/precos/tabela/${codigoTabela}`, { pagina }),
})

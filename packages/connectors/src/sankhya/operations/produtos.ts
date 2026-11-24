import { get } from '../../kernel/operation.ts'
import { defineRoute, FirstPage } from './route.ts'

export const produtos = defineRoute({
  id: 'produtos',
  subject: 'produtos',
  summary:
    'Lista os produtos do Sankhya (código, nome, grupo, marca, NCM), uma página por chamada; a página começa em 0. Não filtra por nome, código nem grupo, só por página: para achar por nome, referência, código ou grupo, use `buscarProdutos`.',
  label: 'Produtos',
  input: FirstPage,
  rowsAt: 'produtos',
  probe: () => ({ page: 0 }),
  request: (input) => get('/v1/produtos', input),
})

export const gruposProduto = defineRoute({
  id: 'gruposProduto',
  subject: 'produtos',
  summary: 'Lista os grupos de produto (código, nome, grupo pai); a página começa em 0.',
  label: 'Grupos de produto',
  input: FirstPage,
  rowsAt: 'grupos',
  probe: () => ({ page: 0 }),
  request: (input) => get('/v1/grupos-produto', input),
})

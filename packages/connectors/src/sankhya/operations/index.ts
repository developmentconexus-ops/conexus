import { readsOf } from '../../kernel/definition.ts'
import { sankhyaDoor } from '../door.ts'
import { buscarParceiros, buscarProdutos, buscarVendedores } from './buscas.ts'
import { estoqueDosProdutos } from './buscas-estoque.ts'
import {
  centrosResultado,
  clientes,
  empresas,
  naturezas,
  tiposOperacao,
  vendedores,
} from './cadastros.ts'
import { estoque, estoqueDoProduto, locaisEstoque } from './estoque.ts'
import { contasAPagar, contasAReceber, tiposPagamento } from './financeiro.ts'
import { ordensCarga, transportadoras } from './logistica.ts'
import { precosDaTabela, precosDoProduto } from './precos.ts'
import { gruposProduto, produtos } from './produtos.ts'
import {
  devolucoes,
  lancarPedido,
  notaFiscal,
  notasCanceladas,
  notasFiscais,
  pedidos,
} from './vendas.ts'

/** The ready reads in the order the probes and Testar run them, subject by subject; `empresas` first, since the company reads take its code. */
const ready = readsOf({
  empresas,
  clientes,
  vendedores,
  tiposOperacao,
  naturezas,
  centrosResultado,
  buscarParceiros,
  buscarVendedores,
  produtos,
  gruposProduto,
  buscarProdutos,
  pedidos,
  notasFiscais,
  notaFiscal,
  devolucoes,
  notasCanceladas,
  estoque,
  estoqueDoProduto,
  locaisEstoque,
  estoqueDosProdutos,
  contasAReceber,
  contasAPagar,
  tiposPagamento,
  precosDoProduto,
  precosDaTabela,
  transportadoras,
  ordensCarga,
})

export const sankhyaOperations = Object.values(ready)

export const sankhyaWrites = [lancarPedido]

/** Every read by its id, the door's included: what an app's typed client is made of (`calls.ts`). */
export const sankhyaReads = readsOf({ ...sankhyaDoor, ...ready })

/** Each subject and its label, in the order of `ready`; `fiscal` and `contabil` group only tables of the copy (T.40). */
export const sankhyaSubjects = {
  cadastros: 'Cadastros',
  produtos: 'Produtos',
  vendas: 'Vendas',
  estoque: 'Estoque',
  financeiro: 'Financeiro',
  precos: 'Preços',
  logistica: 'Logística',
  fiscal: 'Fiscal',
  contabil: 'Contábil',
} as const

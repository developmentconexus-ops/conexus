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

/** The order the probes run in: `empresas` first, since seven probes read it (their `from`); each subject keeps the ready five before the rest. */
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

/** The ready reads, in that order: what the connector declares as its `operations`. */
export const sankhyaOperations = Object.values(ready)

/** The connector's writes: the list the Hub's write funnel reads; the reads above never include one. */
export const sankhyaWrites = [lancarPedido]

/** Every read of the connector by its id, the door's included: what an app's typed client is made of (`calls.ts`). */
export const sankhyaReads = readsOf({ ...sankhyaDoor, ...ready })

/** The subjects and their labels; each has a part of the skill. */
export const sankhyaSubjects = {
  cadastros: 'Cadastros',
  produtos: 'Produtos',
  vendas: 'Vendas',
  estoque: 'Estoque',
  financeiro: 'Financeiro',
  precos: 'Preços',
  logistica: 'Logística',
} as const

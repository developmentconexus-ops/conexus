import {
  centrosResultado,
  clientes,
  empresas,
  naturezas,
  tiposOperacao,
  vendedores,
} from './cadastros.ts'
import { estoque, locaisEstoque } from './estoque.ts'
import { contasAPagar, contasAReceber, tiposPagamento } from './financeiro.ts'
import { ordensCarga, transportadoras } from './logistica.ts'
import { precosDaTabela, precosDoProduto } from './precos.ts'
import { gruposProduto, produtos } from './produtos.ts'
import { devolucoes, notaFiscal, notasCanceladas, notasFiscais, pedidos } from './vendas.ts'

/** The order the probes run in: `empresas` first, since seven probes read it (their `from`); each subject keeps the ready five before the rest. */
export const sankhyaOperations = [
  empresas,
  clientes,
  vendedores,
  tiposOperacao,
  naturezas,
  centrosResultado,
  produtos,
  gruposProduto,
  pedidos,
  notasFiscais,
  notaFiscal,
  devolucoes,
  notasCanceladas,
  estoque,
  locaisEstoque,
  contasAReceber,
  contasAPagar,
  tiposPagamento,
  precosDoProduto,
  precosDaTabela,
  transportadoras,
  ordensCarga,
] as const

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

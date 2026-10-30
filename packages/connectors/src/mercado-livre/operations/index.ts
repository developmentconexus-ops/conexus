import { readsOf } from '../../kernel/definition.ts'
import { anuncios, anunciosDetalhe, descricao, estoque, qualidade } from './anuncios.ts'
import { conta } from './conta.ts'
import { envio, estoqueFull, prazoDoEnvio } from './envios.ts'
import { cobrancasDoPeriodo, notaFiscalDoPedido, periodosDeFaturamento } from './faturamento.ts'
import { mensagensDoPacote, mensagensNaoLidas } from './mensagens.ts'
import { maisVendidos, tarifaDeVenda, tendencias } from './mercado.ts'
import { visitas } from './metricas.ts'
import { perguntas, tempoDeResposta } from './perguntas.ts'
import { promocoes } from './promocoes.ts'
import { devolucao, reclamacao, reclamacoes } from './reclamacoes.ts'
import { pacote, pedido, pedidos } from './vendas.ts'

/** The order Testar calls them in: each read comes after the ones its probe reads (`from`), and `conta` first. */
const ready = readsOf({
  conta,
  anuncios,
  anunciosDetalhe,
  descricao,
  estoque,
  qualidade,
  pedidos,
  pedido,
  pacote,
  envio,
  prazoDoEnvio,
  estoqueFull,
  perguntas,
  tempoDeResposta,
  mensagensNaoLidas,
  mensagensDoPacote,
  reclamacoes,
  reclamacao,
  devolucao,
  promocoes,
  visitas,
  periodosDeFaturamento,
  cobrancasDoPeriodo,
  notaFiscalDoPedido,
  tendencias,
  maisVendidos,
  tarifaDeVenda,
})

/** The ready reads, in that order: what the connector declares as its `operations`. */
export const mercadoLivreOperations = Object.values(ready)

/** Every read of the connector by its id: what an app's typed client is made of (`calls.ts`). */
export const mercadoLivreReads = ready

/** The subjects and their labels, in the order Testar shows them. */
export const mercadoLivreSubjects = {
  conta: 'Conta',
  anuncios: 'Anúncios',
  vendas: 'Vendas',
  envios: 'Envios',
  perguntas: 'Perguntas',
  mensagens: 'Mensagens',
  reclamacoes: 'Reclamações',
  promocoes: 'Promoções',
  metricas: 'Métricas',
  faturamento: 'Faturamento',
  mercado: 'Mercado',
} as const

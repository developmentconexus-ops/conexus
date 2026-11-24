import { defineTables } from '../kernel/tables.ts'
import { contarMeses, descobrirTabelas, lerTabela } from './copy-reads.ts'
import type { Row } from './copy-tables-fiscal.ts'
import { changed, FISCAL_TABLES, FULL } from './copy-tables-fiscal.ts'

/** The columns a TABLE source declares nothing of: the dictionary gives them, less the ones the copy leaves out. */
const ALL = { kind: 'DISCOVERED', exclude: [] } as const

function declared(rows: readonly Row[]) {
  return rows.map(({ table, exclude, ...row }) => ({
    ...row,
    source: { kind: 'TABLE', table } as const,
    history: false,
    columns: exclude === undefined ? ALL : ({ kind: 'DISCOVERED', exclude } as const),
  }))
}

const CORE_TABLES: readonly Row[] = [
  {
    name: 'notas',
    label: 'Notas e pedidos',
    description:
      'Cabeçalho de toda nota e pedido do Sankhya: venda, compra, devolução e transferência. O tipo de cada uma vem em TIPMOV.',
    group: 'vendas',
    table: 'TGFCAB',
    key: ['NUNOTA'],
    mode: changed('DTALTER', false),
  },
  {
    name: 'notas_itens',
    label: 'Itens das notas',
    description: 'Cada item de cada nota e pedido: o produto, a quantidade e o valor.',
    group: 'vendas',
    table: 'TGFITE',
    key: ['NUNOTA', 'SEQUENCIA'],
    mode: changed('DTALTER', false),
  },
  {
    name: 'financeiro',
    label: 'Financeiro (a pagar e a receber)',
    description: 'Cada título a pagar e a receber, com o vencimento, o valor e a baixa.',
    group: 'financeiro',
    table: 'TGFFIN',
    key: ['NUFIN'],
    mode: changed('DTALTER', false),
  },
  {
    name: 'notas_origens',
    label: 'Origem das notas',
    description:
      'De que nota ou pedido cada item veio: o pedido de uma nota, a nota de uma devolução.',
    group: 'vendas',
    table: 'TGFVAR',
    key: ['NUNOTA', 'SEQUENCIA', 'NUNOTAORIG', 'SEQUENCIAORIG'],
    mode: FULL,
  },
  {
    name: 'precos',
    label: 'Preços por produto',
    description: 'O preço de cada produto em cada tabela de preço, por local e controle.',
    group: 'precos',
    table: 'TGFEXC',
    key: ['NUTAB', 'CODPROD', 'CODLOCAL', 'CONTROLE'],
    mode: changed('DHALTREG', true),
  },
  {
    name: 'parceiros',
    label: 'Parceiros (clientes e fornecedores)',
    description:
      'Todo cliente, fornecedor e transportadora da empresa, com o documento e o endereço.',
    group: 'cadastros',
    table: 'TGFPAR',
    key: ['CODPARC'],
    mode: changed('DTALTER', true),
  },
  {
    name: 'produtos',
    label: 'Produtos',
    description: 'Cada produto e serviço, com o grupo, a unidade e a marca.',
    group: 'produtos',
    table: 'TGFPRO',
    key: ['CODPROD'],
    mode: changed('DTALTER', true),
    exclude: ['IMAGEM'],
  },
  {
    name: 'vendedores',
    label: 'Vendedores e compradores',
    description: 'Cada vendedor e comprador da empresa.',
    group: 'cadastros',
    table: 'TGFVEN',
    key: ['CODVEND'],
    mode: changed('DTALTER', true),
  },
  {
    name: 'estoque',
    label: 'Estoque por local',
    description: 'O saldo de cada produto por empresa, local, controle e parceiro.',
    group: 'estoque',
    table: 'TGFEST',
    key: ['CODEMP', 'CODPROD', 'CODLOCAL', 'CONTROLE', 'CODPARC', 'TIPO'],
    mode: FULL,
  },
  {
    name: 'precos_tabelas',
    label: 'Tabelas de preço',
    description: 'As tabelas de preço e a vigência de cada uma.',
    group: 'precos',
    table: 'TGFTAB',
    key: ['NUTAB'],
    mode: changed('DTALTER', true),
  },
  {
    name: 'tipos_operacao',
    label: 'Tipos de operação (TOP)',
    description:
      'Cada tipo de operação e cada versão dele: o que faz de uma nota uma venda, uma compra ou uma devolução.',
    group: 'cadastros',
    table: 'TGFTOP',
    key: ['CODTIPOPER', 'DHALTER'],
    mode: FULL,
  },
  {
    name: 'tipos_negociacao',
    label: 'Tipos de negociação',
    description: 'Cada forma de negociação e cada versão dela: à vista, a prazo e as parcelas.',
    group: 'cadastros',
    table: 'TGFTPV',
    key: ['CODTIPVENDA', 'DHALTER'],
    mode: FULL,
  },
  {
    name: 'produtos_grupos',
    label: 'Grupos de produtos',
    description: 'Os grupos em que os produtos se organizam.',
    group: 'produtos',
    table: 'TGFGRU',
    key: ['CODGRUPOPROD'],
    mode: changed('DHALTER', true),
    exclude: ['IMAGEM'],
  },
  {
    name: 'empresas',
    label: 'Empresas',
    description: 'Cada empresa e filial do Sankhya.',
    group: 'cadastros',
    table: 'TSIEMP',
    key: ['CODEMP'],
    mode: changed('DHALTER', true),
    exclude: ['LOGOMARCA'],
  },
  {
    name: 'centros_resultado',
    label: 'Centros de resultado',
    description: 'Os centros de resultado a que as notas e os títulos se atribuem.',
    group: 'cadastros',
    table: 'TSICUS',
    key: ['CODCENCUS'],
    mode: FULL,
  },
  {
    name: 'naturezas',
    label: 'Naturezas financeiras',
    description: 'As naturezas em que o financeiro se classifica.',
    group: 'cadastros',
    table: 'TGFNAT',
    key: ['CODNAT'],
    mode: changed('DHALTER', true),
  },
  {
    name: 'locais_estoque',
    label: 'Locais de estoque',
    description: 'Os locais onde o estoque fica.',
    group: 'estoque',
    table: 'TGFLOC',
    key: ['CODLOCAL'],
    mode: FULL,
  },
  {
    name: 'unidades',
    label: 'Unidades',
    description: 'As unidades em que os produtos se medem.',
    group: 'produtos',
    table: 'TGFVOL',
    key: ['CODVOL'],
    mode: FULL,
  },
  {
    name: 'cidades',
    label: 'Cidades',
    description: 'As cidades dos endereços.',
    group: 'cadastros',
    table: 'TSICID',
    key: ['CODCID'],
    mode: changed('DTALTER', true),
  },
  {
    name: 'estados',
    label: 'Estados (UF)',
    description: 'Os estados dos endereços.',
    group: 'cadastros',
    table: 'TSIUFS',
    key: ['CODUF'],
    mode: changed('DHALTREG', true),
  },
]

/** The Sankhya's tables: 5,000 rows, the gateway's measured ceiling (0080), and 1 MiB, the stop rule of 0063. */
export const sankhyaTables = defineTables({
  declared: declared([...CORE_TABLES, ...FISCAL_TABLES]),
  page: { rows: 5000, bytes: 1_048_576 },
  discover: descobrirTabelas,
  months: contarMeses,
  readTable: lerTabela,
})

export function changed(column: string, registry: boolean) {
  return { kind: 'CHANGED', column, registry } as const
}

function window(column: string, reread: number) {
  return { kind: 'WINDOW', column, step: 'MONTH', reread } as const
}

export const FULL = { kind: 'FULL' } as const

export type Row = Readonly<{
  name: string
  label: string
  description: string
  group: string
  table: string
  key: readonly string[]
  mode: ReturnType<typeof changed> | ReturnType<typeof window> | typeof FULL
  exclude?: readonly string[]
  meanings?: Readonly<Record<string, 'NFE_XML'>>
}>

const EFD_KEY = ['CODEMP', 'DTREF', 'REGNIV1'] as const
const EFDC_KEY = [...EFD_KEY, 'CODEMPESTAB'] as const

function efd(
  name: string,
  table: string,
  register: string,
  what: string,
  key: readonly string[],
): Row {
  const book = name.startsWith('efd_fiscal') ? 'EFD Fiscal' : 'EFD Contribuições'
  return {
    name,
    label: `${book}: ${what} (${register})`,
    description: `O registro ${register} da ${book} que o Sankhya gerou, por empresa e mês de referência.`,
    group: 'fiscal',
    table,
    key,
    mode: FULL,
  }
}

/** The fiscal tables (P2's keys; the EFD registers whole) and the accounting ones (P5's window of `REFERENCIA`). */
export const FISCAL_TABLES: readonly Row[] = [
  {
    name: 'notas_impostos',
    label: 'Impostos das notas',
    description: 'Cada imposto de cada item das notas: a base, a alíquota e o valor.',
    group: 'fiscal',
    table: 'TGFDIN',
    key: ['NUNOTA', 'SEQUENCIA', 'CODIMP', 'CODINC'],
    mode: changed('DHALTER', false),
  },
  {
    name: 'efd_st_media_diaria',
    label: 'EFD: média diária do ICMS-ST',
    description:
      'A média diária do ICMS-ST por produto que o Sankhya apura, por empresa e mês de referência.',
    group: 'fiscal',
    table: 'TGFEFDVMRSTDIA',
    key: ['CODEMP', 'DTREF', 'CODPROD', 'TIPIMPOSTO', 'TIPMEDIA', 'DTMOV'],
    mode: window('DTREF', 2),
  },
  {
    name: 'estoque_contagens',
    label: 'Contagens de estoque (inventário)',
    description: 'Cada contagem de inventário: o produto, o local e a quantidade contada.',
    group: 'fiscal',
    table: 'TGFCTE',
    key: [
      'DTCONTAGEM',
      'CODEMP',
      'CODLOCAL',
      'CODPROD',
      'CONTROLE',
      'CODVOL',
      'CODPARC',
      'TIPO',
      'SEQUENCIA',
    ],
    mode: window('DTCONTAGEM', 2),
  },
  {
    name: 'livros_fiscais',
    label: 'Livro fiscal (ICMS e IPI)',
    description: 'O livro fiscal de entradas e saídas, com o ICMS e o IPI de cada nota.',
    group: 'fiscal',
    table: 'TGFLIV',
    key: ['NUNOTA', 'ORIGEM', 'SEQUENCIA', 'CODEMP'],
    mode: FULL,
  },
  {
    name: 'notas_nfe',
    label: 'Dados da NF-e',
    description:
      'O XML de cada NF-e e os dos eventos dela: a autorização, o cancelamento e a carta de correção.',
    group: 'fiscal',
    table: 'TGFNFE',
    key: ['NUNOTA'],
    mode: FULL,
    meanings: { XML: 'NFE_XML' },
  },
  {
    name: 'aliquotas_icms',
    label: 'Alíquotas de ICMS',
    description:
      'A alíquota de ICMS de cada estado de origem para cada estado de destino, com as restrições e a vigência.',
    group: 'fiscal',
    table: 'TGFICM',
    key: [
      'UFORIG',
      'UFDEST',
      'TIPRESTRICAO',
      'CODRESTRICAO',
      'TIPRESTRICAO2',
      'CODRESTRICAO2',
      'SEQUENCIA',
    ],
    mode: FULL,
  },
  {
    name: 'aliquotas_ipi',
    label: 'Alíquotas de IPI',
    description: 'Cada alíquota de IPI que os produtos usam.',
    group: 'fiscal',
    table: 'TGFIPI',
    key: ['CODIPI'],
    mode: FULL,
  },
  {
    name: 'cfops',
    label: 'CFOP (código fiscal de operação)',
    description: 'Cada código fiscal de operação e prestação que as notas usam.',
    group: 'fiscal',
    table: 'TGFCFO',
    key: ['CODCFO'],
    mode: FULL,
  },
  {
    name: 'apuracao_ajustes',
    label: 'Ajustes da apuração',
    description: 'Cada ajuste da apuração de impostos, por empresa, mês de referência e estado.',
    group: 'fiscal',
    table: 'TGFAJA',
    key: ['NUAJA'],
    mode: changed('DTALTER', true),
  },
  {
    name: 'estoque_contagens_serie',
    label: 'Contagens de estoque por série',
    description: 'Cada contagem de estoque de um produto por número de série, local e data.',
    group: 'fiscal',
    table: 'TGFCTS',
    key: ['DTCONTAGEM', 'TIPCONTAGEM', 'CODPROD', 'SERIE', 'CODEMP', 'CODLOCAL'],
    mode: FULL,
  },
  efd('efd_fiscal_participantes', 'TGFEFDF0150', '0150', 'participantes', [...EFD_KEY, 'CODPARC']),
  efd('efd_fiscal_produtos', 'TGFEFDF0200', '0200', 'produtos', [
    ...EFD_KEY,
    'CODPROD',
    'COD_ITEM',
  ]),
  efd('efd_fiscal_documentos', 'TGFEFDFC100', 'C100', 'documentos', [...EFD_KEY, 'CHAVE']),
  efd('efd_fiscal_documentos_itens', 'TGFEFDFC170', 'C170', 'itens dos documentos', [
    ...EFD_KEY,
    'CHAVE',
    'SEQUENCIA',
  ]),
  efd('efd_fiscal_st_entradas', 'TGFEFDFC180', 'C180', 'ICMS-ST das entradas', [
    ...EFD_KEY,
    'REGISTRO',
    'CHAVE',
    'SEQC170',
  ]),
  efd('efd_fiscal_st_saidas', 'TGFEFDFC185', 'C185', 'ICMS-ST das saídas', [
    ...EFD_KEY,
    'CHAVE',
    'SEQUENCIA',
  ]),
  efd('efd_fiscal_documentos_resumo', 'TGFEFDFC190', 'C190', 'resumo dos documentos', [
    ...EFD_KEY,
    'CHAVE',
    'SEQUENCIA',
  ]),
  efd('efd_fiscal_inventario', 'TGFEFDFH010', 'H010', 'inventário', [
    ...EFD_KEY,
    'DT_INV',
    'SEQUENCIA',
  ]),
  efd('efd_fiscal_inventario_st', 'TGFEFDFH030', 'H030', 'ICMS-ST do inventário', [
    ...EFD_KEY,
    'DT_INV',
    'SEQH010',
    'SEQUENCIA',
  ]),
  efd('efd_contrib_participantes', 'TGFEFDC0150', '0150', 'participantes', [
    ...EFDC_KEY,
    'CODPARC',
  ]),
  efd('efd_contrib_produtos', 'TGFEFDC0200', '0200', 'produtos', [
    ...EFDC_KEY,
    'CODPROD',
    'COD_ITEM',
  ]),
  efd('efd_contrib_documentos', 'TGFEFDCC100', 'C100', 'documentos', [...EFDC_KEY, 'CHAVE']),
  efd('efd_contrib_documentos_itens', 'TGFEFDCC170', 'C170', 'itens dos documentos', [
    ...EFDC_KEY,
    'CHAVE',
    'SEQUENCIA',
  ]),
  {
    name: 'lancamentos_contabeis',
    label: 'Lançamentos contábeis',
    description: 'Cada lançamento contábil, pelo mês contábil (REFERENCIA) em que entrou.',
    group: 'contabil',
    table: 'TCBLAN',
    key: ['CODEMP', 'REFERENCIA', 'NUMLOTE', 'NUMLANC', 'TIPLANC', 'SEQUENCIA'],
    mode: window('REFERENCIA', 3),
  },
  {
    name: 'saldos_contabeis',
    label: 'Saldos contábeis',
    description: 'O saldo de cada conta contábil por centro de resultado, projeto e mês contábil.',
    group: 'contabil',
    table: 'TCBSAL',
    key: ['CODEMP', 'CODCTACTB', 'CODCENCUS', 'CODPROJ', 'REFERENCIA'],
    mode: FULL,
  },
  {
    name: 'saldos_contabeis_empresa',
    label: 'Saldos contábeis por empresa',
    description:
      'O saldo de cada conta contábil por empresa de destino, centro de resultado, projeto e mês contábil.',
    group: 'contabil',
    table: 'TCBSALEMP',
    key: ['CODEMP', 'CODCTACTB', 'CODCENCUS', 'CODPROJ', 'REFERENCIA', 'CODEMPDEST'],
    mode: FULL,
  },
  {
    name: 'contabilizacao',
    label: 'Integração contábil',
    description: 'De que nota ou título veio cada lançamento contábil.',
    group: 'contabil',
    table: 'TCBINT',
    key: [
      'CODEMP',
      'REFERENCIA',
      'NUMLOTE',
      'NUMLANC',
      'TIPLANC',
      'SEQUENCIA',
      'ORIGEM',
      'NUNICO',
      'SEQNOTA',
    ],
    mode: FULL,
  },
  {
    name: 'plano_contas',
    label: 'Plano de contas',
    description: 'As contas contábeis e a hierarquia delas.',
    group: 'contabil',
    table: 'TCBPLA',
    key: ['CODCTACTB'],
    mode: FULL,
  },
]

import type { CopyColumnType, CopyModel } from '../kernel/copy.ts'
import { CopyDefinitionV1, CopyName } from '../kernel/copy.ts'

/*
 * The five templates, with the columns and types decision 0063 measured on a real Sankhya. No query
 * carries a date filter: the paged read adds the pass's dates. Which operation types count as a sale
 * is each company's rule (`skill/SKILL.md`); the templates take Sankhya's own sale movements.
 */

/** Sankhya's movements of a sale and of a sales order. */
const SALE = "TIPMOV IN ('V', 'P')"

type Columns = readonly (readonly [string, CopyColumnType])[]

const DESCRIBED: Readonly<Record<string, string>> = {
  CODPARC: 'Código do parceiro no Sankhya.',
  NOMEPARC: 'Nome do parceiro.',
  RAZAOSOCIAL: 'Razão social do parceiro.',
  TIPPESSOA: 'Tipo de pessoa: F física, J jurídica.',
  ATIVO: 'S quando o cadastro está ativo, N quando não.',
  CLIENTE: 'S quando o parceiro é cliente.',
  FORNECEDOR: 'S quando o parceiro é fornecedor.',
  DTALTER: 'Data e hora da última alteração do registro no Sankhya.',
  CODVEND: 'Código do vendedor no Sankhya.',
  APELIDO: 'Apelido do vendedor.',
  CODPROD: 'Código do produto no Sankhya.',
  DESCRPROD: 'Descrição do produto.',
  REFERENCIA: 'Referência do produto.',
  CODGRUPOPROD: 'Código do grupo do produto.',
  DESCRGRUPOPROD: 'Nome do grupo do produto.',
  CODVOL: 'Unidade de venda.',
  MARCA: 'Marca do produto.',
  NUNOTA: 'Número único da nota no Sankhya. É a chave da venda.',
  NUMNOTA: 'Número da nota fiscal.',
  CODEMP: 'Código da empresa (filial) da venda.',
  CODTIPOPER: 'Código do tipo de operação (TOP).',
  TIPMOV: 'Tipo de movimento: V venda, P pedido de venda.',
  DTNEG: 'Data da negociação.',
  VLRNOTA: 'Valor total da nota.',
  STATUSNOTA: 'Situação da nota no Sankhya.',
  SEQUENCIA: 'Sequência do item dentro da nota.',
  QTDNEG: 'Quantidade negociada do item.',
  VLRUNIT: 'Valor unitário do item.',
  VLRTOT: 'Valor total do item.',
}

function described(name: string): string {
  const text = DESCRIBED[name]
  if (text === undefined) throw new Error(`Sankhya column without description: ${name}`)
  return text
}

function model(
  id: string,
  label: string,
  definition: {
    description: string
    sql: string
    columns: Columns
    key: readonly string[]
    window?: { column: string; days: number }
    retired?: readonly string[]
  },
): CopyModel {
  return Object.freeze({
    id: CopyName.parse(id),
    label,
    definition: CopyDefinitionV1.parse({
      version: 1,
      description: definition.description,
      source: { kind: 'QUERY', sql: definition.sql },
      columns: definition.columns.map(([name, type]) => ({
        ...{ name, type },
        description: described(name),
      })),
      key: definition.key,
      changedSince: { column: 'DTALTER' },
      ...(definition.window && { window: definition.window }),
    }),
    ...(definition.retired && { retired: definition.retired }),
  })
}

const SALES_WINDOW = { column: 'DTNEG', days: 30 }

export const sankhyaCopyModels: readonly CopyModel[] = [
  model('clientes', 'Clientes', {
    description:
      'Parceiros do Sankhya: clientes e fornecedores, um por linha, com nome, tipo de pessoa e se está ativo.',
    sql: 'SELECT CODPARC, NOMEPARC, RAZAOSOCIAL, TIPPESSOA, ATIVO, CLIENTE, FORNECEDOR, DTALTER FROM TGFPAR',
    columns: [
      ['CODPARC', 'bigint'],
      ['NOMEPARC', 'text'],
      ['RAZAOSOCIAL', 'text'],
      ['TIPPESSOA', 'text'],
      ['ATIVO', 'text'],
      ['CLIENTE', 'text'],
      ['FORNECEDOR', 'text'],
      ['DTALTER', 'timestamp'],
    ],
    key: ['CODPARC'],
    retired: ['CGC_CPF'],
  }),
  model('vendedores', 'Vendedores', {
    description: 'Vendedores do Sankhya, um por linha, com o apelido e se está ativo.',
    sql: 'SELECT CODVEND, APELIDO, ATIVO, DTALTER FROM TGFVEN',
    columns: [
      ['CODVEND', 'bigint'],
      ['APELIDO', 'text'],
      ['ATIVO', 'text'],
      ['DTALTER', 'timestamp'],
    ],
    key: ['CODVEND'],
  }),
  model('produtos', 'Produtos', {
    description:
      'Produtos do Sankhya, um por linha, com descrição, referência, grupo, unidade e marca.',
    sql: 'SELECT P.CODPROD, P.DESCRPROD, P.REFERENCIA, P.CODGRUPOPROD, G.DESCRGRUPOPROD, P.CODVOL, P.MARCA, P.ATIVO, P.DTALTER FROM TGFPRO P LEFT JOIN TGFGRU G ON G.CODGRUPOPROD = P.CODGRUPOPROD',
    columns: [
      ['CODPROD', 'bigint'],
      ['DESCRPROD', 'text'],
      ['REFERENCIA', 'text'],
      ['CODGRUPOPROD', 'bigint'],
      ['DESCRGRUPOPROD', 'text'],
      ['CODVOL', 'text'],
      ['MARCA', 'text'],
      ['ATIVO', 'text'],
      ['DTALTER', 'timestamp'],
    ],
    key: ['CODPROD'],
  }),
  model('vendas', 'Vendas', {
    description:
      'Cabeçalho de cada venda e pedido de venda do Sankhya: data, cliente, vendedor, valor e situação. Uma linha por nota.',
    sql: `SELECT NUNOTA, NUMNOTA, CODEMP, CODTIPOPER, TIPMOV, DTNEG, CODPARC, CODVEND, VLRNOTA, STATUSNOTA, DTALTER FROM TGFCAB WHERE ${SALE}`,
    columns: [
      ['NUNOTA', 'bigint'],
      ['NUMNOTA', 'bigint'],
      ['CODEMP', 'bigint'],
      ['CODTIPOPER', 'bigint'],
      ['TIPMOV', 'text'],
      ['DTNEG', 'date'],
      ['CODPARC', 'bigint'],
      ['CODVEND', 'bigint'],
      ['VLRNOTA', 'numeric'],
      ['STATUSNOTA', 'text'],
      ['DTALTER', 'timestamp'],
    ],
    key: ['NUNOTA'],
    window: SALES_WINDOW,
  }),
  // The item's own DTALTER may be null (decision 0063): the header's says when the sale changed.
  model('itens_venda', 'Itens de venda', {
    description:
      'Itens de cada venda e pedido de venda do Sankhya: produto, quantidade, valor unitário e total. Uma linha por item.',
    sql: `SELECT I.NUNOTA, I.SEQUENCIA, I.CODPROD, I.QTDNEG, I.VLRUNIT, I.VLRTOT, I.CODVOL, C.DTNEG, C.DTALTER FROM TGFITE I JOIN TGFCAB C ON C.NUNOTA = I.NUNOTA WHERE C.${SALE}`,
    columns: [
      ['NUNOTA', 'bigint'],
      ['SEQUENCIA', 'bigint'],
      ['CODPROD', 'bigint'],
      ['QTDNEG', 'numeric'],
      ['VLRUNIT', 'numeric'],
      ['VLRTOT', 'numeric'],
      ['CODVOL', 'text'],
      ['DTNEG', 'date'],
      ['DTALTER', 'timestamp'],
    ],
    key: ['NUNOTA', 'SEQUENCIA'],
    window: SALES_WINDOW,
  }),
]

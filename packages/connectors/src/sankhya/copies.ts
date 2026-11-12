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

function model(
  id: string,
  label: string,
  definition: {
    sql: string
    columns: Columns
    key: readonly string[]
    window?: { column: string; days: number }
  },
): CopyModel {
  return Object.freeze({
    id: CopyName.parse(id),
    label,
    definition: CopyDefinitionV1.parse({
      version: 1,
      source: { kind: 'QUERY', sql: definition.sql },
      columns: definition.columns.map(([name, type]) => ({ name, type })),
      key: definition.key,
      changedSince: { column: 'DTALTER' },
      ...(definition.window && { window: definition.window }),
    }),
  })
}

const SALES_WINDOW = { column: 'DTNEG', days: 30 }

export const sankhyaCopyModels: readonly CopyModel[] = [
  model('clientes', 'Clientes', {
    sql: 'SELECT CODPARC, NOMEPARC, RAZAOSOCIAL, CGC_CPF, TIPPESSOA, ATIVO, CLIENTE, FORNECEDOR, DTALTER FROM TGFPAR',
    columns: [
      ['CODPARC', 'bigint'],
      ['NOMEPARC', 'text'],
      ['RAZAOSOCIAL', 'text'],
      ['CGC_CPF', 'text'],
      ['TIPPESSOA', 'text'],
      ['ATIVO', 'text'],
      ['CLIENTE', 'text'],
      ['FORNECEDOR', 'text'],
      ['DTALTER', 'timestamp'],
    ],
    key: ['CODPARC'],
  }),
  model('vendedores', 'Vendedores', {
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

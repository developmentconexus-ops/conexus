import { DatabaseSync } from 'node:sqlite'

// Invented values only (S40): a bakery, its sellers, customers and products, September and October 2026.

type Seller = { codvend: number; apelido: string }
type Item = { codprod: number; qtdneg: number; vlrunit: number; vlrtot: number }
type Note = {
  nunota: number
  codemp: number
  dtneg: string
  codvend: number
  codparc: number
  itens: Item[]
}

/** One company's sales as Sankhya keeps them: the notes with their items, the sellers, customers and products. */
export type SalesSet = {
  codemp: number
  vendedores: readonly Seller[]
  parceiros: readonly { codparc: number; nomeparc: string }[]
  produtos: readonly { codprod: number; descrprod: string; preco: number }[]
  notas: readonly Note[]
}

const PARCEIROS = [
  { codparc: 100, nomeparc: 'MERCADO BOA VISTA' },
  { codparc: 101, nomeparc: 'LANCHONETE DO ZE' },
  { codparc: 102, nomeparc: 'CAFE DA PRACA' },
  { codparc: 103, nomeparc: 'CONSUMIDOR FINAL' },
]
const PRODUTOS = [
  { codprod: 10, descrprod: 'PAO FRANCES KG', preco: 14.9 },
  { codprod: 11, descrprod: 'BOLO DE FUBA', preco: 32 },
  { codprod: 12, descrprod: 'PAO DE QUEIJO KG', preco: 39.9 },
  { codprod: 13, descrprod: 'CAFE 250G', preco: 18.5 },
]
const DAYS = [
  ...Array.from({ length: 30 }, (_, at) => `2026-09-${String(at + 1).padStart(2, '0')}`),
  ...Array.from({ length: 31 }, (_, at) => `2026-10-${String(at + 1).padStart(2, '0')}`),
]

function cents(value: number): number {
  return Math.round(value * 100) / 100
}

/** One note a day per seller, two items each, the quantities from a fixed rule so every run is the same. */
function salesOf(codemp: number, vendedores: readonly Seller[], weight: number): SalesSet {
  const notas = DAYS.flatMap((dtneg, day) =>
    vendedores.map((seller, at) => {
      const itens = [0, 2].map((offset) => {
        const product = PRODUTOS[(day + at + offset) % PRODUTOS.length] ?? PRODUTOS[0]
        if (product === undefined) throw new Error('The double has no product.')
        const qtdneg = 1 + ((day * 7 + seller.codvend * 3 + product.codprod) % (9 + weight))
        return {
          codprod: product.codprod,
          qtdneg,
          vlrunit: product.preco,
          vlrtot: cents(qtdneg * product.preco),
        }
      })
      return {
        nunota: codemp * 100_000 + day * 10 + at,
        codemp,
        dtneg,
        codvend: seller.codvend,
        codparc: PARCEIROS[(day + at) % PARCEIROS.length]?.codparc ?? 103,
        itens,
      }
    }),
  )
  return { codemp, vendedores, parceiros: PARCEIROS, produtos: PRODUTOS, notas }
}

/** Padaria Sol's Matriz. */
export const PADARIA_SOL_MATRIZ = salesOf(
  1,
  [
    { codvend: 1, apelido: 'RITA' },
    { codvend: 2, apelido: 'JOAO' },
    { codvend: 3, apelido: 'MARCIA' },
  ],
  0,
)

/** Padaria Sol's Filial: other sellers, other totals. */
export const PADARIA_SOL_FILIAL = salesOf(
  2,
  [
    { codvend: 4, apelido: 'PEDRO' },
    { codvend: 5, apelido: 'LUCIA' },
  ],
  3,
)

/** What a seller sold in a month (`YYYY-MM`), computed from the set itself: the truth a test checks an answer against. */
export function soldBy(set: SalesSet, month: string): Map<string, number> {
  const sold = new Map<string, number>()
  for (const nota of set.notas) {
    if (!nota.dtneg.startsWith(month)) continue
    const seller = set.vendedores.find((each) => each.codvend === nota.codvend)?.apelido ?? ''
    const total = nota.itens.reduce((sum, item) => sum + item.vlrtot, 0)
    sold.set(seller, cents((sold.get(seller) ?? 0) + total))
  }
  return sold
}

function tablesOf(database: DatabaseSync, set: SalesSet): void {
  database.exec(`
    CREATE TABLE TGFVEN (CODVEND INTEGER PRIMARY KEY, APELIDO TEXT);
    CREATE TABLE TGFPAR (CODPARC INTEGER PRIMARY KEY, NOMEPARC TEXT);
    CREATE TABLE TGFPRO (CODPROD INTEGER PRIMARY KEY, DESCRPROD TEXT);
    CREATE TABLE TGFCAB (NUNOTA INTEGER PRIMARY KEY, CODEMP INTEGER, DTNEG TEXT, CODVEND INTEGER,
      CODPARC INTEGER, TIPMOV TEXT, VLRNOTA REAL);
    CREATE TABLE TGFITE (NUNOTA INTEGER, SEQUENCIA INTEGER, CODPROD INTEGER, QTDNEG REAL,
      VLRUNIT REAL, VLRTOT REAL);
  `)
  function insert(sql: string, rows: readonly (readonly (string | number)[])[]) {
    const statement = database.prepare(sql)
    for (const row of rows) statement.run(...row)
  }
  insert(
    'INSERT INTO TGFVEN VALUES (?, ?)',
    set.vendedores.map((each) => [each.codvend, each.apelido]),
  )
  insert(
    'INSERT INTO TGFPAR VALUES (?, ?)',
    set.parceiros.map((each) => [each.codparc, each.nomeparc]),
  )
  insert(
    'INSERT INTO TGFPRO VALUES (?, ?)',
    set.produtos.map((each) => [each.codprod, each.descrprod]),
  )
  insert(
    'INSERT INTO TGFCAB VALUES (?, ?, ?, ?, ?, ?, ?)',
    set.notas.map((nota) => [
      nota.nunota,
      nota.codemp,
      nota.dtneg,
      nota.codvend,
      nota.codparc,
      'V',
      cents(nota.itens.reduce((sum, item) => sum + item.vlrtot, 0)),
    ]),
  )
  insert(
    'INSERT INTO TGFITE VALUES (?, ?, ?, ?, ?, ?)',
    set.notas.flatMap((nota) =>
      nota.itens.map((item, at) => [
        nota.nunota,
        at + 1,
        item.codprod,
        item.qtdneg,
        item.vlrunit,
        item.vlrtot,
      ]),
    ),
  )
}

/** The answer of a read query: the columns by name and the rows in their order. */
export type QueryAnswer = { fields: string[]; rows: unknown[][] }

/**
 * The set's tables in an in-memory SQLite, read by the SQL a read sends (`DbExplorerSP.executeQuery`):
 * the answer, or `undefined` when SQLite refuses the query, as Sankhya refuses one it cannot run.
 */
export function salesDatabase(set: SalesSet): (sql: string) => QueryAnswer | undefined {
  const database = new DatabaseSync(':memory:')
  tablesOf(database, set)
  return (sql) => {
    let statement: ReturnType<DatabaseSync['prepare']>
    try {
      statement = database.prepare(sql)
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ERR_SQLITE_ERROR') {
        return undefined
      }
      throw error
    }
    statement.setReturnArrays(true)
    const fields = statement.columns().map((column) => column.name)
    return { fields, rows: statement.all().map((row) => [...Object.values(row)]) }
  }
}

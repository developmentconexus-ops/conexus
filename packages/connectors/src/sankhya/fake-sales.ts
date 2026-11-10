import { DatabaseSync } from 'node:sqlite'
import { inserter, registerOn } from './fake-register.ts'

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

/** When the registers last changed, in the double: before every note's day. */
const REGISTER_CHANGED = '2026-08-20 09:15:00'

/** When a note last changed: the evening of its day, except every tenth day of September, changed again on 20 October. */
export function changedOn(dtneg: string): string {
  return dtneg.startsWith('2026-09') && dtneg.endsWith('0')
    ? '2026-10-20 11:00:00'
    : `${dtneg} 18:30:00`
}

function tablesOf(database: DatabaseSync, set: SalesSet): void {
  database.exec(`
    CREATE TABLE TGFVEN (CODVEND INTEGER PRIMARY KEY, APELIDO TEXT, ATIVO TEXT DEFAULT 'S',
      DTALTER DATE DEFAULT '${REGISTER_CHANGED}');
    CREATE TABLE TGFPAR (CODPARC INTEGER PRIMARY KEY, NOMEPARC TEXT, RAZAOSOCIAL TEXT, CGC_CPF TEXT,
      TIPPESSOA TEXT DEFAULT 'J', ATIVO TEXT DEFAULT 'S', CLIENTE TEXT DEFAULT 'S', FORNECEDOR TEXT DEFAULT 'N',
      DTALTER DATE DEFAULT '${REGISTER_CHANGED}');
    CREATE TABLE TGFPRO (CODPROD INTEGER PRIMARY KEY, DESCRPROD TEXT, REFERENCIA TEXT, CODGRUPOPROD INTEGER,
      CODVOL TEXT DEFAULT 'UN', MARCA TEXT, ATIVO TEXT DEFAULT 'S', DTALTER DATE DEFAULT '${REGISTER_CHANGED}');
    CREATE TABLE TGFCAB (NUNOTA INTEGER PRIMARY KEY, CODEMP INTEGER, DTNEG DATE, CODVEND INTEGER,
      CODPARC INTEGER, TIPMOV TEXT, VLRNOTA REAL, NUMNOTA INTEGER, CODTIPOPER INTEGER DEFAULT 3200,
      STATUSNOTA TEXT DEFAULT 'L', DTALTER DATE);
    CREATE TABLE TGFITE (NUNOTA INTEGER, SEQUENCIA INTEGER, CODPROD INTEGER, QTDNEG REAL,
      VLRUNIT REAL, VLRTOT REAL, CODVOL TEXT DEFAULT 'UN');
  `)
  const insert = inserter(database)
  insert(
    'INSERT INTO TGFVEN (CODVEND, APELIDO) VALUES (?, ?)',
    set.vendedores.map((each) => [each.codvend, each.apelido]),
  )
  insert(
    'INSERT INTO TGFPAR (CODPARC, NOMEPARC, RAZAOSOCIAL) VALUES (?, ?, ?)',
    set.parceiros.map((each) => [each.codparc, each.nomeparc, each.nomeparc]),
  )
  insert(
    'INSERT INTO TGFPRO (CODPROD, DESCRPROD) VALUES (?, ?)',
    set.produtos.map((each) => [each.codprod, each.descrprod]),
  )
  insert(
    'INSERT INTO TGFCAB (NUNOTA, CODEMP, DTNEG, CODVEND, CODPARC, TIPMOV, VLRNOTA, NUMNOTA, DTALTER) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    set.notas.map((nota) => [
      nota.nunota,
      nota.codemp,
      nota.dtneg,
      nota.codvend,
      nota.codparc,
      'V',
      cents(nota.itens.reduce((sum, item) => sum + item.vlrtot, 0)),
      nota.nunota % 100_000,
      changedOn(nota.dtneg),
    ]),
  )
  insert(
    'INSERT INTO TGFITE (NUNOTA, SEQUENCIA, CODPROD, QTDNEG, VLRUNIT, VLRTOT) VALUES (?, ?, ?, ?, ?, ?)',
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

/** SQLite has no `OFFSET 0 ROWS FETCH NEXT n ROWS ONLY` (what both Oracle 12c and SQL Server take), so the double runs the same page as `LIMIT n`. */
function withLimit(sql: string): string {
  return sql.replace(/ OFFSET 0 ROWS FETCH NEXT (\d+) ROWS ONLY$/, ' LIMIT $1')
}

/** A `DATE` column as the DbExplorer answers it, `DDMMYYYY HH24:MI:SS` (decision 0063): the double keeps `YYYY-MM-DD[ HH:MM:SS]`. */
function asSankhyaDate(value: unknown): unknown {
  const [, year, month, day, time] =
    /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}:\d{2}:\d{2}))?$/.exec(String(value)) ?? []
  return year === undefined ? value : `${day}${month}${year} ${time ?? '00:00:00'}`
}

/** The answer of a read query: the columns by name and the rows in their order. */
export type QueryAnswer = { fields: string[]; rows: unknown[][] }

/**
 * The set's tables in an in-memory SQLite, read by the SQL a read sends (`DbExplorerSP.executeQuery`):
 * the answer, or `undefined` when SQLite refuses the query, as Sankhya refuses one it cannot run.
 */
export function salesDatabase(set: SalesSet): (sql: string) => QueryAnswer | undefined {
  const database = new DatabaseSync(':memory:')
  // Oracle's and SQL Server's `TRANSLATE`, which SQLite lacks: each letter of `from` becomes the one of `to` at its place.
  database.function('TRANSLATE', (text, from, to) => {
    const pairs = [...String(from)].map((letter, at) => [letter, [...String(to)][at] ?? ''])
    return [...String(text)]
      .map((letter) => pairs.find(([of]) => of === letter)?.[1] ?? letter)
      .join('')
  })
  // Oracle's `UPPER` folds every letter and its `LIKE` heeds case; SQLite's `UPPER` folds only ASCII and its `LIKE` ignores ASCII case.
  database.function('UPPER', { deterministic: true }, (text) =>
    text === null ? null : String(text).toUpperCase(),
  )
  // Oracle's `TO_DATE` in the one form the paged read writes (`YYYY-MM-DD`): the day, as the double keeps dates.
  database.function('TO_DATE', { deterministic: true }, (text, format) => {
    if (format !== 'YYYY-MM-DD' || !/^\d{4}-\d{2}-\d{2}$/.test(String(text)))
      throw new Error('The double reads only TO_DATE(day, YYYY-MM-DD).')
    return String(text)
  })
  database.exec('PRAGMA case_sensitive_like = ON')
  tablesOf(database, set)
  registerOn(database)
  return (sql) => {
    let statement: ReturnType<DatabaseSync['prepare']>
    try {
      statement = database.prepare(withLimit(sql))
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ERR_SQLITE_ERROR') {
        return undefined
      }
      throw error
    }
    statement.setReturnArrays(true)
    const columns = statement.columns()
    const fields = columns.map((column) => column.name)
    const dated = columns.map((column) => column.type === 'DATE')
    return {
      fields,
      rows: statement
        .all()
        .map((row) =>
          Object.values(row).map((cell, at) =>
            dated[at] && cell !== null ? asSankhyaDate(cell) : cell,
          ),
        ),
    }
  }
}

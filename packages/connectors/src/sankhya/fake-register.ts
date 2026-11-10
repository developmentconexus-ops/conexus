import type { DatabaseSync } from 'node:sqlite'

// Invented values only (S40): the registers the searches read in the double, beside the sales of `fake-sales.ts`.

type Partner = {
  codparc: number
  nomeparc: string
  razaosocial: string
  cgc: string
  tippessoa: 'F' | 'J'
  ativo: 'S' | 'N'
  cliente: 'S' | 'N'
  fornecedor: 'S' | 'N'
}

function partner(codparc: number, nomeparc: string, more: Partial<Partner> = {}): Partner {
  return {
    ...{ codparc, nomeparc, razaosocial: nomeparc, cgc: '', tippessoa: 'J' },
    ...{ ativo: 'S', cliente: 'S', fornecedor: 'N' },
    ...more,
  }
}

/** The names the searches are tried on: accents, a legal name in mixed case, an apostrophe, a `%`, a `_`, a supplier, an inactive one, and a long run after them to page through. */
const PARCEIROS_EXTRAS: readonly Partner[] = [
  partner(200, 'PADARIA SÃO JOSÉ', { cgc: '99999999000101' }),
  partner(201, 'SAO PAULO BEBIDAS LTDA', { cgc: '99999999000202', fornecedor: 'S', cliente: 'N' }),
  partner(202, 'MARIA APARECIDA DA SILVA', { cgc: '11122233344', tippessoa: 'F' }),
  partner(203, "D'AGUA CLARA DISTRIBUIDORA", { cgc: '99999999000303', fornecedor: 'S' }),
  partner(204, 'FAZENDA 100% LEITE', { fornecedor: 'S', cliente: 'N' }),
  partner(205, 'LOJA_UM COMERCIO', { ativo: 'N' }),
  partner(206, 'JOÃO DA SILVA ME', { tippessoa: 'F', razaosocial: 'João da Silva Comércio ME' }),
  ...Array.from({ length: 45 }, (_, at) =>
    partner(300 + at, `ARMAZEM NORTE ${String(at + 1).padStart(3, '0')}`),
  ),
]

type Product = {
  codprod: number
  descrprod: string
  referencia: string
  grupo: number
  ativo: 'S' | 'N'
}

/** The product groups. */
const GRUPOS = [
  { codgrupoprod: 1, descrgrupoprod: 'PADARIA' },
  { codgrupoprod: 2, descrgrupoprod: 'MERCEARIA' },
  { codgrupoprod: 3, descrgrupoprod: 'BEBIDAS' },
] as const

const PRODUTOS_EXTRAS: readonly Product[] = [
  {
    codprod: 200,
    descrprod: 'PÃO DE QUEIJO CONGELADO 1KG',
    referencia: 'PQ-001',
    grupo: 1,
    ativo: 'S',
  },
  { codprod: 201, descrprod: 'AÇÚCAR REFINADO 1KG', referencia: 'AC-001', grupo: 2, ativo: 'S' },
  { codprod: 202, descrprod: 'CAFÉ TORRADO 500G', referencia: 'CF-500', grupo: 2, ativo: 'S' },
  { codprod: 203, descrprod: 'SUCO DE LARANJA 1L', referencia: 'SU-100', grupo: 3, ativo: 'N' },
  ...Array.from(
    { length: 30 },
    (_, at): Product => ({
      codprod: 400 + at,
      descrprod: `BISCOITO TESTE ${String(at + 1).padStart(3, '0')}`,
      referencia: `BT-${String(at + 1).padStart(3, '0')}`,
      grupo: 2,
      ativo: 'S',
    }),
  ),
]

/** The sellers besides the ones the sales set has. */
const VENDEDORES_EXTRAS = [
  { codvend: 20, apelido: 'ZÉ DA FILIAL', ativo: 'S' },
  { codvend: 21, apelido: 'ANA LÚCIA', ativo: 'S' },
  { codvend: 22, apelido: 'ROBERTO', ativo: 'N' },
] as const

/** A stock line: product, company, place, control, kind (`P` own, `T` of a third party), the third party, balance and reserved. */
type Stock = readonly [number, number, number, string, string, number, number, number]

const ESTOQUE: readonly Stock[] = [
  [10, 1, 1, '', 'P', 0, 40, 5],
  [10, 1, 2, '', 'P', 0, 8, 0],
  [11, 1, 1, 'L1', 'P', 0, 12.5, 2.5],
  [11, 2, 1, '', 'P', 0, 3, 0],
  [12, 1, 1, '', 'T', 201, 7, 0],
  [12, 1, 1, '', 'P', 0, 0, 0],
  [200, 1, 1, '', 'P', 0, 25, 4],
  [201, 1, 1, '', 'P', 0, 60, 10],
]

/** The way the double puts rows in a table: one prepared statement, each row run through it. */
export function inserter(database: DatabaseSync) {
  return (sql: string, rows: readonly (readonly (string | number)[])[]) => {
    const statement = database.prepare(sql)
    for (const row of rows) statement.run(...row)
  }
}

/** The columns the searches read, on top of the sales tables, and the rows above. */
export function registerOn(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE TGFGRU (CODGRUPOPROD INTEGER PRIMARY KEY, DESCRGRUPOPROD TEXT);
    CREATE TABLE TGFEST (CODPROD INTEGER, CODEMP INTEGER, CODLOCAL INTEGER, CONTROLE TEXT, TIPO TEXT,
      CODPARC INTEGER, ESTOQUE REAL, RESERVADO REAL);
  `)
  const insert = inserter(database)
  insert(
    'INSERT INTO TGFGRU VALUES (?, ?)',
    GRUPOS.map((each) => [each.codgrupoprod, each.descrgrupoprod]),
  )
  insert(
    'INSERT INTO TGFPAR (CODPARC, NOMEPARC, RAZAOSOCIAL, CGC_CPF, TIPPESSOA, ATIVO, CLIENTE, FORNECEDOR) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    PARCEIROS_EXTRAS.map((each) => [
      ...[each.codparc, each.nomeparc, each.razaosocial, each.cgc],
      ...[each.tippessoa, each.ativo, each.cliente, each.fornecedor],
    ]),
  )
  insert(
    'INSERT INTO TGFPRO (CODPROD, DESCRPROD, REFERENCIA, CODGRUPOPROD, CODVOL, MARCA, ATIVO) VALUES (?, ?, ?, ?, ?, ?, ?)',
    PRODUTOS_EXTRAS.map((each) => [
      ...[each.codprod, each.descrprod, each.referencia, each.grupo],
      ...['UN', 'MARCA TESTE', each.ativo],
    ]),
  )
  insert(
    'INSERT INTO TGFVEN (CODVEND, APELIDO, ATIVO) VALUES (?, ?, ?)',
    VENDEDORES_EXTRAS.map((each) => [each.codvend, each.apelido, each.ativo]),
  )
  insert('INSERT INTO TGFEST VALUES (?, ?, ?, ?, ?, ?, ?, ?)', ESTOQUE)
}

import type { DatabaseSync } from 'node:sqlite'

/** The dictionary of the double, with invented rows that match the tables of `fake-sales.ts`. */
const TABLES = ['TGFCAB', 'TGFITE', 'TGFPAR', 'TGFPRO', 'TGFVEN', 'AD_METAS']

/** `NUCAMPO`, table, field, label, type and whether the company created it. */
const FIELDS: readonly (readonly [number, string, string, string, string, string])[] = [
  [1, 'TGFCAB', 'NUNOTA', 'Número único', 'I', 'N'],
  [2, 'TGFCAB', 'TIPMOV', 'Tipo do movimento', 'S', 'N'],
  [3, 'TGFCAB', 'STATUSNOTA', 'Status da nota', 'S', 'N'],
  [4, 'TGFCAB', 'AD_CANAL', 'Canal de venda', 'I', 'S'],
  [5, 'TGFPAR', 'NOMEPARC', 'Nome do parceiro', 'S', 'N'],
  [6, 'TGFPRO', 'DESCRPROD', 'Descrição do produto', 'S', 'N'],
  [7, 'AD_METAS', 'META', 'Meta do mês', 'F', 'S'],
]

/** What each value of a coded field means, by `NUCAMPO`. */
const OPTIONS: readonly (readonly [number, string, string])[] = [
  [2, 'V', 'Venda'],
  [2, 'P', 'Pedido'],
  [2, 'C', 'Compra'],
  [3, 'L', 'Liberada'],
  [3, 'P', 'Pendente'],
  [4, '1', 'Loja'],
  [4, '2', 'Site'],
]

export function dictionaryOf(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE TDDTAB (NOMETAB TEXT PRIMARY KEY);
    CREATE TABLE TDDCAM (NUCAMPO INTEGER PRIMARY KEY, NOMETAB TEXT, NOMECAMPO TEXT, DESCRCAMPO TEXT,
      TIPCAMPO TEXT, ADICIONAL TEXT DEFAULT 'N');
    CREATE TABLE TDDOPC (NUCAMPO INTEGER, VALOR TEXT, OPCAO TEXT);
  `)
  const tab = database.prepare('INSERT INTO TDDTAB (NOMETAB) VALUES (?)')
  for (const name of TABLES) tab.run(name)
  const cam = database.prepare('INSERT INTO TDDCAM VALUES (?, ?, ?, ?, ?, ?)')
  for (const row of FIELDS) cam.run(...row)
  const opc = database.prepare('INSERT INTO TDDOPC VALUES (?, ?, ?)')
  for (const row of OPTIONS) opc.run(...row)
}

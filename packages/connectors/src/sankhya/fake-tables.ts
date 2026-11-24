import type { DatabaseSync } from 'node:sqlite'
import { EMPRESAS } from './fake-data.ts'
import { inserter } from './fake-register.ts'

const OWNER = 'CONEXUS'

/** TGFCAB as P3 measured it: 449 columns besides a CLOB, some of them the company's own (`AD_`). */
export const WIDE_COLUMNS = 450
const CUSTOM_COLUMNS = 10

/** The XML of one note past a whole page of bytes (PS2: one note reached 356,901 characters). */
export const LARGE_XML_BYTES = 1_048_576 + 4_096

/** A column whose dictionary type the kit's map does not know. */
export const UNKNOWN_TYPE_COLUMN = 'CAMPO429'

/** A physical column the installation's dictionary does not list, as a real TSIEMP has DHALTER (L.2). */
export const OUTSIDE_DICTIONARY = { table: 'TSIEMP', column: 'DHALTER' } as const

/** The months the window table has rows in, two of them out of the calendar (A0D). */
export const WINDOW_MONTHS = ['0208-12', '2026-08', '2026-09', '2026-10', '2026-11', '2109-07']

/** What the test routes change between two reads (criterion 16): a note, a NF-e's events, a new column. */
export type CopyTables = Readonly<{
  note(nunota: number, action: 'ALTERAR' | 'CRIAR' | 'APAGAR', at?: string): boolean
  nfe(nunota: number): boolean
  addColumn(): string
}>

const CHANGED_BY_TEST = '2026-11-20 10:00:00'

const DESCRIPTIONS: Readonly<Record<string, string>> = {
  TGFCAB: 'Cabeçalho da Nota',
  TGFITE: 'Itens da Nota',
  TGFPAR: 'Parceiros',
  TGFPRO: 'Produtos',
  TGFVEN: 'Vendedores',
  TGFEFDVMRSTDIA: 'EFD Valor Médio ICMS ST Diário',
  TGFNFE: 'Arquivos XML de NFe',
  TSIEMP: 'Empresas',
}

const DAY_COLUMNS = new Set(['DTNEG', 'DTREF', 'DTMOV'])

/** TDDCAM.TIPCAMPO from the double's declared type: a day or a day with the hour, a number, a CLOB, a BLOB, a text. */
function tipcampo(name: string, declared: string): string {
  if (name === UNKNOWN_TYPE_COLUMN) return 'X'
  if (declared === 'INTEGER') return 'I'
  if (declared === 'REAL' || declared === 'DECIMAL_TEXT') return 'F'
  if (declared === 'DATE') return DAY_COLUMNS.has(name) ? 'D' : 'H'
  if (declared === 'CLOB') return 'C'
  if (declared === 'BLOB') return 'B'
  return 'S'
}

function wideColumns(decimal: string): readonly (readonly [string, string, string])[] {
  const types = ['TEXT', 'INTEGER', decimal, 'DATE'] as const
  const plain = Array.from({ length: WIDE_COLUMNS - 11 - CUSTOM_COLUMNS }, (_, at) => {
    const name = `CAMPO${String(at + 1).padStart(3, '0')}`
    const type = types[at % types.length] ?? 'TEXT'
    const value =
      type === 'TEXT'
        ? `'texto ' || NUNOTA`
        : type === 'INTEGER'
          ? `NUNOTA % ${at + 2}`
          : type === 'DATE'
            ? 'DTALTER'
            : `'${at}.25'`
    return [name, type, value] as const
  })
  const custom = Array.from({ length: CUSTOM_COLUMNS }, (_, at) => {
    const name = `AD_CAMPO${String(at + 1).padStart(2, '0')}`
    return [name, 'TEXT', `'da empresa ' || NUNOTA`] as const
  })
  return [...plain, ...custom]
}

function windowRows(): (string | number)[][] {
  return WINDOW_MONTHS.flatMap((month, at) =>
    [1, 2].map((codprod) => [
      1,
      `${month}-01`,
      codprod,
      'ST',
      'D',
      `${month}-15`,
      `${at}.${codprod}0`,
    ]),
  )
}

function xmlOf(nunota: number, bytes: number): string {
  const head = `<nfeProc><NFe><infNFe Id="NFe${nunota}">`
  const tail = '</infNFe></NFe></nfeProc>'
  return `${head}${'x'.repeat(Math.max(0, bytes - head.length - tail.length))}${tail}`
}

function create(database: DatabaseSync, decimal: string): void {
  const wide = wideColumns(decimal)
  for (const [name, type] of wide) database.exec(`ALTER TABLE TGFCAB ADD COLUMN ${name} ${type}`)
  database.exec(
    `UPDATE TGFCAB SET ${wide.map(([name, , value]) => `${name} = ${value}`).join(', ')}`,
  )
  database.exec(`
    ALTER TABLE TGFITE ADD COLUMN DTALTER DATE;
    UPDATE TGFITE SET DTALTER = (SELECT DTALTER FROM TGFCAB WHERE TGFCAB.NUNOTA = TGFITE.NUNOTA);
    UPDATE TGFITE SET DTALTER = NULL
      WHERE NUNOTA = (SELECT MIN(NUNOTA) FROM TGFITE) AND SEQUENCIA = 1;
    ALTER TABLE TGFPRO ADD COLUMN IMAGEM BLOB;
    CREATE TABLE TGFEFDVMRSTDIA (CODEMP INTEGER, DTREF DATE, CODPROD INTEGER, TIPIMPOSTO TEXT,
      TIPMEDIA TEXT, DTMOV DATE, VLRMEDIA ${decimal},
      PRIMARY KEY (CODEMP, DTREF, CODPROD, TIPIMPOSTO, TIPMEDIA, DTMOV));
    CREATE TABLE TGFNFE (NUNOTA INTEGER PRIMARY KEY, CHAVENFE TEXT, XML CLOB, XMLCANC CLOB);
    CREATE TABLE TSIEMP (CODEMP INTEGER PRIMARY KEY, NOMEFANTASIA TEXT, RAZAOSOCIAL TEXT,
      DHALTER DATE, LOGOMARCA BLOB);
  `)
  database
    .prepare('UPDATE TGFPRO SET IMAGEM = ? WHERE CODPROD = 10')
    .run(Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0, 255))
  const insert = inserter(database)
  insert(
    'INSERT INTO TSIEMP (CODEMP, NOMEFANTASIA, RAZAOSOCIAL, DHALTER) VALUES (?, ?, ?, ?)',
    EMPRESAS.map((empresa, at) => [
      empresa.codigoEmpresa,
      empresa.nomeFantasia,
      empresa.razaoSocial,
      `2026-11-1${at} 08:30:00`,
    ]),
  )
  insert('INSERT INTO TGFEFDVMRSTDIA VALUES (?, ?, ?, ?, ?, ?, ?)', windowRows())
  const notes = database.prepare('SELECT NUNOTA FROM TGFCAB ORDER BY NUNOTA LIMIT 3').all()
  insert(
    'INSERT INTO TGFNFE (NUNOTA, CHAVENFE, XML) VALUES (?, ?, ?)',
    notes.map(({ NUNOTA }, at) => [
      Number(NUNOTA),
      `3526${String(NUNOTA).padStart(40, '0')}`,
      xmlOf(Number(NUNOTA), at === 1 ? LARGE_XML_BYTES : 2_000),
    ]),
  )
}

/** The dictionary of the tables above: TDDTAB, TDDCAM (with a calculated field the join leaves out) and Oracle's ALL_TAB_COLUMNS. */
function dictionary(database: DatabaseSync): (table: string) => void {
  database.function('SYS_CONTEXT', (_namespace, _parameter) => OWNER)
  database.exec(`
    CREATE TABLE TDDTAB (NOMETAB TEXT PRIMARY KEY, DESCRTAB TEXT, ADICIONAL TEXT);
    CREATE TABLE TDDCAM (NUCAMPO INTEGER PRIMARY KEY, NOMETAB TEXT, NOMECAMPO TEXT, DESCRCAMPO TEXT,
      TIPCAMPO TEXT, CALCULADO TEXT, ADICIONAL TEXT);
    CREATE VIEW ALL_TAB_COLUMNS AS
      SELECT '${OWNER}' AS OWNER, m.name AS TABLE_NAME, p.name AS COLUMN_NAME, p.cid + 1 AS COLUMN_ID,
        CASE p.type WHEN 'INTEGER' THEN 'NUMBER' WHEN 'REAL' THEN 'NUMBER' WHEN 'DECIMAL_TEXT' THEN 'NUMBER'
          WHEN 'DATE' THEN 'DATE' WHEN 'CLOB' THEN 'CLOB' WHEN 'BLOB' THEN 'BLOB' ELSE 'VARCHAR2' END AS DATA_TYPE
      FROM sqlite_master m, pragma_table_info(m.name) p WHERE m.type = 'table';
  `)
  const field = database.prepare(
    'INSERT INTO TDDCAM (NOMETAB, NOMECAMPO, DESCRCAMPO, TIPCAMPO, CALCULADO, ADICIONAL) VALUES (?, ?, ?, ?, ?, ?)',
  )
  return (table) => {
    const columns = database
      .prepare(`SELECT name, type FROM pragma_table_info('${table}')`)
      .all()
      .map(({ name, type }) => [String(name), String(type)] as const)
    for (const [name, type] of columns) {
      const known = database
        .prepare('SELECT 1 FROM TDDCAM WHERE NOMETAB = ? AND NOMECAMPO = ?')
        .get(table, name)
      const outside = table === OUTSIDE_DICTIONARY.table && name === OUTSIDE_DICTIONARY.column
      if (known !== undefined || outside) continue
      const custom = name.startsWith('AD_') ? 'S' : 'N'
      field.run(table, name, `Campo ${name.toLowerCase()}`, tipcampo(name, type), 'N', custom)
    }
  }
}

/** The copy's tables on the double's database, described in its dictionary, and the changes the test routes make. */
export function copyTablesOn(database: DatabaseSync, decimal: string): CopyTables {
  create(database, decimal)
  const describe = dictionary(database)
  for (const [table, description] of Object.entries(DESCRIPTIONS)) {
    database.prepare('INSERT INTO TDDTAB VALUES (?, ?, ?)').run(table, description, 'N')
    describe(table)
  }
  database
    .prepare(
      "INSERT INTO TDDCAM (NOMETAB, NOMECAMPO, DESCRCAMPO, TIPCAMPO, CALCULADO, ADICIONAL) VALUES ('TGFCAB', 'VLRLIQCALC', 'Valor líquido', 'F', 'S', 'N')",
    )
    .run()
  let added = 0
  return {
    note(nunota, action, at = CHANGED_BY_TEST) {
      const done =
        action === 'APAGAR'
          ? database.prepare('DELETE FROM TGFCAB WHERE NUNOTA = ?').run(nunota)
          : action === 'ALTERAR'
            ? database
                .prepare("UPDATE TGFCAB SET VLRNOTA = '1.00', DTALTER = ? WHERE NUNOTA = ?")
                .run(at, nunota)
            : database
                .prepare(
                  "INSERT OR IGNORE INTO TGFCAB (NUNOTA, CODEMP, DTNEG, CODVEND, CODPARC, TIPMOV, VLRNOTA, NUMNOTA, DTALTER) VALUES (?, 1, '2026-11-20', 1, 100, 'V', '10.00', ?, ?)",
                )
                .run(nunota, nunota % 100_000, at)
      return done.changes > 0
    },
    nfe(nunota) {
      const done = database
        .prepare('UPDATE TGFNFE SET XMLCANC = ? WHERE NUNOTA = ?')
        .run(`<procEventoNFe><evento>cancelamento ${nunota}</evento></procEventoNFe>`, nunota)
      return done.changes > 0
    },
    addColumn() {
      added += 1
      const name = `AD_NOVA${String(added).padStart(2, '0')}`
      database.exec(`ALTER TABLE TGFCAB ADD COLUMN ${name} TEXT`)
      describe('TGFCAB')
      return name
    },
  }
}

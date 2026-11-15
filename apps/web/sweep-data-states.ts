import type { RowCount } from '@conexus/hub-api'
import { AppTableName, listAppRows, listAppTables, listCopyRows } from '@conexus/hub-api'
import { failure, ok } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import type { State } from './sweep-kit.ts'
import { waitFor } from './sweep-kit.ts'
import { OWNER, PROJECT_ID, projectsPage } from './sweep-replies.ts'

const PROJECT = `/api/companies/${COMPANY.id}/projects/${PROJECT_ID}`
const PAGE = `/companies/${COMPANY.id}/projects/${PROJECT_ID}/data`

const LISTED = [
  { schema: 'APP', name: 'anotacoes', rows: { kind: 'EXACT', rows: 37 } },
  { schema: 'APP', name: 'clientes', rows: { kind: 'EXACT', rows: 1284 } },
  { schema: 'APP', name: 'metas', rows: { kind: 'EXACT', rows: 0 } },
  {
    schema: 'APP',
    name: 'pedidos_com_um_nome_muito_comprido_para_a_lista',
    rows: { kind: 'OVER' },
  },
  { schema: 'APP', name: 'relatorios', rows: { kind: 'UNKNOWN' } },
] as const
const COPIED = [
  { schema: 'COPY', name: 'vendas', rows: { kind: 'EXACT', rows: 183 } },
  { schema: 'COPY', name: 'clientes', rows: { kind: 'OVER' } },
  {
    schema: 'COPY',
    name: 'estoque_da_matriz_com_um_nome_muito_comprido',
    rows: { kind: 'UNKNOWN' },
  },
] as const
type Listed = readonly { schema: 'APP' | 'COPY'; name: string; rows: RowCount }[]

function tablesOf(listed: Listed) {
  return listed.map((table) => ({ ...table, name: AppTableName.parse(table.name) }))
}
const TABLES = ok(listAppTables, { kind: 'TABLES', tables: tablesOf(LISTED) })
const WITH_COPIES = ok(listAppTables, { kind: 'TABLES', tables: tablesOf([...LISTED, ...COPIED]) })
const COPIES_ONLY = ok(listAppTables, { kind: 'TABLES', tables: tablesOf(COPIED) })
const NO_COPY_ROWS = ok(listCopyRows, { columns: [], rows: [], next: { kind: 'END' } })
const NO_ROWS = ok(listAppRows, { columns: [], rows: [], next: { kind: 'END' } })

/** The owner's Projeto with its tables listed, and what one table's rows answer; the list's links preload the others. */
function dataPage(table: string, rows: ReturnType<typeof ok> | ReturnType<typeof failure>) {
  return {
    ...OWNER,
    ...projectsPage(COMPANY.id),
    [`GET ${PROJECT}/tables`]: TABLES,
    ...Object.fromEntries(
      LISTED.map(({ name }) => [`GET ${PROJECT}/tables/${name}/rows`, NO_ROWS]),
    ),
    [`GET ${PROJECT}/tables/${table}/rows`]: rows,
  }
}

/** The same page with copies released: the list of both, and what one copy's rows answer; the list's links preload the others. */
function copiesPage(
  list: ReturnType<typeof ok>,
  copy: string,
  rows: ReturnType<typeof ok> | ReturnType<typeof failure>,
) {
  return {
    ...OWNER,
    ...projectsPage(COMPANY.id),
    [`GET ${PROJECT}/tables`]: list,
    ...Object.fromEntries(
      COPIED.map(({ name }) => [`GET ${PROJECT}/copy-tables/${name}/rows`, NO_COPY_ROWS]),
    ),
    ...Object.fromEntries(
      LISTED.map(({ name }) => [`GET ${PROJECT}/tables/${name}/rows`, NO_ROWS]),
    ),
    [`GET ${PROJECT}/copy-tables/${copy}/rows`]: rows,
  }
}

const COLUMNS = Array.from({ length: 12 }, (_, at) => ({ name: `coluna_${at + 1}` }))
const WIDE_ROW = COLUMNS.map((_, at) =>
  at % 4 === 3
    ? null
    : {
        text: 'um texto bem comprido que a célula corta em cem letras, sem quebrar a linha da tabela e sem rolar a página'.slice(
          0,
          100,
        ),
        cut: at % 4 === 1,
      },
)

// The screens capacity 1 brings: the Projeto's Dados, its list of tables and one table's rows.
export const DATA_STATES: State[] = [
  {
    name: 'Dados, a lista de tabelas',
    path: PAGE,
    replies: dataPage(
      'clientes',
      ok(listAppRows, { columns: [], rows: [], next: { kind: 'END' } }),
    ),
    settle: (p) => waitFor(p, 'mais de 10.000'),
  },
  {
    name: 'Dados, uma tabela larga com texto cortado e células sem valor',
    path: `${PAGE}/clientes`,
    replies: dataPage(
      'clientes',
      ok(listAppRows, { columns: COLUMNS, rows: [WIDE_ROW, WIDE_ROW], next: { kind: 'END' } }),
    ),
    settle: (p) => waitFor(p, 'coluna_12'),
  },
  {
    name: 'Dados, uma tabela vazia',
    path: `${PAGE}/metas`,
    replies: dataPage(
      'metas',
      ok(listAppRows, {
        columns: [{ name: 'id' }, { name: 'nota' }],
        rows: [],
        next: { kind: 'END' },
      }),
    ),
    settle: (p) => waitFor(p, 'Esta tabela ainda não tem linhas.'),
  },
  {
    name: 'Dados, uma tabela com colunas demais',
    path: `${PAGE}/clientes`,
    replies: dataPage('clientes', failure('APP_TABLE_TOO_WIDE')),
    settle: (p) => waitFor(p, 'Esta tabela tem colunas demais para mostrar aqui.'),
  },
  {
    name: 'Dados, o banco do app que não respondeu',
    path: `${PAGE}/clientes`,
    replies: dataPage('clientes', failure('APP_DATABASE_UNAVAILABLE')),
    settle: (p) => waitFor(p, 'O banco do app não respondeu.'),
  },
  {
    name: 'Dados, as tabelas do app e as cópias liberadas',
    path: PAGE,
    replies: copiesPage(WITH_COPIES, 'vendas', NO_COPY_ROWS),
    settle: (p) => waitFor(p, 'Cópias liberadas'),
  },
  {
    name: 'Dados, as linhas de uma cópia',
    path: `${PAGE}/copies/vendas`,
    replies: copiesPage(
      WITH_COPIES,
      'vendas',
      ok(listCopyRows, { columns: COLUMNS, rows: [WIDE_ROW, WIDE_ROW], next: { kind: 'END' } }),
    ),
    settle: (p) => waitFor(p, 'coluna_12'),
  },
  {
    name: 'Dados, uma cópia sem linhas ainda',
    path: `${PAGE}/copies/vendas`,
    replies: copiesPage(
      WITH_COPIES,
      'vendas',
      ok(listCopyRows, {
        columns: [{ name: 'codigo' }, { name: 'valor' }],
        rows: [],
        next: { kind: 'END' },
      }),
    ),
    settle: (p) => waitFor(p, 'Esta cópia ainda não tem linhas.'),
  },
  {
    name: 'Dados, um Projeto com cópia liberada e app sem tabelas',
    path: PAGE,
    replies: copiesPage(COPIES_ONLY, 'vendas', NO_COPY_ROWS),
    settle: (p) => waitFor(p, 'O app ainda não criou tabelas.'),
  },
  {
    name: 'Dados, uma cópia que não existe ou não foi liberada',
    path: `${PAGE}/copies/estoque`,
    replies: copiesPage(WITH_COPIES, 'estoque', failure('NOT_FOUND')),
    settle: (p) => waitFor(p, 'Não encontramos o que você procurou.'),
  },
]

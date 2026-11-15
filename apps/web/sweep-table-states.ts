import {
  AppTableName,
  listAppTables,
  listConnections,
  listCopyRuns,
  listProjects,
  sampleCopy,
} from '@conexus/hub-api'
import { failure, ok } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import type { RunIn } from './sweep-copies-states.ts'
import {
  CLIENTES,
  COMPANY_API,
  copiesPage,
  copyOf,
  DONE,
  LISTED,
  PAGE,
  RUNNING,
  SOURCE_DOWN,
  VENDAS,
} from './sweep-copies-states.ts'
import type { State } from './sweep-kit.ts'
import { waitFor } from './sweep-kit.ts'
import { PROJECT_ID } from './sweep-replies.ts'

const COLUMNED = copyOf(VENDAS, 'vendas', 'Vendas', {
  shown: {
    ...copyOf(VENDAS, 'vendas', 'Vendas', {}).shown,
    description: 'As notas de venda da Matriz',
    columns: [
      { name: 'NUNOTA', type: 'bigint', description: 'O número da nota', inactiveSince: null },
      { name: 'VLRNOTA', type: 'numeric', description: null, inactiveSince: null },
      {
        name: 'OBS',
        type: 'text',
        description: 'A observação',
        inactiveSince: '2026-11-10T08:00:00.000Z',
      },
    ],
  },
})

const WIDE_COLUMNS = [
  'NUNOTA',
  'CODPARC',
  'CODEMP',
  'DTNEG',
  'VLRNOTA',
  'CODVEND',
  'TIPMOV',
  'STATUSNOTA',
  'NUMNOTA',
  'DTALTER',
  'OBSERVACAO',
]

function columnedPage() {
  return {
    ...copiesPage([COLUMNED]),
    [`GET ${COMPANY_API}/copies/${VENDAS}/runs`]: ok(listCopyRuns, {
      copy: COLUMNED,
      runs: [DONE],
      next: { kind: 'END' },
    }),
  }
}

function detailPage(runs: RunIn[]) {
  return {
    ...copiesPage(LISTED),
    [`GET ${COMPANY_API}/copies/${VENDAS}/runs`]: ok(listCopyRuns, {
      copy: copyOf(VENDAS, 'vendas', 'Vendas', {}),
      runs,
      next: { kind: 'END' },
    }),
  }
}

const WITH_APP = {
  id: PROJECT_ID,
  name: 'Vendedores',
  createdAt: '2026-10-17T12:00:00.000Z',
  appVersion: 2,
  publishedVersion: 2,
}

function appsPage() {
  return {
    ...copiesPage(LISTED),
    [`GET /api/companies/${COMPANY.id}/projects`]: ok(listProjects, {
      projects: [WITH_APP],
      next: { kind: 'END' },
      databaseReady: true,
    }),
    [`GET /api/companies/${COMPANY.id}/projects/${PROJECT_ID}/tables`]: ok(listAppTables, {
      kind: 'TABLES',
      tables: [
        {
          schema: 'APP',
          name: AppTableName.parse('clientes'),
          rows: { kind: 'EXACT', rows: 1284 },
        },
        { schema: 'APP', name: AppTableName.parse('sobras'), rows: { kind: 'UNKNOWN' } },
      ],
    }),
  }
}

/** The layers and the empty states of Dados itself. */
export const LAYER_STATES: State[] = [
  {
    name: 'Dados, a camada Negócio vazia',
    path: `${PAGE}?layer=business`,
    replies: copiesPage(LISTED),
    settle: (p) => waitFor(p, 'Nenhum conceito aprovado ainda'),
  },
  {
    name: 'Dados, a camada Apps',
    path: `${PAGE}?layer=apps`,
    replies: appsPage(),
    settle: (p) => waitFor(p, 'Publicado · v2'),
  },
  {
    name: 'Dados, nenhum sistema ligado',
    path: PAGE,
    replies: {
      ...copiesPage([]),
      [`GET ${COMPANY_API}/connections`]: ok(listConnections, {
        connectors: [],
        connections: [],
        mayManage: true,
      }),
    },
    settle: (p) => waitFor(p, 'Nenhum sistema ligado ainda'),
  },
  {
    name: 'Dados, a busca sem resposta',
    path: `${PAGE}?q=zzz`,
    replies: copiesPage(LISTED),
    settle: (p) => waitFor(p, 'Nenhuma tabela com esse texto.'),
  },
]

/** The page of one table of Dados: its tabs, the notice of a column that stopped, and the failures. */
export const TABLE_STATES: State[] = [
  {
    name: 'A tabela, a consulta e as rodadas',
    path: `${PAGE}/${VENDAS}?tab=runs`,
    replies: detailPage([RUNNING, SOURCE_DOWN, DONE]),
    settle: (p) => waitFor(p, 'O sistema não respondeu.'),
  },
  {
    name: 'A tabela, sem rodada ainda',
    path: `${PAGE}/${VENDAS}?tab=runs`,
    replies: detailPage([]),
    settle: (p) => waitFor(p, 'A primeira rodada ainda não terminou.'),
  },
  {
    name: 'A tabela, as colunas com uma inativa',
    path: `${PAGE}/${VENDAS}?tab=columns`,
    replies: columnedPage(),
    settle: (p) => waitFor(p, 'Inativa desde 10/11'),
  },
  {
    name: 'A tabela, a visão geral',
    path: `${PAGE}/${VENDAS}`,
    replies: columnedPage(),
    settle: (p) => waitFor(p, 'As notas de venda da Matriz'),
  },
  {
    name: 'A tabela, a amostra',
    path: `${PAGE}/${VENDAS}?tab=sample`,
    replies: {
      ...columnedPage(),
      [`GET ${COMPANY_API}/copies/${VENDAS}/sample`]: ok(sampleCopy, {
        sample: {
          columns: ['NUNOTA', 'CODPARC'],
          rows: [1, 2, 3, 4, 5].map((n) => [n * 100, `P${n}`]),
          complete: false,
        },
      }),
    },
    settle: (p) => waitFor(p, 'A cópia tem mais linhas que estas cinco.'),
  },
  {
    name: 'A tabela, a amostra larga',
    path: `${PAGE}/${VENDAS}?tab=sample`,
    replies: {
      ...columnedPage(),
      [`GET ${COMPANY_API}/copies/${VENDAS}/sample`]: ok(sampleCopy, {
        sample: {
          columns: WIDE_COLUMNS,
          rows: [1, 2, 3, 4, 5].map((n) => WIDE_COLUMNS.map((name) => `${name.slice(0, 3)}-${n}`)),
          complete: true,
        },
      }),
    },
    settle: (p) => waitFor(p, 'Cinco linhas da cópia.'),
  },
  {
    name: 'Uma cópia que não existe',
    path: `${PAGE}/${CLIENTES.replace('2', '9')}`,
    replies: {
      ...copiesPage(LISTED),
      [`GET ${COMPANY_API}/copies/${CLIENTES.replace('2', '9')}/runs`]: failure('COPY_NOT_FOUND'),
    },
    settle: (p) => waitFor(p, 'Não encontramos o que você procurou.'),
  },
  {
    name: 'A tabela, a leitura das rodadas que falhou',
    path: `${PAGE}/${VENDAS}`,
    replies: {
      ...detailPage([]),
      [`GET ${COMPANY_API}/copies/${VENDAS}/runs`]: failure('DATABASE_UNAVAILABLE'),
    },
    settle: (p) => waitFor(p, 'O banco do Conexus não respondeu.'),
  },
]

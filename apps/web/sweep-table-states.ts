import {
  AppTableName,
  listAppTables,
  listConnections,
  listLakeTables,
  listProjects,
} from '@conexus/hub-api'
import { failure, ok } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import type { State } from './sweep-kit.ts'
import { waitFor } from './sweep-kit.ts'
import { MEMBER, OWNER, PROJECT_ID, projectsPage } from './sweep-replies.ts'

const COMPANY_API = `/api/companies/${COMPANY.id}`
const PAGE = `/companies/${COMPANY.id}/data`

const MATRIZ = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  connector: 'sankhya',
  name: 'Matriz',
  connectorVersion: '1',
  state: 'ACTIVE',
  linkedBy: null,
  linkedAt: '2026-11-01T12:00:00.000Z',
  testedAt: null,
  testedBy: null,
  account: null,
} as const

/** Dados of an owner whose company links the systems of `connections`. */
function dataPage(connections: (typeof MATRIZ)[]) {
  return {
    ...OWNER,
    ...projectsPage(COMPANY.id),
    [`GET ${COMPANY_API}/connections`]: ok(listConnections, {
      connectors: [],
      connections,
      mayManage: true,
    }),
    [`GET ${COMPANY_API}/lake-tables`]: ok(listLakeTables, []),
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
    ...dataPage([MATRIZ]),
    [`GET ${COMPANY_API}/projects`]: ok(listProjects, {
      projects: [WITH_APP],
      next: { kind: 'END' },
      databaseReady: true,
    }),
    [`GET ${COMPANY_API}/projects/${PROJECT_ID}/tables`]: ok(listAppTables, {
      kind: 'TABLES',
      tables: [
        { name: AppTableName.parse('clientes'), rows: { kind: 'EXACT', rows: 1284 } },
        { name: AppTableName.parse('sobras'), rows: { kind: 'UNKNOWN' } },
      ],
    }),
  }
}

/** The layers and the empty states of Dados. */
export const LAYER_STATES: State[] = [
  {
    name: 'Dados, a primeira vez: o sistema sem tabela copiada',
    path: PAGE,
    replies: dataPage([MATRIZ]),
    settle: (p) => waitFor(p, 'Nenhuma tabela copiada. Escolha o que copiar na página da ligação.'),
  },
  {
    name: 'Dados, a leitura que falhou',
    path: PAGE,
    replies: {
      ...dataPage([]),
      [`GET ${COMPANY_API}/connections`]: failure('DATABASE_UNAVAILABLE'),
    },
    settle: (p) => waitFor(p, 'Tentar de novo'),
  },
  {
    name: 'Dados, a camada Negócio vazia',
    path: `${PAGE}?layer=business`,
    replies: dataPage([MATRIZ]),
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
    replies: dataPage([]),
    settle: (p) => waitFor(p, 'Nenhum sistema ligado ainda'),
  },
  {
    name: 'Dados, o membro',
    path: PAGE,
    replies: { ...dataPage([MATRIZ]), ...MEMBER },
    settle: (p) => waitFor(p, 'Seu papel ainda não lê nenhuma tabela.'),
  },
]

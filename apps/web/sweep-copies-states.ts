import type { CopyRun, CopySummary } from '@conexus/hub-api'
import { listConnections, listCopies, listCopyReaders, listCopyRuns } from '@conexus/hub-api'
import type { z } from 'zod'
import { failure, ok } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import type { State } from './sweep-kit.ts'
import { waitFor } from './sweep-kit.ts'
import { OWNER, PROJECT_ID, projectsPage } from './sweep-replies.ts'

type CopyIn = z.input<typeof CopySummary>
export type RunIn = z.input<typeof CopyRun>

export const COMPANY_API = `/api/companies/${COMPANY.id}`
export const PAGE = `/companies/${COMPANY.id}/data`
export const VENDAS = '11111111-1111-4111-8111-111111111111'
export const CLIENTES = '22222222-2222-4222-8222-222222222222'
const PRODUTOS = '33333333-3333-4333-8333-333333333333'
const CONNECTION = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

export const DONE: RunIn = {
  id: '44444444-4444-4444-8444-444444444444',
  startedAt: '2026-11-02T10:00:00.000Z',
  endedAt: '2026-11-02T10:00:42.000Z',
  outcome: { kind: 'COMPLETE' },
  read: 118402,
  written: 118402,
  whole: false,
}
export const RUNNING: RunIn = {
  ...DONE,
  outcome: { kind: 'RUNNING' },
  endedAt: null,
  read: 9871,
  written: 9871,
} as const
export const SOURCE_DOWN: RunIn = {
  ...DONE,
  outcome: { kind: 'ERROR', code: 'COPY_SOURCE_UNREACHABLE', system: null },
  read: 500,
  written: 500,
} as const

export const SOURCE_REFUSED: RunIn = {
  ...DONE,
  outcome: {
    kind: 'ERROR',
    code: 'COPY_SOURCE_REFUSED',
    system: { status: 200, code: '0', message: 'Serviço recusado' },
  },
  read: 500,
  written: 500,
} as const

export function copyOf(id: string, name: string, label: string, fields: Partial<CopyIn>): CopyIn {
  return {
    id,
    name,
    label,
    sources: [
      {
        connection: {
          id: CONNECTION,
          name: 'Matriz com um nome bem comprido da filial',
          connector: 'sankhya',
        },
      },
    ],
    interval: '30m',
    schedule: { kind: 'ACTIVE', nextRunAt: '2026-11-02T10:30:00.000Z' },
    run: DONE,
    rows: 118402,
    mode: { kind: 'WINDOW', days: 30 },
    projects: [{ id: PROJECT_ID, name: 'Vendedores' }],
    shown: {
      source: {
        kind: 'QUERY',
        query: `SELECT NUNOTA, CODPARC, VLRNOTA, DTNEG FROM TGFCAB WHERE TIPMOV = 'V' ORDER BY NUNOTA`,
      },
      key: ['NUNOTA'],
      changedSince: { column: 'DTALTER' },
      window: { column: 'DTNEG', days: 30 },
      description: null,
      columns: [],
    },
    ...fields,
  }
}

export const LISTED = [
  copyOf(VENDAS, 'vendas', 'Vendas', {}),
  copyOf(CLIENTES, 'clientes', 'Clientes', {
    run: RUNNING,
    rows: 9871,
    interval: '1h',
    projects: [],
  }),
  copyOf(PRODUTOS, 'produtos', 'Produtos', {
    schedule: { kind: 'PAUSED' },
    run: SOURCE_DOWN,
    interval: '6h',
  }),
  copyOf('55555555-5555-4555-8555-555555555555', 'itens_venda', 'Itens de venda', {
    schedule: { kind: 'MISSING' },
    interval: null,
    projects: [],
  }),
]

const CONNECTIONS = ok(listConnections, {
  connectors: [],
  connections: [
    {
      id: CONNECTION,
      connector: 'sankhya',
      name: 'Matriz',
      connectorVersion: '1',
      state: 'ACTIVE',
      linkedBy: null,
      linkedAt: '2026-11-01T12:00:00.000Z',
      testedAt: null,
      testedBy: null,
      account: null,
    },
  ],
  mayManage: true,
})

/** Who reads each copy: the owner and the administrator always, and the roles the people of the page hold. */
export function readersPage(copies: CopyIn[], marked: { role: string; label: string }[] = []) {
  const always = [
    { role: 'owner', label: 'Dono', members: 1 },
    { role: 'admin', label: 'Administrador', members: 1 },
  ]
  return {
    [`GET ${COMPANY_API}/copy-readers`]: ok(listCopyReaders, {
      readers: copies.map((one) => ({
        copyId: one.id,
        roles: [...always, ...marked.map((one) => ({ ...one, members: 2 }))],
      })),
    }),
  }
}

export function copiesList(copies: CopyIn[]) {
  return { [`GET ${COMPANY_API}/copies`]: ok(listCopies, { copies }) }
}

export function copiesPage(copies: CopyIn[]) {
  return {
    ...OWNER,
    ...projectsPage(COMPANY.id),
    ...readersPage(copies, [{ role: 'financeiro', label: 'Financeiro' }]),
    ...copiesList(copies),
    [`GET ${COMPANY_API}/connections`]: CONNECTIONS,
    // The list's links preload each copy's page.
    ...Object.fromEntries(
      copies.map((one) => [
        `GET ${COMPANY_API}/copies/${one.id}/runs`,
        ok(listCopyRuns, { copy: one, runs: [], next: { kind: 'END' } }),
      ]),
    ),
  }
}

export const COPIES_STATES: State[] = [
  {
    name: 'Dados, a lista com uma em dia, uma rodando, uma com erro e uma sem relógio',
    path: PAGE,
    replies: copiesPage(LISTED),
    settle: (p) => waitFor(p, 'Sem relógio'),
  },
  {
    name: 'Dados, a primeira vez',
    path: PAGE,
    replies: copiesPage([]),
    settle: (p) => waitFor(p, 'Nenhuma tabela copiada'),
  },
  {
    name: 'Dados, a leitura que falhou',
    path: PAGE,
    replies: {
      ...copiesPage([]),
      [`GET ${COMPANY_API}/copies`]: failure('DATABASE_UNAVAILABLE'),
    },
    settle: (p) => waitFor(p, 'Tentar de novo'),
  },
]

import type { CopyRun, CopySummary } from '@conexus/hub-api'
import { listConnections, listCopies, listCopyModels, listCopyRuns } from '@conexus/hub-api'
import type { z } from 'zod'
import { failure, ok } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import type { State } from './sweep-kit.ts'
import { waitFor } from './sweep-kit.ts'
import { MEMBER, OWNER, PROJECT_ID, projectsPage } from './sweep-replies.ts'

type CopyIn = z.input<typeof CopySummary>
type RunIn = z.input<typeof CopyRun>

const COMPANY_API = `/api/companies/${COMPANY.id}`
const PAGE = `/companies/${COMPANY.id}/copies`
const VENDAS = '11111111-1111-4111-8111-111111111111'
const CLIENTES = '22222222-2222-4222-8222-222222222222'
const PRODUTOS = '33333333-3333-4333-8333-333333333333'
const CONNECTION = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

const DONE: RunIn = {
  id: '44444444-4444-4444-8444-444444444444',
  startedAt: '2026-11-02T10:00:00.000Z',
  endedAt: '2026-11-02T10:00:42.000Z',
  outcome: { kind: 'COMPLETE' },
  read: 118402,
  written: 118402,
}
const RUNNING: RunIn = {
  ...DONE,
  outcome: { kind: 'RUNNING' },
  endedAt: null,
  read: 9871,
  written: 9871,
} as const
const SOURCE_DOWN: RunIn = {
  ...DONE,
  outcome: { kind: 'ERROR', code: 'COPY_SOURCE_UNREACHABLE' },
  read: 500,
  written: 500,
} as const

function copyOf(id: string, name: string, label: string, fields: Partial<CopyIn>): CopyIn {
  return {
    id,
    name,
    label,
    connection: {
      id: CONNECTION,
      name: 'Matriz com um nome bem comprido da filial',
      connector: 'sankhya',
    },
    interval: '30m',
    schedule: { kind: 'ACTIVE', nextRunAt: '2026-11-02T10:30:00.000Z' },
    run: DONE,
    rows: 118402,
    projects: [{ id: PROJECT_ID, name: 'Vendedores' }],
    shown: {
      query: `SELECT NUNOTA, CODPARC, VLRNOTA, DTNEG FROM TGFCAB WHERE TIPMOV = 'V' ORDER BY NUNOTA`,
      key: ['NUNOTA'],
      window: { column: 'DTNEG', days: 30 },
    },
    ...fields,
  }
}

const LISTED = [
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

const MODELS = ok(listCopyModels, {
  models: [
    { connector: 'sankhya', id: 'vendas', label: 'Vendas' },
    { connector: 'sankhya', id: 'clientes', label: 'Clientes' },
  ],
})
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

function copiesPage(copies: CopyIn[]) {
  return {
    ...OWNER,
    ...projectsPage(COMPANY.id),
    [`GET ${COMPANY_API}/copies`]: ok(listCopies, { copies }),
    [`GET ${COMPANY_API}/copy-models`]: MODELS,
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

/** The dialog of Ligar with a connection and a model chosen, then Ligar pressed: the Hub refuses with `replies`. */
function linkRefused(code: 'COPY_DATABASE_UNAVAILABLE' | 'COPY_EXISTS', sentence: string): State {
  return {
    name: `Ligar uma cópia, recusada: ${code}`,
    path: PAGE,
    replies: { ...copiesPage(LISTED), [`POST ${COMPANY_API}/copies`]: failure(code) },
    settle: async (p) => {
      await waitFor(p, 'Sem relógio')
      await p.getByRole('button', { name: 'Ligar uma cópia' }).click()
      for (const [field, option] of [
        ['Conexão', 'Matriz'],
        ['Modelo', 'Vendas'],
      ] as const) {
        await p.getByRole('combobox', { name: field }).click()
        await p.getByRole('option', { name: option }).click()
      }
      await p.getByRole('button', { name: 'Ligar', exact: true }).click()
      await waitFor(p, sentence)
    },
  }
}

// The screens capacity 2 brings: the company's Cópias, its dialog to turn one on, and one copy.
export const COPIES_STATES: State[] = [
  {
    name: 'Cópias, a lista com uma em dia, uma rodando, uma com erro e uma sem relógio',
    path: PAGE,
    replies: copiesPage(LISTED),
    settle: (p) => waitFor(p, 'Sem relógio'),
  },
  {
    name: 'Cópias, a primeira vez',
    path: PAGE,
    replies: copiesPage([]),
    settle: (p) => waitFor(p, 'libere aos Projetos que usam.'),
  },
  {
    name: 'Cópias, a leitura que falhou',
    path: PAGE,
    replies: {
      ...copiesPage([]),
      [`GET ${COMPANY_API}/copies`]: failure('DATABASE_UNAVAILABLE'),
    },
    settle: (p) => waitFor(p, 'Tentar de novo'),
  },
  {
    name: 'Cópias, o membro não encontra a página',
    path: PAGE,
    replies: { ...MEMBER, ...projectsPage(COMPANY.id) },
    settle: (p) => waitFor(p, 'Não encontramos o que você procurou.'),
  },
  {
    name: 'Ligar uma cópia, o diálogo',
    path: PAGE,
    replies: copiesPage(LISTED),
    settle: async (p) => {
      await waitFor(p, 'Sem relógio')
      await p.getByRole('button', { name: 'Ligar uma cópia' }).click()
      await waitFor(p, 'Modelo')
    },
  },
  {
    name: 'Ligar uma cópia, sem conexão que ofereça cópias',
    path: PAGE,
    replies: {
      ...copiesPage(LISTED),
      [`GET ${COMPANY_API}/copy-models`]: ok(listCopyModels, { models: [] }),
    },
    settle: async (p) => {
      await waitFor(p, 'Sem relógio')
      await p.getByRole('button', { name: 'Ligar uma cópia' }).click()
      await waitFor(p, 'Ligue em Integrações uma conexão que ofereça cópias.')
    },
  },
  {
    name: 'Uma cópia, a consulta e as rodadas',
    path: `${PAGE}/${VENDAS}`,
    replies: detailPage([RUNNING, SOURCE_DOWN, DONE]),
    settle: (p) => waitFor(p, 'O sistema não respondeu.'),
  },
  {
    name: 'Uma cópia, sem rodada ainda',
    path: `${PAGE}/${VENDAS}`,
    replies: detailPage([]),
    settle: (p) => waitFor(p, 'A primeira rodada ainda não terminou.'),
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
    name: 'Cópias, o menu da linha',
    path: PAGE,
    replies: copiesPage(LISTED),
    settle: async (p) => {
      await waitFor(p, 'Sem relógio')
      await p.getByRole('button', { name: 'Ações: Vendas' }).click()
      await p.getByRole('menuitem', { name: 'Rodar agora' }).waitFor()
    },
  },
  {
    name: 'Cópias, o diálogo do Intervalo',
    path: PAGE,
    replies: copiesPage(LISTED),
    settle: async (p) => {
      await waitFor(p, 'Sem relógio')
      await p.getByRole('button', { name: 'Ações: Vendas' }).click()
      await p.getByRole('menuitem', { name: 'Intervalo' }).click()
      await waitFor(p, 'O mínimo é 15 minutos.')
    },
  },
  linkRefused('COPY_DATABASE_UNAVAILABLE', 'O banco da empresa não respondeu.'),
  linkRefused('COPY_EXISTS', 'A empresa já tem esta cópia.'),
  {
    name: 'Uma cópia, a leitura das rodadas que falhou',
    path: `${PAGE}/${VENDAS}`,
    replies: {
      ...detailPage([]),
      [`GET ${COMPANY_API}/copies/${VENDAS}/runs`]: failure('DATABASE_UNAVAILABLE'),
    },
    settle: (p) => waitFor(p, 'O banco do Conexus não respondeu.'),
  },
]

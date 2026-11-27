import {
  getTreatmentModel,
  listConnections,
  listLakeTables,
  listTreatedTables,
  TreatedTables,
  TreatmentModel,
} from '@conexus/hub-api'
import { ok } from './layout-harness.ts'
import { SANKHYA } from './src/hub/connectors/fixtures.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import type { State } from './sweep-kit.ts'
import { waitFor } from './sweep-kit.ts'
import { OWNER, projectsPage } from './sweep-replies.ts'

const COMPANY_API = `/api/companies/${COMPANY.id}`
const PAGE = `/companies/${COMPANY.id}/data`
const TREATED = `${COMPANY_API}/data/treated`

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

const MODEL_ID = '33333333-3333-4333-8333-333333333333'
const AT = '2026-11-26T17:05:00.000Z'

const BOUND = {
  number: 1,
  sql: 'select nunota\nfrom current.sankhya_notas',
  inputs: [{ layer: 'current', table: 'sankhya_notas' }],
  hash: 'a'.repeat(64),
  proposedBy: 'Ana Lima',
  proposedAt: '2026-11-25T17:00:00.000Z',
  approvedBy: 'Ana Lima',
  approvedAt: '2026-11-25T17:30:00.000Z',
} as const

const PROPOSAL = {
  ...BOUND,
  number: 2,
  sql: 'select nunota, vlrnota\nfrom current.sankhya_notas',
  hash: 'b'.repeat(64),
  approvedBy: null,
  approvedAt: null,
} as const

const NOTAS = {
  layer: 'tratado',
  name: 'sankhya_notas',
  label: 'Notas',
  connectionId: MATRIZ.id,
  description: 'Notas fiscais do Sankhya',
  columns: [
    { name: 'nunota', type: 'bigint', description: 'Chave da nota' },
    { name: 'dtalter', type: 'timestamp(6)', description: null },
  ],
  readBy: [{ layer: 'negocio', table: 'venda' }],
  lastRun: { status: 'BUILT', rows: 128_402, at: AT },
} as const

const PEDIDOS = {
  ...NOTAS,
  name: 'sankhya_pedidos',
  label: 'Pedidos',
  description: '',
  readBy: [],
  lastRun: { status: 'FAILED', failure: 'COLUMN_NOT_FOUND', line: 3, at: AT },
} as const

const VENDA = {
  layer: 'negocio',
  id: MODEL_ID,
  name: 'venda',
  description: 'O que conta como venda',
  active: BOUND,
  proposal: PROPOSAL,
  readBy: [],
  lastRun: { status: 'BUILT', rows: 9_120, at: AT },
} as const

const TABLES = {
  lake: 'CURRENT',
  lastRun: { state: 'DONE', at: AT },
  tables: [NOTAS, PEDIDOS, VENDA],
} as const

const MODEL = {
  id: MODEL_ID,
  name: 'venda',
  description: 'O que conta como venda',
  versions: [PROPOSAL, BOUND],
  active: BOUND,
  proposal: PROPOSAL,
  runs: [{ status: 'BUILT', rows: 9_120, at: AT }],
} as const

function withTreatments() {
  return {
    ...OWNER,
    ...projectsPage(COMPANY.id),
    [`GET ${COMPANY_API}/connections`]: ok(listConnections, {
      connectors: [SANKHYA],
      connections: [MATRIZ],
      mayManage: true,
    }),
    [`GET ${COMPANY_API}/lake-tables`]: ok(listLakeTables, []),
    [`GET ${TREATED}`]: ok(listTreatedTables, TreatedTables.parse(TABLES)),
    [`GET ${TREATED}/models/${MODEL_ID}`]: ok(getTreatmentModel, TreatmentModel.parse(MODEL)),
  }
}

/** The screens of the Tratado and Negócio layers that hold treatments (U6), so the 320 px and focus checks cover them. */
export const TREATMENT_STATES: State[] = [
  {
    name: 'Dados, a camada Tratado com tabelas',
    path: `${PAGE}?layer=treated`,
    replies: withTreatments(),
    settle: (p) => waitFor(p, 'Pedidos'),
  },
  {
    name: 'Dados, a camada Negócio com a versão ligada e a proposta',
    path: `${PAGE}?layer=business`,
    replies: withTreatments(),
    settle: (p) => waitFor(p, 'Proposta: v2, à espera do sim'),
  },
  {
    name: 'Dados, a tabela tratada',
    path: `${PAGE}/treated/sankhya_notas`,
    replies: withTreatments(),
    settle: (p) => waitFor(p, 'Colunas'),
  },
  {
    name: 'Dados, a página do tratamento',
    path: `${PAGE}/business/${MODEL_ID}`,
    replies: withTreatments(),
    settle: (p) => waitFor(p, 'Versões'),
  },
  {
    name: 'Dados, Novo tratamento aberto',
    path: `${PAGE}?layer=business`,
    replies: withTreatments(),
    settle: async (page) => {
      await page.getByRole('button', { name: 'Novo tratamento' }).click()
      await page.getByRole('dialog', { name: 'Novo tratamento' }).waitFor()
    },
  },
  {
    name: 'Dados, o cartão Ligar aberto',
    path: `${PAGE}?layer=business`,
    replies: withTreatments(),
    settle: async (page) => {
      await page.getByRole('button', { name: 'Ligar', exact: true }).click()
      await page.getByRole('alertdialog').waitFor()
    },
  },
]

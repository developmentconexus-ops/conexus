import { testConnection, unlinkConnection } from '@conexus/hub-api'
import { ok } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { connectionOf, connectionsPage } from './sweep-connections.ts'
import type { State } from './sweep-kit.ts'
import { waitFor } from './sweep-kit.ts'
import { MEMBER, OWNER } from './sweep-replies.ts'

const PAGE = `/companies/${COMPANY.id}/integrations`
const TESTED = '2026-10-29T14:02:00.000Z'
const WORKING = connectionOf({ state: 'ACTIVE', testedAt: TESTED })
const TEST = `POST /api/companies/${COMPANY.id}/connections/${WORKING.id}/test`

const CHECKS = [
  ['companies', 'Empresas', 'READS'],
  ['orders', 'Pedidos', 'READS'],
  ['products', 'Produtos', 'UNREADABLE'],
  ['partners', 'Clientes', 'READS'],
  ['taxes', 'Impostos dos pedidos', 'NOTHING_TO_READ'],
  ['load', 'Leitura genérica', 'READS'],
  ['query', 'Consulta livre', 'REFUSED'],
] as const

const TEST_WORKING = ok(testConnection, {
  result: 'WORKING',
  checks: CHECKS.map(([id, label, outcome]) => ({ id, label, outcome })),
  connection: WORKING,
})

function owner(connections: ReturnType<typeof connectionOf>[]) {
  return { ...OWNER, ...connectionsPage(COMPANY.id, true, connections) }
}

// The screen step 19 brings: Integrações, its Ligar dialog, its result of Testar and its Desligar.
export const INTEGRATIONS_STATES: State[] = [
  {
    name: 'Integrações vazia do dono',
    path: PAGE,
    replies: owner([]),
    settle: (p) => waitFor(p, 'Nenhuma integração ligada ainda.'),
  },
  {
    name: 'Integrações com o Sankhya ligado e ainda não testado',
    path: PAGE,
    replies: owner([connectionOf()]),
    settle: (p) => waitFor(p, 'ainda não testada'),
  },
  {
    name: 'Integrações com o formulário de Ligar',
    path: PAGE,
    replies: owner([]),
    settle: async (p) => {
      await p.getByRole('button', { name: 'Ligar', exact: true }).click()
      await p.getByRole('dialog', { name: 'Ligar Sankhya' }).waitFor()
    },
  },
  {
    name: 'Integrações com o resultado do Testar',
    path: PAGE,
    replies: { ...owner([WORKING]), [TEST]: TEST_WORKING },
    settle: async (p) => {
      await p.getByRole('button', { name: 'Testar', exact: true }).click()
      await waitFor(p, 'Ligação funcionando')
    },
  },
  {
    name: 'Integrações com as chaves recusadas',
    path: PAGE,
    replies: owner([connectionOf({ state: 'NEEDS_REAUTH', testedAt: TESTED })]),
    settle: (p) => waitFor(p, 'As chaves foram recusadas pelo Sankhya.'),
  },
  {
    name: 'Integrações com o Desligar pedindo confirmação',
    path: PAGE,
    replies: {
      ...owner([WORKING]),
      [`DELETE /api/companies/${COMPANY.id}/connections/${WORKING.id}`]: {
        status: unlinkConnection.success.status,
      },
    },
    settle: async (p) => {
      await p.getByRole('button', { name: 'Desligar', exact: true }).click()
      await p.getByRole('alertdialog').waitFor()
    },
  },
  {
    name: 'Integrações do membro',
    path: PAGE,
    replies: { ...MEMBER, ...connectionsPage(COMPANY.id, false, [WORKING]) },
    settle: (p) => waitFor(p, 'Só a dona ou um administrador liga, testa e desliga.'),
  },
]

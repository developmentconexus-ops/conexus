import { testConnection, unlinkConnection } from '@conexus/hub-api'
import { failure, ok } from './layout-harness.ts'
import { REFUSAL, workingOf } from './src/hub/connectors/fixtures.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { connectionOf, connectionPage, connectionsPage } from './sweep-connections.ts'
import type { State } from './sweep-kit.ts'
import { waitFor } from './sweep-kit.ts'
import { MEMBER, OWNER } from './sweep-replies.ts'

const NEVER = new Promise<never>(() => undefined)
const PAGE = `/companies/${COMPANY.id}/integrations`
const TESTED = '2026-10-29T14:02:00.000Z'
const WORKING = connectionOf({
  state: 'ACTIVE',
  testedAt: TESTED,
  testedBy: { id: 'person-ana', name: 'Ana Lima' },
})
const SECOND = connectionOf({ name: 'Financeiro', state: 'NEEDS_REAUTH', testedAt: TESTED })
const NEW = connectionOf({ name: 'Matriz' })
const GONE = connectionOf({ name: 'Antiga' })
const PARTIAL = {
  Empresas: { outcome: 'REFUSED', native: REFUSAL },
  Pedidos: { outcome: 'SOURCE_UNREAD', source: 'Empresas' },
  'Impostos dos pedidos': { outcome: 'SOURCE_UNREAD', source: 'Pedidos' },
  Clientes: { outcome: 'UNREADABLE', native: { ...REFUSAL, status: 200, code: null } },
  'Locais de estoque': 'NOT_TESTED',
  'Preços de uma tabela': 'NOTHING_TO_READ',
}

function pageOf(connection: { id: string }) {
  return `${PAGE}/${connection.id}`
}

function testOf(connection: { id: string }) {
  return `POST /api/companies/${COMPANY.id}/connections/${connection.id}/test`
}

/** The list, and each connection's page, which the router preloads when a link takes focus. */
function listOf(mayManage: boolean, connections: ReturnType<typeof connectionOf>[]) {
  return {
    ...connectionsPage(COMPANY.id, mayManage, connections),
    ...Object.assign({}, ...connections.map((one) => connectionPage(COMPANY.id, one))),
  }
}

function owner(connections: ReturnType<typeof connectionOf>[]) {
  return { ...OWNER, ...listOf(true, connections) }
}

/** The connection's page as its owner reads it, the list behind it included. */
function ownerPage(
  connection: ReturnType<typeof connectionOf>,
  outcomes?: Record<string, string | Record<string, unknown>>,
) {
  return { ...owner([connection]), ...connectionPage(COMPANY.id, connection, outcomes) }
}

// The screens step 19 brings: Integrações, its window to link, the page of a connection and its Desligar.
export const INTEGRATIONS_STATES: State[] = [
  {
    name: 'Integrações vazia do dono',
    path: PAGE,
    replies: owner([]),
    settle: (p) => waitFor(p, 'Nenhuma integração ligada ainda.'),
  },
  {
    name: 'Integrações com duas ligações do Sankhya',
    path: PAGE,
    replies: owner([WORKING, SECOND, NEW]),
    settle: (p) => waitFor(p, '3 ligações'),
  },
  {
    name: 'Integrações com a janela de Ligar',
    path: PAGE,
    replies: owner([]),
    settle: async (p) => {
      await p.getByRole('button', { name: 'Ligar Sankhya' }).click()
      await p.getByRole('dialog', { name: 'Ligar Sankhya' }).waitFor()
      await p.getByLabel('Client ID', { exact: true }).fill('a4f1c09e-77b2-4c1d-9e0a-55d1')
      await p.getByLabel('Client Secret', { exact: true }).fill('segredo-de-exemplo')
      await p.getByLabel('X-Token', { exact: true }).fill('token-de-exemplo')
    },
  },
  {
    name: 'Integrações do membro',
    path: PAGE,
    replies: { ...MEMBER, ...listOf(false, [WORKING]) },
    settle: (p) => waitFor(p, 'Só o dono ou um administrador liga, testa e desliga.'),
  },
  {
    name: 'Página da ligação que lê tudo',
    path: pageOf(WORKING),
    replies: ownerPage(WORKING, {}),
    settle: (p) => waitFor(p, 'Lê 8 de 8 assuntos inteiros'),
  },
  {
    name: 'Página da ligação que lê em parte',
    path: pageOf(WORKING),
    replies: ownerPage(WORKING, PARTIAL),
    settle: (p) => waitFor(p, 'Lê 5 de 8 assuntos inteiros'),
  },
  {
    name: 'Página da ligação testando',
    path: pageOf(NEW),
    replies: {
      ...ownerPage(NEW),
      [testOf(NEW)]: { ...ok(testConnection, workingOf(NEW)), hold: NEVER },
    },
    settle: async (p) => {
      await p.getByRole('button', { name: 'Testar', exact: true }).click()
      await waitFor(p, 'Testando as 25 leituras, uma por vez…')
    },
  },
  {
    name: 'Página da ligação com o resultado novo do Testar',
    path: pageOf(WORKING),
    replies: {
      ...ownerPage(WORKING, {}),
      [testOf(WORKING)]: ok(testConnection, workingOf(WORKING, PARTIAL)),
    },
    settle: async (p) => {
      await p.getByRole('button', { name: 'Testar', exact: true }).click()
      await waitFor(p, 'Sankhya respondeu 403, código SEM_ACESSO: Sem acesso à tela')
      await p.getByText('Ver a resposta inteira').first().click()
    },
  },
  {
    name: 'Página da ligação com o Sankhya fora do ar',
    path: pageOf(WORKING),
    replies: {
      ...ownerPage(WORKING, {}),
      [testOf(WORKING)]: ok(testConnection, {
        result: 'UNREACHABLE',
        native: null,
        connection: WORKING,
      }),
    },
    settle: async (p) => {
      await p.getByRole('button', { name: 'Testar', exact: true }).click()
      await waitFor(p, 'O Sankhya não respondeu. Tente de novo em alguns minutos.')
    },
  },
  {
    name: 'Página da ligação com as chaves recusadas',
    path: pageOf(SECOND),
    replies: ownerPage(SECOND),
    settle: (p) => waitFor(p, 'As chaves foram recusadas pelo Sankhya.'),
  },
  {
    name: 'Página da ligação do membro',
    path: pageOf(WORKING),
    replies: {
      ...MEMBER,
      ...connectionsPage(COMPANY.id, false, [WORKING]),
      ...connectionPage(COMPANY.id, WORKING, PARTIAL),
    },
    settle: (p) => waitFor(p, 'Só o dono ou um administrador liga, testa e desliga.'),
  },
  {
    name: 'Página da ligação com o Desligar pedindo confirmação',
    path: pageOf(WORKING),
    replies: {
      ...ownerPage(WORKING, {}),
      [`DELETE /api/companies/${COMPANY.id}/connections/${WORKING.id}`]: {
        status: unlinkConnection.success.status,
      },
    },
    settle: async (p) => {
      await p.getByRole('button', { name: 'Mais ações' }).click()
      await p.getByRole('menuitem', { name: 'Desligar' }).click()
      await p.getByRole('alertdialog').waitFor()
    },
  },
  {
    name: 'Página de uma ligação desligada',
    path: pageOf(GONE),
    replies: {
      ...owner([]),
      [`GET /api/companies/${COMPANY.id}/connections/${GONE.id}`]: failure('CONNECTION_NOT_FOUND'),
    },
    settle: (p) => waitFor(p, 'Essa integração foi desligada.'),
  },
]

import {
  getConnection,
  listConnections,
  listProjectConnections,
  ProjectConnections,
} from '@conexus/hub-api'
import { ok } from './layout-harness.ts'
import { MERCADO_LIVRE, SANKHYA } from './src/hub/connectors/fixtures.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { connectionOf } from './sweep-connections.ts'
import type { State } from './sweep-kit.ts'
import { waitFor } from './sweep-kit.ts'
import { MEMBER, OWNER, PROJECT_ID, projectsPage } from './sweep-replies.ts'

const PAGE = `/companies/${COMPANY.id}/projects/${PROJECT_ID}/integrations`
const GRANT = { by: 'Ana Lima', at: '2026-10-30T12:00:00.000Z' }
const NOT_RELEASED = { kind: 'NOT_RELEASED' }
const READS = { kind: 'READS', grant: GRANT }
const CATALOG = [SANKHYA, MERCADO_LIVRE]

const LineShape = ProjectConnections.shape.connectors.element.shape.connections.element

function line(name: string, fields: Record<string, unknown> = {}) {
  const { id } = connectionOf()
  return LineShape.parse({
    id,
    name,
    state: 'ACTIVE',
    account: null,
    access: NOT_RELEASED,
    ...fields,
  })
}

type Line = ReturnType<typeof line>

function listOf(sankhya: Line[], mercadoLivre: Line[]) {
  function entry(one: typeof SANKHYA) {
    return { id: one.id, name: one.name, logo: one.logo, category: one.category }
  }
  return ok(listProjectConnections, {
    connectors: [
      { connector: entry(SANKHYA), perProject: 'one', connections: sankhya },
      { connector: entry(MERCADO_LIVRE), perProject: 'many', connections: mercadoLivre },
    ],
  })
}

function page(who: typeof OWNER, mayManage: boolean, sankhya: Line[], mercadoLivre: Line[]) {
  return {
    ...who,
    ...projectsPage(COMPANY.id),
    [`GET /api/companies/${COMPANY.id}/connections`]: ok(listConnections, {
      connectors: CATALOG,
      connections: [],
      mayManage,
    }),
    [`GET /api/companies/${COMPANY.id}/projects/${PROJECT_ID}/connections`]: listOf(
      sankhya,
      mercadoLivre,
    ),
  }
}

const MATRIZ = line('Matriz', { access: READS, account: { label: 'PADARIASOL' } })
const FILIAL = line('Filial')
const LOJA_1 = line('Loja 1', { access: READS })
const LOJA_2 = line('Loja 2')
const STOPPED = line('Matriz', {
  state: 'NEW',
  access: { kind: 'RELEASED_NOT_WORKING', grant: GRANT },
})
const UNTESTED = line('Loja 3', { state: 'NEW', access: { kind: 'NOT_RELEASED_NOT_WORKING' } })
const BROKEN = line('Financeiro', {
  state: 'NEEDS_REAUTH',
  access: { kind: 'NOT_RELEASED_NOT_WORKING' },
})

const NOTE = {
  concept: 'Vendedor do pedido',
  mapping: 'TGFCAB.AD_CODVEND → TGFVEN.CODVEND',
  provedAt: '2026-10-30T14:02:00.000Z',
  provedRows: 20,
  writtenBy: 'Bruno',
}
const CONNECTION = connectionOf({ name: 'Matriz', state: 'ACTIVE' })

function notebook(who: typeof OWNER, mayManage: boolean, notes: (typeof NOTE)[]) {
  return {
    ...who,
    [`GET /api/companies/${COMPANY.id}/connections`]: ok(listConnections, {
      connectors: [SANKHYA],
      connections: [CONNECTION],
      mayManage,
    }),
    [`GET /api/companies/${COMPANY.id}/connections/${CONNECTION.id}`]: ok(getConnection, {
      connection: CONNECTION,
      notes,
    }),
  }
}

// The screens step 20 brings: the Projeto's Integrações with its Liberar, and the Caderno of a connection.
export const PROJECT_INTEGRATIONS_STATES: State[] = [
  {
    name: 'Integrações do Projeto, a dona com liberadas e uma escolha pelo nome',
    path: PAGE,
    replies: page(OWNER, true, [MATRIZ, FILIAL], [LOJA_1, LOJA_2]),
    settle: (p) => waitFor(p, 'O Sankhya lê uma ligação por Projeto. Tire a Matriz antes.'),
  },
  {
    name: 'Integrações do Projeto, a confirmação de Liberar para ler',
    path: PAGE,
    replies: page(OWNER, true, [], [LOJA_1, LOJA_2]),
    settle: async (p) => {
      await p.getByRole('button', { name: 'Liberar para ler: Loja 2' }).click()
      await waitFor(p, 'Quem usa o app vê o que o app mostrar.')
    },
  },
  {
    name: 'Integrações do Projeto, uma ligação liberada que deixou de funcionar',
    path: PAGE,
    replies: {
      ...page(OWNER, true, [STOPPED], []),
      // The link to the connection's page is preloaded when it takes focus.
      [`GET /api/companies/${COMPANY.id}/connections/${STOPPED.id}`]: ok(getConnection, {
        connection: connectionOf({ id: STOPPED.id, name: STOPPED.name, state: 'NEW' }),
        notes: [],
      }),
    },
    settle: (p) => waitFor(p, 'liberado, mas não lê até a ligação funcionar'),
  },
  {
    name: 'Integrações do Projeto, uma ligação nova ainda não testada',
    path: PAGE,
    replies: {
      ...page(OWNER, true, [], [UNTESTED]),
      [`GET /api/companies/${COMPANY.id}/connections/${UNTESTED.id}`]: ok(getConnection, {
        connection: connectionOf({ id: UNTESTED.id, name: UNTESTED.name, state: 'NEW' }),
        notes: [],
      }),
    },
    settle: (p) => waitFor(p, 'Teste a ligação antes de liberar'),
  },
  {
    name: 'Integrações do Projeto, o membro',
    path: PAGE,
    replies: page(MEMBER, false, [MATRIZ], [LOJA_2]),
    settle: (p) => waitFor(p, 'Peça ao dono ou a um administrador.'),
  },
  {
    name: 'Integrações do Projeto, uma ligação que pede para conectar de novo',
    path: PAGE,
    replies: {
      ...page(OWNER, true, [BROKEN], []),
      // The link to the connection's page is preloaded when it takes focus.
      [`GET /api/companies/${COMPANY.id}/connections/${BROKEN.id}`]: ok(getConnection, {
        connection: connectionOf({ id: BROKEN.id, name: BROKEN.name, state: 'NEEDS_REAUTH' }),
        notes: [],
      }),
    },
    settle: (p) => waitFor(p, 'Conectar de novo em Integrações da empresa'),
  },
  {
    name: 'Integrações do Projeto sem nenhuma ligação',
    path: PAGE,
    replies: page(OWNER, true, [], []),
    settle: (p) => waitFor(p, 'A empresa ainda não ligou nenhum sistema.'),
  },
  {
    name: 'A ligação com o Caderno da dona',
    path: `/companies/${COMPANY.id}/integrations/${CONNECTION.id}`,
    replies: notebook(OWNER, true, [NOTE]),
    settle: (p) => waitFor(p, 'Vendedor do pedido'),
  },
  {
    name: 'A ligação com a confirmação de Apagar',
    path: `/companies/${COMPANY.id}/integrations/${CONNECTION.id}`,
    replies: notebook(OWNER, true, [NOTE]),
    settle: async (p) => {
      await p.getByRole('button', { name: 'Apagar: Vendedor do pedido' }).click()
      await waitFor(p, 'O Builder deixa de usar essa anotação. Ele pode anotar de novo.')
    },
  },
  {
    name: 'A ligação com o Caderno vazio',
    path: `/companies/${COMPANY.id}/integrations/${CONNECTION.id}`,
    replies: notebook(OWNER, true, []),
    settle: (p) => waitFor(p, 'O Builder ainda não anotou nada desta ligação.'),
  },
  {
    name: 'A ligação com o Caderno do membro',
    path: `/companies/${COMPANY.id}/integrations/${CONNECTION.id}`,
    replies: notebook(MEMBER, false, [NOTE]),
    settle: (p) => waitFor(p, 'Vendedor do pedido'),
  },
]

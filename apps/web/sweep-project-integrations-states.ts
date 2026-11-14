import {
  getConnection,
  listConnections,
  listProjectConnections,
  listProjectCopies,
  ProjectConnections,
} from '@conexus/hub-api'
import { failure, ok } from './layout-harness.ts'
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
    return { id: one.id, name: one.name, logo: one.logo, category: one.category, auth: one.auth }
  }
  return ok(listProjectConnections, {
    connectors: [
      { connector: entry(SANKHYA), perProject: 'one', connections: sankhya },
      { connector: entry(MERCADO_LIVRE), perProject: 'many', connections: mercadoLivre },
    ],
  })
}

const COPIES = [
  { id: '00000000-0000-4000-8000-0000000000a1', label: 'Vendas', name: 'vendas', granted: false },
  {
    id: '00000000-0000-4000-8000-0000000000a2',
    label: 'Clientes da Matriz com um nome bem comprido para a linha quebrar',
    name: 'clientes_da_matriz_com_um_nome_bem_comprido_para_a_linha',
    granted: true,
  },
]

function copiesOf(copies: typeof COPIES) {
  return {
    [`GET /api/companies/${COMPANY.id}/projects/${PROJECT_ID}/copies`]: ok(listProjectCopies, {
      copies: copies.map(({ granted, ...copy }) => ({
        copy: { ...copy, connector: 'sankhya' },
        granted,
      })),
    }),
  }
}

function page(
  who: typeof OWNER,
  mayManage: boolean,
  sankhya: Line[],
  mercadoLivre: Line[],
  copies: typeof COPIES = COPIES,
) {
  return {
    ...copiesOf(copies),
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

// The screens step 20 brings: the Projeto's Integrações with its Liberar.
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
      }),
    },
    settle: (p) => waitFor(p, 'Conectar de novo em Integrações da empresa'),
  },
  {
    name: 'Integrações do Projeto, sem nenhuma cópia na empresa',
    path: PAGE,
    replies: page(OWNER, true, [MATRIZ], [], []),
    settle: (p) => waitFor(p, 'A empresa ainda não tem cópias.'),
  },
  {
    name: 'Integrações do Projeto, o banco da empresa não respondeu ao liberar uma cópia',
    path: PAGE,
    replies: {
      ...page(OWNER, true, [MATRIZ], []),
      [`PUT /api/companies/${COMPANY.id}/projects/${PROJECT_ID}/copies/${COPIES[0]?.id}`]: failure(
        'COPY_DATABASE_UNAVAILABLE',
      ),
    },
    settle: async (p) => {
      await p.getByRole('button', { name: 'Liberar: Vendas' }).click()
      await waitFor(p, 'O banco da empresa não respondeu.')
    },
  },
  {
    name: 'Integrações do Projeto, o membro lê quem libera uma cópia',
    path: PAGE,
    replies: page(MEMBER, false, [MATRIZ], []),
    settle: (p) => waitFor(p, 'Dono, administrador ou desenvolvedor libera uma cópia.'),
  },
  {
    name: 'Integrações do Projeto sem nenhuma ligação',
    path: PAGE,
    replies: page(OWNER, true, [], []),
    settle: (p) => waitFor(p, 'A empresa ainda não ligou nenhum sistema.'),
  },
]

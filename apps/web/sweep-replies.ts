import {
  getAccountKinds,
  getClient,
  getCompany,
  getInvitation,
  getProject,
  getSession,
  getStatus,
  listClients,
  listCompanies,
  listConversations,
  listInvitations,
  listMembers,
  listModelAccounts,
  listModelProviders,
  listProjects,
} from '@conexus/hub-api'
import type { Replies } from './layout-harness.ts'
import { ok } from './layout-harness.ts'
import { ANA, COMPANY } from './src/platform/fixtures.ts'

export const INVITATION = 'i'.repeat(32)
export const LONG_EMAIL =
  'pessoa.com.um.nome.muito.comprido.mesmo@empresa-de-nome-longo.example.test'
export const LONG_NAME =
  'Empresa de Nome Muito Comprido que Não Cabe em Uma Linha de Telefone Pequeno'
const LIVE_INVITATION = {
  id: 'p'.repeat(32),
  email: LONG_EMAIL,
  role: 'admin',
  expiresAt: '2026-10-17T12:00:00.000Z',
  revision: 0,
  state: 'PENDING',
} as const
export const SIGNED_OUT: Replies = {
  'GET /api/sessions/current': ok(getSession, { state: 'SIGNED_OUT' }),
}
export const SIGNED_IN: Replies = {
  'GET /api/sessions/current': ok(getSession, { state: 'SIGNED_IN', person: ANA }),
  'GET /api/status': ok(getStatus, {
    version: 'v0.3.0',
    lastStart: { state: 'NONE' },
    previousStart: { state: 'NONE' },
  }),
  // The router preloads Início on focus (defaultPreload: 'intent').
  'GET /api/companies': ok(listCompanies, {
    companies: [],
    mayOperate: false,
    next: { kind: 'END' },
  }),
}

export function companies(
  list: { name: string; role: 'owner' | 'admin' | 'member' }[],
  mayOperate: boolean,
) {
  const body = {
    companies: list.map(({ name, role }, index) => ({
      company: { id: String(index).repeat(32), name },
      role,
    })),
    mayOperate,
    next: { kind: 'END' },
  } as const
  const preloaded = body.companies.map(({ company, role }) =>
    companyPage(role, role === 'member' ? [] : ['admin', 'member'], company.id, company.name),
  )
  return {
    ...Object.assign({}, ...preloaded),
    ...SIGNED_IN,
    'GET /api/companies': ok(listCompanies, body),
  }
}

function companyPage(
  role: 'owner' | 'admin' | 'member',
  mayInviteAs: ('owner' | 'admin' | 'member')[],
  id = COMPANY.id,
  name = LONG_NAME,
) {
  const company = { id, name, nickname: 'empresa-teste', appsDomain: 'apps.example.test' }
  const people = [
    {
      personId: ANA.id,
      name: ANA.name,
      email: ANA.email,
      role: 'owner',
      mayRemove: false,
      mayChangeTo: [],
      invitationsSent: 0,
    },
    {
      personId: 'person-long',
      name: 'Nome Completo Muito Comprido',
      email: LONG_EMAIL,
      role: 'member',
      mayRemove: true,
      mayChangeTo: ['admin'],
      invitationsSent: 1,
    },
  ] as const
  // The rail's Projetos link preloads its page on focus, so every company page has its Projects too.
  return {
    ...SIGNED_IN,
    ...projectsPage(id),
    ...modelAccountsPage(id, role !== 'member'),
    [`GET /api/companies/${id}`]: ok(getCompany, { company, role, mayInviteAs }),
    [`GET /api/companies/${id}/members`]: ok(listMembers, {
      members: people.map((one) => ({ ...one, mayChangeTo: [...one.mayChangeTo] })),
      next: { kind: 'END' },
    }),
    [`GET /api/companies/${id}/invitations`]: ok(listInvitations, {
      invitations: [LIVE_INVITATION],
      next: { kind: 'END' },
    }),
  }
}

/** The company's model accounts and the providers of their keys, which the rail preloads on focus. */
function modelAccountsPage(id: string, mayManage: boolean): Replies {
  return {
    [`GET /api/companies/${id}/model-accounts`]: ok(listModelAccounts, {
      company: [],
      mine: [],
      order: [],
      kinds: [],
      defaultModel: null,
      fallback: { enabled: false, chain: [], revision: 0 },
      usableProviders: [],
      mayManage,
    }),
    'GET /api/model-providers': ok(listModelProviders, {
      providers: [{ id: 'anthropic', name: 'Anthropic', models: ['claude-sonnet-4'] }],
    }),
  }
}

const ADDRESS = 'projeto-com-um-nome-muito-comprido--empresa-teste.apps.example.test'
const PROJECT = {
  id: 'r'.repeat(32),
  name: `Projeto com um nome muito comprido que não cabe em uma linha de telefone pequeno`,
  createdAt: '2026-10-17T12:00:00.000Z',
} as const

/**
 * A company's Projects, as a person of `mayDelete` sees them; no Project, no database yet, when
 * `empty`. The Project's Conversa tab preloads its conversations on focus.
 */
export function projectsPage(
  id: string,
  view: { empty?: boolean; mayDelete?: boolean } = {},
): Replies {
  return {
    [`GET /api/companies/${id}/projects`]: ok(listProjects, {
      projects: view.empty ? [] : [PROJECT],
      next: { kind: 'END' },
      databaseReady: !view.empty,
    }),
    [`GET /api/companies/${id}/projects/${PROJECT.id}`]: ok(getProject, {
      project: {
        ...PROJECT,
        mayDelete: view.mayDelete ?? true,
        mayManageVersions: view.mayDelete ?? true,
        address: ADDRESS,
      },
    }),
    [`GET /api/companies/${id}/projects/${PROJECT.id}/conversations`]: ok(listConversations, {
      conversations: [],
      next: { kind: 'END' },
    }),
  }
}

export const PROJECT_ID = PROJECT.id
export const PROJECT_NAME = PROJECT.name

export const INVITATION_DETAILS = {
  company: { id: COMPANY.id, name: LONG_NAME },
  role: 'admin',
  inviterName: 'Ana Lima',
  firstOwner: false,
  revision: 0,
  expiresAt: LIVE_INVITATION.expiresAt,
} as const

export function received(state: 'PENDING' | 'EXPIRED' | 'ACCEPTED' | 'CANCELED'): Replies {
  const views = {
    PENDING: { kind: 'INVITED', ...INVITATION_DETAILS },
    ACCEPTED: { kind: 'JOINED', company: INVITATION_DETAILS.company },
    EXPIRED: { kind: 'CLOSED', state: 'EXPIRED' },
    CANCELED: { kind: 'CLOSED', state: 'CANCELED' },
  } as const
  return {
    ...SIGNED_IN,
    ...(state === 'ACCEPTED' ? companyPage('admin', ['admin', 'member']) : {}),
    [`GET /api/invitations/${INVITATION}`]: ok(getInvitation, { invitation: views[state] }),
  }
}

export const OWNER = companyPage('owner', ['owner', 'admin', 'member'])
export const MEMBER = companyPage('member', [])
export const WITH_EXPIRED: Replies = {
  ...OWNER,
  [`GET /api/companies/${COMPANY.id}/invitations`]: ok(listInvitations, {
    invitations: [
      LIVE_INVITATION,
      {
        id: 'e'.repeat(32),
        email: `vencido.${LONG_EMAIL}`,
        role: 'member',
        expiresAt: '2026-10-14T12:00:00.000Z',
        revision: 0,
        state: 'EXPIRED',
      },
    ],
    next: { kind: 'END' },
  }),
}
export const NO_COMPANIES = companies([], false)

export const CLIENT_ID = 'k'.repeat(32)
const CLIENT = {
  companyId: CLIENT_ID,
  cnpj: '12ABC34501DE35',
  legalName: `${LONG_NAME} Comércio e Serviços Ltda`,
  name: LONG_NAME,
  registeredAt: '2026-10-16T12:00:00.000Z',
  revision: 0,
  state: {
    kind: 'AWAITING_OWNER',
    ownerInvitation: { ...LIVE_INVITATION, state: 'EXPIRED' },
  },
} as const
const ACTIVE = {
  ...CLIENT,
  state: {
    kind: 'ACTIVE' as const,
    activeSince: '2026-10-17T12:00:00.000Z',
    owners: [{ name: 'Nome Completo Muito Comprido', email: LONG_EMAIL }],
  },
}

const DELETING = { ...CLIENT, state: { kind: 'DELETING' as const } }

/** The Operations Central as the operator sees it, with `client` behind its one row. */
export function central(client: 'AWAITING' | 'ACTIVE' | 'DELETING' | 'NONE'): Replies {
  const shown = { ACTIVE, DELETING, AWAITING: CLIENT, NONE: CLIENT }[client]
  return {
    ...(client === 'ACTIVE' ? companyPage('owner', ['owner'], CLIENT_ID) : {}),
    ...companies([], true),
    'GET /api/clients': ok(listClients, {
      clients: client === 'NONE' ? [] : [shown],
      next: { kind: 'END' },
    }),
    [`GET /api/clients/${CLIENT_ID}`]: ok(getClient, { client: shown }),
    [`GET /api/clients/${CLIENT_ID}/account-kinds`]: ok(getAccountKinds, { kinds: [] }),
  }
}

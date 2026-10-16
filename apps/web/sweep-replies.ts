import {
  getCompany,
  getInvitation,
  getSession,
  getStatus,
  listCompanies,
  listInvitations,
  listMembers,
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
    mayCreate: false,
    next: { kind: 'END' },
  }),
}

export function companies(
  list: { name: string; role: 'owner' | 'admin' | 'member' }[],
  mayCreate: boolean,
) {
  const body = {
    companies: list.map(({ name, role }, index) => ({
      company: { id: String(index).repeat(32), name },
      role,
    })),
    mayCreate,
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
  const company = { id, name }
  const people = [
    { personId: ANA.id, name: ANA.name, email: ANA.email, role: 'owner' },
    {
      personId: 'person-long',
      name: 'Nome Completo Muito Comprido',
      email: LONG_EMAIL,
      role: 'member',
    },
  ] as const
  return {
    ...SIGNED_IN,
    [`GET /api/companies/${id}`]: ok(getCompany, { company, role, mayInviteAs }),
    [`GET /api/companies/${id}/members`]: ok(listMembers, {
      members: [...people],
      next: { kind: 'END' },
    }),
    [`GET /api/companies/${id}/invitations`]: ok(listInvitations, {
      invitations: [LIVE_INVITATION],
      next: { kind: 'END' },
    }),
  }
}

export const INVITATION_DETAILS = {
  company: { id: COMPANY.id, name: LONG_NAME },
  role: 'admin',
  inviterName: 'Ana Lima',
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

import {
  getCompany,
  getInvitation,
  getSession,
  getStatus,
  listCompanies,
  listInvitations,
  listMembers,
} from '@conexus/hub-api'
import type { Page } from 'playwright-core'
import type { Replies } from './layout-harness.ts'
import { failure, ok } from './layout-harness.ts'
import { ANA, COMPANY } from './src/platform/fixtures.ts'

// The signed-out and signed-in screens the sweep visits, each with the replies the fake Hub gives it.
const INVITATION = 'i'.repeat(32)
const LONG_EMAIL = 'pessoa.com.um.nome.muito.comprido.mesmo@empresa-de-nome-longo.example.test'
const LONG_NAME = 'Empresa de Nome Muito Comprido que Não Cabe em Uma Linha de Telefone Pequeno'
const LIVE_INVITATION = {
  id: 'p'.repeat(32),
  email: LONG_EMAIL,
  role: 'admin',
  expiresAt: '2026-10-17T12:00:00.000Z',
  state: 'PENDING',
} as const
const SIGNED_OUT: Replies = {
  'GET /api/sessions/current': ok(getSession, { state: 'SIGNED_OUT' }),
}
export const SIGNED_IN: Replies = {
  'GET /api/sessions/current': ok(getSession, { state: 'SIGNED_IN', person: ANA }),
  'GET /api/status': ok(getStatus, {
    version: 'v0.3.0',
    lastStart: { state: 'NONE' },
    previousStart: { state: 'NONE' },
  }),
  // Every signed-in page has the Início link, which the router preloads on hover or focus
  // (defaultPreload: 'intent'); an empty list answers it.
  'GET /api/companies': ok(listCompanies, {
    companies: [],
    mayCreate: false,
    next: { kind: 'END' },
  }),
}

function companies(
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
  // The router preloads a company when its link takes focus, as the Tab pass does (defaultPreload).
  const preloaded = body.companies.map(({ company, role }) =>
    companyPage(role, role === 'member' ? [] : ['admin', 'member'], company.id, company.name),
  )
  return {
    ...Object.assign({}, ...preloaded),
    ...SIGNED_IN,
    'GET /api/companies': ok(listCompanies, body),
  }
}

/** The company page as a person with `role` sees it, who may invite as `mayInviteAs`. */
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

function received(state: 'PENDING' | 'EXPIRED' | 'ACCEPTED' | 'CANCELED'): Replies {
  const invitation = {
    id: INVITATION,
    company: { id: COMPANY.id, name: LONG_NAME },
    role: 'admin',
    inviterName: 'Ana Lima',
    state,
  } as const
  return {
    ...SIGNED_IN,
    // "Abrir empresa" preloads the company the invitation joined.
    ...(state === 'ACCEPTED' ? companyPage('admin', ['admin', 'member']) : {}),
    [`GET /api/invitations/${INVITATION}`]: ok(getInvitation, { invitation }),
  }
}

export type State = {
  name: string
  path: string
  replies: Replies
  /** Waits for the screen and brings it to the state: a form refused, a field filled. */
  settle(page: Page): Promise<void>
}

export async function waitFor(page: Page, text: string) {
  await page.getByText(text).first().waitFor()
}

/** Submits the invitation form, which the state's replies refuse, and waits for the refusal. */
async function inviteRefused(page: Page, sentence: string) {
  await page.getByLabel('E-mail').fill('davi@example.test')
  await page.getByRole('button', { name: 'Enviar convite' }).click()
  await waitFor(page, sentence)
}

export const OWNER = companyPage('owner', ['owner', 'admin', 'member'])
const MEMBER = companyPage('member', [])
const WITH_EXPIRED: Replies = {
  ...OWNER,
  [`GET /api/companies/${COMPANY.id}/invitations`]: ok(listInvitations, {
    invitations: [
      LIVE_INVITATION,
      {
        id: 'e'.repeat(32),
        email: `vencido.${LONG_EMAIL}`,
        role: 'member',
        expiresAt: '2026-10-14T12:00:00.000Z',
        state: 'EXPIRED',
      },
    ],
    next: { kind: 'END' },
  }),
}
const NO_COMPANIES = companies([], false)
const NEVER = new Promise<never>(() => undefined)

export const STATES: State[] = [
  {
    name: 'sem sessão',
    path: '/login',
    replies: SIGNED_OUT,
    settle: (p) => waitFor(p, 'Entrar no Conexus'),
  },
  {
    name: 'senha criada',
    path: '/login?reason=password-set',
    replies: SIGNED_OUT,
    settle: (p) => waitFor(p, 'Senha criada. Entre com ela.'),
  },
  {
    name: 'link de senha',
    path: '/set-password#token=abc',
    replies: SIGNED_OUT,
    settle: (p) => waitFor(p, 'Criar sua senha'),
  },
  {
    name: 'convite sem sessão',
    path: `/invitations/${INVITATION}`,
    replies: SIGNED_OUT,
    settle: async (page) => {
      await page.getByRole('button', { name: 'Ainda não tenho senha' }).click()
      await page.getByLabel('Nome').waitFor()
    },
  },
  {
    name: 'sem empresas',
    path: '/',
    replies: NO_COMPANIES,
    settle: (p) => waitFor(p, 'Você ainda não participa'),
  },
  {
    name: 'com empresas',
    path: '/',
    replies: companies(
      [
        { name: LONG_NAME, role: 'owner' },
        { name: 'Outra Empresa', role: 'member' },
      ],
      true,
    ),
    settle: (p) => waitFor(p, 'Outra Empresa'),
  },
  {
    name: 'nova empresa',
    path: '/companies/new',
    replies: SIGNED_IN,
    settle: (p) => waitFor(p, 'Criar empresa'),
  },
  {
    name: 'dono',
    path: `/companies/${COMPANY.id}`,
    replies: OWNER,
    settle: (p) => waitFor(p, 'Convidar pessoa'),
  },
  {
    name: 'sem convites pendentes',
    path: `/companies/${COMPANY.id}`,
    replies: {
      ...OWNER,
      [`GET /api/companies/${COMPANY.id}/invitations`]: ok(listInvitations, {
        invitations: [],
        next: { kind: 'END' },
      }),
    },
    settle: (p) => waitFor(p, 'Nenhum convite pendente.'),
  },
  {
    name: 'convite vencido na lista',
    path: `/companies/${COMPANY.id}`,
    replies: WITH_EXPIRED,
    settle: (p) => waitFor(p, 'Convidar de novo'),
  },
  {
    name: 'convidar de novo recusado',
    path: `/companies/${COMPANY.id}`,
    replies: {
      ...WITH_EXPIRED,
      [`POST /api/companies/${COMPANY.id}/invitations`]: failure('MEMBER_EXISTS'),
    },
    settle: async (page) => {
      await page.getByRole('button', { name: 'Convidar de novo' }).click()
      await waitFor(page, 'Essa pessoa já está na empresa.')
    },
  },
  {
    name: 'empresa que o Hub não acha',
    path: `/companies/${COMPANY.id}`,
    replies: { ...SIGNED_IN, [`GET /api/companies/${COMPANY.id}`]: failure('NOT_FOUND') },
    settle: (p) => waitFor(p, 'Não encontramos o que você procurou.'),
  },
  {
    name: 'membro',
    path: `/companies/${COMPANY.id}`,
    replies: MEMBER,
    settle: (p) => waitFor(p, 'Pessoas'),
  },
  {
    name: 'convite pendente',
    path: `/invitations/${INVITATION}`,
    replies: received('PENDING'),
    settle: (p) => waitFor(p, 'Aceitar convite'),
  },
  {
    name: 'convite vencido',
    path: `/invitations/${INVITATION}`,
    replies: received('EXPIRED'),
    settle: (p) => waitFor(p, 'Este convite não vale mais.'),
  },
  {
    name: 'convite aceito',
    path: `/invitations/${INVITATION}`,
    replies: received('ACCEPTED'),
    settle: (p) => waitFor(p, 'Abrir empresa'),
  },
  {
    name: 'convite alheio',
    path: `/invitations/${INVITATION}`,
    replies: {
      ...SIGNED_IN,
      [`GET /api/invitations/${INVITATION}`]: failure('NOT_FOUND'),
    },
    settle: (p) => waitFor(p, 'Se o convite foi para outro e-mail, saia e entre com ele.'),
  },
  {
    name: 'erro de campo',
    path: `/companies/${COMPANY.id}`,
    replies: {
      ...OWNER,
      [`POST /api/companies/${COMPANY.id}/invitations`]: failure('MEMBER_EXISTS'),
    },
    settle: (page) => inviteRefused(page, 'Essa pessoa já está na empresa.'),
  },
  {
    name: 'carregando',
    path: '/',
    replies: { ...SIGNED_IN, 'GET /api/companies': { status: 200, hold: NEVER } },
    settle: (p) => waitFor(p, 'Abrindo o Conexus'),
  },
  {
    name: '502',
    path: `/companies/${COMPANY.id}`,
    replies: {
      ...OWNER,
      [`POST /api/companies/${COMPANY.id}/invitations`]: failure('MAIL_UNAVAILABLE'),
    },
    settle: (page) => inviteRefused(page, 'O e-mail não pôde ser enviado agora.'),
  },
]

import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
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
import type { Replies, Viewport } from './layout-harness.ts'
import {
  createHarness,
  DESKTOP,
  failure,
  ok,
  PHONE,
  presses,
  SMALL_PHONE,
} from './layout-harness.ts'

// Every state of the screens, at three widths and in both themes: no sideways scroll, and a 2px
// outline at each Tab stop (testing T23, design V18, V28).
const COMPANY = 'a'.repeat(32)
const INVITATION = 'i'.repeat(32)
const ANA = { id: 'person-ana', name: 'Ana Lima', email: 'ana@example.test' }
const LONG_EMAIL = 'pessoa.com.um.nome.muito.comprido.mesmo@empresa-de-nome-longo.example.test'
const LONG_NAME = 'Empresa de Nome Muito Comprido que Não Cabe em Uma Linha de Telefone Pequeno'
const SIGNED_OUT: Replies = {
  'GET /api/sessions/current': ok(getSession, { state: 'SIGNED_OUT' }),
}
const SIGNED_IN: Replies = {
  'GET /api/sessions/current': ok(getSession, { state: 'SIGNED_IN', person: ANA }),
  'GET /api/status': ok(getStatus, {
    version: 'v0.3.0',
    lastStart: { state: 'NONE' },
    previousStart: { state: 'NONE' },
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
  return { ...SIGNED_IN, 'GET /api/companies': ok(listCompanies, body) }
}

/** The company page as a person with `role` sees it, who may invite as `mayInviteAs`. */
function companyPage(role: 'owner' | 'member', mayInviteAs: ('owner' | 'admin' | 'member')[]) {
  const company = { id: COMPANY, name: LONG_NAME }
  const people = [
    { personId: ANA.id, name: ANA.name, email: ANA.email, role: 'owner' },
    {
      personId: 'person-long',
      name: 'Nome Completo Muito Comprido',
      email: LONG_EMAIL,
      role: 'member',
    },
  ] as const
  const pending = [
    { id: 'p'.repeat(32), email: LONG_EMAIL, role: 'admin', expiresAt: '2026-10-17T12:00:00.000Z' },
  ] as const
  return {
    ...SIGNED_IN,
    [`GET /api/companies/${COMPANY}`]: ok(getCompany, { company, role, mayInviteAs }),
    [`GET /api/companies/${COMPANY}/members`]: ok(listMembers, {
      members: [...people],
      next: { kind: 'END' },
    }),
    [`GET /api/companies/${COMPANY}/invitations`]: ok(listInvitations, {
      invitations: [...pending],
      next: { kind: 'END' },
    }),
  }
}

function received(state: 'PENDING' | 'EXPIRED' | 'ACCEPTED' | 'CANCELED'): Replies {
  const invitation = {
    id: INVITATION,
    company: { id: COMPANY, name: LONG_NAME },
    role: 'admin',
    inviterName: 'Ana Lima',
    state,
  } as const
  return { ...SIGNED_IN, [`GET /api/invitations/${INVITATION}`]: ok(getInvitation, { invitation }) }
}

type State = {
  name: string
  path: string
  replies: Replies
  /** Waits for the screen and brings it to the state: a form refused, a field filled. */
  settle(page: Page): Promise<void>
}

async function waitFor(page: Page, text: string) {
  await page.getByText(text).first().waitFor()
}

/** Submits the invitation form, which the state's replies refuse, and waits for the refusal. */
async function inviteRefused(page: Page, sentence: string) {
  await page.getByLabel('E-mail').fill('davi@example.test')
  await page.getByRole('button', { name: 'Enviar convite' }).click()
  await waitFor(page, sentence)
}

const OWNER = companyPage('owner', ['owner', 'admin', 'member'])
const MEMBER = companyPage('member', [])
const NO_COMPANIES = companies([], false)
const NEVER = new Promise<never>(() => undefined)

const STATES: State[] = [
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
    path: `/companies/${COMPANY}`,
    replies: OWNER,
    settle: (p) => waitFor(p, 'Convidar pessoa'),
  },
  {
    name: 'membro',
    path: `/companies/${COMPANY}`,
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
    path: `/companies/${COMPANY}`,
    replies: { ...OWNER, [`POST /api/companies/${COMPANY}/invitations`]: failure('MEMBER_EXISTS') },
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
    path: `/companies/${COMPANY}`,
    replies: {
      ...OWNER,
      [`POST /api/companies/${COMPANY}/invitations`]: failure('MAIL_UNAVAILABLE'),
    },
    settle: (page) => inviteRefused(page, 'O e-mail não pôde ser enviado agora.'),
  },
]

const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

/** Every stop the key reaches before focus leaves the page. */
async function walk(page: Page, key: string): Promise<string[]> {
  const stops: string[] = []
  for (let stop = 0; stop < 40; stop++) {
    const [reached] = await presses(page, key, 1)
    if (reached === undefined || reached === 'body') return stops
    stops.push(reached)
  }
  throw new Error(`${key} never left the page`)
}

/** Back out of wherever the state left focus, then forward through the whole page. */
async function tabStops(page: Page): Promise<string[]> {
  const back = await walk(page, 'Shift+Tab')
  return [...new Set([...back, ...(await walk(page, 'Tab'))])]
}

const VIEWPORTS: Viewport[] = [DESKTOP, PHONE, SMALL_PHONE]
for (const state of STATES) {
  for (const viewport of VIEWPORTS) {
    for (const scheme of ['light', 'dark'] as const) {
      test(`${state.name}, ${viewport.width}px, tema ${scheme}: sem rolagem lateral e contorno de 2px em cada parada do Tab`, async () => {
        const page = await harness.open(state.path, { viewport, replies: state.replies, scheme })
        await state.settle(page)
        const { scroll, inner } = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          inner: window.innerWidth,
        }))
        assert.ok(scroll <= inner, `the page scrolls sideways: ${scroll}px in ${inner}px`)
        const stops = await tabStops(page)
        const flawed = stops.filter((stop) => !/ solid 2px( inside)?$/.test(stop))
        assert.deepEqual(flawed, [])
        await page.close()
      })
    }
  }
}

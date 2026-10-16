import { getInvitation, listInvitations } from '@conexus/hub-api'
import type { Page } from 'playwright-core'
import type { Replies } from './layout-harness.ts'
import { failure, ok } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import {
  companies,
  INVITATION,
  INVITATION_DETAILS,
  LONG_EMAIL,
  LONG_NAME,
  MEMBER,
  NO_COMPANIES,
  OWNER,
  received,
  SIGNED_IN,
  SIGNED_OUT,
  WITH_EXPIRED,
} from './sweep-replies.ts'

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
    replies: {
      ...SIGNED_OUT,
      [`GET /api/invitations/${INVITATION}`]: ok(getInvitation, {
        invitation: {
          kind: 'NEW',
          email: LONG_EMAIL,
          ...INVITATION_DETAILS,
        },
      }),
    },
    settle: async (page) => {
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
    settle: (p) => waitFor(p, 'Este convite venceu.'),
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
    settle: (p) => waitFor(p, 'Confira o endereço do convite.'),
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

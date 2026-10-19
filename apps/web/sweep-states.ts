import { getInvitation, listInvitations } from '@conexus/hub-api'
import type { Page } from 'playwright-core'
import { failure, ok } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { APP_STATES } from './sweep-app-states.ts'
import { CONVERSATION_STATES } from './sweep-conversation-states.ts'
import type { State } from './sweep-kit.ts'
import { waitFor } from './sweep-kit.ts'
import { PROJECT_STATES } from './sweep-project-states.ts'
import { RECOVERY_STATES } from './sweep-recovery-states.ts'
import {
  CLIENT_ID,
  central,
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

/** Submits the invitation form, which the state's replies refuse, and waits for the refusal. */
async function inviteRefused(page: Page, sentence: string) {
  await page.getByLabel('E-mail').fill('davi@example.test')
  await page.getByRole('button', { name: 'Enviar convite', exact: true }).click()
  await waitFor(page, sentence)
}

const NEVER = new Promise<never>(() => undefined)

export const STATES: State[] = [
  ...RECOVERY_STATES,
  ...PROJECT_STATES,
  ...CONVERSATION_STATES,
  ...APP_STATES,
  {
    name: 'Central sem clientes',
    path: '/operations/clients',
    replies: central('NONE'),
    settle: (p) => waitFor(p, 'Nenhum cliente cadastrado.'),
  },
  {
    name: 'Central com um cliente',
    path: '/operations/clients',
    replies: central('AWAITING'),
    settle: (p) => waitFor(p, `Convite vencido: ${LONG_EMAIL}`),
  },
  {
    name: 'cadastrar cliente, recusado no campo',
    path: '/operations/clients/new',
    replies: { ...central('NONE'), 'POST /api/clients': failure('CLIENT_EXISTS') },
    settle: async (page) => {
      await page.getByLabel('CNPJ').fill('12.ABC.345/01DE-35')
      await page.getByLabel('Razão social').fill(LONG_NAME)
      await page.getByLabel('Nome de exibição').fill('Empresa Teste')
      await page.getByLabel('E-mail do administrador').fill(LONG_EMAIL)
      await page.getByRole('button', { name: 'Cadastrar cliente', exact: true }).click()
      await waitFor(page, 'Já existe um cliente com este CNPJ.')
    },
  },
  {
    name: 'cliente aguardando, convidar outro e-mail',
    path: `/operations/clients/${CLIENT_ID}`,
    replies: central('AWAITING'),
    settle: async (page) => {
      await page.getByRole('button', { name: 'Convidar outro e-mail' }).click()
      await page.getByLabel('E-mail do administrador').waitFor()
    },
  },
  {
    name: 'cliente aguardando, corrigir dados',
    path: `/operations/clients/${CLIENT_ID}`,
    replies: central('AWAITING'),
    settle: async (page) => {
      await page.getByRole('button', { name: 'Corrigir dados' }).click()
      await page.getByLabel('Razão social').waitFor()
    },
  },
  {
    name: 'cliente ativo',
    path: `/operations/clients/${CLIENT_ID}`,
    replies: central('ACTIVE'),
    settle: (p) => waitFor(p, 'Convidar pessoa'),
  },
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
    name: 'dono',
    path: `/companies/${COMPANY.id}/people`,
    replies: OWNER,
    settle: (p) => waitFor(p, 'Convidar pessoa'),
  },
  {
    name: 'sem convites pendentes',
    path: `/companies/${COMPANY.id}/people`,
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
    name: 'tirar uma pessoa, a confirmação',
    path: `/companies/${COMPANY.id}/people`,
    replies: OWNER,
    settle: async (page) => {
      await page.getByRole('button', { name: /^Tirar da empresa:/ }).click()
      await waitFor(page, 'Perde o acesso agora.')
    },
  },
  {
    name: 'mudar o papel de uma pessoa',
    path: `/companies/${COMPANY.id}/people`,
    replies: OWNER,
    settle: async (page) => {
      await page.getByRole('button', { name: /^Mudar papel:/ }).click()
      await waitFor(page, 'Papel atual: Membro.')
    },
  },
  {
    name: 'convite vencido na lista',
    path: `/companies/${COMPANY.id}/people`,
    replies: WITH_EXPIRED,
    settle: (p) => waitFor(p, 'Reenviar'),
  },
  {
    name: 'convidar de novo recusado',
    path: `/companies/${COMPANY.id}/people`,
    replies: {
      ...WITH_EXPIRED,
      [`POST /api/companies/${COMPANY.id}/invitations`]: failure('MEMBER_EXISTS'),
    },
    settle: async (page) => {
      await page
        .getByRole('button', { name: /^Reenviar convite para/ })
        .last()
        .click()
      await waitFor(page, 'Essa pessoa já está na empresa.')
    },
  },
  {
    name: 'empresa que o Hub não acha',
    path: `/companies/${COMPANY.id}/people`,
    replies: { ...SIGNED_IN, [`GET /api/companies/${COMPANY.id}`]: failure('NOT_FOUND') },
    settle: (p) => waitFor(p, 'Não encontramos o que você procurou.'),
  },
  {
    name: 'membro',
    path: `/companies/${COMPANY.id}/people`,
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
    path: `/companies/${COMPANY.id}/people`,
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
    path: `/companies/${COMPANY.id}/people`,
    replies: {
      ...OWNER,
      [`POST /api/companies/${COMPANY.id}/invitations`]: failure('MAIL_UNAVAILABLE'),
    },
    settle: (page) => inviteRefused(page, 'O e-mail não pôde ser enviado agora.'),
  },
]

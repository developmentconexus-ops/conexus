import { getCompany, getInvitation, listAppAccess, listMyApps } from '@conexus/hub-api'
import type { Page } from 'playwright-core'
import { failure, ok } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import type { State } from './sweep-kit.ts'
import { createRefused, waitFor } from './sweep-kit.ts'
import {
  INVITATION,
  INVITATION_DETAILS,
  LONG_EMAIL,
  LONG_NAME,
  NO_COMPANIES,
  OWNER,
  PROJECT_ID,
  projectsPage,
  SIGNED_IN,
  SIGNED_OUT,
  startsOn,
} from './sweep-replies.ts'

const STEP_ONE = `/companies/${COMPANY.id}/welcome/company`
const NICKNAME = `PUT /api/companies/${COMPANY.id}/nickname`
const OPEN = `/apps/open?host=pedidos--empresa-teste&binding=${'b'.repeat(43)}`
// The company before its owner chooses the nickname, so its pages lead to step 1 alone.
const UNSET = {
  ...OWNER,
  [`GET /api/companies/${COMPANY.id}`]: ok(getCompany, {
    company: { id: COMPANY.id, name: LONG_NAME, nickname: null, appsDomain: 'apps.example.test' },
    role: 'owner',
    mayInviteAs: ['owner', 'admin', 'member'],
  }),
}

const ACCESS = `/companies/${COMPANY.id}/projects/${PROJECT_ID}?lens=project&section=access`
const APP = {
  projectName: 'Encomendas',
  companyName: LONG_NAME,
  address: 'encomendas--sol.apps.example.test',
}
const PERSON = { personId: 'person-dora', name: LONG_NAME, email: LONG_EMAIL }

function accessList(mayManage: boolean) {
  return {
    [`GET /api/companies/${COMPANY.id}/projects/${PROJECT_ID}/access`]: ok(listAppAccess, {
      roles: [{ name: 'vendedor', label: 'Vendedor' }],
      published: true,
      members: [{ personId: 'person-ana', name: LONG_NAME, email: LONG_EMAIL }],
      people: [
        { ...PERSON, role: 'vendedor', roleDeclared: true, grantedAt: '2026-10-28T12:00:00.000Z' },
        {
          ...PERSON,
          personId: 'person-edu',
          role: 'gerente',
          roleDeclared: false,
          grantedAt: '2026-10-28T12:00:00.000Z',
        },
      ],
      invitations: [
        {
          id: 'c'.repeat(32),
          email: LONG_EMAIL,
          role: 'vendedor',
          expiresAt: '2026-11-04T12:00:00.000Z',
        },
      ],
      mayManage,
    }),
  }
}

async function saveRefused(page: Page, sentence: string) {
  await page.getByLabel('Apelido').fill('conexus')
  await page.getByRole('button', { name: 'Salvar e continuar', exact: true }).click()
  await waitFor(page, sentence)
}

export const APP_STATES: State[] = [
  {
    name: 'passo 1, sua empresa',
    path: STEP_ONE,
    replies: UNSET,
    settle: (p) => waitFor(p, 'Exemplo de endereço'),
  },
  {
    name: 'passo 1, apelido reservado',
    path: STEP_ONE,
    replies: { ...UNSET, [NICKNAME]: failure('COMPANY_NICKNAME_RESERVED') },
    settle: (p) => saveRefused(p, 'Esse apelido é reservado.'),
  },
  {
    name: 'passo 1, banco fora',
    path: STEP_ONE,
    replies: { ...UNSET, [NICKNAME]: failure('DATABASE_UNAVAILABLE') },
    settle: (page) => saveRefused(page, 'O banco do Conexus não respondeu.'),
  },
  {
    name: 'criar Projeto, nome sem endereço',
    path: `/companies/${COMPANY.id}`,
    replies: {
      ...OWNER,
      ...projectsPage(COMPANY.id, { empty: true }),
      ...startsOn(COMPANY.id),
      [`POST /api/companies/${COMPANY.id}/projects`]: failure('PROJECT_NAME_NO_ADDRESS'),
    },
    settle: (page) =>
      createRefused(page, 'O nome precisa ter ao menos três letras ou números.', 'TI'),
  },
  {
    name: 'abrir app, recusado',
    path: OPEN,
    replies: SIGNED_IN,
    settle: (p) => waitFor(p, 'Este app não existe ou você não tem acesso a ele.'),
  },
  {
    name: 'abrir app, sessão sem banco',
    path: OPEN,
    replies: { 'GET /api/sessions/current': failure('DATABASE_UNAVAILABLE') },
    settle: (p) => waitFor(p, 'O banco do Conexus não respondeu.'),
  },
  {
    name: 'Quem usa o app, quem gerencia',
    path: ACCESS,
    replies: { ...OWNER, ...projectsPage(COMPANY.id), ...accessList(true) },
    settle: (p) => waitFor(p, 'Dar acesso'),
  },
  {
    name: 'Quem usa o app, o membro',
    path: ACCESS,
    replies: { ...OWNER, ...projectsPage(COMPANY.id), ...accessList(false) },
    settle: (p) => waitFor(p, 'Só o dono ou um administrador dá ou tira acesso ao app.'),
  },
  {
    name: 'Seus apps',
    path: '/',
    replies: {
      ...NO_COMPANIES,
      'GET /api/apps': ok(listMyApps, { apps: [APP, { ...APP, projectName: LONG_NAME }] }),
    },
    settle: (p) => waitFor(p, 'Seus apps'),
  },
  {
    name: 'convite de um app',
    path: `/invitations/${INVITATION}`,
    replies: {
      ...SIGNED_OUT,
      [`GET /api/invitations/${INVITATION}`]: ok(getInvitation, {
        invitation: {
          kind: 'NEW',
          email: LONG_EMAIL,
          ...INVITATION_DETAILS,
          app: { projectName: LONG_NAME },
        },
      }),
    },
    settle: (p) => waitFor(p, 'Criar senha'),
  },
]

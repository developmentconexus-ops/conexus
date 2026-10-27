import { getCompany } from '@conexus/hub-api'
import type { Page } from 'playwright-core'
import { failure, ok } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import type { State } from './sweep-kit.ts'
import { createRefused, waitFor } from './sweep-kit.ts'
import { LONG_NAME, OWNER, projectsPage, SIGNED_IN, startsOn } from './sweep-replies.ts'

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
]

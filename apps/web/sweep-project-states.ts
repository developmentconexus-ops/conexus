import type { Page } from 'playwright-core'
import { failure } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import type { State } from './sweep-kit.ts'
import { waitFor } from './sweep-kit.ts'
import {
  CLIENT_ID,
  central,
  companies,
  OWNER,
  PROJECT_ID,
  PROJECT_NAME,
  projectsPage,
} from './sweep-replies.ts'

const HOME = `/companies/${COMPANY.id}`
const PROJECTS = `${HOME}/projects`
const OF_OWNER = { ...OWNER, ...projectsPage(COMPANY.id) }
const NOBODY = { ...OWNER, ...projectsPage(COMPANY.id, { empty: true }) }
const OF_MEMBER = { ...OWNER, ...projectsPage(COMPANY.id, { mayDelete: false }) }

async function createRefused(page: Page, sentence: string) {
  await page.getByLabel('Nome do projeto').fill('Pedidos')
  await page.getByRole('button', { name: 'Criar projeto', exact: true }).click()
  await waitFor(page, sentence)
}

async function openDeletion(page: Page) {
  await page.getByRole('button', { name: 'Apagar Projeto', exact: true }).click()
  await waitFor(page, 'Isto não se desfaz.')
}

export const PROJECT_STATES: State[] = [
  {
    name: 'Todos os projetos, vazio',
    path: PROJECTS,
    replies: NOBODY,
    settle: (p) => waitFor(p, 'Nenhum projeto ainda.'),
  },
  {
    name: 'Todos os projetos, com um Projeto',
    path: PROJECTS,
    replies: OF_OWNER,
    settle: (p) => waitFor(p, 'Criado em'),
  },
  {
    name: 'criar Projeto, nome repetido',
    path: HOME,
    replies: {
      ...NOBODY,
      [`POST /api/companies/${COMPANY.id}/projects`]: failure('PROJECT_NAME_TAKEN'),
    },
    settle: (p) => createRefused(p, 'Já existe um Projeto com esse nome nesta empresa.'),
  },
  {
    name: 'criar Projeto, banco em preparo',
    path: HOME,
    replies: {
      ...NOBODY,
      [`POST /api/companies/${COMPANY.id}/projects`]: failure('COMPANY_DATABASE_PREPARING'),
    },
    settle: async (page) => {
      await createRefused(page, 'O banco da empresa está sendo preparado.')
      await page.getByRole('button', { name: 'Tentar de novo' }).waitFor()
    },
  },
  {
    name: 'Projeto do dono',
    path: `${PROJECTS}/${PROJECT_ID}`,
    replies: OF_OWNER,
    settle: (p) => waitFor(p, 'Apagar Projeto'),
  },
  {
    name: 'Projeto do membro',
    path: `${PROJECTS}/${PROJECT_ID}`,
    replies: OF_MEMBER,
    settle: (p) => p.getByRole('heading', { level: 1, name: PROJECT_NAME }).waitFor(),
  },
  {
    name: 'apagar Projeto, a confirmação',
    path: `${PROJECTS}/${PROJECT_ID}`,
    replies: OF_OWNER,
    settle: openDeletion,
  },
  {
    name: 'apagar Projeto, o nome não confere',
    path: `${PROJECTS}/${PROJECT_ID}`,
    replies: {
      ...OF_OWNER,
      [`DELETE /api/companies/${COMPANY.id}/projects/${PROJECT_ID}`]:
        failure('PROJECT_NAME_MISMATCH'),
    },
    settle: async (page) => {
      await openDeletion(page)
      await page.getByLabel('Digite o nome do Projeto').fill(PROJECT_NAME)
      await page.getByRole('button', { name: 'Apagar Projeto', exact: true }).last().click()
      await waitFor(page, 'O nome não confere.')
    },
  },
  {
    name: 'troca de empresa aberta',
    path: `/companies/${'0'.repeat(32)}/projects`,
    replies: companies(
      [
        { name: 'Empresa Teste', role: 'owner' },
        { name: 'Outra Empresa', role: 'member' },
      ],
      false,
    ),
    settle: async (page) => {
      // On a phone the switcher heads the drawer, which is closed until asked.
      if ((page.viewportSize()?.width ?? 0) < 768) {
        await page.getByRole('button', { name: 'Abrir navegação' }).click()
      }
      await page.getByRole('button', { name: /^Trocar de empresa/ }).click()
      await waitFor(page, 'Suas empresas')
    },
  },
  {
    name: 'Central, cliente com a exclusão em andamento',
    path: `/operations/clients/${CLIENT_ID}`,
    replies: central('DELETING'),
    settle: (p) => waitFor(p, 'Tentar concluir exclusão'),
  },
  {
    name: 'Central, concluir exclusão recusado',
    path: `/operations/clients/${CLIENT_ID}`,
    replies: {
      ...central('DELETING'),
      [`DELETE /api/clients/${CLIENT_ID}`]: failure('CLIENT_DELETION_PENDING'),
    },
    settle: async (page) => {
      await page.getByRole('button', { name: 'Tentar concluir exclusão' }).click()
      await waitFor(page, 'A exclusão começou, mas o banco da empresa ainda não saiu.')
    },
  },
]

import { listAppVersions } from '@conexus/hub-api'
import type { Page } from 'playwright-core'
import { failure, ok } from './layout-harness.ts'
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

const PROJECTS = `/companies/${COMPANY.id}/projects`
const ABOUT = `${PROJECTS}/${PROJECT_ID}?lens=project`
const VERSIONS = `${ABOUT}&section=versions`
const OF_OWNER = { ...OWNER, ...projectsPage(COMPANY.id) }
const NOBODY = { ...OWNER, ...projectsPage(COMPANY.id, { empty: true }) }
const OF_MEMBER = { ...OWNER, ...projectsPage(COMPANY.id, { mayDelete: false }) }

async function createRefused(page: Page, sentence: string) {
  await page.getByLabel('Nome do Projeto').fill('Pedidos')
  await page.getByRole('button', { name: 'Criar Projeto', exact: true }).click()
  await waitFor(page, sentence)
}

async function openDeletion(page: Page) {
  await page.getByRole('button', { name: 'Apagar Projeto', exact: true }).click()
  await waitFor(page, 'Isto não se desfaz.')
}

export const PROJECT_STATES: State[] = [
  {
    name: 'Projetos, vazio',
    path: PROJECTS,
    replies: NOBODY,
    settle: (p) => waitFor(p, 'Nenhum Projeto ainda.'),
  },
  {
    name: 'Projetos, com um Projeto',
    path: PROJECTS,
    replies: OF_OWNER,
    settle: (p) => waitFor(p, 'Criado em'),
  },
  {
    name: 'criar Projeto, nome repetido',
    path: PROJECTS,
    replies: {
      ...NOBODY,
      [`POST /api/companies/${COMPANY.id}/projects`]: failure('PROJECT_NAME_TAKEN'),
    },
    settle: (p) => createRefused(p, 'Já existe um Projeto com esse nome nesta empresa.'),
  },
  {
    name: 'criar Projeto, banco em preparo',
    path: PROJECTS,
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
    name: 'Projeto, Sobre do dono',
    path: ABOUT,
    replies: OF_OWNER,
    settle: (p) => waitFor(p, 'Apagar Projeto'),
  },
  {
    name: 'Projeto, Sobre do membro',
    path: ABOUT,
    replies: OF_MEMBER,
    settle: (p) => waitFor(p, 'Só o dono ou quem administra a empresa pode apagar o Projeto.'),
  },
  {
    name: 'Projeto, Versões do dono',
    path: VERSIONS,
    replies: {
      ...OF_OWNER,
      [`GET /api/companies/${COMPANY.id}/projects/${PROJECT_ID}/versions`]: ok(listAppVersions, {
        versions: [],
      }),
    },
    settle: (p) => waitFor(p, 'Nenhuma versão enviada.'),
  },
  {
    name: 'Projeto, Versões do membro',
    path: VERSIONS,
    replies: OF_MEMBER,
    settle: (p) => waitFor(p, 'Só o dono ou quem administra a empresa vê e envia as versões.'),
  },
  {
    name: 'apagar Projeto, a confirmação',
    path: ABOUT,
    replies: OF_OWNER,
    settle: openDeletion,
  },
  {
    name: 'apagar Projeto, o nome não confere',
    path: ABOUT,
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

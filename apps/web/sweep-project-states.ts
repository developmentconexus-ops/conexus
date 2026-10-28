import { listAppVersions, readProjectFile, readProjectSource } from '@conexus/hub-api'
import type { Page } from 'playwright-core'
import type { Replies } from './layout-harness.ts'
import { failure, ok } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import type { State } from './sweep-kit.ts'
import { createRefused, waitFor } from './sweep-kit.ts'
import {
  CLIENT_ID,
  central,
  companies,
  OWNER,
  PROJECT_ID,
  PROJECT_NAME,
  projectsPage,
  startsOn,
} from './sweep-replies.ts'

const HOME = `/companies/${COMPANY.id}`
const PROJECTS = `${HOME}/projects`
const ABOUT = `${PROJECTS}/${PROJECT_ID}?lens=project`
const CODE = `${PROJECTS}/${PROJECT_ID}?lens=code`
const SOURCE = `/api/companies/${COMPANY.id}/projects/${PROJECT_ID}/source`
const VERSIONS = `${ABOUT}&section=versions`
const OF_OWNER = { ...OWNER, ...projectsPage(COMPANY.id) }
const NOBODY = { ...OWNER, ...projectsPage(COMPANY.id, { empty: true }), ...startsOn(COMPANY.id) }
const OF_MEMBER = { ...OWNER, ...projectsPage(COMPANY.id, { mayDelete: false }) }

/** A file with a keyword, a string, a comment and a function, over four lines. */
const FILE_TEXT = `import { listar } from './listar'
// as encomendas do dia
export const encomendas = listar('hoje')
export function total() { return encomendas.length }
`

/** The Projeto's first version, its files in the tree and the first one's text. */
function withVersion(paths: string[], text = FILE_TEXT): Replies {
  return {
    ...OF_OWNER,
    [`GET ${SOURCE}`]: ok(readProjectSource, {
      version: 1,
      commit: 'a'.repeat(40),
      savedAt: '2026-10-21T12:00:00.000Z',
      files: paths.map((path) => ({ path, bytes: 40 })),
    }),
    [`GET ${SOURCE}/file`]: ok(readProjectFile, { text }),
  }
}

async function openFiles(page: Page) {
  await waitFor(page, 'Versão 1, guardada em')
  if ((page.viewportSize()?.width ?? 0) < 768) {
    await page.getByRole('button', { name: 'Arquivos', exact: true }).click()
  }
  await page.getByRole('tree', { name: 'Arquivos do app' }).waitFor()
}

async function openDeletion(page: Page) {
  await page.getByRole('button', { name: 'Apagar Projeto', exact: true }).click()
  await waitFor(page, 'Isto não se desfaz.')
}

/**
 * The kit's folder holds 50 files, so the phone's Sheet has to scroll to the last (criterion 23).
 * Kept out of the sweep: its Tab walk stops at 40 and this list has more rows than that.
 */
export const LONG_TREE: State = {
  name: 'Projeto, Código com a lista longa',
  path: CODE,
  replies: withVersion([
    'src/router.tsx',
    ...Array.from({ length: 50 }, (_, at) => `src/components/ui/peca-${at + 1}.tsx`),
  ]),
  settle: async (page) => {
    await openFiles(page)
    await page.getByRole('treeitem', { name: 'components', exact: true }).click()
    await page.getByRole('treeitem', { name: 'ui', exact: true }).click()
    await page.getByRole('treeitem', { name: 'peca-50.tsx' }).waitFor({ state: 'attached' })
  },
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
    settle: (p) => waitFor(p, 'Nenhuma versão foi ao app ainda.'),
  },
  {
    name: 'Projeto, Versões do membro',
    path: VERSIONS,
    replies: {
      ...OF_MEMBER,
      [`GET /api/companies/${COMPANY.id}/projects/${PROJECT_ID}/versions`]: ok(listAppVersions, {
        versions: [],
      }),
    },
    settle: (p) => waitFor(p, 'Nenhuma versão foi ao app ainda.'),
  },
  {
    name: 'Projeto, Código com a árvore',
    path: CODE,
    replies: withVersion([
      'package.json',
      'src/router.tsx',
      'src/pages/encomendas.tsx',
      'src/components/ui/button.tsx',
    ]),
    settle: openFiles,
  },
  {
    name: 'Projeto, Código de um app vazio',
    path: CODE,
    replies: withVersion([]),
    settle: (p) => waitFor(p, 'Este app ainda está vazio'),
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

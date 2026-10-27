import { getStatus } from '@conexus/hub-api'
import type { Page } from 'playwright-core'
import { failure, ok } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import type { State } from './sweep-kit.ts'
import { waitFor } from './sweep-kit.ts'
import { central, MEMBER, OWNER, startsOn } from './sweep-replies.ts'

const HOME = `/companies/${COMPANY.id}`
const SETTINGS = `${HOME}/settings`
const WELCOME = `${HOME}/welcome`

/** Opens what sits in the sidebar, which on a phone is the drawer, closed until asked. */
async function inSidebar(page: Page, name: string | RegExp) {
  if ((page.viewportSize()?.width ?? 0) < 768) {
    await page.getByRole('button', { name: 'Abrir navegação' }).click()
  }
  await page.getByRole('button', { name }).click()
}

// The screens step 12.2 brings: Início, Configurações, the owner's first entry and the account.
export const HOUSE_STATES: State[] = [
  {
    name: 'Início do dono, com o cartão de preparo',
    path: HOME,
    replies: OWNER,
    settle: (p) => waitFor(p, 'Termine de preparar a empresa'),
  },
  {
    name: 'Início do membro',
    path: HOME,
    replies: MEMBER,
    settle: (p) => waitFor(p, 'Criado em'),
  },
  {
    name: 'menu da conta aberto',
    path: HOME,
    replies: MEMBER,
    settle: async (page) => {
      await inSidebar(page, 'Conta de Ana Lima')
      await waitFor(page, 'Sair do Conexus')
    },
  },
  {
    name: 'Configurações, minha conta',
    path: `${SETTINGS}/account`,
    replies: OWNER,
    settle: (p) => waitFor(p, 'Minha conta'),
  },
  {
    name: 'Configurações, busca sem resultado',
    path: `${SETTINGS}/account`,
    replies: OWNER,
    settle: async (page) => {
      if ((page.viewportSize()?.width ?? 0) < 768) {
        await page.getByRole('button', { name: 'Abrir navegação' }).click()
      }
      await page.getByRole('searchbox').fill('nada disso')
      await waitFor(page, 'Nenhuma seção encontrada.')
    },
  },
  {
    name: 'Configurações, aparência',
    path: `${SETTINGS}/appearance`,
    replies: OWNER,
    settle: (p) => waitFor(p, 'Como o sistema'),
  },
  {
    name: 'Configurações, geral',
    path: `${SETTINGS}/general`,
    replies: OWNER,
    settle: (p) => waitFor(p, 'Exemplo de endereço'),
  },
  {
    name: 'Configurações, contas de modelo do membro',
    path: `${SETTINGS}/model-accounts`,
    replies: MEMBER,
    settle: (p) => waitFor(p, 'Só o dono ou um administrador muda as contas de modelo'),
  },
  {
    name: 'Configurações, minhas contas de modelo',
    path: `${SETTINGS}/my-model-accounts`,
    replies: MEMBER,
    settle: (p) => waitFor(p, 'Nenhuma conta sua'),
  },
  {
    name: 'passo 2, conta de modelo',
    path: `${WELCOME}/model-account`,
    replies: OWNER,
    settle: (p) => waitFor(p, 'Passo 2 de 4'),
  },
  {
    name: 'passo 3, convite recusado',
    path: `${WELCOME}/team`,
    replies: {
      ...OWNER,
      [`POST /api/companies/${COMPANY.id}/invitations`]: failure('MEMBER_EXISTS'),
    },
    settle: async (page) => {
      await page.getByLabel('E-mail').fill('davi@example.test')
      await page.getByRole('button', { name: 'Enviar convite', exact: true }).click()
      await waitFor(page, 'Essa pessoa já está na empresa.')
    },
  },
  {
    name: 'passo 4',
    path: `${WELCOME}/build`,
    replies: { ...OWNER, ...startsOn(COMPANY.id) },
    settle: (p) => waitFor(p, 'Ir para o início sem pedir nada'),
  },
  {
    name: 'Central, estado do Hub',
    path: '/operations/status',
    replies: {
      ...central('NONE'),
      'GET /api/status': ok(getStatus, {
        version: 'v0.3.0',
        lastStart: { state: 'NONE' },
        previousStart: { state: 'NONE' },
      }),
    },
    settle: (p) => waitFor(p, 'v0.3.0'),
  },
]

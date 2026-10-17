import { FAILURES } from '@conexus/hub-api'
import type { Page } from 'playwright-core'
import { failure } from './layout-harness.ts'
import type { State } from './sweep-kit.ts'
import { waitFor } from './sweep-kit.ts'
import { SIGNED_OUT } from './sweep-replies.ts'

async function choosePassword(page: Page, password: string) {
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByLabel('Repita a senha').fill(password)
  await page.getByRole('button', { name: 'Criar a senha' }).click()
}

async function askForLink(page: Page) {
  await page.getByLabel('E-mail').fill('ana@example.test')
  await page.getByRole('button', { name: 'Enviar o link' }).click()
}

/** The screens of a forgotten password: asking for the link, the new password, and the way back. */
export const RECOVERY_STATES: State[] = [
  {
    name: 'link de senha nova',
    path: '/set-password#token=abc&kind=recovery',
    replies: SIGNED_OUT,
    settle: (p) => waitFor(p, 'Criar senha nova'),
  },
  {
    name: 'link de senha vencido',
    path: '/set-password#token=abc&kind=recovery',
    replies: { ...SIGNED_OUT, 'PUT /api/passwords': failure('PASSWORD_LINK_INVALID') },
    settle: async (page) => {
      await choosePassword(page, 'senha-nova-1')
      await page.getByRole('link', { name: 'Pedir outro link' }).waitFor()
    },
  },
  {
    name: 'senha vazada',
    path: '/set-password#token=abc&kind=recovery',
    replies: { ...SIGNED_OUT, 'PUT /api/passwords': failure('PASSWORD_COMPROMISED') },
    settle: async (page) => {
      await choosePassword(page, '123456789')
      await waitFor(page, FAILURES.PASSWORD_COMPROMISED.phrase)
    },
  },
  {
    name: 'senha trocada',
    path: '/login?reason=password-changed',
    replies: SIGNED_OUT,
    settle: (p) => waitFor(p, 'Senha trocada. Entre com a nova senha.'),
  },
  {
    name: 'esqueci minha senha',
    path: '/forgot-password',
    replies: SIGNED_OUT,
    settle: (p) => waitFor(p, 'Esqueci minha senha'),
  },
  {
    name: 'esqueci minha senha, enviado',
    path: '/forgot-password',
    replies: { ...SIGNED_OUT, 'POST /api/password-recoveries': { status: 202 } },
    settle: async (page) => {
      await askForLink(page)
      await waitFor(page, 'Se houver uma conta com esse e-mail')
    },
  },
  {
    name: 'esqueci minha senha, limite',
    path: '/forgot-password',
    replies: {
      ...SIGNED_OUT,
      'POST /api/password-recoveries': failure('RECOVERY_ATTEMPTS_EXCEEDED'),
    },
    settle: async (page) => {
      await askForLink(page)
      await waitFor(page, FAILURES.RECOVERY_ATTEMPTS_EXCEEDED.phrase)
    },
  },
]

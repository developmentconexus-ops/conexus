import assert from 'node:assert/strict'
import type { Page } from 'playwright-core'
import type { Mail } from './live-hub.ts'
import { linkIn, sidebarOf } from './live-hub.ts'

// What the journeys that start in the Operations Central share: the operator registers a client,
// and its administrator creates a password from the first-owner invitation.
const NEW_PASSWORD = 'senha-nova-1'

/** The operator registers a client from the Central's sidebar and sees it awaiting its administrator. */
export async function registerClient(
  page: Page,
  client: { cnpj: string; legalName: string; name: string },
  adminEmail: string,
) {
  await sidebarOf(page).getByRole('link', { name: 'Clientes', exact: true }).click()
  await page.getByRole('link', { name: 'Cadastrar cliente' }).click()
  await page.getByLabel('CNPJ').fill(client.cnpj)
  await page.getByLabel('Razão social').fill(client.legalName)
  await page.getByLabel('Nome de exibição').fill(client.name)
  await page.getByLabel('E-mail do administrador').fill(adminEmail)
  await page.getByRole('button', { name: 'Cadastrar cliente' }).click()
  await page.getByRole('heading', { name: client.name, exact: true }).waitFor()
  await page.getByText('Aguardando o administrador').first().waitFor()
}

/** The first owner's mail: from Conexus, as the first owner of `company`; returns its link. */
export async function ownerInvitationLink(
  next: () => Promise<Mail>,
  company: string,
  adminEmail: string,
): Promise<string> {
  const mail = await next()
  const words = `Conexus convidou você para ser o primeiro dono de ${company}`
  assert.deepEqual([mail.to, mail.subject], [adminEmail, words])
  assert.ok(mail.text.includes(words), mail.text)
  return linkIn(mail)
}

/** On the invitation's page, a person without an account creates the password. */
export async function createPassword(page: Page, name: string) {
  await page.getByLabel('Nome').fill(name)
  await page.getByLabel('Senha', { exact: true }).fill(NEW_PASSWORD)
  await page.getByLabel('Confirmar senha', { exact: true }).fill(NEW_PASSWORD)
  await page.getByRole('button', { name: 'Criar senha', exact: true }).click()
}

/** The invitation's page says who invited to which company; "Aceitar convite" joins it. */
export async function acceptFirstOwnerInvitation(page: Page, company: string) {
  await page
    .getByRole('heading', { name: `Conexus convidou você para ser o primeiro dono de ${company}.` })
    .waitFor()
  await page.getByRole('button', { name: 'Aceitar convite' }).click()
}

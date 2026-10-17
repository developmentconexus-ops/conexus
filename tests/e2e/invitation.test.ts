import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { mkdtempSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { hashPassword } from 'better-auth/crypto'
import type { Browser, BrowserContext, Page } from 'playwright-core'
import { chromium } from 'playwright-core'
import { build } from 'vite'
import { createStatus } from '../../apps/server/src/hub/status/public.ts'
import { createHub, identityOf, operationsOf } from '../../apps/server/src/main.ts'
import {
  createTestDatabase,
  TEST_ORIGIN,
  testConfig,
} from '../../apps/server/src/platform/test-database.ts'

// The founder's invitation journey, run in Chromium against a real Hub
// on a real database. Only the mail provider is faked, at its HTTP door (testing T14, T16).
const PASSWORD = 'senha-certa-1'
const NEW_PASSWORD = 'senha-nova-1'
const ANA = { name: 'Ana Lima', email: 'ana@example.test' }
const DAVI = { name: 'Davi Costa', email: 'davi@example.test' }
const silent = { info: () => undefined, error: () => undefined }

type Mail = { to: string; subject: string; text: string }

/** The provider's door: each message is kept, and `next` resolves with the next one to arrive. */
async function mailProvider(t: TestContext) {
  const arrived: Mail[] = []
  const waiting: ((mail: Mail) => void)[] = []
  const server = createServer((request, response) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => chunks.push(chunk))
    request.on('end', () => {
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
      const mail = { to: body.to, subject: body.subject, text: body.text }
      const waiter = waiting.shift()
      if (waiter) waiter(mail)
      else arrived.push(mail)
      response.writeHead(200, { 'content-type': 'application/json' })
      const result = { delivered: [body.to], permanent_bounces: [], queued: [] }
      response.end(JSON.stringify({ success: true, result }))
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => {
    server.closeAllConnections()
    server.close()
  })
  const address = server.address()
  assert.ok(address !== null && typeof address === 'object')
  return {
    url: `http://127.0.0.1:${address.port}/email/sending/send`,
    next: () =>
      new Promise<Mail>((resolve) => {
        const mail = arrived.shift()
        if (mail) resolve(mail)
        else waiting.push(resolve)
      }),
  }
}

async function builtScreens(t: TestContext): Promise<string> {
  const outDir = mkdtempSync(join(tmpdir(), 'conexus-e2e-web-'))
  t.after(() => rmSync(outDir, { recursive: true, force: true }))
  const root = join(import.meta.dirname, '..', '..', 'apps', 'web')
  await build({ root, logLevel: 'silent', build: { outDir } })
  return outDir
}

/** The Hub in this process, on the CI database, serving the built screens and mailing to the fake. */
async function liveHub(t: TestContext, mailUrl: string) {
  const database = await createTestDatabase(t)
  const config = testConfig(database.runtimeUrl, mailUrl)
  const status = createStatus({ version: config.version, database: database.database })
  const identity = identityOf({ database: database.database, config, log: silent })
  const operations = operationsOf(database.database, identity)
  const app = await createHub(config, {
    status,
    identity,
    operations,
    webRoot: await builtScreens(t),
  })
  t.after(() => app.close())
  await app.listen({ host: '127.0.0.1', port: 0 })
  const address = app.server.address()
  assert.ok(address !== null && typeof address === 'object')
  return { port: address.port, database }
}

/** Ana, with a password, owns Empresa Teste, as a client's first owner is left by step 4.2. */
async function ownerOfCompany(database: Awaited<ReturnType<typeof liveHub>>['database']) {
  const id = randomBytes(16).toString('hex')
  const companyId = randomBytes(16).toString('hex')
  await database.asOwner('insert into auth.user (id, name, email) values ($1, $2, $3)', [
    id,
    ANA.name,
    ANA.email,
  ])
  await database.asOwner(
    `insert into auth.account (id, account_id, provider_id, user_id, password, updated_at)
      values ($1, $2, 'credential', $2, $3, now())`,
    [randomBytes(16).toString('hex'), id, await hashPassword(PASSWORD)],
  )
  await database.asOwner(
    `insert into auth.company (id, name, slug, created_at, attempt_key)
      values ($1, 'Empresa Teste', $1, now(), $1)`,
    [companyId],
  )
  await database.asOwner(
    `insert into auth.member (id, company_id, user_id, role, created_at)
      values ($1, $2, $3, 'owner', now())`,
    [randomBytes(16).toString('hex'), companyId, id],
  )
}

/**
 * The browser reaches the Hub by its public name, over the Hub's real HTTP door; Cloudflare's
 * header is set as the tunnel sets it.
 */
async function reachHub(context: BrowserContext, port: number, ip: string) {
  await context.route(`${TEST_ORIGIN}/**`, async (route) => {
    const request = route.request()
    const url = request.url().replace(TEST_ORIGIN, `http://127.0.0.1:${port}`)
    const headers = { ...(await request.allHeaders()), 'cf-connecting-ip': ip }
    return route.fulfill({ response: await route.fetch({ url, headers }) })
  })
}

/** What would show in the console as a refusal of the page itself, never as a refusal it shows. */
function watchConsole(page: Page, problems: string[]) {
  page.on('pageerror', (error) => problems.push(error.message))
  page.on('console', (message) => {
    if (/Content Security Policy/.test(message.text())) problems.push(message.text())
  })
}

async function signIn(page: Page, email: string, password: string) {
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
}

/** Ana opens Empresa Teste and invites Davi as Administrador. */
async function anaInvites(page: Page) {
  await page.goto(`${TEST_ORIGIN}/`)
  await signIn(page, ANA.email, PASSWORD)
  await page.getByRole('heading', { name: 'Suas empresas' }).waitFor()
  await page.getByRole('link', { name: /^Empresa Teste/ }).click()
  await page.getByRole('heading', { name: 'Empresa Teste', exact: true }).waitFor()
  await page.getByText('Dono').waitFor()
  await page.getByLabel('E-mail').fill(DAVI.email)
  await page.getByLabel('Papel').click()
  await page.getByRole('option', { name: 'Administrador' }).click()
  await page.getByRole('button', { name: 'Enviar convite', exact: true }).click()
  await page.getByText(`Convite enviado para ${DAVI.email}.`).waitFor()
  const pending = page.getByRole('heading', { name: 'Convites pendentes' }).locator('..')
  await pending.getByText(DAVI.email).waitFor()
}

function linkIn(mail: Mail): string {
  const link = mail.text.match(/https:\/\/\S+/)?.[0]
  assert.ok(link, 'the e-mail carries no link')
  return link
}

/** Davi creates his password in the invitation, then explicitly joins the company. */
async function daviJoins(page: Page, mail: Awaited<ReturnType<typeof mailProvider>>) {
  const invitation = await mail.next()
  assert.equal(invitation.subject, 'Convite para Empresa Teste')
  assert.equal(invitation.to, DAVI.email)
  const invitationLink = linkIn(invitation)
  await page.goto(invitationLink)
  await page.getByLabel('Nome').fill(DAVI.name)
  await page.getByLabel('Senha', { exact: true }).fill(NEW_PASSWORD)
  await page.getByLabel('Confirmar senha', { exact: true }).fill(NEW_PASSWORD)
  await page.getByRole('button', { name: 'Criar senha', exact: true }).click()
  await page.getByRole('status').filter({ hasText: 'Senha criada. Você já entrou.' }).waitFor()
  await page
    .getByRole('heading', { name: 'Ana Lima convidou você para Empresa Teste como Administrador.' })
    .waitFor()
  await page.getByRole('button', { name: 'Aceitar convite' }).click()
  await page.getByRole('heading', { name: 'Empresa Teste', exact: true }).waitFor()
  assert.equal(await page.getByRole('listitem').filter({ hasText: ANA.email }).count(), 1)
  assert.equal(await page.getByRole('listitem').filter({ hasText: DAVI.email }).count(), 1)
  await page.goto(invitationLink)
  await page.getByRole('heading', { name: 'Você já faz parte de Empresa Teste.' }).waitFor()
}

test('o roteiro de uso: convidar, criar a senha, aceitar e ver a empresa com as duas pessoas', async (t) => {
  const mail = await mailProvider(t)
  const { port, database } = await liveHub(t, mail.url)
  await ownerOfCompany(database)
  const browser: Browser = await chromium.launch()
  t.after(() => browser.close())
  const problems: string[] = []
  const anaContext = await browser.newContext()
  const daviContext = await browser.newContext()
  await reachHub(anaContext, port, '198.51.100.10')
  await reachHub(daviContext, port, '203.0.113.9')
  const anaPage = await anaContext.newPage()
  const daviPage = await daviContext.newPage()
  watchConsole(anaPage, problems)
  watchConsole(daviPage, problems)
  await anaInvites(anaPage)
  await daviJoins(daviPage, mail)
  assert.deepEqual(problems, [])
})

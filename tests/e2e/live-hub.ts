import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { mkdtempSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { hashPassword } from 'better-auth/crypto'
import type { BrowserContext, Page } from 'playwright-core'
import { build } from 'vite'
import { createStatus } from '../../apps/server/src/hub/status/public.ts'
import { createHub, identityOf, operationsOf } from '../../apps/server/src/main.ts'
import {
  createTestDatabase,
  TEST_ORIGIN,
  testConfig,
} from '../../apps/server/src/platform/test-database.ts'

// What the founder's journeys share: a real Hub on a real database, serving the built screens, and
// the browser reaching it by its public name. Only the mail provider is faked, at its HTTP door
// (testing T14, T16).
export const PASSWORD = 'senha-certa-1'
const silent = { info: () => undefined, error: () => undefined }

export type Mail = { to: string; subject: string; text: string }

/** The provider's door: each message is kept, and `next` resolves with the next one to arrive. */
export async function mailProvider(t: TestContext) {
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
export async function liveHub(t: TestContext, mailUrl: string) {
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

/**
 * The browser reaches the Hub by its public name, over the Hub's real HTTP door; Cloudflare's
 * header is set as the tunnel sets it.
 */
export async function reachHub(context: BrowserContext, port: number, ip: string) {
  await context.route(`${TEST_ORIGIN}/**`, async (route) => {
    const request = route.request()
    const url = request.url().replace(TEST_ORIGIN, `http://127.0.0.1:${port}`)
    const headers = { ...(await request.allHeaders()), 'cf-connecting-ip': ip }
    return route.fulfill({ response: await route.fetch({ url, headers }) })
  })
}

/** What would show in the console as a refusal of the page itself, never as a refusal it shows. */
export function watchConsole(page: Page, problems: string[]) {
  page.on('pageerror', (error) => problems.push(error.message))
  page.on('console', (message) => {
    if (/Content Security Policy/.test(message.text())) problems.push(message.text())
  })
}

export async function signIn(page: Page, email: string, password: string) {
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
}

export function linkIn(mail: Mail): string {
  const link = mail.text.match(/https:\/\/\S+/)?.[0]
  assert.ok(link, 'the e-mail carries no link')
  return link
}

export type LiveDatabase = Awaited<ReturnType<typeof liveHub>>['database']

/** A person with a password, as the first-person command or an accepted invitation leaves them. */
export async function personWithPassword(
  database: LiveDatabase,
  who: { name: string; email: string; role?: string },
): Promise<string> {
  const id = randomBytes(16).toString('hex')
  await database.asOwner('insert into auth.user (id, name, email, role) values ($1, $2, $3, $4)', [
    id,
    who.name,
    who.email,
    who.role ?? 'user',
  ])
  await database.asOwner(
    `insert into auth.account (id, account_id, provider_id, user_id, password, updated_at)
      values ($1, $2, 'credential', $2, $3, now())`,
    [randomBytes(16).toString('hex'), id, await hashPassword(PASSWORD)],
  )
  return id
}

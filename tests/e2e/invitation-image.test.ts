import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir, userInfo } from 'node:os'
import { dirname, join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { promisify } from 'node:util'
import { hashPassword } from 'better-auth/crypto'
import { request } from 'playwright-core'
import {
  createTestDatabase,
  freePort,
  serveEnvironment,
  TEST_ORIGIN,
} from '../../apps/server/src/platform/test-database.ts'
import { mailServer } from '../../apps/server/src/platform/test-mail.ts'

const IMAGE = 'conexus-hub:ci'
const PASSWORD = 'senha-certa-1'
const execute = promisify(execFile)

async function docker(args: string[]) {
  return (await execute('docker', args, { timeout: 60_000 })).stdout.trim()
}

async function imageHub(t: TestContext) {
  const name = `conexus-image-${randomUUID()}`
  let running = false
  t.after(async () => {
    if (running) await docker(['stop', name])
  })
  const database = await createTestDatabase(t)
  const mail = await mailServer(t)
  const port = await freePort()
  const ports = { port, edgePort: await freePort() }
  const env = { ...serveEnvironment(t, database.runtimeUrl, ports), HUB_MAIL_API_URL: mail.url }
  const summaryDir = mkdtempSync(join(tmpdir(), 'conexus-image-summary-'))
  t.after(() => rmSync(summaryDir, { recursive: true, force: true }))
  const { uid, gid } = userInfo()
  const folders = new Set([
    summaryDir,
    ...Object.entries(env)
      .filter(([key]) => key.endsWith('_FILE'))
      .map(([, value]) => dirname(value)),
  ])
  const args = [
    '--rm',
    '--network',
    'host',
    // The leaked-password service is never reached from a test (testing T14): the name goes
    // nowhere, so a password written through the image's door would be refused as unchecked.
    '--add-host',
    'api.pwnedpasswords.com:127.0.0.1',
    '--user',
    `${uid}:${gid}`,
    ...[...folders].flatMap((path) => ['--mount', `type=bind,src=${path},dst=${path}`]),
    ...Object.entries(env).flatMap(([key, value]) => ['--env', `${key}=${value}`]),
  ]
  const summary = join(summaryDir, 'first-person')
  await docker([
    'run',
    ...args,
    IMAGE,
    'node',
    'apps/server/src/main.ts',
    'first-person',
    '--name',
    'Ana Lima',
    '--email',
    'ana@example.test',
    '--summary',
    summary,
  ])
  await docker(['run', '-d', '--name', name, ...args, IMAGE])
  running = true
  const client = await request.newContext({
    baseURL: `http://127.0.0.1:${port}`,
    extraHTTPHeaders: { origin: TEST_ORIGIN, 'cf-connecting-ip': '198.51.100.10' },
  })
  t.after(() => client.dispose())
  const deadline = Date.now() + 10_000
  while (true) {
    const health = await client.get('/api/health', { timeout: 1000 }).catch(() => undefined)
    if (health?.status() === 200) break
    if (Date.now() >= deadline) throw Error('image did not become healthy')
  }
  return { client, mail, database }
}

test('final image executes the mail bundle through HTTP without a runtime mail toolchain or NODE_ENV', async (t) => {
  const [inspection] = JSON.parse(await docker(['image', 'inspect', IMAGE]))
  assert.equal(inspection.Config.User, 'node')
  assert.equal(inspection.Config.Labels['conexus.migrate'], '1')
  assert.equal(
    inspection.Config.Env.some((entry: string) => entry.startsWith('NODE_ENV=')),
    false,
  )
  const measured = JSON.parse(
    await docker([
      'run',
      '--rm',
      '--network',
      'none',
      IMAGE,
      'node',
      '--input-type=module',
      '-e',
      `
    import { statSync } from 'node:fs'; import { createRequire } from 'node:module';
    const require = createRequire(import.meta.url);
    // esbuild is not listed: @mastra/e2b (the Builder's machine) depends on it at run time.
    const packages = ['react-email', '@react-email/render', 'vitest', 'vite', 'msw', 'drizzle-kit'];
    const installed = packages.filter(name => { try { require.resolve(name); return true } catch { return false } });
    console.log(JSON.stringify({ installed, bytes: statSync('apps/server/src/hub/identity/invitation-render.mjs').size }));`,
    ]),
  )
  assert.deepEqual(measured.installed, [])
  assert.ok(measured.bytes > 0)
  const { client, mail, database } = await imageHub(t)
  // The first person has no password yet; the link that sets one would ask the leak service.
  await database.asOwner(
    `insert into auth.account (id, account_id, provider_id, user_id, password, updated_at)
      select $1, id, 'credential', id, $2, now() from auth.user where email = 'ana@example.test'`,
    [randomUUID(), await hashPassword(PASSWORD)],
  )
  const login = await client.put('/api/sessions/current', {
    data: { email: 'ana@example.test', password: PASSWORD },
  })
  assert.equal(login.status(), 200)
  const cookie = login
    .headersArray()
    .filter(({ name }) => name.toLowerCase() === 'set-cookie')
    .map(({ value }) => value.split(';')[0])
    .join('; ')
  // The first person is the operator: registering a client sends its owner's invitation.
  const registered = await client.post('/api/clients', {
    headers: { cookie, 'idempotency-key': randomUUID() },
    data: {
      cnpj: '12.ABC.345/01DE-35',
      legalName: 'Empresa Teste Ltda',
      name: 'Empresa Teste',
      ownerEmail: 'davi@example.test',
    },
  })
  assert.equal(registered.status(), 201)
  const invitation = (await registered.json()).client.state.ownerInvitation
  assert.equal(mail.sent.length, 1)
  const sent = mail.sent[0]
  assert.ok(sent)
  assert.deepEqual(sent.from, { address: 'convites@hub.example.test', name: 'Conexus' })
  assert.equal(sent.to, 'davi@example.test')
  assert.equal(sent.subject, 'Conexus convidou você para ser o primeiro dono de Empresa Teste')
  const link = `${TEST_ORIGIN}/invitations/${invitation.id}`
  assert.ok(sent.html.includes(`href="${link}"`))
  assert.ok(sent.html.includes('Ver convite'))
  assert.ok(sent.html.includes('Se o botão não abrir'))
  assert.ok(sent.text.includes(link))
  assert.ok(sent.text.includes('UTC'))
  assert.ok(!sent.html.includes('src="https://'))
})

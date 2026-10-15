import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { join } from 'node:path'
import { test } from 'node:test'
import { Email } from '@conexus/hub-api'
import {
  createTestDatabase,
  freePort,
  serveEnvironment,
  TEST_ORIGIN,
  testConfig,
} from '../../platform/test-database.ts'
import { createIdentity } from './public.ts'

const MAIN = join(import.meta.dirname, '..', '..', 'main.ts')
const silent = { info: () => undefined, error: () => undefined }
const WRITE = {
  origin: TEST_ORIGIN,
  'content-type': 'application/json',
  'cf-connecting-ip': '203.0.113.7',
}
// The library's scrypt hash is a hex salt and a hex key joined by a colon.
const PASSWORD_HASH = /[0-9a-f]{16,}:[0-9a-f]{64,}/

test('senha que não grava: 503, nenhuma senha, o link continua valendo, e a saída não traz o erro do banco', async (t) => {
  const test = await createTestDatabase(t)
  const identity = createIdentity({
    database: test.database,
    config: testConfig(test.runtimeUrl),
    log: silent,
  })
  const { link } = await identity.firstPerson({
    name: 'Ana Lima',
    email: Email.parse('ana@example.test'),
  })
  const token = link.split('#token=')[1]
  const port = await freePort()
  const child = spawn(process.execPath, [MAIN], {
    env: serveEnvironment(t, test.runtimeUrl, port),
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  t.after(() => child.kill('SIGKILL'))
  let output = ''
  const listening = Promise.withResolvers<void>()
  child.stdout.on('data', (chunk) => {
    output += chunk
    if (output.includes('"LISTENING"')) listening.resolve()
  })
  child.stderr.on('data', (chunk) => {
    output += chunk
  })
  const exited = once(child, 'exit')
  await listening.promise
  function setPassword() {
    return fetch(`http://127.0.0.1:${port}/api/passwords`, {
      method: 'PUT',
      headers: WRITE,
      body: JSON.stringify({ token, password: 'senha-nova-1' }),
    })
  }

  await test.asOwner('revoke insert on auth.account from hub_runtime')
  const failed = await setPassword()
  assert.equal(failed.status, 503)
  assert.equal(Object(await failed.json()).code, 'DATABASE_UNAVAILABLE')
  const left = await test.asOwner(`select
    (select count(*)::int from auth.account) as accounts,
    (select count(*)::int from auth.verification) as links`)
  assert.deepEqual(left, [{ accounts: 0, links: 1 }])

  await test.asOwner('grant insert on auth.account to hub_runtime')
  assert.equal((await setPassword()).status, 204)
  child.kill('SIGTERM')
  await exited

  const [person] = await test.asOwner('select id from auth.user')
  const lines = output.split('\n').filter(Boolean)
  for (const line of lines) {
    assert.doesNotMatch(line, PASSWORD_HASH)
    assert.doesNotMatch(line, new RegExp(String(person?.id)))
    assert.equal(line.match(/"level":/g)?.length, 1, line)
  }
  const messages = lines.map((line) => String(JSON.parse(line).msg))
  // Served lines sit between the start and the stop; boot lines carry no request.
  const served = messages.slice(
    messages.indexOf('LISTENING') + 1,
    messages.indexOf('SHUTTING_DOWN'),
  )
  for (const message of served) assert.match(message, /^[A-Z_]+$/)
  assert.ok(served.includes('DATABASE_UNAVAILABLE'), 'the failure was logged by its code')
})

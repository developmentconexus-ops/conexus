import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Email } from '@conexus/hub-api'
import { identityOf } from '../../main.ts'
import {
  createTestDatabase,
  serveEnvironment,
  spawnHub,
  TEST_ORIGIN,
  testConfig,
} from '../../platform/test-database.ts'

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
  const identity = identityOf({
    database: test.database,
    config: testConfig(test.runtimeUrl),
    log: silent,
  })
  const { link } = await identity.firstPerson({
    name: 'Ana Lima',
    email: Email.parse('ana@example.test'),
  })
  const token = link.split('#token=')[1]
  const { port, lines, stop } = await spawnHub(t, serveEnvironment(t, test.runtimeUrl))
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
  await stop()

  const [person] = await test.asOwner('select id from auth.user')
  const output = JSON.stringify(lines)
  assert.doesNotMatch(output, PASSWORD_HASH)
  assert.doesNotMatch(output, new RegExp(String(person?.id)))
  const messages = lines.map((line) => String(line.msg))
  assert.ok(messages.includes('DATABASE_UNAVAILABLE'), 'the failure was logged by its code')
})

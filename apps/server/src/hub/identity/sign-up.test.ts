import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createTestDatabase, testConfig } from '../../platform/test-database.ts'
import { createAuth } from './public.ts'

const silent = { info: () => undefined, error: () => undefined }

test('cadastro fechado: signUpEmail no servidor é recusado e ninguém é criado', async (t) => {
  const test = await createTestDatabase(t)
  const auth = createAuth({
    database: test.database,
    config: testConfig(test.runtimeUrl),
    log: silent,
  })
  const body = { name: 'Ana Lima', email: 'ana@example.test', password: 'senha-certa-1' }
  await assert.rejects(auth.api.signUpEmail({ body }), (error: unknown) => {
    assert.equal(Object(Object(error).body).code, 'EMAIL_PASSWORD_SIGN_UP_DISABLED')
    return true
  })
  assert.deepEqual(await test.asOwner('select count(*)::int as people from auth.user'), [
    { people: 0 },
  ])
})

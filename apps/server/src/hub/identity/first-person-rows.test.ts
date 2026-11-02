import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Email } from '@conexus/hub-api'
import { createTestDatabase, testConfig } from '../../platform/test-database.ts'
import { testMail } from '../../platform/test-mail.ts'
import { createIdentity } from './public.ts'

const ANA = { name: 'Ana Lima', email: 'ana@example.test' }

test('com a pessoa de id vazio no banco, recusa e nenhum link é gravado', async (t) => {
  const database = await createTestDatabase(t)
  await database.asOwner(
    `insert into auth.user (id, name, email, role) values ('', $1, $2, 'admin')`,
    [ANA.name, ANA.email],
  )
  const config = testConfig(database.runtimeUrl)
  const log = { info: () => undefined, error: () => undefined }
  const sendMail = testMail(config)
  const identity = createIdentity({ database: database.database, config, log, sendMail })
  await assert.rejects(identity.firstPerson({ name: ANA.name, email: Email.parse(ANA.email) }), {
    code: 'INTERNAL_UNEXPECTED',
  })
  assert.deepEqual(await database.asOwner('select count(*)::int as links from auth.verification'), [
    { links: 0 },
  ])
})

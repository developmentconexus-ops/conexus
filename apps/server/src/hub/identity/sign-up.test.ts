import assert from 'node:assert/strict'
import { test } from 'node:test'
import { hashPassword } from 'better-auth/crypto'
import { createTestDatabase, silent, testConfig } from '../../platform/test-database.ts'
import { createAuth } from './public.ts'
import { ANA, BRUNO, hubOn, PASSWORD, personOn, plantCompany } from './test-hub.ts'

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

test('empresa só pela Central: createOrganization direto é recusado ao operador e a quem não é, e nenhuma empresa nasce', async (t) => {
  const test = await createTestDatabase(t)
  const auth = createAuth({
    database: test.database,
    config: testConfig(test.runtimeUrl),
    log: silent,
  })
  for (const [index, role] of ['admin', 'user'].entries()) {
    const email = `pessoa${index}@example.test`
    await test.asOwner(
      `insert into auth.user (id, name, email, role) values ($1, 'Pessoa', $2, $3)`,
      [`p${index}`, email, role],
    )
    await test.asOwner(
      `insert into auth.account (id, account_id, provider_id, user_id, password, updated_at)
        values ($1, $1, 'credential', $1, $2, now())`,
      [`p${index}`, await hashPassword(PASSWORD)],
    )
    const signedIn = await auth.api.signInEmail({
      body: { email, password: PASSWORD },
      returnHeaders: true,
    })
    const cookie = signedIn.headers.getSetCookie()[0]?.split(';')[0] ?? ''
    const body = { name: 'Empresa Nova', slug: `empresa-${index}`, attemptKey: `k${index}` }
    await assert.rejects(
      auth.api.createOrganization({ body, headers: new Headers({ cookie }) }),
      (error: unknown) => {
        const { code } = Object(Object(error).body)
        assert.equal(code, 'YOU_ARE_NOT_ALLOWED_TO_CREATE_A_NEW_ORGANIZATION', role)
        return true
      },
    )
  }
  assert.deepEqual(await test.asOwner('select count(*)::int as companies from auth.company'), [
    { companies: 0 },
  ])
})

test('apagar só pela Central: deleteOrganization direto é recusado ao dono e ao operador, e a empresa fica', async (t) => {
  const hub = await hubOn(t)
  const owner = await personOn(hub, BRUNO)
  const operator = await personOn(hub, ANA)
  const companyId = await plantCompany(hub.test, owner.id)
  const auth = createAuth({
    database: hub.test.database,
    config: testConfig(hub.test.runtimeUrl),
    log: silent,
  })
  for (const person of [owner, operator]) {
    const headers = new Headers({ cookie: person.cookie })
    await assert.rejects(
      auth.api.deleteOrganization({ body: { organizationId: companyId }, headers }),
      (error: unknown) => {
        assert.equal(Object(Object(error).body).code, 'ORGANIZATION_DELETION_DISABLED')
        return true
      },
    )
  }
  assert.deepEqual(await hub.test.asOwner('select count(*)::int as companies from auth.company'), [
    { companies: 1 },
  ])
})

import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { test } from 'node:test'
import { appLogin, appLoginPassword, ProjectId } from './index.ts'

const PROJECT = ProjectId.parse('Ab3dEf6hIj9kLm2nOp5qRs8tUv1wXy4z')

test('o esquema e os logins levam o id do Projeto como ele é', () => {
  assert.deepEqual(appLogin(PROJECT), {
    schema: 'app_Ab3dEf6hIj9kLm2nOp5qRs8tUv1wXy4z',
    runLogin: 'app_Ab3dEf6hIj9kLm2nOp5qRs8tUv1wXy4z_run',
    migrateLogin: 'app_Ab3dEf6hIj9kLm2nOp5qRs8tUv1wXy4z_migrate',
  })
  for (const name of Object.values(appLogin(PROJECT))) assert.ok(name.length <= 63)
})

test('a senha é o HMAC-SHA-256 do login em base64url, a mesma a cada vez', async () => {
  const login = appLogin(PROJECT).runLogin
  const expected = createHmac('sha256', 'chave-de-teste').update(login).digest('base64url')
  assert.equal(await appLoginPassword({ key: 'chave-de-teste', login }), expected)
  assert.equal(await appLoginPassword({ key: 'chave-de-teste', login }), expected)
  assert.notEqual(await appLoginPassword({ key: 'outra-chave', login }), expected)
  assert.notEqual(
    await appLoginPassword({ key: 'chave-de-teste', login: appLogin(PROJECT).migrateLogin }),
    expected,
  )
})

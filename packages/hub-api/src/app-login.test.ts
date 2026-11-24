import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { test } from 'node:test'
import {
  AppVersionId,
  AppWorker,
  appCheckLogin,
  appCheckWorkerOf,
  appLogin,
  appLoginPassword,
  appWorkerOf,
  ProjectId,
} from './index.ts'

const PROJECT = ProjectId.parse('Ab3dEf6hIj9kLm2nOp5qRs8tUv1wXy4z')

test('o esquema e os logins levam o id do Projeto como ele é', () => {
  assert.deepEqual(appLogin(PROJECT), {
    schema: 'app_Ab3dEf6hIj9kLm2nOp5qRs8tUv1wXy4z',
    runLogin: 'app_Ab3dEf6hIj9kLm2nOp5qRs8tUv1wXy4z_run',
    migrateLogin: 'app_Ab3dEf6hIj9kLm2nOp5qRs8tUv1wXy4z_migrate',
    readLogin: 'app_Ab3dEf6hIj9kLm2nOp5qRs8tUv1wXy4z_read',
  })
  for (const name of Object.values(appLogin(PROJECT))) assert.ok(name.length <= 63)
})

test('a conferência tem esquema e logins próprios, sem login de leitura, ao lado dos do app', () => {
  assert.deepEqual(appCheckLogin(PROJECT), {
    schema: 'app_Ab3dEf6hIj9kLm2nOp5qRs8tUv1wXy4z_check',
    runLogin: 'app_Ab3dEf6hIj9kLm2nOp5qRs8tUv1wXy4z_check_run',
    migrateLogin: 'app_Ab3dEf6hIj9kLm2nOp5qRs8tUv1wXy4z_check_migrate',
  })
  const appNames = new Set<string>(Object.values(appLogin(PROJECT)))
  for (const name of Object.values(appCheckLogin(PROJECT))) {
    assert.ok(name.length <= 63)
    assert.ok(!appNames.has(name))
  }
})

test('o Worker da versão começa por v-, o da conferência do Projeto por c-, e nenhum outro passa', () => {
  const version = AppVersionId.parse('Zy4xWv1uTs8rQp5oNm2lKj9iHg6fEd3c')
  assert.equal(appWorkerOf(version), 'v-Zy4xWv1uTs8rQp5oNm2lKj9iHg6fEd3c')
  assert.equal(appCheckWorkerOf(PROJECT), 'c-Ab3dEf6hIj9kLm2nOp5qRs8tUv1wXy4z')
  assert.equal(AppWorker.safeParse('x-Ab3dEf6hIj9kLm2nOp5qRs8tUv1wXy4z').success, false)
  assert.equal(AppWorker.safeParse('c-curto').success, false)
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

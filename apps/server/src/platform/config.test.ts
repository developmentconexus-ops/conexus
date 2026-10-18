import assert from 'node:assert/strict'
import { chmodSync, writeFileSync } from 'node:fs'
import { test } from 'node:test'
import { readConfig } from './config.ts'
import { serveEnvironment, unreachableDatabaseUrl } from './test-database.ts'

function refusal(env: Record<string, string | undefined>, variables: string) {
  assert.throws(
    () => readConfig('serve', env),
    (error: unknown) => {
      assert.equal(Reflect.get(Object(error), 'code'), 'CONFIG_INVALID')
      assert.equal(
        Reflect.get(Object(Reflect.get(Object(error), 'details')), 'variables'),
        variables,
      )
      return true
    },
  )
}

test('configuração: a chave, a organização e o endereço do Neon entram na leitura', async (t) => {
  const env = serveEnvironment(t, await unreachableDatabaseUrl(), { port: 8080, edgePort: 8081 })
  const config = readConfig('serve', env)
  assert.equal(config.neonApiUrl, 'http://127.0.0.1:9/api/v2')
  assert.equal(config.neonOrgId, 'org-test-0000')
  assert.equal(String(config.neonApiKey), '[NeonApiKey]')
})

test('configuração: sem a organização, o arquivo da chave ou o endereço, nomeia a variável', async (t) => {
  const env = serveEnvironment(t, await unreachableDatabaseUrl(), { port: 8080, edgePort: 8081 })
  for (const name of ['HUB_NEON_API_URL', 'HUB_NEON_ORG_ID', 'HUB_NEON_API_KEY_FILE']) {
    refusal({ ...env, [name]: undefined }, name)
  }
})

test('configuração: o endereço do Neon fora desta máquina só vale em https', async (t) => {
  const env = serveEnvironment(t, await unreachableDatabaseUrl(), { port: 8080, edgePort: 8081 })
  refusal({ ...env, HUB_NEON_API_URL: 'http://neon.example.test/api/v2' }, 'HUB_NEON_API_URL')
  assert.equal(
    readConfig('serve', { ...env, HUB_NEON_API_URL: 'https://neon.example.test/api/v2' })
      .neonApiUrl,
    'https://neon.example.test/api/v2',
  )
})

test('configuração: o arquivo da chave legível por outros ou vazio é recusado', async (t) => {
  const env = serveEnvironment(t, await unreachableDatabaseUrl(), { port: 8080, edgePort: 8081 })
  const path = env.HUB_NEON_API_KEY_FILE
  chmodSync(path, 0o644)
  refusal(env, 'HUB_NEON_API_KEY_FILE')
  chmodSync(path, 0o600)
  writeFileSync(path, '\n')
  refusal(env, 'HUB_NEON_API_KEY_FILE')
})

test('configuração: a chave dos logins dos apps só vale com 64 dígitos hexadecimais', async (t) => {
  const env = serveEnvironment(t, await unreachableDatabaseUrl(), { port: 8080, edgePort: 8081 })
  const path = env.HUB_APP_LOGIN_KEY_FILE
  for (const key of ['a1'.repeat(31), 'A1'.repeat(32), `${'a1'.repeat(31)}a\r1`]) {
    chmodSync(path, 0o600)
    writeFileSync(path, `${key}\n`)
    refusal(env, 'HUB_APP_LOGIN_KEY_FILE')
  }
  writeFileSync(path, `${'a1'.repeat(32)}\n`)
  assert.equal(String(readConfig('serve', env).appLoginKey), '[AppLoginKey]')
})

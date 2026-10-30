import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { templateName } from '../../../../infra/e2b/name.ts'
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

test('configuração: sem o arquivo das chaves do lacre, vazio, legível por outros ou fora de 32 bytes, não inicia', async (t) => {
  const env = serveEnvironment(t, await unreachableDatabaseUrl(), { port: 8080, edgePort: 8081 })
  refusal({ ...env, HUB_SEAL_KEYS_FILE: undefined }, 'HUB_SEAL_KEYS_FILE')
  refusal({ ...env, HUB_SEAL_KEYS_FILE: `${env.HUB_SEAL_KEYS_FILE}-absent` }, 'HUB_SEAL_KEYS_FILE')
  const path = env.HUB_SEAL_KEYS_FILE
  chmodSync(path, 0o600)
  writeFileSync(path, '\n')
  refusal(env, 'HUB_SEAL_KEYS_FILE')
  writeFileSync(path, `k1:${randomBytes(16).toString('base64')}\n`)
  refusal(env, 'HUB_SEAL_KEYS_FILE')
  writeFileSync(path, `k1:${randomBytes(32).toString('base64')}\n`)
  chmodSync(path, 0o640)
  refusal(env, 'HUB_SEAL_KEYS_FILE')
  chmodSync(path, 0o600)
  assert.equal(readConfig('serve', env).sealKeys.sealingId, 'k1')
})

test('configuração: o arquivo do banco do Mastra ausente, vazio ou aberto a outros é recusado', async (t) => {
  const env = serveEnvironment(t, await unreachableDatabaseUrl(), { port: 8080, edgePort: 8081 })
  const path = env.HUB_MASTRA_DATABASE_URL_FILE
  refusal({ ...env, HUB_MASTRA_DATABASE_URL_FILE: undefined }, 'HUB_MASTRA_DATABASE_URL_FILE')
  chmodSync(path, 0o644)
  refusal(env, 'HUB_MASTRA_DATABASE_URL_FILE')
  chmodSync(path, 0o600)
  writeFileSync(path, '\n')
  refusal(env, 'HUB_MASTRA_DATABASE_URL_FILE')
})

test('configuração: a pasta dos repositórios, o bucket e a chave da cópia do Git entram na leitura', async (t) => {
  const env = serveEnvironment(t, await unreachableDatabaseUrl(), { port: 8080, edgePort: 8081 })
  const config = readConfig('serve', env)
  assert.equal(config.gitRoot, env.HUB_GIT_ROOT)
  assert.equal(config.gitCopyBucket, 'conexus-test-git')
  assert.equal(String(config.gitCopyKey), '[GitCopyKey]')
  assert.equal(config.gitCopyUrl, undefined)
  const double = readConfig('serve', { ...env, HUB_GIT_COPY_URL: 'http://127.0.0.1:9000' })
  assert.equal(double.gitCopyUrl, 'http://127.0.0.1:9000')
  refusal({ ...env, HUB_GIT_COPY_URL: 'http://bucket.example.com' }, 'HUB_GIT_COPY_URL')
})

test('configuração: sem a pasta, o bucket ou o arquivo da chave da cópia, ou com a chave de uma palavra só, nomeia a variável', async (t) => {
  const env = serveEnvironment(t, await unreachableDatabaseUrl(), { port: 8080, edgePort: 8081 })
  for (const name of ['HUB_GIT_ROOT', 'HUB_GIT_COPY_BUCKET', 'HUB_GIT_COPY_KEY_FILE']) {
    refusal({ ...env, [name]: undefined }, name)
  }
  refusal({ ...env, HUB_GIT_ROOT: 'relativa/git' }, 'HUB_GIT_ROOT')
  chmodSync(env.HUB_GIT_COPY_KEY_FILE, 0o600)
  writeFileSync(env.HUB_GIT_COPY_KEY_FILE, 'so-uma-palavra\n')
  refusal(env, 'HUB_GIT_COPY_KEY_FILE')
})

test('configuração: a chave do E2B vem de arquivo e o molde nomeia a variável quando falta ou é inválido', async (t) => {
  const env = serveEnvironment(t, await unreachableDatabaseUrl(), { port: 8080, edgePort: 8081 })
  const config = readConfig('serve', env)
  assert.equal(String(config.e2bApiKey), '[E2bApiKey]')
  assert.equal(config.machineTemplate, 'conexus-builder:test')
  for (const name of ['HUB_E2B_API_KEY_FILE', 'HUB_E2B_TEMPLATE']) {
    refusal({ ...env, [name]: undefined }, name)
  }
  for (const value of [
    'Molde Com Espaço',
    'conexus-builder',
    'conexus-builder:',
    ':0b2d667',
    'conexus-builder:a:b',
  ]) {
    refusal({ ...env, HUB_E2B_TEMPLATE: value }, 'HUB_E2B_TEMPLATE')
  }
  // The line `node infra/e2b/template.ts` prints, as the how-to tells to write it.
  assert.equal(
    readConfig('serve', { ...env, HUB_E2B_TEMPLATE: templateName('0b2d667') }).machineTemplate,
    'conexus-builder:0b2d667',
  )
  chmodSync(env.HUB_E2B_API_KEY_FILE, 0o644)
  refusal(env, 'HUB_E2B_API_KEY_FILE')
  chmodSync(env.HUB_E2B_API_KEY_FILE, 0o600)
  writeFileSync(env.HUB_E2B_API_KEY_FILE, '\n')
  refusal(env, 'HUB_E2B_API_KEY_FILE')
})

test('configuração: a origem do dublê é só local', async (t) => {
  const env = serveEnvironment(t, await unreachableDatabaseUrl(), { port: 8080, edgePort: 8081 })
  assert.equal(readConfig('serve', env).connectorOrigins, undefined)
  const doubles = readConfig('serve', {
    ...env,
    HUB_CONNECTOR_ORIGINS: 'sankhya=http://127.0.0.1:4180, outro=http://localhost:4181',
  })
  assert.deepEqual(
    doubles.connectorOrigins,
    new Map([
      ['sankhya', 'http://127.0.0.1:4180'],
      ['outro', 'http://localhost:4181'],
    ]),
  )
  const ipv6 = readConfig('serve', { ...env, HUB_CONNECTOR_ORIGINS: 'sankhya=http://[::1]:4180' })
  assert.equal(ipv6.connectorOrigins?.get('sankhya'), 'http://[::1]:4180')
  for (const value of [
    'sankhya=https://api.sankhya.com.br',
    'sankhya=http://api.sankhya.com.br:4180',
    'sankhya=http://127.0.0.1',
    'sankhya=http://127.0.0.1:4180/caminho',
    'sankhya=http://user@127.0.0.1:4180',
    'sankhya=http://10.0.0.1:4180',
    'Sankhya=http://127.0.0.1:4180',
    'sankhya',
  ])
    refusal({ ...env, HUB_CONNECTOR_ORIGINS: value }, 'HUB_CONNECTOR_ORIGINS')
})

function appsFile(t: TestContext, text: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-apps-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const path = join(dir, 'apps.json')
  writeFileSync(path, text, { mode: 0o600 })
  return path
}

test('configuração: as chaves dos apps', async (t) => {
  const env = serveEnvironment(t, await unreachableDatabaseUrl(), { port: 8080, edgePort: 8081 })
  assert.equal(readConfig('serve', env).connectorApps, undefined)
  const app = { clientId: 'app-inventado', clientSecret: 'segredo-inventado' }
  const read = readConfig('serve', {
    ...env,
    HUB_CONNECTOR_APPS_FILE: appsFile(t, JSON.stringify({ 'mercado-livre': app })),
  }).connectorApps?.get('mercado-livre')
  assert.equal(read?.clientId, app.clientId)
  assert.equal(read?.clientSecret.reveal(), app.clientSecret)
  assert.equal(JSON.stringify(read).includes(app.clientSecret), false)
  for (const text of [
    '',
    '{}',
    'não é JSON',
    JSON.stringify({ 'mercado-livre': { ...app, extra: 'x' } }),
    JSON.stringify({ 'mercado-livre': { ...app, clientSecret: '' } }),
    JSON.stringify({ 'Mercado Livre': app }),
  ])
    refusal(
      { ...env, HUB_CONNECTOR_APPS_FILE: appsFile(t, text) },
      'HUB_CONNECTOR_APPS_FILE',
    )
  refusal(
    { ...env, HUB_CONNECTOR_APPS_FILE: `${appsFile(t, '{}')}-ausente` },
    'HUB_CONNECTOR_APPS_FILE',
  )
})

import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { test } from 'node:test'
import { appLogin, appLoginPassword, ProjectId } from '@conexus/hub-api'
import { readAddress } from './app-read.ts'
import { testAppsConfig } from './test-cloudflare.ts'
import { pgTransport } from './test-company-postgres.ts'

const KEY = testAppsConfig().appLoginKey
const context = { transport: pgTransport, key: KEY.reveal() }

test('endereço de leitura: o login de leitura no host da empresa e no banco do app, com a senha derivada, sem chamar o Neon', async () => {
  const id = ProjectId.parse(randomBytes(16).toString('hex').replace(/^./, 'P'))
  const { readLogin } = appLogin(id)
  const url = new URL((await readAddress(context, 'ep-teste.neon.tech', id)).reveal())
  assert.deepEqual(
    [url.protocol, url.username, url.host, url.pathname, url.search],
    ['postgresql:', readLogin, 'ep-teste.neon.tech', '/neondb', '?sslmode=require'],
  )
  assert.equal(url.password, await appLoginPassword({ key: KEY.reveal(), login: readLogin }))
})

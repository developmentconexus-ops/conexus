import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mercadoLivreFake } from '@conexus/connectors'
import { REDIRECT_PATH } from '@conexus/hub-api'
import { createTestDatabase, serveEnvironment, TEST_ORIGIN } from '../../platform/test-database.ts'
import { spawnHub, startHub } from '../../platform/test-hub-process.ts'
import { ANA_OWNER, hubWithMail, personOn, plantCompany } from '../identity/test-hub.ts'
import { appsFileOf, spawnedSession } from './test-connections.ts'

const APP = { clientId: 'app-inventado', clientSecret: 'segredo-inventado' }

test('as chaves dos apps: um conector que o kit não tem, ou que não é OAuth, não sobe o Hub', async (t) => {
  const { runtimeUrl } = await createTestDatabase(t)
  for (const connector of ['sankhya', 'outro-conector']) {
    const run = startHub(t, {
      ...serveEnvironment(t, runtimeUrl, { port: 8080, edgePort: 8081 }),
      HUB_CONNECTOR_APPS_FILE: appsFileOf(t, { [connector]: APP }),
    })
    assert.notEqual(await run.exited, 0)
    const refused = run.lines.find((line) => line.msg === 'CONFIG_INVALID')
    assert.equal(refused?.variables, 'HUB_CONNECTOR_APPS_FILE')
  }
})

test('entre cópias do Hub: dois Testar na mesma ligação vencida, uma renovação', async (t) => {
  const fake = mercadoLivreFake({ redirectUri: `${TEST_ORIGIN}${REDIRECT_PATH}` })
  const served = await fake.serve()
  t.after(() => served.close())
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id)
  const environment = {
    ...serveEnvironment(t, hub.test.runtimeUrl),
    HUB_CONNECTOR_ORIGINS: `mercado-livre=${served.origin}`,
    HUB_CONNECTOR_APPS_FILE: appsFileOf(t, { 'mercado-livre': fake.app }),
  }
  const first = await spawnHub(t, environment)
  const second = await spawnHub(t, environment)
  try {
    const onFirst = await spawnedSession(first.port, companyId)
    const onSecond = await spawnedSession(second.port, companyId)
    // One minute left: inside the five-minute margin, so each Testar wants a refresh.
    fake.switches.expiresInSeconds = 60
    const linked = await onFirst.link({ connector: 'mercado-livre', name: 'Loja 1' })
    fake.switches.expiresInSeconds = 21_600
    fake.switches.slowMilliseconds = 500
    const path = `/connections/${linked.body.connection.id}/test`
    const results = await Promise.all([onFirst.send('POST', path), onSecond.send('POST', path)])
    assert.deepEqual(
      results.map((each) => each.body.result),
      ['WORKING', 'WORKING'],
    )
    assert.equal(fake.refreshes(), 1)
  } finally {
    await first.stop()
    await second.stop()
  }
  const refreshed = [...first.lines, ...second.lines].filter(
    (line) => line.msg === 'CONNECTION_TOKEN_REFRESHED',
  )
  assert.equal(refreshed.length, 1)
})

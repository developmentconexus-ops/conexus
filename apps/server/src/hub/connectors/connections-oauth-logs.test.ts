import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mercadoLivreFake } from '@conexus/connectors'
import { REDIRECT_PATH } from '@conexus/hub-api'
import { z } from 'zod'
import { serveEnvironment, TEST_ORIGIN } from '../../platform/test-database.ts'
import { spawnHub } from '../../platform/test-hub-process.ts'
import { ANA_OWNER, hubWithMail, personOn, plantCompany } from '../identity/test-hub.ts'
import { appsFileOf, consentAt, spawnedSession, standIn } from './test-connections.ts'

const Issued = z.looseObject({ access_token: z.string(), refresh_token: z.string() })
const LEVELS = [
  ['CONNECTION_SIGN_IN_STARTED', 30],
  ['CONNECTION_LINKED', 30],
  ['CONNECTION_TOKEN_REFRESHED', 30],
  ['CONNECTION_SIGN_IN_REFUSED', 30],
  ['CONNECTOR_APP_REFUSED', 50],
  ['SEAL_REFUSED', 50],
] as const

function keysIn(body: string) {
  const issued = Issued.safeParse(JSON.parse(body))
  return issued.success ? [issued.data.access_token, issued.data.refresh_token] : []
}

/** The provider's error on the redirect, instead of a code, is answered like a refused exchange. */
async function redirectRefused(session: Awaited<ReturnType<typeof spawnedSession>>) {
  const started = await session.send('POST', '/connection-sign-ins', {
    connector: 'mercado-livre',
    name: 'Loja 3',
  })
  const { signInId } = await consentAt(started.body.url)
  const sent = { error: 'temporarily_unavailable', description: 'tente depois' }
  const redirected = await session.send('POST', `/connection-sign-ins/${signInId}`, sent)
  assert.deepEqual(
    [redirected.body.result, redirected.body.native.code, redirected.body.native.message],
    ['REFUSED', 'temporarily_unavailable', 'tente depois'],
  )
}

test('nenhuma resposta, log ou erro leva uma chave; o selo copiado não abre', async (t) => {
  const fake = mercadoLivreFake({ redirectUri: `${TEST_ORIGIN}${REDIRECT_PATH}` })
  const served = await fake.serve()
  t.after(() => served.close())
  const seen: string[] = []
  const mode = { refresh: 'pass' as const, seen }
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id)
  const spawned = await spawnHub(t, {
    ...serveEnvironment(t, hub.test.runtimeUrl),
    HUB_CONNECTOR_ORIGINS: `mercado-livre=${await standIn(t, mode)(served.origin)}`,
    HUB_CONNECTOR_APPS_FILE: appsFileOf(t, { 'mercado-livre': fake.app }),
  })
  const codes: string[] = []
  const session = await spawnedSession(spawned.port, companyId)
  try {
    // One minute left: the first Testar of each refreshes.
    fake.switches.expiresInSeconds = 60
    const first = await session.link({ connector: 'mercado-livre', name: 'Loja 1' })
    codes.push(first.code)
    const one = first.body.connection.id
    assert.equal((await session.send('POST', `/connections/${one}/test`)).body.result, 'WORKING')

    fake.switches.operator = true
    const refused = await session.link({ connector: 'mercado-livre', name: 'Loja 2' })
    codes.push(refused.code)
    assert.equal(refused.body.result, 'REFUSED')

    await redirectRefused(session)

    fake.switches.account = { ref: '987654321', label: 'OUTRALOJA' }
    const second = await session.link({ connector: 'mercado-livre', name: 'Loja 2' })
    codes.push(second.code)
    const two = second.body.connection.id
    fake.switches.invalidClient = true
    assert.equal(
      (await session.send('POST', `/connections/${two}/test`)).body.result,
      'APP_REFUSED',
    )
    fake.switches.invalidClient = false

    await hub.test.asOwner(
      `update connectors.connection set sealed = (select sealed from connectors.connection where id = $1) where id = $2`,
      [one, two],
    )
    const copied = await session.send('POST', `/connections/${two}/test`)
    assert.deepEqual([copied.status, copied.body.code], [500, 'SEAL_REFUSED'])
    await session.send('GET', '/connections')
  } finally {
    await spawned.stop()
  }
  for (const [msg, level] of LEVELS)
    assert.ok(
      spawned.lines.some((line) => line.msg === msg && line.level === level),
      `${msg} at level ${level}`,
    )
  const redirectLine = spawned.lines.find(
    (line) => line.msg === 'CONNECTION_SIGN_IN_REFUSED' && line.code === 'temporarily_unavailable',
  )
  assert.equal(redirectLine?.status, 302)
  const keys = seen.flatMap(keysIn)
  assert.ok(keys.length >= 6, 'three exchanges and a refresh were seen')
  const printed = JSON.stringify([spawned.lines, session.bodies])
  for (const secret of [...keys, ...codes, fake.app.clientSecret])
    assert.equal(printed.includes(secret), false, `a key left: ${secret.slice(0, 6)}`)
})

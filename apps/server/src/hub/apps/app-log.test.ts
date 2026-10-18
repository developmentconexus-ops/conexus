import assert from 'node:assert/strict'
import { createHash, randomBytes } from 'node:crypto'
import { test } from 'node:test'
import { APP_SESSION_HEADER } from '@conexus/hub-api'
import { serveEnvironment, TEST_ORIGIN } from '../../platform/test-database.ts'
import { spawnHub } from '../../platform/test-hub-process.ts'
import { neonServer } from '../../platform/test-neon.ts'
import { ANA_OWNER, hubWithMail, PASSWORD, personOn, plantCompany } from '../identity/test-hub.ts'

const PEDIDOS = 'pedidos--empresa-a'

test('log: a passagem, a sessão e a recusa levam ids, nunca o código, a sessão ou o nome (S41)', async (t) => {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id, 'Empresa A', 'empresa-a')
  const neon = await neonServer(t)
  const environment = { ...serveEnvironment(t, hub.test.runtimeUrl), HUB_NEON_API_URL: neon.url }
  const spawned = await spawnHub(t, environment)
  const base = `http://127.0.0.1:${spawned.port}`
  const edge = `http://127.0.0.1:${spawned.edgePort}`
  const json = { origin: TEST_ORIGIN, 'content-type': 'application/json' }
  const secrets: string[] = []
  try {
    const signedIn = await fetch(`${base}/api/sessions/current`, {
      method: 'PUT',
      headers: { ...json, 'cf-connecting-ip': '203.0.113.9' },
      body: JSON.stringify({ email: ANA_OWNER.email, password: PASSWORD }),
    })
    const cookie = (signedIn.headers.get('set-cookie') ?? '').split(';')[0] ?? ''
    secrets.push(cookie.split('=')[1] ?? '')
    const created = await fetch(`${base}/api/companies/${companyId}/projects`, {
      method: 'POST',
      headers: { ...json, cookie, 'idempotency-key': crypto.randomUUID() },
      body: JSON.stringify({ name: 'Pedidos' }),
    })
    assert.equal(created.status, 201)
    const binding = randomBytes(32).toString('base64url')
    const hash = createHash('sha256').update(binding).digest('base64url')
    const made = await fetch(`${base}/api/apps/handoffs`, {
      method: 'POST',
      headers: { ...json, cookie },
      body: JSON.stringify({ host: PEDIDOS, binding: hash }),
    })
    const code = String(
      new URL(String(Object(await made.json()).location)).searchParams.get('code'),
    )
    const redeemed = await fetch(`${edge}/api/app-sessions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ host: PEDIDOS, code, binding }),
    })
    const session = String(Object(await redeemed.json()).session)
    secrets.push(binding, hash, code, session)
    await hub.test.asOwner(`delete from auth.member where company_id = $1`, [companyId])
    const refused = await fetch(`${edge}/api/app-sessions/current?host=${PEDIDOS}`, {
      headers: { [APP_SESSION_HEADER]: session },
    })
    assert.equal(refused.status, 403)
  } finally {
    await spawned.stop()
  }
  for (const message of ['APP_HANDOFF_CREATED', 'APP_SESSION_CREATED', 'APP_ACCESS_REFUSED']) {
    const line = spawned.lines.find((logged) => logged.msg === message)
    assert.equal(line?.companyId, companyId, message)
    assert.match(String(line?.projectId), /^[0-9a-f]{32}$/, message)
  }
  const printed = JSON.stringify(spawned.lines)
  for (const secret of secrets) assert.equal(printed.includes(secret), false)
  assert.doesNotMatch(printed, /Ana Lima|Pedidos/)
})

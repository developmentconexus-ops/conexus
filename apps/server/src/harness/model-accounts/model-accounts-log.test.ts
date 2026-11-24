import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  ANA_OWNER,
  hubWithMail,
  PASSWORD,
  personOn,
  plantCompany,
} from '../../hub/identity/test-hub.ts'
import { serveEnvironment, TEST_ORIGIN } from '../../platform/test-database.ts'
import { spawnHub } from '../../platform/test-hub-process.ts'

const KEY = 'sk-planted-7b1e4c9d2a6f-key-never-printed-Zz91'

test('a chave plantada não sai no log, na resposta nem na falha, nem quando o lacre recusa', async (t) => {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id)
  const spawned = await spawnHub(t, serveEnvironment(t, hub.test.runtimeUrl))
  const accounts = `http://127.0.0.1:${spawned.port}/api/companies/${companyId}/model-accounts`
  const json = { origin: TEST_ORIGIN, 'content-type': 'application/json' }
  const bodies: string[] = []
  try {
    const signedIn = await fetch(`http://127.0.0.1:${spawned.port}/api/sessions/current`, {
      method: 'PUT',
      headers: { ...json, 'cf-connecting-ip': '203.0.113.9' },
      body: JSON.stringify({ email: ANA_OWNER.email, password: PASSWORD }),
    })
    const cookie = (signedIn.headers.get('set-cookie') ?? '').split(';')[0] ?? ''
    const attempt = crypto.randomUUID()
    async function link(body: object, key = attempt) {
      const answer = await fetch(accounts, {
        method: 'POST',
        headers: { ...json, cookie, 'idempotency-key': key },
        body: JSON.stringify({
          owner: 'company',
          provider: 'anthropic',
          label: 'Time',
          key: KEY,
          ...body,
        }),
      })
      bodies.push(await answer.text())
      return answer.status
    }
    assert.equal(await link({}), 201)
    assert.equal(await link({ provider: 'nenhum' }, crypto.randomUUID()), 422)
    assert.equal(await link({ label: 'Outro' }), 409)
    // A blob that no longer opens: the replay compares keys and the seal refuses, as a 500.
    await hub.test.asOwner(`update builder.model_account set sealed = sealed || '\\x00'::bytea`)
    assert.equal(await link({}), 500)
    const listed = await fetch(accounts, { headers: { cookie } })
    bodies.push(await listed.text())
  } finally {
    await spawned.stop()
  }
  assert.ok(spawned.lines.some((line) => line.msg === 'MODEL_ACCOUNT_LINKED'))
  assert.ok(spawned.lines.some((line) => line.msg === 'SEAL_REFUSED'))
  const printed = JSON.stringify([spawned.lines, bodies])
  for (const part of [KEY, KEY.slice(0, 16), KEY.slice(8, 30)])
    assert.equal(printed.includes(part), false)
  assert.ok(bodies[0]?.includes('"hint":"Zz91"'))
})

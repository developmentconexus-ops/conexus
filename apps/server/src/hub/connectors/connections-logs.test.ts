import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { sankhyaFake } from '@conexus/connectors'
import { serveEnvironment, TEST_ORIGIN } from '../../platform/test-database.ts'
import { spawnHub } from '../../platform/test-hub-process.ts'
import { ANA_OWNER, hubWithMail, PASSWORD, personOn, plantCompany } from '../identity/test-hub.ts'

test('o log do Testar leva o status e o código do fornecedor, nunca o corpo', async (t) => {
  const fake = sankhyaFake()
  const served = await fake.serve()
  t.after(() => served.close())
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id)
  const spawned = await spawnHub(t, {
    ...serveEnvironment(t, hub.test.runtimeUrl),
    HUB_CONNECTOR_ORIGINS: `sankhya=${served.origin}`,
  })
  const origin = `http://127.0.0.1:${spawned.port}`
  const connections = `${origin}/api/companies/${companyId}/connections`
  const json = { origin: TEST_ORIGIN, 'content-type': 'application/json' }
  try {
    const signedIn = await fetch(`${origin}/api/sessions/current`, {
      method: 'PUT',
      headers: { ...json, 'cf-connecting-ip': '203.0.113.9' },
      body: JSON.stringify({ email: ANA_OWNER.email, password: PASSWORD }),
    })
    const cookie = (signedIn.headers.get('set-cookie') ?? '').split(';')[0] ?? ''
    async function tested(name: string, credential: Record<string, string>) {
      const linked = await fetch(connections, {
        method: 'POST',
        headers: { ...json, cookie, 'idempotency-key': randomUUID() },
        body: JSON.stringify({ connector: 'sankhya', name, credential }),
      })
      const id = Object(await linked.json()).connection.id
      await fetch(`${connections}/${id}/test`, {
        method: 'POST',
        headers: { origin: TEST_ORIGIN, cookie },
      })
      return id
    }
    const wrong = await tested('Errada', { ...fake.credential, clientSecret: 'segredo-errado' })
    const right = await tested('Certa', fake.credential)
    fake.switches.refuse.add('empresas')
    const barred = await tested('Sem empresas', fake.credential)

    const lines = spawned.lines.filter((line) => line.msg === 'CONNECTION_TESTED')
    assert.deepEqual(
      lines.map((line) => [line.connectionId, line.result, line.status, line.code]),
      [
        [wrong, 'AUTH_REFUSED', 401, 'GTW2510'],
        [right, 'WORKING', undefined, undefined],
        [barred, 'READ_REFUSED', 403, 'NO_ACCESS'],
      ],
    )
    assert.equal(JSON.stringify(spawned.lines).includes('Sem permissão'), false)
    assert.equal(JSON.stringify(spawned.lines).includes('Credenciais inválidas'), false)
  } finally {
    await spawned.stop()
  }
})

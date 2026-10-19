import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import {
  ANA_OWNER,
  hubWithMail,
  PASSWORD,
  personOn,
  plantCompany,
} from '../../hub/identity/test-hub.ts'
import { serveEnvironment, TEST_ORIGIN, testSealKeyLine } from '../../platform/test-database.ts'
import { spawnHub, startHub } from '../../platform/test-hub-process.ts'

const KEY = 'sk-reseal-key-for-tests-Rr42'

function keysFile(t: TestContext, ...lines: string[]): string {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-seal-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const path = join(dir, 'hub_seal_keys')
  writeFileSync(path, `${lines.join('\n')}\n`, { mode: 0o400 })
  return path
}

test('reseal muda as contas da chave antiga para a última, sem perda, e roda de novo sem nada a fazer', async (t) => {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id)
  const [old, current] = [testSealKeyLine('k1'), testSealKeyLine('k2')]
  const environment = serveEnvironment(t, hub.test.runtimeUrl)
  const attempt = crypto.randomUUID()
  async function link(keys: string, body: object = {}) {
    const spawned = await spawnHub(t, { ...environment, HUB_SEAL_KEYS_FILE: keys })
    const base = `http://127.0.0.1:${spawned.port}`
    const json = { origin: TEST_ORIGIN, 'content-type': 'application/json' }
    try {
      const signedIn = await fetch(`${base}/api/sessions/current`, {
        method: 'PUT',
        headers: { ...json, 'cf-connecting-ip': '203.0.113.9' },
        body: JSON.stringify({ email: ANA_OWNER.email, password: PASSWORD }),
      })
      const cookie = (signedIn.headers.get('set-cookie') ?? '').split(';')[0] ?? ''
      const linked = await fetch(`${base}/api/companies/${companyId}/model-accounts`, {
        method: 'POST',
        headers: { ...json, cookie, 'idempotency-key': attempt },
        body: JSON.stringify({
          owner: 'company',
          provider: 'anthropic',
          label: 'Time',
          key: KEY,
          ...body,
        }),
      })
      return linked.status
    } finally {
      await spawned.stop()
    }
  }
  async function reseal(keys: string) {
    const ports = { HUB_PORT: '8080', HUB_EDGE_PORT: '8081' }
    const run = startHub(t, { ...environment, ...ports, HUB_SEAL_KEYS_FILE: keys }, ['reseal'])
    assert.equal(await run.exited, 0, JSON.stringify(run.lines))
    return run.lines.find((line) => line.msg === 'RESEALED')
  }
  assert.equal(await link(keysFile(t, old)), 201)
  async function keyIds() {
    const rows = await hub.test.asOwner(`select key_id from builder.model_account`)
    return rows.map((row) => Object(row).key_id)
  }
  assert.deepEqual(await keyIds(), ['k1'])
  const both = keysFile(t, old, current)
  assert.deepEqual([(await reseal(both))?.moved, (await reseal(both))?.moved], [1, 0])
  assert.deepEqual(await keyIds(), ['k2'])
  // The old line has left: the replay opens the credential to compare it, so nothing was lost.
  const only = keysFile(t, current)
  assert.equal(await link(only), 201)
  assert.equal(await link(only, { key: `${KEY}-outra` }), 409)
})

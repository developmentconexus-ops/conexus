import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { sankhyaFake } from '@conexus/connectors'
import { serveEnvironment, testSealKeyLine } from '../../platform/test-database.ts'
import { startHub } from '../../platform/test-hub-process.ts'
import { codeOf, hubWithLog, personOn, plantCompany } from '../identity/test-hub.ts'
import { connectionsOn, linkSankhya, sealingWith, testOf } from './test-connections.ts'

function keysFile(t: TestContext, ...lines: string[]): string {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-seal-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const path = join(dir, 'hub_seal_keys')
  writeFileSync(path, `${lines.join('\n')}\n`, { mode: 0o400 })
  return path
}

test('o selo da ligação abre só com o seu contexto', async (t) => {
  const { hub, fake, ana, companyId, base } = await connectionsOn(t)
  const otherCompany = await plantCompany(hub.test, ana.id, 'Outra Empresa')
  const otherBase = `/api/companies/${otherCompany}/connections`
  const mine = Object((await linkSankhya(hub, ana, base, fake.credential)).json()).connection
  const theirs = Object((await linkSankhya(hub, ana, otherBase, fake.credential)).json()).connection
  assert.equal(Object((await testOf(hub, ana, otherBase, theirs.id)).json()).result, 'WORKING')

  // The same values sealed for another row of another company do not open here.
  await hub.test.asOwner(
    `update connectors.connection set sealed = (select sealed from connectors.connection where company_id = $1)
      where company_id = $2`,
    [companyId, otherCompany],
  )
  const copied = await testOf(hub, ana, otherBase, theirs.id)
  assert.deepEqual([copied.statusCode, codeOf(copied)], [500, 'SEAL_REFUSED'])
  assert.equal(Object((await testOf(hub, ana, base, mine.id)).json()).result, 'WORKING')

  // Nor for another connector.
  await hub.test.asOwner(`update connectors.connection set connector_id = 'outro' where id = $1`, [
    mine.id,
  ])
  const moved = await testOf(hub, ana, base, mine.id)
  assert.deepEqual([moved.statusCode, codeOf(moved)], [500, 'SEAL_REFUSED'])
})

test('o reseal move as ligações da chave antiga e conta as que não abrem', async (t) => {
  const [old, current] = [testSealKeyLine('k1'), testSealKeyLine('k2')]
  const fake = sankhyaFake()
  const hub = await hubWithLog(t, sealingWith(old))
  const ana = await personOn(hub, { name: 'Ana Lima', email: 'ana@example.test' })
  const companies = [
    await plantCompany(hub.test, ana.id),
    await plantCompany(hub.test, ana.id, 'Outra Empresa'),
  ]
  for (const companyId of companies) {
    const linked = await linkSankhya(
      hub,
      ana,
      `/api/companies/${companyId}/connections`,
      fake.credential,
    )
    assert.equal(linked.statusCode, 201)
  }
  // A connection of a connector the kit no longer has cannot rebuild its seal's context.
  await hub.test.asOwner(
    `update connectors.connection set connector_id = 'outro' where company_id = $1`,
    [companies[1]],
  )
  const environment = serveEnvironment(t, hub.test.runtimeUrl)
  async function reseal(keys: string) {
    const ports = { HUB_PORT: '8080', HUB_EDGE_PORT: '8081' }
    const run = startHub(t, { ...environment, ...ports, HUB_SEAL_KEYS_FILE: keys }, ['reseal'])
    const exited = await run.exited
    return { exited, done: run.lines.find((line) => line.msg === 'RESEALED') }
  }
  async function keyIds() {
    const rows = await hub.test.asOwner(
      `select key_id from connectors.connection order by connector_id`,
    )
    return rows.map((row) => Object(row).key_id)
  }
  const first = await reseal(keysFile(t, old, current))
  assert.equal(first.exited, 0)
  assert.deepEqual([first.done?.moved, first.done?.refused], [1, 1])
  assert.deepEqual(await keyIds(), ['k1', 'k2'])
  // With only the new key the moved one still opens: it is kept, and only the other is refused.
  const again = await reseal(keysFile(t, current))
  assert.deepEqual([again.exited, again.done?.moved, again.done?.refused], [0, 0, 1])
  // A key file that opens no connection fails the command rather than report a clean run.
  const wrong = await reseal(keysFile(t, testSealKeyLine('k2')))
  assert.notEqual(wrong.exited, 0)
})

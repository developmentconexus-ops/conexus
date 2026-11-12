import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { PADARIA_SOL_MATRIZ } from '../connectors/test-sales.ts'
import type { CopiesOn } from './test-copies.ts'
import { copiesOn, copyRowOf, runsOf } from './test-copies.ts'

const NOTAS = PADARIA_SOL_MATRIZ.notas
const MIGRATIONS = join(import.meta.dirname, '../../../migrations')
const SOURCES = readdirSync(MIGRATIONS)
  .filter((name) => name.endsWith('_sync_copy_sources_data'))
  .map((name) => readFileSync(join(MIGRATIONS, name, 'migration.sql'), 'utf8'))[0]

function sourcesOf(on: CopiesOn) {
  return on.hub.test.asOwner(
    `select copy_id, connection_id, connector_id, account_ref, pass, position, watermark, pass_started_at
     from copies.copy_source order by copy_id`,
  )
}

test('a fonte de cada cópia de hoje', async (t) => {
  assert.ok(SOURCES, 'the data migration')
  const on = await copiesOn(t)
  const copyId = await on.enable('vendas')
  const fiftieth = NOTAS.map((nota) => nota.nunota).sort((a, b) => a - b)[49]
  // A copy of before the sources: its pass where the copy kept it, and no source.
  await on.hub.test.asOwner('delete from copies.copy_source where copy_id = $1', [copyId])
  await on.hub.test.asOwner(
    `update copies.copy set pass = 3, position = $2, watermark = '2026-11-01T12:00:00Z',
       pass_started_at = '2026-11-02T12:00:00Z' where id = $1`,
    [copyId, JSON.stringify([fiftieth])],
  )
  await on.hub.test.asOwner(SOURCES)
  const [source] = await sourcesOf(on)
  assert.deepEqual(
    {
      ...source,
      watermark: new Date(String(source?.watermark)).toISOString(),
      pass_started_at: new Date(String(source?.pass_started_at)).toISOString(),
    },
    {
      copy_id: copyId,
      connection_id: on.connectionId,
      connector_id: 'sankhya',
      account_ref: null,
      pass: 3,
      position: { kind: 'KEY', after: [fiftieth] },
      watermark: '2026-11-01T12:00:00.000Z',
      pass_started_at: '2026-11-02T12:00:00.000Z',
    },
  )
  await on.hub.test.asOwner(SOURCES)
  assert.equal((await sourcesOf(on)).length, 1, 'a segunda vez não insere')
  // Its first pass, which reads the whole source: the position alone decides where it goes on.
  await on.hub.test.asOwner('update copies.copy_source set watermark = null where copy_id = $1', [
    copyId,
  ])

  assert.deepEqual(await on.run(copyId), { kind: 'ENDED', outcome: { kind: 'COMPLETE' } })
  const [run] = await runsOf(on, copyId)
  assert.deepEqual(
    [run.pages, run.read],
    [3, NOTAS.length - 50],
    'a primeira rodada continua da posição guardada',
  )
  const row = await copyRowOf(on, copyId)
  assert.equal(row.pass, 4)
  assert.equal(row.position, null)
})

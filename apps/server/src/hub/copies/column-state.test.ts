import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { CopyId } from '@conexus/hub-api'
import { listCopies } from '@conexus/hub-api'
import { call } from '../identity/test-hub.ts'
import type { ColumnState, Seen } from './public.ts'
import { nextColumnState } from './public.ts'
import { asSync } from './test-copies.ts'
import { copiesUrl } from './test-routes.ts'
import type { StoresOn } from './test-sources.ts'
import { ordersCopy, STORE_A, storesOn } from './test-sources.ts'

const FIRST = new Date('2026-11-10T10:00:00.000Z')
const SECOND = new Date('2026-11-10T11:00:00.000Z')
const THIRD = new Date('2026-11-10T12:00:00.000Z')

function seen(present: string[], over: Partial<Seen> = {}): Seen {
  return { present: new Set(present), whole: true, rows: 10, ...over }
}

function step(previous: ColumnState, s: Seen, began: Date) {
  return nextColumnState({ previous, columns: ['a', 'b'], seen: s, began })
}

test('inativa só depois de vista', () => {
  const first = step({}, seen(['a']), FIRST)
  assert.deepEqual(Object.keys(first), ['a'], 'a coluna nunca vista continua ausente')
  const second = step(first, seen(['a']), SECOND)
  assert.equal(second.b, undefined)
  const both = step({}, seen(['a', 'b']), FIRST)
  const gone = step(both, seen(['a']), SECOND)
  assert.equal(gone.b?.inactiveSince, SECOND.toISOString())
  assert.equal(gone.b?.seenAt, FIRST.toISOString())
  assert.equal(
    step(gone, seen(['a']), THIRD).b?.inactiveSince,
    SECOND.toISOString(),
    'a data não anda',
  )
})

test('volta a ativa', () => {
  const gone = step(step({}, seen(['a', 'b']), FIRST), seen(['a']), SECOND)
  const back = step(gone, seen(['a', 'b'], { whole: false }), THIRD)
  assert.deepEqual(back.b, { seenAt: THIRD.toISOString(), inactiveSince: null })
})

test('a passada do alterado não marca', () => {
  const both = step({}, seen(['a', 'b']), FIRST)
  assert.equal(step(both, seen(['a'], { whole: false }), SECOND).b?.inactiveSince, null)
})

test('zero linhas não marca', () => {
  const both = step({}, seen(['a', 'b']), FIRST)
  assert.equal(step(both, seen([], { rows: 0 }), SECOND).b?.inactiveSince, null)
})

async function inactiveOf(on: StoresOn, column: string) {
  const read = await call(on.hub, on.ana, 'GET', copiesUrl(on))
  assert.equal(read.statusCode, 200, read.body)
  const [found] = listCopies.success.body.parse(read.json()).copies
  return found?.shown.columns.find((each) => each.name === column)?.inactiveSince
}

function pointStatusAt(on: StoresOn, copyId: CopyId, path: string) {
  return on.hub.test.asOwner(
    `update copies.copy set definition = jsonb_set(definition, '{columns,1,path}', $2::jsonb) where id = $1`,
    [copyId, JSON.stringify(path)],
  )
}

for (const [title, changed, rounds] of [
  ['a coluna que some fica inativa e volta', false, 2],
  ['a cópia que relê tudo marca da segunda rodada em diante', false, 3],
] as const) {
  test(title, async (t) => {
    const on = await storesOn(t, { stores: [STORE_A] })
    const copyId = await on.planted('pedidos', ordersCopy(changed), [STORE_A.ref])
    assert.deepEqual(await on.ended(copyId), { kind: 'COMPLETE' })
    assert.equal(await inactiveOf(on, 'status'), null)
    if (rounds === 3) assert.deepEqual(await on.ended(copyId), { kind: 'COMPLETE' })
    await pointStatusAt(on, copyId, 'sumiu')
    assert.deepEqual(await on.ended(copyId), { kind: 'COMPLETE' })
    assert.notEqual(await inactiveOf(on, 'status'), null, 'inativa')
    const kept = await asSync(on.owner, (client) =>
      client.query('select status from sync."pedidos" limit 1'),
    )
    assert.equal(kept.rows.length, 1, 'a tabela continua com a coluna e as linhas')
    await pointStatusAt(on, copyId, 'status')
    assert.deepEqual(await on.ended(copyId), { kind: 'COMPLETE' })
    assert.equal(await inactiveOf(on, 'status'), null, 'volta a ativa')
  })
}

test('a passada do alterado não marca nada na segunda rodada', async (t) => {
  const on = await storesOn(t, { stores: [STORE_A] })
  const copyId = await on.planted('pedidos', ordersCopy(true), [STORE_A.ref])
  assert.deepEqual(await on.ended(copyId), { kind: 'COMPLETE' })
  await on.hub.test.asOwner(
    `update copies.copy_source set watermark = '2020-01-01' where copy_id = $1`,
    [copyId],
  )
  await pointStatusAt(on, copyId, 'sumiu')
  assert.deepEqual(await on.ended(copyId), { kind: 'COMPLETE' })
  assert.equal(await inactiveOf(on, 'status'), null)
})

test('uma rodada que não termina COMPLETE não marca', async (t) => {
  const on = await storesOn(t, { stores: [STORE_A] })
  const copyId = await on.planted('pedidos', ordersCopy(false), [STORE_A.ref])
  assert.deepEqual(await on.ended(copyId), { kind: 'COMPLETE' })
  await pointStatusAt(on, copyId, 'sumiu')
  on.door.busy.set(on.door.seen.length + 2, '60')
  assert.deepEqual(await on.ended(copyId), { kind: 'PARTIAL', reason: 'WAIT' })
  assert.equal(await inactiveOf(on, 'status'), null)
})

test('retomar uma passada aberta não marca', async (t) => {
  const on = await storesOn(t, { stores: [STORE_A] })
  const copyId = await on.planted('pedidos', ordersCopy(false), [STORE_A.ref])
  assert.deepEqual(await on.ended(copyId), { kind: 'COMPLETE' })
  await on.hub.test.asOwner(
    `update copies.copy_source set position = '{"kind":"OFFSET","offset":50}'::jsonb where copy_id = $1`,
    [copyId],
  )
  await pointStatusAt(on, copyId, 'sumiu')
  assert.deepEqual(await on.ended(copyId), { kind: 'COMPLETE' })
  assert.equal(await inactiveOf(on, 'status'), null)
})

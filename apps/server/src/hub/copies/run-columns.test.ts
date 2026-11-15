import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { copiesOn } from './test-copies.ts'

function insertRun(
  on: Awaited<ReturnType<typeof copiesOn>>,
  copyId: string,
  outcome: 'COMPLETE' | 'ERROR',
  systemStatus: number | null = null,
) {
  return on.hub.test.asOwner(
    `insert into copies.copy_run (id, company_id, copy_id, started_at, ended_at, outcome, system_status)
     values ($1, $2, $3, now(), now(), $4, $5)`,
    [randomUUID(), on.companyId, copyId, outcome, systemStatus],
  )
}

test('uma rodada de antes fica com whole falso e sem mensagem do sistema', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('vendas')
  await on.hub.test.asOwner('delete from copies.copy_run where copy_id = $1', [copyId])
  await insertRun(on, copyId, 'COMPLETE')
  assert.deepEqual(
    await on.hub.test.asOwner(
      'select whole, system_status, system_code, system_message from copies.copy_run where copy_id = $1',
      [copyId],
    ),
    [{ whole: false, system_status: null, system_code: null, system_message: null }],
  )
})

test('o status do sistema só cabe numa rodada que terminou em ERROR', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('vendas')
  await on.hub.test.asOwner('delete from copies.copy_run where copy_id = $1', [copyId])
  await assert.rejects(insertRun(on, copyId, 'COMPLETE', 401), { code: '23514' })
  await insertRun(on, copyId, 'ERROR', 401)
  await assert.rejects(
    on.hub.test.asOwner(
      `update copies.copy_run set system_message = repeat('x', 1001) where copy_id = $1`,
      [copyId],
    ),
    { code: '23514' },
  )
})

test('o código e a mensagem do sistema também só cabem numa rodada que terminou em ERROR', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('vendas')
  await on.hub.test.asOwner('delete from copies.copy_run where copy_id = $1', [copyId])
  await insertRun(on, copyId, 'COMPLETE')
  for (const column of ['system_code', 'system_message']) {
    await assert.rejects(
      on.hub.test.asOwner(`update copies.copy_run set ${column} = 'x' where copy_id = $1`, [
        copyId,
      ]),
      { code: '23514' },
    )
  }
})

test('whole não aceita nulo', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('vendas')
  await on.hub.test.asOwner('delete from copies.copy_run where copy_id = $1', [copyId])
  await insertRun(on, copyId, 'COMPLETE')
  await assert.rejects(
    on.hub.test.asOwner('update copies.copy_run set whole = null where copy_id = $1', [copyId]),
    { code: '23502' },
  )
})

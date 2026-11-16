import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { CopyId } from '@conexus/hub-api'
import type { CopiesOn } from './test-copies.ts'
import { copiesOn, errorOf, runsOf, SANKHYA_REFUSED } from './test-copies.ts'

async function ended(on: CopiesOn, copyId: CopyId) {
  const end = await on.run(copyId)
  assert.equal(end.kind, 'ENDED', JSON.stringify(end))
  return end.kind === 'ENDED' ? end.outcome : undefined
}

test('a recusa guarda o que o sistema disse', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('clientes')
  on.fake.switches.refuse.add('consultar')
  assert.deepEqual(await ended(on, copyId), errorOf('COPY_SOURCE_REFUSED', SANKHYA_REFUSED))
  const [run] = await runsOf(on, copyId)
  assert.deepEqual(
    [run.system_status, run.system_code, run.system_message],
    [200, '0', 'Serviço recusado'],
  )
})

test('sem resposta, sem mensagem', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('clientes')
  on.fake.switches.refuse.add('consultar')
  await ended(on, copyId)
  on.fake.switches.refuse.delete('consultar')
  on.fake.switches.silent = true
  await ended(on, copyId)
  on.fake.switches.silent = false
  const write = t.mock.method(on.hub.postgres.companyPostgres, 'writePage', async () => ({
    kind: 'NO_ANSWER' as const,
  }))
  await ended(on, copyId)
  write.mock.restore()
  assert.deepEqual(await ended(on, copyId), { kind: 'COMPLETE' })
  assert.deepEqual(
    (await runsOf(on, copyId)).map((run) => [
      run.outcome,
      run.system_status,
      run.system_code,
      run.system_message,
    ]),
    [
      ['COMPLETE', null, null, null],
      ['ERROR', null, null, null],
      ['ERROR', null, null, null],
      ['ERROR', 200, '0', 'Serviço recusado'],
    ],
  )
})

test('a mensagem longa é cortada', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('clientes')
  on.fake.switches.refuse.add('consultar')
  on.fake.switches.refuseMessage = `${'a'.repeat(700)}\0${'b'.repeat(800)}`
  const outcome = await ended(on, copyId)
  const expected = `${'a'.repeat(700)}${'b'.repeat(300)}`
  assert.deepEqual(outcome, {
    kind: 'ERROR',
    code: 'COPY_SOURCE_REFUSED',
    system: { status: 200, code: '0', message: expected },
  })
  const [run] = await runsOf(on, copyId)
  assert.equal(run.system_message, expected)
})

test('a mensagem não vai ao log', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('clientes')
  on.fake.switches.refuse.add('consultar')
  await ended(on, copyId)
  for (const line of on.hub.lines)
    assert.ok(!JSON.stringify(line).includes('Serviço recusado'), line.message)
  const stopped = on.hub.lines.find((line) => line.message === 'COPY_RUN_ENDED')
  assert.equal(stopped?.fields.outcome, 'ERROR')
  assert.equal(stopped?.fields.reason, 'COPY_SOURCE_REFUSED')
})

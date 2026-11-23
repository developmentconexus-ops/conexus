import assert from 'node:assert/strict'
import { test } from 'node:test'
import { copiesOn } from '../../hub/copies/test-copies.ts'
import { call, personOn } from '../../hub/identity/test-hub.ts'
import { schedulerOf } from './public.ts'

test('o agendador: a falha de publicação vai ao registro com o id da agenda', () => {
  const lines: { fields: Record<string, unknown>; message: string }[] = []
  const log = {
    info: () => undefined,
    error: (fields: Record<string, unknown>, message: string) =>
      void lines.push({ fields, message }),
  }
  schedulerOf(log, 200).onError(new Error('x'), { scheduleId: 'schedule_a' })
  assert.deepEqual(lines, [
    { fields: { scheduleId: 'schedule_a' }, message: 'SCHEDULE_PUBLISH_FAILED' },
  ])
  assert.equal(schedulerOf(log, 200).tickIntervalMs, 200)
  assert.equal('tickIntervalMs' in schedulerOf(log, undefined), false)
})

test('nenhum relógio de cópia', async (t) => {
  const on = await copiesOn(t)
  const { hub } = on
  function copyRows() {
    return hub.mastra.schedules.list({ workflowId: 'conexus-copy-run' })
  }
  assert.deepEqual(await copyRows(), [], 'after the Hub boots')
  await on.plant('vendas')
  const operator = await personOn(hub, {
    ...{ name: 'Olga Souza', email: 'olga@example.test' },
    role: 'admin',
  })
  await hub.test.asOwner(
    `insert into operations.client (company_id, cnpj, legal_name, attempt_key, registered_at)
     values ($1, '00000000000001', 'Empresa A Ltda', $1, now())`,
    [on.companyId],
  )
  const body = { name: 'Empresa A', revision: 0 }
  const deleted = await call(hub, operator, 'DELETE', `/api/clients/${on.companyId}`, body)
  assert.equal(deleted.statusCode, 204, deleted.body)
  assert.deepEqual(await copyRows(), [], 'after the company is removed')
  assert.deepEqual(
    hub.lines.filter(({ message }) => message === 'COPY_SCHEDULES_RELEASED'),
    [],
  )
})

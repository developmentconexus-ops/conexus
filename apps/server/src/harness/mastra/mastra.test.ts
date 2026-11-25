import assert from 'node:assert/strict'
import { test } from 'node:test'
import { call, personOn } from '../../hub/identity/test-hub.ts'
import { conversing } from '../routes/test-conversation.ts'
import { stepped } from '../routes/test-questions.ts'
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
  const on = await conversing(t, stepped([]))
  const { hub } = on
  function copyRows() {
    return hub.mastra.schedules.list({ workflowId: 'conexus-copy-run' })
  }
  assert.deepEqual(await copyRows(), [], 'after the Hub boots')
  const operator = await personOn(hub, {
    ...{ name: 'Olga Souza', email: 'olga@example.test' },
    role: 'admin',
  })
  await hub.test.asOwner(
    `insert into operations.client (company_id, cnpj, legal_name, attempt_key, registered_at)
     values ($1, '00000000000001', 'Empresa A Ltda', $1, now())`,
    [on.companyId],
  )
  const body = { name: 'Empresa Teste', revision: 0 }
  const deleted = await call(hub, operator, 'DELETE', `/api/clients/${on.companyId}`, body)
  assert.equal(deleted.statusCode, 204, deleted.body)
  assert.deepEqual(await copyRows(), [], 'after the company is removed')
  assert.deepEqual(
    hub.lines.filter(({ message }) => message === 'COPY_SCHEDULES_RELEASED'),
    [],
  )
})

test('o agendador: a agenda de um fluxo que ninguém registra sobrevive a quatro tiques seguidos e é apagada no quinto', async (t) => {
  const on = await conversing(t, stepped([]), (config) => ({
    ...config,
    automationClock: { schedulerTickMs: 3_600_000, turnMs: 60_000 },
  }))
  const { scheduler } = on.hub.mastra
  const store = await on.hub.mastra.getStorage()?.getStore('schedules')
  assert.ok(scheduler && store, 'the scheduler runs, over the one store')
  const now = Date.now()
  await store.createSchedule({
    id: 'schedule_orphan',
    target: { type: 'workflow', workflowId: 'conexus-renamed-flow' },
    cron: '0 0 1 1 *',
    status: 'active',
    nextFireAt: now - 1,
    createdAt: now,
    updatedAt: now,
  })
  for (const tick of [1, 2, 3, 4]) {
    await scheduler.tick()
    assert.notEqual(await store.getSchedule('schedule_orphan'), null, `alive after tick ${tick}`)
  }
  await scheduler.tick()
  assert.equal(await store.getSchedule('schedule_orphan'), null, 'deleted on the fifth miss')
})

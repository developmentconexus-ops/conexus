import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, ConnectionId } from '@conexus/hub-api'
import { call, personOn } from '../../hub/identity/test-hub.ts'
import { silent } from '../../platform/test-database.ts'
import { createLakeClock } from '../copy-clock/public.ts'
import { conversing, hubBeside } from '../routes/test-conversation.ts'
import { stepped } from '../routes/test-questions.ts'
import { COPY_WORKFLOW, schedulerOf } from './public.ts'

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

test('o relógio da ligação: a subida deixa um por cópia fora de MANUAL e nenhum de ligação que saiu; remover a empresa tira os dela', async (t) => {
  const on = await conversing(t, stepped([]))
  const { hub } = on
  const companyId = CompanyId.parse(on.companyId)
  function newConnection() {
    return ConnectionId.parse(crypto.randomUUID())
  }
  const [clocked, manual, gone] = [newConnection(), newConnection(), newConnection()]
  for (const [connection, interval] of [
    [clocked, '2h'],
    [manual, 'MANUAL'],
  ] as const) {
    await hub.test.asOwner(
      `insert into connectors.connection (id, company_id, connector_id, name, connector_version, state,
         sealed, key_id, linked_by, linked_at, attempt_key)
       values ($1, $2, 'sankhya', $4, '1.0.0', 'ACTIVE', '\\x01', 'k1', $3, now(), $4)`,
      [connection, companyId, on.ana.id, `Ligação ${interval}`],
    )
    await hub.test.asOwner(
      `insert into copies.lake_copy (company_id, connector_id, connection_id, interval, created_at)
       values ($1, 'sankhya', $2, $3, '2026-11-24T14:07:00Z')`,
      [companyId, connection, interval],
    )
  }
  const anchor = new Date('2026-11-24T13:07:00Z')
  for (const connectionId of [manual, gone])
    await createLakeClock({ mastra: hub.mastra, log: silent }).set({
      ...{ companyId, connectionId, interval: '1h', fullPass: 'OFF', anchor },
    })

  const beside = await hubBeside(t, hub)
  const rows = await beside.mastra.schedules.list({ workflowId: COPY_WORKFLOW })
  assert.deepEqual(
    rows.map(({ id, cron }) => ({ id, cron })),
    [{ id: `schedule_${clocked}`, cron: '7 1-23/2 * * *' }],
    'after the Hub starts',
  )

  const operator = await personOn(hub, {
    ...{ name: 'Olga Souza', email: 'olga@example.test' },
    role: 'admin',
  })
  await hub.test.asOwner(
    `insert into operations.client (company_id, cnpj, legal_name, attempt_key, registered_at)
     values ($1, '00000000000001', 'Empresa A Ltda', $1, now())`,
    [companyId],
  )
  const body = { name: 'Empresa Teste', revision: 0 }
  const deleted = await call(hub, operator, 'DELETE', `/api/clients/${companyId}`, body)
  assert.equal(deleted.statusCode, 204, deleted.body)
  assert.deepEqual(
    await hub.mastra.schedules.list({ workflowId: COPY_WORKFLOW }),
    [],
    'after the company is removed',
  )
  assert.deepEqual(
    hub.lines
      .filter(({ message }) => message === 'LAKE_CLOCKS_RELEASED')
      .map(({ fields }) => fields),
    [{ companyId, count: 1 }],
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

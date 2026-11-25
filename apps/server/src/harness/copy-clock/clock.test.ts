import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, ConnectionId } from '@conexus/hub-api'
import { lakeRunOn } from '../../hub/copies/test-lake-run.ts'
import { silent } from '../../platform/test-database.ts'
import { until } from '../../platform/test-until.ts'
import { COPY_WORKFLOW } from '../mastra/public.ts'
import { COPY_TIMEZONE, createLakeClock, cronOf } from './public.ts'

const AT_10_07 = new Date('2026-11-24T13:07:00Z')
const AT_11_07 = new Date('2026-11-24T14:07:00Z')

test('o relógio conta da hora em que a cópia nasceu, no fuso de São Paulo', () => {
  assert.equal(cronOf('15m', AT_10_07), '7,22,37,52 * * * *')
  assert.equal(cronOf('30m', AT_10_07), '7,37 * * * *')
  assert.equal(cronOf('1h', AT_10_07), '7 * * * *')
  assert.equal(cronOf('24h', AT_10_07), '7 10 * * *')
  assert.equal(cronOf('2h', AT_11_07), '7 1-23/2 * * *')
  assert.equal(cronOf('6h', AT_11_07), '7 5-23/6 * * *')
  assert.equal(
    cronOf('24h', new Date('2026-11-25T02:59:00Z')),
    '59 23 * * *',
    'the day of São Paulo',
  )
})

test('o relógio da ligação em mastra.schedules: o horário da cópia, nenhum em MANUAL, o mesmo horário de volta', async (t) => {
  const on = await lakeRunOn(t)
  const lakeClock = createLakeClock({ mastra: on.hub.mastra, log: silent })
  const { schedules } = on.hub.mastra
  const companyId = CompanyId.parse(on.companyId)
  const connectionId = ConnectionId.parse(crypto.randomUUID())
  const id = `schedule_${connectionId}`
  const copy = { companyId, connectionId, anchor: AT_10_07 }

  await lakeClock.set({ ...copy, interval: '15m' })
  const made = await schedules.get(id)
  assert.equal(made?.workflowId, COPY_WORKFLOW)
  assert.equal(made?.cron, '7,22,37,52 * * * *')
  assert.equal(made?.timezone, COPY_TIMEZONE)
  assert.equal(new Date(made?.nextFireAt ?? 0).getUTCMinutes() % 15, 7)

  await Promise.all([
    lakeClock.set({ ...copy, interval: '24h' }),
    lakeClock.set({ ...copy, interval: '24h' }),
  ])
  assert.equal((await schedules.get(id))?.cron, '7 10 * * *', 'two at once leave one row')
  assert.equal((await schedules.list({ workflowId: COPY_WORKFLOW })).length, 1)

  await lakeClock.set({ ...copy, interval: 'MANUAL' })
  assert.equal(await schedules.get(id), null, 'MANUAL leaves no clock row')
  assert.equal(await lakeClock.next(connectionId), null)

  await lakeClock.set({ ...copy, interval: '24h' })
  assert.equal((await schedules.get(id))?.cron, '7 10 * * *', 'back on an interval, the same hour')
})

test('o relógio só diz quando: o passo chama iniciarRodada e termina antes de a tarefa terminar', async (t) => {
  const on = await lakeRunOn(t)
  const connection = await on.copied([{ source: 'TGFPAR', name: 'sankhya_parceiros' }])
  const workflow = on.hub.mastra.getWorkflow(COPY_WORKFLOW)
  const run = await workflow.createRun()
  const ended = await run.start({
    inputData: { version: 1, companyId: on.companyId, connectionId: connection },
  })
  assert.equal(ended.status, 'success')
  assert.deepEqual(ended.status === 'success' ? ended.result : null, { kind: 'QUEUED' })
  const [open] = await on.rows(`select ended_at from copies.lake_run where connection_id = $1`, [
    connection,
  ])
  assert.deepEqual(open, { ended_at: null }, 'the round is open when the step ends')

  await until(() => on.aws.tasks().length > 0, 'the task started by the Hub')
  const [task, ...more] = on.aws.tasks()
  assert.deepEqual(more, [])
  assert.equal(task?.stopped, false, 'the task runs on after the step')

  const again = await (await workflow.createRun()).start({
    inputData: { version: 1, companyId: on.companyId, connectionId: connection },
  })
  assert.deepEqual(again.status === 'success' ? again.result : null, { kind: 'ALREADY_RUNNING' })
})

test('o relógio de uma ligação sem cópia sai no disparo', async (t) => {
  const on = await lakeRunOn(t)
  const lakeClock = createLakeClock({ mastra: on.hub.mastra, log: silent })
  const connection = await on.copied([])
  await on.rows(`delete from copies.lake_copy where connection_id = $1`, [connection])
  const companyId = CompanyId.parse(on.companyId)
  await lakeClock.set({
    companyId,
    connectionId: connection,
    interval: '1h',
    anchor: AT_10_07,
  })
  const ended = await (await on.hub.mastra.getWorkflow(COPY_WORKFLOW).createRun()).start({
    inputData: { version: 1, companyId, connectionId: connection },
  })
  assert.deepEqual(ended.status === 'success' ? ended.result : null, { kind: 'NO_COPY' })
  assert.equal(await on.hub.mastra.schedules.get(`schedule_${connection}`), null)
})

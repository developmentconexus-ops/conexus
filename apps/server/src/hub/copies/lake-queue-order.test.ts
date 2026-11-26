import assert from 'node:assert/strict'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { until } from '../../platform/test-until.ts'
import {
  drained,
  endedLines,
  finished,
  PARCEIROS,
  RESULT_GRACE_MS,
  result,
  roundOf,
  running,
} from './test-lake-queue.ts'
import { lakeRunOn, testClock } from './test-lake-run.ts'

test('a parada antes do resultado: a saída 0 lida antes do resultado, na mesma leitura ou em outra, fecha COMPLETE com o resultado, nunca COPY_TASK_LOST; numa leitura, o resultado vai antes da parada', async (t) => {
  const clock = testClock()
  const on = await lakeRunOn(t, clock)
  const together = await running(on)
  finished(on, together)
  on.aws.enqueue(result(together.run))
  const apart = await running(on, [PARCEIROS], 'Filial')
  finished(on, apart)
  const stopped = await running(on, [{ source: 'TGFITE', name: 'sankhya_itens' }], 'Terceira')
  on.aws.endTask(stopped.arn)
  on.aws.enqueue(result(stopped.run))

  await on.queue.start()
  await drained(on)
  for (const run of [together.run, stopped.run]) {
    assert.deepEqual(await roundOf(on, run), {
      ...{ outcome: 'COMPLETE', code: null, failed_table: null, ended: true },
    })
    assert.equal(endedLines(on, run)[0]?.fields.cause, 'RESULT')
  }

  await clock.sleep(64_000)
  await sleep(1_000)
  assert.equal((await roundOf(on, apart.run))?.ended, false, 'the stop alone closed nothing')
  assert.equal(on.queue.reading(), true, 'the round waiting for its result is open')
  on.aws.enqueue(result(apart.run))
  await drained(on)
  await until(async () => (await roundOf(on, apart.run))?.ended === true, 'the result closed')
  assert.equal((await roundOf(on, apart.run))?.outcome, 'COMPLETE')
  assert.equal(endedLines(on, apart.run).length, 1)
  await until(() => !on.queue.reading(), 'the consumer sleeps with no round open')
})

test('a parada sem resultado depois da graça: a saída 0 sem resultado fecha COPY_TASK_LOST só depois da graça; o resultado que chega depois não reescreve', async (t) => {
  const clock = testClock()
  const on = await lakeRunOn(t, clock)
  const quiet = await running(on)
  const awake = await running(on, [PARCEIROS], 'Filial')
  finished(on, quiet)
  await on.queue.start()
  await drained(on)

  await clock.sleep(RESULT_GRACE_MS - 1_000)
  await sleep(1_000)
  assert.equal((await roundOf(on, quiet.run))?.ended, false, 'still inside the grace')
  await clock.sleep(1_000)
  await until(async () => (await roundOf(on, quiet.run))?.ended === true, 'the grace ended')
  assert.deepEqual(await roundOf(on, quiet.run), {
    ...{ outcome: 'ERROR', code: 'COPY_TASK_LOST', failed_table: null, ended: true },
  })
  assert.equal(endedLines(on, quiet.run)[0]?.fields.cause, 'ECS_STOPPED')

  on.aws.enqueue(result(quiet.run))
  await drained(on)
  assert.equal((await roundOf(on, quiet.run))?.code, 'COPY_TASK_LOST')
  assert.equal(endedLines(on, quiet.run).length, 1, 'the late result closed nothing')
  assert.equal((await roundOf(on, awake.run))?.ended, false)
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { drained, PARCEIROS, result, roundOf, running } from './test-lake-queue.ts'
import { lakeRunOn } from './test-lake-run.ts'

const MACHINE = {
  allocated: { vcpu: 1, memoryMib: 2048 },
  peak: { vcpu: 0.97, memoryMib: 771 },
  everySeconds: 5,
  samples: [
    [0.4, 300],
    [0.97, 771],
    [0.6, 640],
  ],
}

function machineOf(on: Awaited<ReturnType<typeof lakeRunOn>>, run: string) {
  return on.rows(
    `select cpu_allocated::float as cpu_allocated, memory_allocated_mib, cpu_peak::float as cpu_peak,
            memory_peak_mib, machine_samples, system_status, system_code, system_message
       from copies.lake_run where id = $1`,
    [run],
  )
}

test('a máquina da rodada: o resultado grava as cinco colunas, sem machine ficam nulas, e a parada tardia não reescreve', async (t) => {
  const on = await lakeRunOn(t)
  const measured = await running(on)
  const bare = await running(on, [PARCEIROS], 'Filial')
  on.aws.enqueue(result(measured.run, { kind: 'COMPLETE' }, [], MACHINE))
  on.aws.enqueue(result(bare.run))
  on.aws.endTask(measured.arn, 'EXITED')
  await on.queue.start()
  await drained(on)

  assert.deepEqual(await machineOf(on, measured.run), [
    {
      ...{ cpu_allocated: 1, memory_allocated_mib: 2048, cpu_peak: 0.97, memory_peak_mib: 771 },
      machine_samples: { everySeconds: 5, samples: MACHINE.samples },
      ...{ system_status: null, system_code: null, system_message: null },
    },
  ])
  assert.deepEqual(await machineOf(on, bare.run), [
    {
      ...{ cpu_allocated: null, memory_allocated_mib: null, cpu_peak: null, memory_peak_mib: null },
      machine_samples: null,
      ...{ system_status: null, system_code: null, system_message: null },
    },
  ])
  assert.equal((await roundOf(on, measured.run))?.outcome, 'COMPLETE')

  await running(on, [{ source: 'TGFITE', name: 'sankhya_itens' }], 'Outra')
  on.aws.enqueue(
    result(measured.run, { kind: 'COMPLETE' }, [], { ...MACHINE, peak: { vcpu: 1, memoryMib: 9 } }),
  )
  on.aws.enqueue(result(bare.run, { kind: 'COMPLETE' }, [], MACHINE))
  await drained(on)
  assert.equal(
    (await machineOf(on, measured.run))[0]?.memory_peak_mib,
    771,
    'the first close wrote',
  )
  assert.equal(
    (await machineOf(on, bare.run))[0]?.memory_peak_mib,
    null,
    'a second close writes nothing',
  )
})

test('a máquina da rodada: a parada do ECS sem resultado grava a frase da AWS; a parada do Hub não grava', async (t) => {
  const on = await lakeRunOn(t)
  const died = await running(on)
  const stopped = await running(on, [PARCEIROS], 'Filial')
  on.aws.endTask(died.arn, 'EXITED')
  on.aws.endTask(stopped.arn)
  await on.queue.start()
  await drained(on)

  const [lost] = await machineOf(on, died.run)
  assert.equal(lost?.system_message, 'Essential container in task exited')
  assert.deepEqual([lost?.system_status, lost?.system_code, lost?.cpu_peak], [null, null, null])
  assert.equal((await roundOf(on, died.run))?.code, 'COPY_TASK_LOST')
  const [interrupted] = await machineOf(on, stopped.run)
  assert.equal(interrupted?.system_message, null)
})

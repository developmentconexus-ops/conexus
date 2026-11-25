import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, LakeRunId } from '@conexus/hub-api'
import { z } from 'zod'
import { TEST_AWS_ACCOUNT, TEST_AWS_REGION } from './test-aws.ts'
import { TEST_LAKE_ID as LAKE, servedAws as served, testRunParameter } from './test-aws-wire.ts'

const AT = {
  company: CompanyId.parse('EmpresaTesteA0000000000000000001'),
  account: TEST_AWS_ACCOUNT,
  region: TEST_AWS_REGION,
}
const RUN = LakeRunId.parse('00000000-0000-4000-8000-0000000000c1')
const OTHER = LakeRunId.parse('00000000-0000-4000-8000-0000000000c2')
const PARAMETER = testRunParameter(AT.company, RUN)

function start(run: LakeRunId, attempt = 1, cpu = 1024) {
  return {
    token: `${run}-${attempt}`,
    startedBy: run,
    writer: `arn:aws:iam::${TEST_AWS_ACCOUNT}:role/conexus-${LAKE}-escritor`,
    parameter: PARAMETER,
    machine: { cpu, memory: 2048 },
  }
}

test('dublê da AWS: uma pilha que se cria termina no segundo olhar e se apaga', async (t) => {
  const { aws, version } = await served(t)
  const created = await aws.stacks.create(AT, { id: LAKE, template: version })
  assert.equal(created.kind, 'DONE')
  if (created.kind !== 'DONE') return
  assert.deepEqual(await aws.stacks.status(AT, created.value), {
    kind: 'DONE',
    value: 'CREATE_IN_PROGRESS',
  })
  assert.deepEqual(await aws.stacks.status(AT, created.value), {
    kind: 'DONE',
    value: 'CREATE_COMPLETE',
  })
  assert.deepEqual(await aws.stacks.firstFailure(AT, created.value), { kind: 'DONE', value: null })
  assert.deepEqual(await aws.stacks.remove(AT, created.value), { kind: 'DONE', value: undefined })
  assert.deepEqual(await aws.stacks.status(AT, created.value), {
    kind: 'DONE',
    value: 'DELETE_IN_PROGRESS',
  })
})

test('dublê da AWS: a criação que falha mostra o diário gravado, e o nome preso, o depósito que sobrou', async (t) => {
  for (const [creation, left] of [
    ['FAILS', { kind: 'DONE', value: 'NONE' }],
    ['NAME_HELD', { kind: 'REFUSED', code: 'AccessDeniedException' }],
  ] as const) {
    const { aws, version } = await served(t, creation)
    const created = await aws.stacks.create(AT, { id: LAKE, template: version })
    assert.equal(created.kind, 'DONE')
    if (created.kind !== 'DONE') return
    await aws.stacks.status(AT, created.value)
    assert.deepEqual(await aws.stacks.status(AT, created.value), {
      kind: 'DONE',
      value: 'DELETE_COMPLETE',
    })
    const failed = await aws.stacks.firstFailure(AT, created.value)
    assert.equal(failed.kind, 'DONE', creation)
    assert.deepEqual(
      await aws.stacks.leftover(AT, { id: LAKE, stack: created.value }),
      left,
      creation,
    )
  }
})

test('dublê da AWS: a rodada, do parâmetro à mensagem do fim', async (t) => {
  const { aws, server } = await served(t)
  assert.deepEqual(await aws.tasks.putRun(AT, { name: PARAMETER, spec: '{}' }), {
    kind: 'DONE',
    value: undefined,
  })
  assert.deepEqual(server.parameters(), [PARAMETER])
  const first = await aws.tasks.start(AT, start(RUN))
  assert.equal(first.kind, 'DONE')
  if (first.kind !== 'DONE') return
  assert.deepEqual(await aws.tasks.start(AT, start(RUN)), first)
  assert.deepEqual(await aws.tasks.start(AT, start(RUN, 1, 2048)), {
    kind: 'REFUSED',
    code: 'ConflictException',
  })
  const second = await aws.tasks.start(AT, start(OTHER))
  assert.notDeepEqual(second, first)
  assert.deepEqual(await aws.tasks.state(AT, first.value), {
    kind: 'DONE',
    value: { kind: 'RUNNING' },
  })
  assert.deepEqual(await aws.tasks.find(AT, RUN), { kind: 'DONE', value: first.value })
  assert.deepEqual(await aws.tasks.stop(AT, first.value), { kind: 'DONE', value: undefined })
  assert.deepEqual(await aws.tasks.state(AT, first.value), {
    kind: 'DONE',
    value: { kind: 'STOPPED', stoppedAt: new Date(1_795_000_000_000) },
  })
  assert.deepEqual(await aws.tasks.find(AT, RUN), { kind: 'DONE', value: first.value })
  const heard = await aws.queue.receive(new AbortController().signal)
  assert.equal(heard.kind, 'DONE')
  if (heard.kind !== 'DONE') return
  const [event] = heard.value
  assert.deepEqual(
    z
      .object({ detail: z.object({ startedBy: z.string(), taskArn: z.string() }) })
      .parse(JSON.parse(event?.body ?? '')).detail,
    {
      startedBy: RUN,
      taskArn: first.value,
    },
  )
  assert.deepEqual(await aws.queue.acknowledge(event?.handle ?? ''), {
    kind: 'DONE',
    value: undefined,
  })
  assert.equal(server.queued(), 0)
  assert.deepEqual(await aws.tasks.deleteRun(AT, PARAMETER), { kind: 'DONE', value: undefined })
  assert.deepEqual(await aws.tasks.deleteRun(AT, PARAMETER), { kind: 'DONE', value: undefined })
  assert.deepEqual(server.parameters(), [])
})

test('dublê da AWS: as tabelas do lago, listadas e apagadas, e a que falta conta como apagada', async (t) => {
  const { aws, server } = await served(t)
  server.seedTables('raw/vendas', 'current/vendas')
  const listed = await aws.tables.list(AT, LAKE)
  assert.deepEqual(listed, {
    kind: 'DONE',
    value: [
      { namespace: 'raw', name: 'vendas' },
      { namespace: 'current', name: 'vendas' },
    ],
  })
  const done = { kind: 'DONE', value: undefined }
  assert.deepEqual(await aws.tables.drop(AT, LAKE, { namespace: 'raw', name: 'vendas' }), done)
  assert.deepEqual(await aws.tables.drop(AT, LAKE, { namespace: 'raw', name: 'vendas' }), done)
  assert.deepEqual(server.tables(), ['current/vendas'])
})

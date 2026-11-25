import { randomUUID } from 'node:crypto'
import {
  DescribeTasksCommand,
  ListTasksCommand,
  RunTaskCommand,
  StopTaskCommand,
} from '@aws-sdk/client-ecs'
import {
  CreateNamespaceCommand,
  CreateTableBucketCommand,
  CreateTableCommand,
  DeleteNamespaceCommand,
  DeleteTableBucketCommand,
  DeleteTableCommand,
  ListTablesCommand,
} from '@aws-sdk/client-s3tables'
import { DeleteMessageCommand, ReceiveMessageCommand } from '@aws-sdk/client-sqs'
import { DeleteParameterCommand, PutParameterCommand } from '@aws-sdk/client-ssm'
import { LakeRunId } from '@conexus/hub-api'
import { z } from 'zod'
import {
  putRunInput,
  RunParameter,
  runTaskInput,
  stopTaskInput,
  TaskArn,
} from '../apps/server/src/platform/aws-copy.ts'
import type { AwsConfig } from '../apps/server/src/platform/config-aws.ts'
import type { World } from './record-aws-wire.ts'
import { recorded } from './record-aws-wire.ts'

const COMPANY = 'EmpresaTesteA0000000000000000001'
const STOPPED_WITHIN_MS = 5 * 60_000
const Tasks = z.object({ tasks: z.array(z.object({ taskArn: TaskArn, lastStatus: z.string() })) })
const Events = z.object({
  Messages: z.array(z.object({ ReceiptHandle: z.string(), Body: z.string() })).optional(),
})
const Event = z.object({
  detail: z.object({ startedBy: z.string().optional(), stopCode: z.string().optional() }),
})

export type Started = Readonly<{ stopped: LakeRunId; ended: LakeRunId }>
type Round = Readonly<{ run: LakeRunId; task: TaskArn }>

function copyOf(world: World): AwsConfig['copy'] {
  const { outputs } = world
  return {
    clusterArn: outputs.CopyClusterArn,
    taskFamily: outputs.CopyTaskFamily,
    subnets: [outputs.CopySubnets.split(',')[0] ?? '', ...outputs.CopySubnets.split(',').slice(1)],
    securityGroup: outputs.CopySecurityGroup,
    queueUrl: outputs.CopyQueueUrl,
  }
}

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function startRequest(world: World, run: LakeRunId, parameter: RunParameter, attempt = 1) {
  const writer = `arn:aws:iam::${world.account}:role/conexus-copia-execucao`
  return runTaskInput(copyOf(world), {
    token: `${run}-${attempt}`,
    startedBy: run,
    writer,
    parameter,
    machine: { cpu: 1024, memory: 2048 },
  })
}

async function startRound(
  world: World,
  run: LakeRunId,
  parameter: RunParameter,
  name: string | null,
) {
  const answer = await recorded(world, name, { service: 'ecs', api: 'RunTask' }, () =>
    world.ecs.send(new RunTaskCommand(startRequest(world, run, parameter))),
  )
  if (!answer.ok)
    throw new Error('the laboratory refused RunTask; see the recording of the refusal')
  const [task] = z
    .object({ tasks: z.array(z.object({ taskArn: TaskArn })) })
    .parse(answer.value).tasks
  if (task === undefined) throw new Error('RunTask started no task')
  return { run, task: task.taskArn } satisfies Round
}

async function recordRunRefusals(world: World, round: Round, parameter: RunParameter) {
  const again = startRequest(world, round.run, parameter)
  await recorded(world, 'run-task-mesma-chave', { service: 'ecs', api: 'RunTask' }, () =>
    world.ecs.send(new RunTaskCommand(again)),
  )
  const other = { ...again, overrides: { ...again.overrides, cpu: '2048', memory: '4096' } }
  await recorded(world, 'run-task-outro-pedido', { service: 'ecs', api: 'RunTask' }, () =>
    world.ecs.send(new RunTaskCommand(other)),
  )
  const unknown = {
    ...startRequest(world, LakeRunId.parse(randomUUID()), parameter),
    taskDefinition: 'conexus-copia-inexistente',
  }
  await recorded(world, 'run-task-familia-inexistente', { service: 'ecs', api: 'RunTask' }, () =>
    world.ecs.send(new RunTaskCommand(unknown)),
  )
}

async function waitStopped(world: World, rounds: readonly Round[]) {
  const copy = copyOf(world)
  const until = Date.now() + STOPPED_WITHIN_MS
  while (Date.now() < until) {
    const read = Tasks.parse(
      await world.ecs.send(
        new DescribeTasksCommand({
          cluster: copy.clusterArn,
          tasks: rounds.map(({ task }) => task),
        }),
      ),
    )
    if (read.tasks.every(({ lastStatus }) => lastStatus === 'STOPPED')) return
    await pause(5_000)
  }
  throw new Error('a task did not stop in time')
}

function describeTasks(world: World, name: string, task: string) {
  return recorded(world, name, { service: 'ecs', api: 'DescribeTasks' }, () =>
    world.ecs.send(new DescribeTasksCommand({ cluster: copyOf(world).clusterArn, tasks: [task] })),
  )
}

function listTasks(
  world: World,
  name: string,
  startedBy: string,
  desiredStatus: 'RUNNING' | 'STOPPED',
) {
  return recorded(world, name, { service: 'ecs', api: 'ListTasks' }, () =>
    world.ecs.send(
      new ListTasksCommand({ cluster: copyOf(world).clusterArn, startedBy, desiredStatus }),
    ),
  )
}

function stopTask(world: World, name: string | null, task: string) {
  return recorded(world, name, { service: 'ecs', api: 'StopTask' }, () =>
    world.ecs.send(new StopTaskCommand(stopTaskInput(copyOf(world), task))),
  )
}

async function recordReads(world: World, first: Round, second: Round) {
  await describeTasks(world, 'describe-tasks-rodando', first.task)
  await listTasks(world, 'list-tasks-rodando', first.run, 'RUNNING')
  await listTasks(world, 'list-tasks-vazio', randomUUID(), 'RUNNING')
  await stopTask(world, 'stop-task', first.task)
  await waitStopped(world, [first, second])
  await describeTasks(world, 'describe-tasks-parada', second.task)
  await listTasks(world, 'list-tasks-parada', second.run, 'STOPPED')
  await stopTask(world, 'stop-task-parada', first.task)
  const missing = first.task.replace(/[0-9a-f]{32}$/, '0'.repeat(32))
  await describeTasks(world, 'describe-tasks-inexistente', missing)
  await stopTask(world, 'stop-task-inexistente', missing)
}

function putParameter(world: World, name: string, parameter: RunParameter) {
  const spec = JSON.stringify({ inventado: true })
  return recorded(world, name, { service: 'ssm', api: 'PutParameter' }, () =>
    world.ssm.send(new PutParameterCommand(putRunInput({ name: parameter, spec }))),
  )
}

function deleteParameter(world: World, name: string, parameter: RunParameter) {
  return recorded(world, name, { service: 'ssm', api: 'DeleteParameter' }, () =>
    world.ssm.send(new DeleteParameterCommand({ Name: parameter })),
  )
}

/** The round's parameter, written twice (the second overwrites) and deleted twice (the second finds none). */
export async function recordTasks(world: World): Promise<Started> {
  const first = LakeRunId.parse(randomUUID())
  const second = LakeRunId.parse(randomUUID())
  world.inventor.pin(first, '00000000-0000-4000-8000-0000000000a1')
  world.inventor.pin(second, '00000000-0000-4000-8000-0000000000b1')
  const parameter = RunParameter.parse(`/conexus/copia/${COMPANY}/${first}`)
  const rounds: Round[] = []
  try {
    await putParameter(world, 'put-parameter', parameter)
    await putParameter(world, 'put-parameter-sobrescreve', parameter)
    const one = await startRound(world, first, parameter, 'run-task')
    rounds.push(one)
    await recordRunRefusals(world, one, parameter)
    const two = await startRound(world, second, parameter, null)
    rounds.push(two)
    await recordReads(world, one, two)
  } finally {
    for (const round of rounds) await stopTask(world, null, round.task)
    await deleteParameter(world, 'delete-parameter', parameter)
    await deleteParameter(world, 'delete-parameter-inexistente', parameter)
  }
  return { stopped: first, ended: second }
}

const RECEIVE_FOR_MS = 4 * 60_000

type Ended = 'parada' | 'fim'

function endsOf(started: Started, body: string): Ended | null {
  const { detail } = Event.parse(JSON.parse(body))
  if (detail.startedBy === started.stopped) return 'parada'
  if (detail.startedBy === started.ended) return 'fim'
  return null
}

function batchName(started: Started, value: unknown): string | null {
  const ends = new Set(
    (Events.parse(value).Messages ?? []).flatMap(({ Body }) => endsOf(started, Body) ?? []),
  )
  if (ends.size === 2) return 'receive-message-lote'
  const [only] = ends
  return only === undefined ? null : `receive-message-${only}`
}

/** The queue's STOPPED events of the two rounds, each deleted after it is read; then a missing handle and an empty poll. */
export async function recordQueue(world: World, started: Started) {
  const { queueUrl } = copyOf(world)
  const seen = new Set<Ended>()
  const until = Date.now() + RECEIVE_FOR_MS
  let deleted = false
  while (seen.size < 2 && Date.now() < until) {
    const answer = await recorded(
      world,
      (value) => batchName(started, value),
      { service: 'sqs', api: 'ReceiveMessage' },
      () =>
        world.sqs.send(
          new ReceiveMessageCommand({
            QueueUrl: queueUrl,
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: 20,
          }),
        ),
    )
    if (!answer.ok) throw answer.error
    for (const message of Events.parse(answer.value).Messages ?? []) {
      const end = endsOf(started, message.Body)
      if (end !== null) seen.add(end)
      await recorded(
        world,
        deleted ? null : 'delete-message',
        { service: 'sqs', api: 'DeleteMessage' },
        () =>
          world.sqs.send(
            new DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: message.ReceiptHandle }),
          ),
      )
      deleted = true
    }
  }
  if (seen.size < 2) throw new Error(`the queue held ${seen.size} of the 2 events`)
  await recorded(world, 'delete-message-invalido', { service: 'sqs', api: 'DeleteMessage' }, () =>
    world.sqs.send(new DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: 'invalido' })),
  )
  await recorded(world, 'receive-message-vazio', { service: 'sqs', api: 'ReceiveMessage' }, () =>
    world.sqs.send(new ReceiveMessageCommand({ QueueUrl: queueUrl, WaitTimeSeconds: 1 })),
  )
}

function listTables(world: World, name: string, tableBucketARN: string, maxTables?: number) {
  return recorded(world, name, { service: 's3tables', api: 'ListTables' }, () =>
    world.tables.send(new ListTablesCommand({ tableBucketARN, maxTables })),
  )
}

function dropTable(world: World, name: string | null, tableBucketARN: string) {
  return recorded(world, name, { service: 's3tables', api: 'DeleteTable' }, () =>
    world.tables.send(
      new DeleteTableCommand({ tableBucketARN, namespace: 'raw', name: 'tabela_a' }),
    ),
  )
}

/** A bucket the script makes and ends, with a table in each area: listed in a page and whole, then dropped twice. */
export async function recordTables(world: World) {
  const bucket = `conexus-${world.tableLake}`
  const arn = `arn:aws:s3tables:us-east-2:${world.account}:bucket/${bucket}`
  const made = await world.tables.send(new CreateTableBucketCommand({ name: bucket }))
  if (made.arn !== arn) throw new Error('the table bucket has another address than the Hub builds')
  try {
    for (const namespace of ['raw', 'current']) {
      await world.tables.send(
        new CreateNamespaceCommand({ tableBucketARN: arn, namespace: [namespace] }),
      )
      await world.tables.send(
        new CreateTableCommand({
          tableBucketARN: arn,
          namespace,
          name: 'tabela_a',
          format: 'ICEBERG',
        }),
      )
    }
    await listTables(world, 'list-tables-pagina', arn, 1)
    await listTables(world, 'list-tables', arn)
    await listTables(world, 'list-tables-bucket-inexistente', `${arn}-inexistente`)
    await dropTable(world, 'delete-table', arn)
    await dropTable(world, 'delete-table-inexistente', arn)
  } finally {
    await clearBucket(world, arn)
  }
}

async function clearBucket(world: World, arn: string) {
  const left = await world.tables.send(new ListTablesCommand({ tableBucketARN: arn }))
  for (const { namespace, name } of left.tables ?? []) {
    await world.tables.send(
      new DeleteTableCommand({ tableBucketARN: arn, namespace: namespace?.[0], name }),
    )
  }
  for (const namespace of ['raw', 'current']) {
    await world.tables.send(new DeleteNamespaceCommand({ tableBucketARN: arn, namespace }))
  }
  await world.tables.send(new DeleteTableBucketCommand({ tableBucketARN: arn }))
}

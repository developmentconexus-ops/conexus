import type { RunTaskCommandInput } from '@aws-sdk/client-ecs'
import {
  DescribeTasksCommand,
  ListTasksCommand,
  RunTaskCommand,
  StopTaskCommand,
} from '@aws-sdk/client-ecs'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import type { PutParameterCommandInput } from '@aws-sdk/client-ssm'
import { DeleteParameterCommand, PutParameterCommand } from '@aws-sdk/client-ssm'
import type { LakeRunId, TreatmentRunId } from '@conexus/hub-api'
import { z } from 'zod'
import {
  COPY_CONTAINER,
  RUN_PARAMETER_PREFIX,
  RUN_PARAMETER_VARIABLE,
  stateBucketName,
  TREAT_OBJECT_VARIABLE,
} from './aws-names.ts'
import type { Attempt, AwsAnswer, Session, Where } from './aws-session.ts'
import { isNamed } from './aws-session.ts'
import type { AwsConfig } from './config-aws.ts'

export const TaskArn = z.string().startsWith('arn:aws:ecs:').brand('TaskArn')
export type TaskArn = z.infer<typeof TaskArn>
export const RunParameter = z.string().startsWith(RUN_PARAMETER_PREFIX).brand('RunParameter')
export type RunParameter = z.infer<typeof RunParameter>

/** A round's machine, as Fargate's task sizes count it: `cpu` in units of 1/1024 vCPU, `memory` in MiB. */
type Machine = Readonly<{ cpu: number; memory: number }>

/** A task as ECS describes it: stopped with the time ECS gives, or unknown to it. */
type TaskState =
  | Readonly<{ kind: 'RUNNING' }>
  | Readonly<{ kind: 'STOPPED'; stoppedAt: Date | null }>
  | Readonly<{ kind: 'MISSING' }>

export type CopyTasks = {
  putRun(at: Where, run: { name: RunParameter; spec: string }): Promise<AwsAnswer<void>>
  /** A parameter AWS does not have counts as deleted. */
  deleteRun(at: Where, name: RunParameter): Promise<AwsAnswer<void>>
  start(
    at: Where,
    run: {
      token: string
      startedBy: LakeRunId
      writer: string
      parameter: RunParameter
      machine: Machine
    },
  ): Promise<AwsAnswer<TaskArn>>
  /** A treatment round's task: the copy's, with the treatment role and the specification's object. */
  treat(
    at: Where,
    run: {
      token: string
      startedBy: TreatmentRunId
      role: string
      object: { key: string }
      machine: Machine
    },
  ): Promise<AwsAnswer<TaskArn>>
  /** A treatment round's specification, written in the region's state bucket under `key`. */
  putTreat(at: Where, spec: { key: string; spec: string }): Promise<AwsAnswer<void>>
  /** A task AWS does not have, or has stopped, counts as stopped. */
  stop(at: Where, task: TaskArn): Promise<AwsAnswer<void>>
  state(at: Where, task: TaskArn): Promise<AwsAnswer<TaskState>>
  /** The task a round started, found by its `startedBy` when the Hub fell before it kept the ARN (running first, then stopped). */
  find(at: Where, startedBy: LakeRunId | TreatmentRunId): Promise<AwsAnswer<TaskArn | null>>
}

const Started = z.object({
  tasks: z.array(z.object({ taskArn: TaskArn })).optional(),
  failures: z.array(z.object({ reason: z.string().optional() })).optional(),
})
const Described = z.object({
  tasks: z.array(z.object({ lastStatus: z.string(), stoppedAt: z.date().optional() })).optional(),
})
const Listed = z.object({ taskArns: z.array(TaskArn).optional() })

type TaskRun = Readonly<{ token: string; startedBy: string; role: string; machine: Machine }>

function taskInput(
  copy: AwsConfig['copy'],
  run: TaskRun,
  variable: { name: string; value: string },
) {
  return {
    cluster: copy.clusterArn,
    taskDefinition: copy.taskFamily,
    launchType: 'FARGATE',
    count: 1,
    clientToken: run.token,
    startedBy: run.startedBy,
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets: [...copy.subnets],
        securityGroups: [copy.securityGroup],
        assignPublicIp: 'ENABLED',
      },
    },
    overrides: {
      cpu: String(run.machine.cpu),
      memory: String(run.machine.memory),
      taskRoleArn: run.role,
      containerOverrides: [{ name: COPY_CONTAINER, environment: [variable] }],
    },
  } as const satisfies RunTaskCommandInput
}

/** The `RunTask` request of a round, shared with `scripts/record-aws.ts` so that what is recorded is what is sent. */
export function runTaskInput(copy: AwsConfig['copy'], run: Parameters<CopyTasks['start']>[1]) {
  const variable = { name: RUN_PARAMETER_VARIABLE, value: run.parameter }
  return taskInput(copy, { ...run, role: run.writer }, variable)
}

/** The `RunTask` request of a treatment round: the copy's, with the object's address in place of the parameter. */
function treatTaskInput(
  copy: AwsConfig['copy'],
  at: Where,
  run: Parameters<CopyTasks['treat']>[1],
) {
  const value = `s3://${stateBucketName(at.account, at.region)}/${run.object.key}`
  return taskInput(copy, run, { name: TREAT_OBJECT_VARIABLE, value })
}

async function runTask({ clients, abortSignal }: Session, input: ReturnType<typeof taskInput>) {
  const read = Started.parse(await clients.ecs.send(new RunTaskCommand(input), { abortSignal }))
  const task = read.tasks?.[0]
  if (task !== undefined) return { kind: 'STARTED', task: task.taskArn } as const
  return { kind: 'NOT_STARTED', reason: read.failures?.[0]?.reason ?? 'NO_TASK' } as const
}

async function taskState(
  { clients, abortSignal }: Session,
  copy: AwsConfig['copy'],
  task: TaskArn,
): Promise<TaskState> {
  const read = Described.parse(
    await clients.ecs.send(new DescribeTasksCommand({ cluster: copy.clusterArn, tasks: [task] }), {
      abortSignal,
    }),
  )
  const found = read.tasks?.[0]
  if (found === undefined) return { kind: 'MISSING' }
  if (found.lastStatus !== 'STOPPED') return { kind: 'RUNNING' }
  return { kind: 'STOPPED', stoppedAt: found.stoppedAt ?? null }
}

async function findTask(
  { clients, abortSignal }: Session,
  copy: AwsConfig['copy'],
  startedBy: LakeRunId | TreatmentRunId,
) {
  for (const desiredStatus of ['RUNNING', 'STOPPED'] as const) {
    const read = Listed.parse(
      await clients.ecs.send(
        new ListTasksCommand({ cluster: copy.clusterArn, startedBy, desiredStatus }),
        { abortSignal },
      ),
    )
    const [task] = read.taskArns ?? []
    if (task !== undefined) return task
  }
  return null
}

/** The `StopTask` request, shared with `scripts/record-aws.ts`. */
export function stopTaskInput(copy: AwsConfig['copy'], task: string) {
  return { cluster: copy.clusterArn, task, reason: 'conexus: stopped by the Hub' } as const
}

async function stopTask({ clients, abortSignal }: Session, copy: AwsConfig['copy'], task: TaskArn) {
  try {
    await clients.ecs.send(new StopTaskCommand(stopTaskInput(copy, task)), { abortSignal })
  } catch (error) {
    if (!isNamed(error, 'InvalidParameterException') || !/not found/i.test(String(error)))
      throw error
  }
}

/** The `PutParameter` request of a round, shared with `scripts/record-aws.ts`. */
export function putRunInput(run: { name: RunParameter; spec: string }) {
  return {
    Name: run.name,
    Value: run.spec,
    Type: 'SecureString',
    Tier: 'Intelligent-Tiering',
    Overwrite: true,
  } as const satisfies PutParameterCommandInput
}

async function deleteParameter({ clients, abortSignal }: Session, name: RunParameter) {
  try {
    await clients.ssm.send(new DeleteParameterCommand({ Name: name }), { abortSignal })
  } catch (error) {
    if (!isNamed(error, 'ParameterNotFound')) throw error
  }
}

async function started(
  attempt: Attempt,
  at: Where,
  input: ReturnType<typeof taskInput>,
): Promise<AwsAnswer<TaskArn>> {
  const answer = await attempt('RunTask', at, (session) => runTask(session, input))
  if (answer.kind !== 'DONE') return answer
  return answer.value.kind === 'STARTED'
    ? { kind: 'DONE', value: answer.value.task }
    : { kind: 'REFUSED', code: answer.value.reason }
}

/** The copy's tasks and round parameters over one `Attempt`, which owns the sessions (C56). */
export function copyTasks(attempt: Attempt, copy: AwsConfig['copy']): CopyTasks {
  return {
    putRun: (at, run) =>
      attempt('PutParameter', at, async ({ clients, abortSignal }) => {
        await clients.ssm.send(new PutParameterCommand(putRunInput(run)), { abortSignal })
      }),
    deleteRun: (at, name) =>
      attempt('DeleteParameter', at, (session) => deleteParameter(session, name)),
    start: (at, run) => started(attempt, at, runTaskInput(copy, run)),
    treat: (at, run) => started(attempt, at, treatTaskInput(copy, at, run)),
    putTreat: (at, { key, spec }) =>
      attempt('PutObject', at, async ({ clients, abortSignal }) => {
        const Bucket = stateBucketName(at.account, at.region)
        const object = { Bucket, Key: key, Body: spec, ContentType: 'application/json' }
        await clients.state.send(new PutObjectCommand(object), { abortSignal })
      }),
    stop: (at, task) => attempt('StopTask', at, (session) => stopTask(session, copy, task)),
    state: (at, task) => attempt('DescribeTasks', at, (session) => taskState(session, copy, task)),
    find: (at, startedBy) =>
      attempt('ListTasks', at, (session) => findTask(session, copy, startedBy)),
  }
}

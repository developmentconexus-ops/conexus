import type { StackEvent, StackStatus } from '@aws-sdk/client-cloudformation'
import {
  CreateStackCommand,
  DeleteStackCommand,
  DescribeStackEventsCommand,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation'
import {
  DeleteNamespaceCommand,
  DeleteTableBucketCommand,
  GetTableBucketCommand,
  ListNamespacesCommand,
} from '@aws-sdk/client-s3tables'
import { copyTasks } from './aws-copy.ts'
import { copyQueuePorts } from './aws-copy-queue.ts'
import type { LakeId, StackName } from './aws-names.ts'
import {
  BUCKET_TYPE,
  bucketName,
  StackId,
  stackName,
  TAG_COMPANY,
  TAG_TEMPLATE,
  templateUrl,
} from './aws-names.ts'
import type { AwsAnswer, AwsDeadlines, Session, Where } from './aws-session.ts'
import { attemptsOf, DEADLINES, isNamed } from './aws-session.ts'
import type { Config } from './config.ts'
import type { AwsConfig, TemplateVersion } from './config-aws.ts'
import type { FailureLog } from './failure.ts'

export * from './aws-copy.ts'
export * from './aws-copy-queue.ts'
export * from './aws-names.ts'
export type { AwsAnswer, AwsDeadlines, Where } from './aws-session.ts'
export type { StackStatus }

export type FirstFailure = Readonly<{ resource: string; type: string }>

/** One adapter for every AWS call the Hub makes (C56); each call runs in a 15-minute session tagged with the company. */
export type LakeStacks = {
  create(at: Where, lake: { id: LakeId; template: TemplateVersion }): Promise<AwsAnswer<StackId>>
  /** By the id the row of the operator keeps, or by the name, which a company's login can derive from the lake's id. */
  status(at: Where, stack: StackId | StackName): Promise<AwsAnswer<StackStatus>>
  /** The resource and type of the first `_FAILED` event; AWS's sentence never leaves (C51). */
  firstFailure(at: Where, stack: StackId): Promise<AwsAnswer<FirstFailure | null>>
  /** A stack AWS no longer has counts as removed. */
  remove(at: Where, stack: StackId): Promise<AwsAnswer<void>>
  /**
   * The lake's table bucket a failed creation left, its namespaces first (decision E). The stack's
   * events decide whether to look: S3 Tables refuses the Hub a bucket that is not there.
   */
  leftover(at: Where, lake: { id: LakeId; stack: StackId }): Promise<AwsAnswer<'NONE' | 'DELETED'>>
}

const EVENT_PAGES = 5

async function createStack(
  { clients, abortSignal }: Session,
  aws: AwsConfig,
  at: Where,
  lake: { id: LakeId; template: TemplateVersion },
): Promise<StackId> {
  const command = new CreateStackCommand({
    StackName: stackName(lake.id),
    ClientRequestToken: lake.id,
    TemplateURL: templateUrl(aws.templateBucket, at.region, lake.template),
    RoleARN: aws.serviceRoleArn,
    OnFailure: 'DELETE',
    // The template names the reader role (the study's p3.sh:9).
    Capabilities: ['CAPABILITY_NAMED_IAM'],
    Parameters: [
      { ParameterKey: 'LakeId', ParameterValue: lake.id },
      { ParameterKey: 'CompanyId', ParameterValue: at.company },
    ],
    Tags: [
      { Key: TAG_COMPANY, Value: at.company },
      { Key: TAG_TEMPLATE, Value: lake.template },
    ],
  })
  const created = await clients.stacks.send(command, { abortSignal })
  return StackId.parse(created.StackId)
}

async function stackStatus({ clients, abortSignal }: Session, stack: StackId | StackName) {
  const read = await clients.stacks.send(new DescribeStacksCommand({ StackName: stack }), {
    abortSignal,
  })
  const status = read.Stacks?.[0]?.StackStatus
  if (status === undefined) throw new TypeError('no stack in the reply')
  return status
}

/** The stack's events, newest first, read by its id: a deleted stack keeps them. */
async function stackEvents({ clients, abortSignal }: Session, stack: StackId) {
  const events: StackEvent[] = []
  let next: string | undefined
  for (let page = 0; page < EVENT_PAGES; page += 1) {
    const read = await clients.stacks.send(
      new DescribeStackEventsCommand({ StackName: stack, NextToken: next }),
      { abortSignal },
    )
    events.push(...(read.StackEvents ?? []))
    next = read.NextToken
    if (next === undefined) break
  }
  return events
}

async function firstFailed(session: Session, stack: StackId) {
  const events = await stackEvents(session, stack)
  // Newest first: the earliest failure is the cause, the later ones its cancellations.
  const failed = events.findLast((event) => event.ResourceStatus?.endsWith('_FAILED'))
  if (failed === undefined) return null
  return { resource: failed.LogicalResourceId ?? '', type: failed.ResourceType ?? '' }
}

async function removeStack({ clients, abortSignal }: Session, stack: StackId) {
  try {
    await clients.stacks.send(new DeleteStackCommand({ StackName: stack }), { abortSignal })
  } catch (error) {
    const gone =
      error instanceof Error &&
      error.name === 'ValidationError' &&
      error.message.endsWith('does not exist')
    if (!gone) throw error
  }
}

/** AWS saying a namespace is not there: already gone, as a leftover's should be. */
function absent(error: unknown): void {
  if (isNamed(error, 'NotFoundException')) return
  throw error
}

/**
 * Whether CloudFormation may have left the bucket. No event: its creation never began. Gone only when
 * CloudFormation created it and then deleted it: a CREATE_COMPLETE, and DELETE_COMPLETE the newest.
 * After a CREATE_FAILED its DELETE_COMPLETE speaks of a bucket it did not create (the held name of lab
 * run 45081093044), as the handler that owned one on 20/11 probably did.
 */
function bucketMayBeLeft(events: readonly StackEvent[]): boolean {
  const bucket = events.filter((event) => event.ResourceType === BUCKET_TYPE)
  if (bucket.length === 0) return false
  const created = bucket.some((event) => event.ResourceStatus === 'CREATE_COMPLETE')
  return !(created && bucket[0]?.ResourceStatus === 'DELETE_COMPLETE')
}

async function clearLeftover(session: Session, at: Where, lake: { id: LakeId; stack: StackId }) {
  if (!bucketMayBeLeft(await stackEvents(session, lake.stack))) return 'NONE'
  const { clients, abortSignal } = session
  const { tables } = clients
  const tableBucketARN = `arn:aws:s3tables:${at.region}:${at.account}:bucket/${bucketName(lake.id)}`
  // The Hub's session reads and deletes only its company's tagged bucket: one not there is refused.
  await tables.send(new GetTableBucketCommand({ tableBucketARN }), { abortSignal })
  const listed = await tables.send(new ListNamespacesCommand({ tableBucketARN }), { abortSignal })
  for (const { namespace } of listed.namespaces ?? []) {
    await tables
      .send(new DeleteNamespaceCommand({ tableBucketARN, namespace: namespace?.join('.') }), {
        abortSignal,
      })
      .catch(absent)
  }
  await tables.send(new DeleteTableBucketCommand({ tableBucketARN }), { abortSignal })
  return 'DELETED'
}

/** The one adapter to AWS: only it imports the SDK, and the base key leaves only into the STS call (C56, S36). */
export function createAws(deps: { config: Config; log: FailureLog; deadlines?: AwsDeadlines }) {
  const { aws } = deps.config
  const attempt = attemptsOf({ aws, log: deps.log, deadlines: deps.deadlines ?? DEADLINES })
  const stacks: LakeStacks = {
    create: (at, lake) =>
      attempt('CreateStack', at, (session) => createStack(session, aws, at, lake)),
    status: (at, stack) => attempt('DescribeStacks', at, (session) => stackStatus(session, stack)),
    firstFailure: (at, stack) =>
      attempt('DescribeStackEvents', at, (session) => firstFailed(session, stack)),
    remove: (at, stack) => attempt('DeleteStack', at, (session) => removeStack(session, stack)),
    leftover: (at, lake) => attempt('Leftover', at, (session) => clearLeftover(session, at, lake)),
  }
  return { stacks, tasks: copyTasks(attempt, aws.copy), ...copyQueuePorts(attempt, aws.copy) }
}

/** The adapter's ports under the names the Hub's subjects take them by. */
export function subjectPortsOf(aws: ReturnType<typeof createAws>) {
  return {
    lakeStacks: aws.stacks,
    copyTasks: aws.tasks,
    copyQueue: aws.queue,
    lakeTables: aws.tables,
  }
}

import type { Readable } from 'node:stream'
import { pipeline, Transform } from 'node:stream'
import type { StackEvent, StackStatus } from '@aws-sdk/client-cloudformation'
import {
  CloudFormationClient,
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
  S3TablesClient,
} from '@aws-sdk/client-s3tables'
import { fromIni, fromTemporaryCredentials } from '@aws-sdk/credential-providers'
import type { CompanyId } from '@conexus/hub-api'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import { z } from 'zod'
import type { Config } from './config.ts'
import type { AwsAccount, AwsConfig, AwsRegion, TemplateVersion } from './config-aws.ts'
import type { FailureLog } from './failure.ts'

export const LakeId = z
  .string()
  .regex(/^[a-z0-9]{12}$/)
  .brand('LakeId')
export type LakeId = z.infer<typeof LakeId>
export const StackId = z.string().startsWith('arn:aws:cloudformation:').brand('StackId')
export type StackId = z.infer<typeof StackId>
export type { StackStatus }

/** What AWS said: a refusal names its error for the log; silence may have taken effect. */
export type AwsAnswer<T> =
  | { kind: 'DONE'; value: T }
  | { kind: 'REFUSED'; code: string }
  | { kind: 'NO_ANSWER' }
export type FirstFailure = Readonly<{ resource: string; type: string }>
export type Where = Readonly<{ company: CompanyId; account: AwsAccount; region: AwsRegion }>
type AwsCall = 'CreateStack' | 'DescribeStacks' | 'DescribeStackEvents' | 'DeleteStack' | 'Leftover'

/** One adapter for every AWS call the Hub makes (C56); each call runs in a 15-minute session tagged with the company. */
export type LakeStacks = {
  create(at: Where, lake: { id: LakeId; template: TemplateVersion }): Promise<AwsAnswer<StackId>>
  status(at: Where, stack: StackId): Promise<AwsAnswer<StackStatus>>
  /** The resource and type of the first `_FAILED` event; AWS's sentence never leaves (C51). */
  firstFailure(at: Where, stack: StackId): Promise<AwsAnswer<FirstFailure | null>>
  /** A stack AWS no longer has counts as removed. */
  remove(at: Where, stack: StackId): Promise<AwsAnswer<void>>
  /** The lake's table bucket a failed creation left, its namespaces first (decision E). */
  leftover(at: Where, lake: LakeId): Promise<AwsAnswer<'NONE' | 'DELETED'>>
}

// The names infra/aws/lib/names.ts owns on the platform's side (C26); aws.test.ts checks them
// against lake.template.json and the Hub role's pattern.
const STACK_PREFIX = 'conexus-lago-'
const BUCKET_PREFIX = 'conexus-'
const TAG_COMPANY = 'conexus-empresa'
const TAG_TEMPLATE = 'conexus-modelo'
const TEMPLATE_PREFIX = 'lago/'

export function stackName(lake: LakeId): string {
  return `${STACK_PREFIX}${lake}`
}

/** The lake's table bucket, as the template names it and the screen shows it. */
export function bucketName(lake: LakeId): string {
  return `${BUCKET_PREFIX}${lake}`
}

/** The one form of a template's address, the bucket first, as the Hub role's policy matches it. */
export function templateUrl(bucket: string, region: AwsRegion, version: TemplateVersion): string {
  return `https://${bucket}.s3.${region}.amazonaws.com/${TEMPLATE_PREFIX}${version}.json`
}

// The screen gives up on the Hub at 10 s (web platform/hub.ts), and a read of a moving lake makes
// up to three calls in a row: the stack, then its first failure and the leftover, or the deletion
// and the stack again. So a call has 3 s, its retries included, and a silent AWS leaves the read
// answering the row as it is (criterion 49). One request answers in under a second (the study's
// P5); the 25 s of a creation are CloudFormation's, after CreateStack answers.
const DEADLINES = { connectionMs: 1_000, requestMs: 2_000, callMs: 3_000 }
export type AwsDeadlines = typeof DEADLINES
/** The shortest session AssumeRole grants; the Hub role allows an hour. */
const SESSION_SECONDS = 900
const REPLY_CAP_BYTES = 1024 * 1024
const EVENT_PAGES = 5
const THROTTLING = new Set([
  'Throttling',
  'ThrottlingException',
  'TooManyRequestsException',
  'RequestLimitExceeded',
])

/** Ends a reply that passes the cap with an error, so the SDK never holds more than it (C59). */
function capped(body: Readable): Readable {
  let size = 0
  const cap = new Transform({
    transform(chunk: Buffer, _encoding, done) {
      size += chunk.byteLength
      if (size > REPLY_CAP_BYTES) done(new RangeError('reply too large'))
      else done(null, chunk)
    },
  })
  return pipeline(body, cap, () => undefined)
}

class CappedHandler extends NodeHttpHandler {
  override async handle(...args: Parameters<NodeHttpHandler['handle']>) {
    const answer = await super.handle(...args)
    answer.response.body = capped(answer.response.body)
    return answer
  }
}

const ServiceError = z.object({
  name: z.string(),
  $metadata: z.object({ httpStatusCode: z.number(), attempts: z.number().optional() }),
})

/**
 * A 4xx that is not a rate limit is AWS's refusal, with no effect. Anything else is silence, whose
 * effect is unknown: a rate limit or a 5xx the SDK's own retries did not clear, a deadline, a cut
 * connection, a reply past the cap. The log takes the call, the error's name and the attempts:
 * never AWS's sentence, which names the account and the role (C51, S41).
 */
function mapped(log: FailureLog, call: AwsCall, error: unknown): AwsAnswer<never> {
  const answered = ServiceError.safeParse(error)
  const code = answered.success
    ? answered.data.name
    : error instanceof Error
      ? error.name
      : 'unknown'
  const status = answered.success ? answered.data.$metadata.httpStatusCode : 0
  const attempts = answered.success ? (answered.data.$metadata.attempts ?? 1) : 0
  const refused = status >= 400 && status < 500 && !THROTTLING.has(code)
  log.error({ call, code, status, attempts }, 'AWS_CALL_FAILED')
  return refused ? { kind: 'REFUSED', code } : { kind: 'NO_ANSWER' }
}

type Clients = { stacks: CloudFormationClient; tables: S3TablesClient }
type Session = Readonly<{ clients: Clients; abortSignal: AbortSignal }>

/** One pair of clients per company and region, each signed by a session tagged with that company. */
function sessionsOf(aws: AwsConfig, deadlines: AwsDeadlines): (at: Where) => Clients {
  const requestHandler = new CappedHandler({
    connectionTimeout: deadlines.connectionMs,
    requestTimeout: deadlines.requestMs,
    throwOnRequestTimeout: true,
  })
  const endpoint = aws.endpoint === undefined ? {} : { endpoint: aws.endpoint }
  // The base key's file, as the config owner checked it, and only its default profile (S31).
  const base = fromIni({
    filepath: aws.credentialsFile,
    configFilepath: aws.credentialsFile,
    profile: 'default',
  })
  const sessions = new Map<string, Clients>()
  return function clientsAt(at) {
    const key = `${at.company} ${at.region}`
    const known = sessions.get(key)
    if (known !== undefined) return known
    const shared = { region: at.region, requestHandler, ...endpoint }
    const credentials = fromTemporaryCredentials({
      params: {
        RoleArn: aws.hubRoleArn,
        RoleSessionName: `hub-${at.company}`,
        Tags: [{ Key: TAG_COMPANY, Value: at.company }],
        DurationSeconds: SESSION_SECONDS,
      },
      masterCredentials: base,
      clientConfig: shared,
    })
    const clients = {
      stacks: new CloudFormationClient({ ...shared, credentials }),
      tables: new S3TablesClient({ ...shared, credentials }),
    }
    sessions.set(key, clients)
    return clients
  }
}

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

async function stackStatus({ clients, abortSignal }: Session, stack: StackId) {
  const read = await clients.stacks.send(new DescribeStacksCommand({ StackName: stack }), {
    abortSignal,
  })
  const status = read.Stacks?.[0]?.StackStatus
  if (status === undefined) throw new TypeError('no stack in the reply')
  return status
}

async function firstFailed({ clients, abortSignal }: Session, stack: StackId) {
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

/** AWS saying a bucket or namespace is not there: already gone, as a leftover should be. */
function absent(error: unknown): 'ABSENT' {
  if (error instanceof Error && error.name === 'NotFoundException') return 'ABSENT'
  throw error
}

async function clearLeftover({ clients, abortSignal }: Session, at: Where, lake: LakeId) {
  const { tables } = clients
  const tableBucketARN = `arn:aws:s3tables:${at.region}:${at.account}:bucket/${bucketName(lake)}`
  const found = await tables
    .send(new GetTableBucketCommand({ tableBucketARN }), { abortSignal })
    .catch(absent)
  if (found === 'ABSENT') return 'NONE'
  const listed = await tables.send(new ListNamespacesCommand({ tableBucketARN }), { abortSignal })
  for (const { namespace } of listed.namespaces ?? []) {
    await tables
      .send(new DeleteNamespaceCommand({ tableBucketARN, namespace: namespace?.join('.') }), {
        abortSignal,
      })
      .catch(absent)
  }
  await tables.send(new DeleteTableBucketCommand({ tableBucketARN }), { abortSignal }).catch(absent)
  return 'DELETED'
}

/** The one adapter to AWS: only it imports the SDK, and the base key leaves only into the STS call (C56, S36). */
export function createLakeStacks(deps: {
  config: Config
  log: FailureLog
  deadlines?: AwsDeadlines
}): LakeStacks {
  const { aws } = deps.config
  const deadlines = deps.deadlines ?? DEADLINES
  const clientsAt = sessionsOf(aws, deadlines)

  async function attempt<T>(
    call: AwsCall,
    at: Where,
    work: (session: Session) => Promise<T>,
  ): Promise<AwsAnswer<T>> {
    try {
      const abortSignal = AbortSignal.timeout(deadlines.callMs)
      return { kind: 'DONE', value: await work({ clients: clientsAt(at), abortSignal }) }
    } catch (error) {
      return mapped(deps.log, call, error)
    }
  }

  return {
    create: (at, lake) =>
      attempt('CreateStack', at, (session) => createStack(session, aws, at, lake)),
    status: (at, stack) => attempt('DescribeStacks', at, (session) => stackStatus(session, stack)),
    firstFailure: (at, stack) =>
      attempt('DescribeStackEvents', at, (session) => firstFailed(session, stack)),
    remove: (at, stack) => attempt('DeleteStack', at, (session) => removeStack(session, stack)),
    leftover: (at, lake) => attempt('Leftover', at, (session) => clearLeftover(session, at, lake)),
  }
}

import type { Readable } from 'node:stream'
import { pipeline, Transform } from 'node:stream'
import { CloudFormationClient } from '@aws-sdk/client-cloudformation'
import { ECSClient } from '@aws-sdk/client-ecs'
import { S3Client } from '@aws-sdk/client-s3'
import { S3TablesClient } from '@aws-sdk/client-s3tables'
import { SQSClient } from '@aws-sdk/client-sqs'
import { SSMClient } from '@aws-sdk/client-ssm'
import { fromIni, fromTemporaryCredentials } from '@aws-sdk/credential-providers'
import type { CompanyId } from '@conexus/hub-api'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import { z } from 'zod'
import { TAG_COMPANY } from './aws-names.ts'
import type { AwsAccount, AwsConfig, AwsRegion } from './config-aws.ts'
import type { FailureLog } from './failure.ts'

/** What AWS said: a refusal names its error for the log; silence may have taken effect. */
export type AwsAnswer<T> =
  | { kind: 'DONE'; value: T }
  | { kind: 'REFUSED'; code: string }
  | { kind: 'NO_ANSWER' }
export type Where = Readonly<{ company: CompanyId; account: AwsAccount; region: AwsRegion }>
type AwsCall =
  | 'CreateStack'
  | 'DescribeStacks'
  | 'DescribeStackEvents'
  | 'DeleteStack'
  | 'Leftover'
  | 'PutParameter'
  | 'DeleteParameter'
  | 'RunTask'
  | 'StopTask'
  | 'DescribeTasks'
  | 'ListTasks'
  | 'ReceiveMessage'
  | 'DeleteMessage'
  | 'ListTables'
  | 'DeleteTable'
  | 'ForgetStoppingPoint'

// The screen gives up on the Hub at 10 s (web platform/hub.ts), and a read of a moving lake makes
// up to three calls in a row: the stack, then its first failure and the leftover, or the deletion
// and the stack again. So a call has 3 s, its retries included, and a silent AWS leaves the read
// answering the row as it is (criterion 49). One request answers in under a second (the study's
// P5); the 25 s of a creation are CloudFormation's, after CreateStack answers.
export const DEADLINES = { connectionMs: 1_000, requestMs: 2_000, callMs: 3_000 }
export type AwsDeadlines = typeof DEADLINES
/** The queue's one long poll waits this long at AWS; its request may take a little more. */
export const POLL_SECONDS = 20
const POLL_GRACE_MS = 5_000
/** The shortest session AssumeRole grants; the Hub role allows an hour. */
const SESSION_SECONDS = 900
const REPLY_CAP_BYTES = 1024 * 1024
const THROTTLING = new Set([
  'Throttling',
  'ThrottlingException',
  'TooManyRequestsException',
  'RequestLimitExceeded',
])
/** The stand-in company tag the Hub role's trust policy requires of the queue's session. */
const QUEUE_SESSION_COMPANY = 'copy-queue'

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

/** AWS saying the thing is not there, by the error's name: what a deletion wanted. */
export function isNamed(error: unknown, ...names: readonly string[]): boolean {
  return error instanceof Error && names.includes(error.name)
}

type Clients = {
  stacks: CloudFormationClient
  tables: S3TablesClient
  /** The copies' stopping points, in the bucket the task's Meltano writes them to. */
  state: S3Client
  ecs: ECSClient
  ssm: SSMClient
  sqs: SQSClient
  /** The queue's long poll, whose request outlasts the others' deadline. */
  poll: SQSClient
}
export type Session = Readonly<{ clients: Clients; abortSignal: AbortSignal }>

function sessionsOf(
  aws: AwsConfig,
  deadlines: AwsDeadlines,
): (tag: string, region: AwsRegion) => Clients {
  const requestHandler = new CappedHandler({
    connectionTimeout: deadlines.connectionMs,
    requestTimeout: deadlines.requestMs,
    throwOnRequestTimeout: true,
  })
  const pollHandler = new CappedHandler({
    connectionTimeout: deadlines.connectionMs,
    requestTimeout: POLL_SECONDS * 1_000 + POLL_GRACE_MS,
    throwOnRequestTimeout: true,
  })
  const endpoint = aws.endpoint === undefined ? {} : { endpoint: aws.endpoint }
  const pathStyle = aws.endpoint === undefined ? {} : { forcePathStyle: true }
  // The base key's file, as the config owner checked it, and only its default profile (S31).
  const base = fromIni({
    filepath: aws.credentialsFile,
    configFilepath: aws.credentialsFile,
    profile: 'default',
  })
  const sessions = new Map<string, Clients>()
  return function clientsAt(tag, region) {
    const key = `${tag} ${region}`
    const known = sessions.get(key)
    if (known !== undefined) return known
    const shared = { region, requestHandler, ...endpoint }
    const credentials = fromTemporaryCredentials({
      params: {
        RoleArn: aws.hubRoleArn,
        RoleSessionName: `hub-${tag}`,
        Tags: [{ Key: TAG_COMPANY, Value: tag }],
        DurationSeconds: SESSION_SECONDS,
      },
      masterCredentials: base,
      clientConfig: shared,
    })
    const clients = {
      stacks: new CloudFormationClient({ ...shared, credentials }),
      tables: new S3TablesClient({ ...shared, credentials }),
      state: new S3Client({ ...shared, ...pathStyle, credentials }),
      ecs: new ECSClient({ ...shared, credentials }),
      ssm: new SSMClient({ ...shared, credentials }),
      sqs: new SQSClient({ ...shared, credentials }),
      poll: new SQSClient({ ...shared, requestHandler: pollHandler, credentials }),
    }
    sessions.set(key, clients)
    return clients
  }
}

/** The one door of every call: a session of the company, a deadline for the whole call, and AWS's answer mapped. */
export type Attempt = {
  <T>(call: AwsCall, at: Where, work: (session: Session) => Promise<T>): Promise<AwsAnswer<T>>
  /** The queue's calls: the Hub's own session, and the caller's signal in place of the deadline. */
  queue<T>(
    call: AwsCall,
    signal: AbortSignal | null,
    work: (session: Session) => Promise<T>,
  ): Promise<AwsAnswer<T>>
}

export function attemptsOf(deps: {
  aws: AwsConfig
  log: FailureLog
  deadlines: AwsDeadlines
}): Attempt {
  const clientsAt = sessionsOf(deps.aws, deps.deadlines)
  async function attempt<T>(call: AwsCall, at: Where, work: (session: Session) => Promise<T>) {
    try {
      const abortSignal = AbortSignal.timeout(deps.deadlines.callMs)
      const clients = clientsAt(at.company, at.region)
      return { kind: 'DONE', value: await work({ clients, abortSignal }) } as const
    } catch (error) {
      return mapped(deps.log, call, error)
    }
  }
  async function queue<T>(
    call: AwsCall,
    signal: AbortSignal | null,
    work: (session: Session) => Promise<T>,
  ): Promise<AwsAnswer<T>> {
    const abortSignal = signal ?? AbortSignal.timeout(deps.deadlines.callMs)
    try {
      const clients = clientsAt(QUEUE_SESSION_COMPANY, deps.aws.region)
      return { kind: 'DONE', value: await work({ clients, abortSignal }) }
    } catch (error) {
      if (signal?.aborted === true) return { kind: 'NO_ANSWER' }
      return mapped(deps.log, call, error)
    }
  }
  return Object.assign(attempt, { queue })
}

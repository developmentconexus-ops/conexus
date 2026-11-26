import { createHash, randomUUID } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import type { CompanyId } from '@conexus/hub-api'
import type {
  AwsAnswer,
  FirstFailure,
  LakeId,
  LakeStacks,
  LakeTables,
  StackStatus,
  Where,
} from './aws.ts'
import { bucketName, StackId, stackName } from './aws.ts'
import type { AwsConfig } from './config-aws.ts'
import {
  AwsAccount,
  AwsRegion,
  LAKE_TEMPLATE,
  TemplateVersion,
  treatableWith,
} from './config-aws.ts'

export const TEST_AWS_ACCOUNT = AwsAccount.parse('111122223333')
export const TEST_AWS_REGION = AwsRegion.parse('us-east-2')
// Nothing listens on the discard port, so a Hub that reaches AWS without a double fails loudly.
const NO_AWS_SERVER = 'http://127.0.0.1:9'

/** The AWS part of a test configuration: the image's template version, and no reachable AWS. */
export function testAws(endpoint = NO_AWS_SERVER, credentialsFile = '/nonexistent/aws'): AwsConfig {
  const version = TemplateVersion.parse(
    createHash('sha256').update(readFileSync(LAKE_TEMPLATE)).digest('hex'),
  )
  return {
    account: TEST_AWS_ACCOUNT,
    region: TEST_AWS_REGION,
    hubRoleArn: `arn:aws:iam::${TEST_AWS_ACCOUNT}:role/conexus-hub`,
    serviceRoleArn: `arn:aws:iam::${TEST_AWS_ACCOUNT}:role/conexus-cfn`,
    templateBucket: `conexus-receitas-${TEST_AWS_ACCOUNT}-${TEST_AWS_REGION}`,
    credentialsFile,
    templateVersion: version,
    treatable: treatableWith(version),
    copy: {
      clusterArn: `arn:aws:ecs:${TEST_AWS_REGION}:${TEST_AWS_ACCOUNT}:cluster/conexus-copia`,
      taskFamily: 'conexus-copia',
      subnets: ['subnet-0aaaaaaaaaaaaaaa1', 'subnet-0aaaaaaaaaaaaaaa2'],
      securityGroup: 'sg-0aaaaaaaaaaaaaaa1',
      queueUrl: `https://sqs.${TEST_AWS_REGION}.amazonaws.com/${TEST_AWS_ACCOUNT}/conexus-copia-fim`,
    },
    endpoint,
  }
}

/** The AWS variables of a serving Hub's environment, with the platform's outputs, all invented (S40). */
export function testAwsEnvironment(t: TestContext) {
  const copy = testAws().copy
  return {
    HUB_AWS_ACCOUNT: TEST_AWS_ACCOUNT,
    HUB_AWS_REGION: TEST_AWS_REGION,
    HUB_AWS_HUB_ROLE_ARN: `arn:aws:iam::${TEST_AWS_ACCOUNT}:role/conexus-hub`,
    HUB_AWS_SERVICE_ROLE_ARN: `arn:aws:iam::${TEST_AWS_ACCOUNT}:role/conexus-cfn`,
    HUB_AWS_TEMPLATE_BUCKET: `conexus-receitas-${TEST_AWS_ACCOUNT}-${TEST_AWS_REGION}`,
    HUB_AWS_COPY_CLUSTER_ARN: copy.clusterArn,
    HUB_AWS_COPY_TASK_FAMILY: copy.taskFamily,
    HUB_AWS_COPY_SUBNETS: copy.subnets.join(','),
    HUB_AWS_COPY_SECURITY_GROUP: copy.securityGroup,
    HUB_AWS_COPY_QUEUE_URL: copy.queueUrl,
    AWS_SHARED_CREDENTIALS_FILE: testAwsCredentials(t),
  }
}

/** The base key's shared credentials file, invented (S40), readable only by its owner (S31). */
export function testAwsCredentials(t: TestContext): string {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-aws-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const path = join(dir, 'credentials')
  const key =
    '[default]\naws_access_key_id = AKIAINVENTED00000001\naws_secret_access_key = invented\n'
  writeFileSync(path, key, { mode: 0o600 })
  return path
}

/**
 * One AWS answer as it came on the wire. S3 Tables speaks restJson1: the SDK reads the error's class
 * from `x-amzn-errortype` (`errorType`), so a JSON refusal replayed without it is `Unknown`.
 */
export type WireAnswer = { status: number; body: string; contentType?: string; errorType?: string }

/** One AWS answer the adapter records, as `recordings/aws/<name>.json` holds it. */
export function awsRecording(name: string): WireAnswer {
  const url = new URL(`./recordings/aws/${name}.json`, import.meta.url)
  const { status, body, contentType, errorType } = JSON.parse(readFileSync(url, 'utf8'))
  return {
    status,
    body,
    ...(typeof contentType === 'string' ? { contentType } : {}),
    ...(typeof errorType === 'string' ? { errorType } : {}),
  }
}

type Call = 'create' | 'status' | 'firstFailure' | 'remove' | 'leftover'
type Scripted = { answer: 'REFUSED' | 'NO_ANSWER'; takesEffect: boolean }
type Stack = {
  company: CompanyId
  lake: LakeId
  status: StackStatus
  failure: FirstFailure | null
}
export type AwsCallRecord = Readonly<{ call: Call; company: CompanyId; target: string }>

const REFUSED = { kind: 'REFUSED', code: 'AccessDenied' } as const

function failed(next: Scripted): AwsAnswer<never> {
  return next.answer === 'REFUSED' ? REFUSED : { kind: 'NO_ANSWER' }
}

function answered<T>(next: Scripted | undefined, value: T): AwsAnswer<T> {
  return next === undefined ? { kind: 'DONE', value } : failed(next)
}

/** The port over the memory: a session of one company is refused another's stack and bucket. */
class MemoryAws implements LakeStacks {
  readonly stacks = new Map<StackId, Stack>()
  readonly tokens = new Map<string, StackId>()
  readonly buckets = new Map<string, CompanyId>()
  readonly taken = new Set<string>()
  readonly calls: AwsCallRecord[] = []
  readonly scripts: Record<Call, Scripted[]> = {
    create: [],
    status: [],
    firstFailure: [],
    remove: [],
    leftover: [],
  }

  private enter(call: Call, at: Where, target: string) {
    this.calls.push({ call, company: at.company, target })
    return this.scripts[call].shift()
  }

  /** The stack, or nothing when it is another company's or unknown, which AWS refuses. */
  private owned(at: Where, id: StackId): Stack | undefined {
    const stack = this.stacks.get(id)
    return stack?.company === at.company ? stack : undefined
  }

  async create(at: Where, lake: { id: LakeId }) {
    const next = this.enter('create', at, lake.id)
    if (next !== undefined && !next.takesEffect) return failed(next)
    const known = this.tokens.get(lake.id)
    const alive = known === undefined ? undefined : this.stacks.get(known)
    if (known !== undefined && alive !== undefined && alive.status !== 'DELETE_COMPLETE') {
      return answered(next, known)
    }
    const id = StackId.parse(
      `arn:aws:cloudformation:${at.region}:${at.account}:stack/${stackName(lake.id)}/${randomUUID()}`,
    )
    const name = bucketName(lake.id)
    const held = this.taken.has(name)
    this.stacks.set(id, {
      company: at.company,
      lake: lake.id,
      status: held ? 'DELETE_COMPLETE' : 'CREATE_IN_PROGRESS',
      failure: held ? { resource: 'Bucket', type: 'AWS::S3Tables::TableBucket' } : null,
    })
    if (!held) this.buckets.set(name, at.company)
    this.taken.add(name)
    this.tokens.set(lake.id, id)
    return answered(next, id)
  }

  async status(at: Where, id: StackId) {
    const next = this.enter('status', at, id)
    const stack = this.owned(at, id)
    return stack === undefined ? REFUSED : answered(next, stack.status)
  }

  async firstFailure(at: Where, id: StackId) {
    const next = this.enter('firstFailure', at, id)
    const stack = this.owned(at, id)
    return stack === undefined ? REFUSED : answered(next, stack.failure)
  }

  async remove(at: Where, id: StackId) {
    const next = this.enter('remove', at, id)
    const stack = this.owned(at, id)
    if (stack === undefined) return REFUSED
    if (next !== undefined && !next.takesEffect) return failed(next)
    if (stack.status === 'CREATE_COMPLETE' || stack.status === 'DELETE_FAILED') {
      stack.status = 'DELETE_IN_PROGRESS'
    }
    return answered(next, undefined)
  }

  async leftover(at: Where, lake: { id: LakeId }) {
    const next = this.enter('leftover', at, lake.id)
    const name = bucketName(lake.id)
    const owner = this.buckets.get(name)
    if (owner !== undefined && owner !== at.company) return REFUSED
    if (next !== undefined && !next.takesEffect) return failed(next)
    if (owner === undefined) return answered(next, 'NONE' as const)
    this.buckets.delete(name)
    return answered(next, 'DELETED' as const)
  }
}

const EMPTY_LAKE: LakeTables = {
  list: async () => ({ kind: 'DONE', value: [] }),
  drop: async () => ({ kind: 'DONE', value: undefined }),
  forget: async () => ({ kind: 'DONE', value: undefined }),
}

/**
 * The AWS of memory (T14, T29) that answers like the adapter does. Stacks by id, tagged with their
 * company, as the Hub role's tag condition reads them. The same token answers the same stack while
 * it lives (the study's P6); a bucket name stays taken after its bucket is gone (610 s in the proof
 * of 20/11, longer than any test). Each call is recorded, and the next answers scripted; a scripted
 * silence may still have taken effect.
 */
export function fakeAws() {
  const memory = new MemoryAws()
  const aws: LakeStacks = memory
  return {
    aws,
    /** The lake of memory holds no table: a client's deletion drops none. */
    tables: EMPTY_LAKE,
    calls: memory.calls,
    /** The stacks AWS holds now, by id, the deleted ones included as AWS keeps them. */
    stacks: () => [...memory.stacks].map(([id, stack]) => ({ id, ...stack })),
    /** The table buckets that exist now, by name. */
    buckets: () => [...memory.buckets.keys()],
    /** The next call of this kind answers so; `takesEffect` says the call happened before the answer was lost. */
    script(call: Call, answer: Scripted['answer'], takesEffect = false) {
      memory.scripts[call].push({ answer, takesEffect })
    },
    /** CloudFormation finishes the stack: a deletion takes its bucket, and a failure names its first event. */
    finish(
      id: StackId,
      status: 'CREATE_COMPLETE' | 'DELETE_COMPLETE' | 'DELETE_FAILED',
      failure: Stack['failure'] = null,
    ) {
      const stack = memory.stacks.get(id)
      if (stack === undefined) throw new Error(`no stack ${id}`)
      stack.status = status
      stack.failure = failure
      if (status === 'DELETE_COMPLETE') memory.buckets.delete(bucketName(stack.lake))
    },
    /** The bucket a failed creation left behind (decision E), tagged with the company. */
    plantLeftover(lake: LakeId, company: CompanyId) {
      memory.buckets.set(bucketName(lake), company)
    },
  }
}

/** A stack the double serves: its name and where it is on the way to finishing or failing. */
export type ServedStack = { name: string; status: StackStatus; creation: Creation }
export type Creation = 'SUCCEEDS' | 'FAILS' | 'NAME_HELD'

export function stackReply(recording: string, id: string, stack: ServedStack): string {
  return awsRecording(recording)
    .body.replace(/<StackId>[^<]*<\/StackId>/g, `<StackId>${id}</StackId>`)
    .replace(/<StackName>[^<]*<\/StackName>/g, `<StackName>${stack.name}</StackName>`)
    .replace(/<StackStatus>[^<]*<\/StackStatus>/, `<StackStatus>${stack.status}</StackStatus>`)
}

/** AssumeRole's recorded answer, its session valid fifteen minutes from now. */
export function sessionReply(): string {
  const expiration = new Date(Date.now() + 15 * 60_000).toISOString()
  return awsRecording('assume-role-aceito').body.replace(
    /<Expiration>[^<]*<\/Expiration>/,
    `<Expiration>${expiration}</Expiration>`,
  )
}

/** A stack's next status each time it is read: CloudFormation finishing between two looks. */
export function settled(stack: ServedStack): StackStatus {
  if (stack.status === 'DELETE_IN_PROGRESS') return 'DELETE_COMPLETE'
  if (stack.status !== 'CREATE_IN_PROGRESS') return stack.status
  return stack.creation === 'SUCCEEDS' ? 'CREATE_COMPLETE' : 'DELETE_COMPLETE'
}

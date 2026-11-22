import { createHash, randomUUID } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import type { CompanyId } from '@conexus/hub-api'
import type { AwsAnswer, FirstFailure, LakeId, LakeStacks, StackStatus, Where } from './aws.ts'
import { bucketName, StackId, stackName } from './aws.ts'
import type { AwsConfig } from './config-aws.ts'
import { AwsAccount, AwsRegion, LAKE_TEMPLATE, TemplateVersion } from './config-aws.ts'

export const TEST_AWS_ACCOUNT = AwsAccount.parse('111122223333')
export const TEST_AWS_REGION = AwsRegion.parse('us-east-2')
// Nothing listens on the discard port, so a Hub that reaches AWS without a double fails loudly.
const NO_AWS_SERVER = 'http://127.0.0.1:9'

/** The AWS part of a test configuration: the image's template version, and no reachable AWS. */
export function testAws(endpoint = NO_AWS_SERVER, credentialsFile = '/nonexistent/aws'): AwsConfig {
  return {
    account: TEST_AWS_ACCOUNT,
    region: TEST_AWS_REGION,
    hubRoleArn: `arn:aws:iam::${TEST_AWS_ACCOUNT}:role/conexus-hub`,
    serviceRoleArn: `arn:aws:iam::${TEST_AWS_ACCOUNT}:role/conexus-cfn`,
    templateBucket: `conexus-receitas-${TEST_AWS_ACCOUNT}-${TEST_AWS_REGION}`,
    credentialsFile,
    templateVersion: TemplateVersion.parse(
      createHash('sha256').update(readFileSync(LAKE_TEMPLATE)).digest('hex'),
    ),
    endpoint,
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

/** One AWS answer the adapter records, as `recordings/aws/<name>.json` holds it. */
export function awsRecording(name: string): { status: number; body: string } {
  const url = new URL(`./recordings/aws/${name}.json`, import.meta.url)
  const { status, body } = JSON.parse(readFileSync(url, 'utf8'))
  return { status, body }
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

  async leftover(at: Where, lake: LakeId) {
    const next = this.enter('leftover', at, lake)
    const name = bucketName(lake)
    const owner = this.buckets.get(name)
    if (owner !== undefined && owner !== at.company) return REFUSED
    if (next !== undefined && !next.takesEffect) return failed(next)
    if (owner === undefined) return answered(next, 'NONE' as const)
    this.buckets.delete(name)
    return answered(next, 'DELETED' as const)
  }
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

type ServedStack = { name: string; status: StackStatus }

/** The CloudFormation answer of `name`'s recording with this stack in it. */
function stackReply(recording: string, id: string, stack: ServedStack): string {
  return awsRecording(recording)
    .body.replace(/<StackId>[^<]*<\/StackId>/g, `<StackId>${id}</StackId>`)
    .replace(/<StackName>[^<]*<\/StackName>/g, `<StackName>${stack.name}</StackName>`)
    .replace(/<StackStatus>[^<]*<\/StackStatus>/, `<StackStatus>${stack.status}</StackStatus>`)
}

/** AssumeRole's recorded answer, its session valid fifteen minutes from now. */
function sessionReply(): string {
  const expiration = new Date(Date.now() + 15 * 60_000).toISOString()
  return awsRecording('assume-role-aceito').body.replace(
    /<Expiration>[^<]*<\/Expiration>/,
    `<Expiration>${expiration}</Expiration>`,
  )
}

/** A stack's next status each time it is read: CloudFormation finishing between two looks. */
const SETTLES: Partial<Record<StackStatus, StackStatus>> = {
  CREATE_IN_PROGRESS: 'CREATE_COMPLETE',
  DELETE_IN_PROGRESS: 'DELETE_COMPLETE',
}

/**
 * STS and CloudFormation behind a port, with state, from the recorded answers, for a Hub that runs
 * as a program and the QA (T14, card L.17): each creation finishes at the second read, as each
 * deletion does. S3 Tables waits for the U4 proof that records it, and answers 501 until then.
 */
export async function awsServer(t: TestContext) {
  const stacks = new Map<string, ServedStack>()
  const tokens = new Map<string, string>()
  const server = createServer((request, response) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => chunks.push(chunk))
    request.on('end', () => {
      const form = new URLSearchParams(Buffer.concat(chunks).toString('utf8'))
      function send(status: number, body: string) {
        response.writeHead(status, { 'content-type': 'text/xml' })
        response.end(body)
      }
      const action = request.method === 'POST' ? form.get('Action') : null
      if (action === 'AssumeRole') return send(200, sessionReply())
      if (action === 'CreateStack') {
        const token = form.get('ClientRequestToken') ?? ''
        const id =
          tokens.get(token) ??
          `arn:aws:cloudformation:${TEST_AWS_REGION}:${TEST_AWS_ACCOUNT}:stack/${form.get('StackName')}/${randomUUID()}`
        if (!stacks.has(id)) {
          stacks.set(id, { name: form.get('StackName') ?? '', status: 'CREATE_IN_PROGRESS' })
        }
        tokens.set(token, id)
        return send(
          200,
          stackReply('create-stack-mesma-chave', id, { name: '', status: 'CREATE_IN_PROGRESS' }),
        )
      }
      const id = form.get('StackName') ?? ''
      const stack = stacks.get(id)
      if (stack === undefined) return send(403, awsRecording('describe-stacks-inexistente').body)
      if (action === 'DescribeStacks') {
        const reply = stackReply('describe-stacks-pronta', id, stack)
        stack.status = SETTLES[stack.status] ?? stack.status
        return send(200, reply)
      }
      if (action === 'DeleteStack') {
        if (stack.status === 'CREATE_COMPLETE') stack.status = 'DELETE_IN_PROGRESS'
        return send(200, awsRecording('delete-stack').body)
      }
      response.writeHead(501).end()
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => {
    server.closeAllConnections()
    server.close()
  })
  const address = server.address()
  if (address === null || typeof address !== 'object') throw new Error('AWS server has no port')
  return {
    endpoint: new URL(`http://127.0.0.1:${address.port}`),
    credentialsFile: testAwsCredentials(t),
    /** The stacks it holds, by id and status. */
    stacks: () => [...stacks].map(([id, stack]) => ({ id, ...stack })),
  }
}

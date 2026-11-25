import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { PassThrough } from 'node:stream'
import type { ECSClient } from '@aws-sdk/client-ecs'
import type { S3TablesClient } from '@aws-sdk/client-s3tables'
import type { SQSClient } from '@aws-sdk/client-sqs'
import type { SSMClient } from '@aws-sdk/client-ssm'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import { z } from 'zod'
import { LEAK, RECORDINGS } from '../apps/server/src/platform/test-recordings.ts'

const INVENTED_ACCOUNT = '111122223333'
const INVENTED_LAKE = 'k3x9a0b1c2d3'
const FOLDER = join(RECORDINGS, 'aws')

/** What AWS answered, as the handler kept it. */
export type Captured = Readonly<{
  status: number
  contentType: string
  errorType: string | null
  body: string
}>

/** Keeps the last answer whole and hands the SDK an equal one. */
export class CapturingHandler extends NodeHttpHandler {
  last: Captured | null = null

  override async handle(...args: Parameters<NodeHttpHandler['handle']>) {
    const answer = await super.handle(...args)
    const chunks: Buffer[] = []
    for await (const chunk of answer.response.body) chunks.push(Buffer.from(chunk))
    const { headers, statusCode } = answer.response
    this.last = {
      status: statusCode,
      contentType: headers['content-type'] ?? '',
      errorType: headers['x-amzn-errortype'] ?? null,
      body: Buffer.concat(chunks).toString('utf8'),
    }
    answer.response.body = new PassThrough().end(Buffer.concat(chunks))
    return answer
  }
}

function truncatedTimestamps(text: string): string {
  return text.replace(/(\d\.\d{3})\d+E9/g, '$1E9')
}

const PATTERNS = {
  uuid: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g,
  taskId: /(?<=\/)[0-9a-f]{32}\b/g,
  compute: /(?<=\b(?:taskComputeId|computeId|runtimeId)\W{1,8})[0-9a-f]{32}\b/g,
  digest: /\bsha256:[0-9a-f]{64}\b/g,
  eni: /\beni-[0-9a-f]{8,17}\b/g,
  subnet: /\bsubnet-[0-9a-f]{8,17}\b/g,
  group: /\bsg-[0-9a-f]{8,17}\b/g,
  vpc: /\bvpc-[0-9a-f]{8,17}\b/g,
  mac: /\b[0-9a-f]{2}(?::[0-9a-f]{2}){5}\b/g,
  ip: /\b\d{1,3}(?:\.\d{1,3}){3}\b/g,
} as const

/** One invented value for each real one, in the form of the real one. */
export class Inventor {
  readonly #seen = new Map<string, string>()
  readonly #lakes: readonly string[]

  constructor(lakes: readonly string[]) {
    this.#lakes = lakes
  }

  /** Pins a value the script made itself (a round's id) to a readable invented one. */
  pin(real: string, invented: string): void {
    this.#seen.set(real, invented)
  }

  #next(kind: string, real: string, make: (n: number) => string): string {
    const known = this.#seen.get(real)
    if (known !== undefined) return known
    const invented = make(
      [...this.#seen.keys()].filter((key) => key.startsWith(`${kind}:`)).length + 1,
    )
    this.#seen.set(real, invented)
    this.#seen.set(`${kind}:${real}`, invented)
    return invented
  }

  invent(text: string): string {
    let out = truncatedTimestamps(text)
    for (const lake of this.#lakes) out = out.replaceAll(lake, INVENTED_LAKE)
    out = out.replace(/(?<!\d)\d{12}(?!\d)/g, INVENTED_ACCOUNT)
    out = out.replace(PATTERNS.uuid, (real) =>
      this.#next(
        'uuid',
        real,
        (n) => `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`,
      ),
    )
    out = out.replace(PATTERNS.taskId, (real) =>
      this.#next('task', real, (n) => n.toString(16).padStart(32, '0')),
    )
    out = out.replace(PATTERNS.compute, (real) =>
      this.#next('compute', real, (n) => n.toString(16).padStart(32, 'c')),
    )
    out = out.replace(PATTERNS.digest, (real) =>
      this.#next('digest', real, (n) => `sha256:${n.toString(16).padStart(64, '0')}`),
    )
    for (const [kind, prefix] of [
      ['eni', 'eni'],
      ['subnet', 'subnet'],
      ['group', 'sg'],
      ['vpc', 'vpc'],
    ] as const) {
      out = out.replace(PATTERNS[kind], (real) =>
        this.#next(kind, real, (n) => `${prefix}-${n.toString(16).padStart(17, '0')}`),
      )
    }
    out = out.replace(PATTERNS.mac, (real) =>
      this.#next('mac', real, (n) => `02:00:00:00:00:${n.toString(16).padStart(2, '0')}`),
    )
    return out.replace(PATTERNS.ip, (real) => this.#next('ip', real, (n) => `10.0.0.${n}`))
  }
}

const Source = z.string().min(1)
const Batch = z.object({
  Messages: z.array(z.looseObject({ Body: z.string(), MD5OfBody: z.string() })),
})

/** SQS's client checks each received body against its `MD5OfBody`: after the values change, the sum is the changed body's. */
function checksummed(body: string): string {
  if (!body.includes('"MD5OfBody"')) return body
  const batch = Batch.parse(JSON.parse(body))
  const messages = batch.Messages.map((message) => ({
    ...message,
    MD5OfBody: createHash('md5').update(message.Body).digest('hex'),
  }))
  return JSON.stringify({ ...batch, Messages: messages })
}

function save(
  inventor: Inventor,
  entry: {
    name: string
    service: 'ecs' | 'ssm' | 'sqs' | 's3tables'
    api: string
    sdk: string
    source: string
    captured: Captured
    recordedAt: string
  },
): void {
  const { captured } = entry
  const recording = {
    service: entry.service,
    api: entry.api,
    sdk: entry.sdk,
    recordedAt: entry.recordedAt,
    source: Source.parse(entry.source),
    status: captured.status,
    contentType: captured.contentType,
    ...(captured.errorType === null ? {} : { errorType: inventor.invent(captured.errorType) }),
    body: checksummed(inventor.invent(captured.body)),
  }
  const text = `${JSON.stringify(recording, null, 2)}\n`
  if (LEAK.test(text)) throw new Error(`${entry.name}: an address or a credential would be saved`)
  writeFileSync(join(FOLDER, `${entry.name}.json`), text)
}

const SDK = '3.1175.0'
export const Outputs = z.object({
  CopyClusterArn: z.string(),
  CopyTaskFamily: z.string(),
  CopyQueueUrl: z.string(),
  CopySubnets: z.string(),
  CopySecurityGroup: z.string(),
})
export type World = Readonly<{
  handler: CapturingHandler
  inventor: Inventor
  recordedAt: string
  ecs: ECSClient
  ssm: SSMClient
  sqs: SQSClient
  tables: S3TablesClient
  outputs: z.infer<typeof Outputs>
  account: string
  /** The twelve letters and digits of the table bucket this run makes. */
  tableLake: string
}>

const ServiceAnswer = z.looseObject({ $metadata: z.looseObject({ httpStatusCode: z.number() }) })

/** One call: its answer saved under `name` (null: made, not kept), a refusal too; anything else is the script's. */
export async function recorded<T>(
  world: World,
  name: string | null | ((value: T) => string | null),
  call: { service: 'ecs' | 'ssm' | 'sqs' | 's3tables'; api: string },
  send: () => Promise<T>,
): Promise<{ ok: true; value: T } | { ok: false; error: unknown }> {
  let result: { ok: true; value: T } | { ok: false; error: unknown }
  try {
    result = { ok: true, value: await send() }
  } catch (error) {
    if (!ServiceAnswer.safeParse(error).success) throw error
    result = { ok: false, error }
  }
  const { last } = world.handler
  const named = typeof name === 'function' ? (result.ok ? name(result.value) : null) : name
  if (named !== null && last !== null) {
    save(world.inventor, {
      name: named,
      ...call,
      sdk: `@aws-sdk/client-${call.service} ${SDK}`,
      recordedAt: world.recordedAt,
      source:
        'U8 step 1, scripts/record-aws.ts from this machine on the laboratory account, temporary resources deleted at the end; account and ids changed (S40)',
      captured: last,
    })
  }
  return result
}

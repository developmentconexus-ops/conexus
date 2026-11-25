import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import type { AwsDeadlines } from './aws.ts'
import { createAws, LakeId, RunParameter, StackId } from './aws.ts'
import type { Creation, WireAnswer } from './test-aws.ts'
import { awsRecording, testAws, testAwsCredentials } from './test-aws.ts'
import { awsServer } from './test-aws-server.ts'
import { silent, testConfig, unreachableDatabaseUrl } from './test-database.ts'

/** The lake of the recordings' company. */
export const TEST_LAKE_ID = LakeId.parse('k3x9a0b1c2d3')

/** A round's parameter, as the Hub names it. */
export function testRunParameter(company: string, run: string): RunParameter {
  return RunParameter.parse(`/conexus/copia/${company}/${run}`)
}

/** The adapter's ports against the AWS double of recorded answers (`awsServer`). */
export async function servedAws(t: TestContext, creation?: Creation) {
  const server = await awsServer(t, creation === undefined ? {} : { creation })
  const aws = testAws(server.endpoint.origin, server.credentialsFile)
  const config = { ...testConfig(await unreachableDatabaseUrl()), aws }
  return { server, aws: createAws({ config, log: silent }), version: aws.templateVersion }
}

export type Received = {
  action: string
  form: URLSearchParams
  body: string
  authorization: string
}
type Reply = WireAnswer | 'SILENT'

/** AWS behind a port, as the recordings answer it (T29): each request recorded, each answer `reply`'s. */
export async function awsWire(t: TestContext, reply: (received: Received) => Reply) {
  const received: Received[] = []
  const server = createServer((request, response) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => chunks.push(chunk))
    request.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8')
      const form = new URLSearchParams(body)
      const target = request.headers['x-amz-target']
      const entry = {
        action:
          form.get('Action') ??
          (typeof target === 'string' ? target.split('.').pop() : undefined) ??
          `${request.method} ${request.url}`,
        form,
        body,
        authorization: request.headers.authorization ?? '',
      }
      received.push(entry)
      const answer = reply(entry)
      if (answer === 'SILENT') return
      // CloudFormation and STS answer XML; a recording of S3 Tables names its JSON and error class.
      response.writeHead(answer.status, {
        'content-type': answer.contentType ?? 'text/xml',
        ...(answer.errorType === undefined ? {} : { 'x-amzn-errortype': answer.errorType }),
      })
      response.end(answer.body)
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => {
    server.closeAllConnections()
    server.close()
  })
  const address = server.address()
  assert.ok(address !== null && typeof address === 'object')
  return { endpoint: `http://127.0.0.1:${address.port}`, received }
}

/** The adapter's ports against `awsWire`, under `deadlines` or production's. */
export async function awsAt(
  t: TestContext,
  reply: (received: Received) => Reply,
  deadlines?: AwsDeadlines,
) {
  const { endpoint, received } = await awsWire(t, reply)
  const lines: { fields: Record<string, unknown>; message: string }[] = []
  const log = {
    info: (fields: Record<string, unknown>, message: string) => lines.push({ fields, message }),
    error: (fields: Record<string, unknown>, message: string) => lines.push({ fields, message }),
  }
  const aws = testAws(endpoint, testAwsCredentials(t))
  const config = { ...testConfig(await unreachableDatabaseUrl()), aws }
  const ports = createAws({
    config,
    log,
    ...(deadlines === undefined ? {} : { deadlines }),
  })
  return {
    ...ports,
    received,
    lines,
    config,
    of: (action: string) => received.filter((r) => r.action === action),
  }
}

/** The session first, then `answers` by action, in order. */
export function recorded(answers: Record<string, string[]>): (received: Received) => Reply {
  return ({ action }) => {
    if (action === 'AssumeRole') return session()
    const name = answers[action]?.shift()
    assert.ok(name !== undefined, `no answer for ${action}`)
    return awsRecording(name)
  }
}

export function session(): Reply {
  const { status, body } = awsRecording('assume-role-aceito')
  const expiration = new Date(Date.now() + 15 * 60_000).toISOString()
  return { status, body: body.replace(/<Expiration>[^<]*</, `<Expiration>${expiration}<`) }
}

/** A lake whose creation failed, under the stack the recordings name (create-stack-mesma-chave). */
export function failedLake(): { id: LakeId; stack: StackId } {
  const stack = /<StackId>([^<]+)<\/StackId>/.exec(awsRecording('create-stack-mesma-chave').body)
  return { id: LakeId.parse('k3x9a0b1c2d3'), stack: StackId.parse(stack?.[1]) }
}

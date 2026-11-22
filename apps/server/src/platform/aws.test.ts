import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { CompanyId } from '@conexus/hub-api'
import {
  BUCKET_PREFIX,
  templateUrl as platformTemplateUrl,
  STACK_PREFIX,
  TAG_COMPANY,
  TAG_TEMPLATE,
  templateBucket,
  templateUrlPattern,
} from '../../../../infra/aws/lib/names.ts'
import type { AwsDeadlines } from './aws.ts'
import { bucketName, createLakeStacks, LakeId, StackId, stackName, templateUrl } from './aws.ts'
import {
  awsRecording,
  TEST_AWS_ACCOUNT,
  TEST_AWS_REGION,
  testAws,
  testAwsCredentials,
} from './test-aws.ts'
import { testConfig, unreachableDatabaseUrl } from './test-database.ts'

const LAKE_TEMPLATE = new URL('../../../../infra/aws/lake.template.json', import.meta.url)
const COMPANY = CompanyId.parse('EmpresaTesteA0000000000000000001')
const LAKE = LakeId.parse('k3x9a0b1c2d3')
const AT = { company: COMPANY, account: TEST_AWS_ACCOUNT, region: TEST_AWS_REGION }
const RECORDED_STACK = StackId.parse(
  /<StackId>([^<]+)<\/StackId>/.exec(awsRecording('create-stack-mesma-chave').body)?.[1],
)

type Received = { action: string; form: URLSearchParams; authorization: string }
type Reply = { status: number; body: string } | 'SILENT'

/** AWS behind a port, as the recordings answer it (T29): each request recorded, each answer `reply`'s. */
async function awsAt(
  t: TestContext,
  reply: (received: Received) => Reply,
  deadlines?: AwsDeadlines,
) {
  const received: Received[] = []
  const server = createServer((request, response) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => chunks.push(chunk))
    request.on('end', () => {
      const form = new URLSearchParams(Buffer.concat(chunks).toString('utf8'))
      const entry = {
        action: form.get('Action') ?? `${request.method} ${request.url}`,
        form,
        authorization: request.headers.authorization ?? '',
      }
      received.push(entry)
      const answer = reply(entry)
      if (answer === 'SILENT') return
      response.writeHead(answer.status, { 'content-type': 'text/xml' })
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
  const lines: { fields: Record<string, unknown>; message: string }[] = []
  const log = {
    info: (fields: Record<string, unknown>, message: string) => lines.push({ fields, message }),
    error: (fields: Record<string, unknown>, message: string) => lines.push({ fields, message }),
  }
  const aws = testAws(`http://127.0.0.1:${address.port}`, testAwsCredentials(t))
  const config = { ...testConfig(await unreachableDatabaseUrl()), aws }
  const stacks = createLakeStacks({
    config,
    log,
    ...(deadlines === undefined ? {} : { deadlines }),
  })
  return {
    stacks,
    received,
    lines,
    config,
    of: (action: string) => received.filter((r) => r.action === action),
  }
}

/** The session first, then `answers` by action, in order. */
function recorded(answers: Record<string, string[]>): (received: Received) => Reply {
  return ({ action }) => {
    if (action === 'AssumeRole') return session()
    const name = answers[action]?.shift()
    assert.ok(name !== undefined, `no answer for ${action}`)
    return awsRecording(name)
  }
}

function session(): Reply {
  const { status, body } = awsRecording('assume-role-aceito')
  const expiration = new Date(Date.now() + 15 * 60_000).toISOString()
  return { status, body: body.replace(/<Expiration>[^<]*</, `<Expiration>${expiration}<`) }
}

const version = testAws().templateVersion

test('aws: criar manda o pedido inteiro e lê o id', async (t) => {
  const { stacks, of, config } = await awsAt(
    t,
    recorded({ CreateStack: ['create-stack-mesma-chave'] }),
  )
  const answer = await stacks.create(AT, { id: LAKE, template: version })
  assert.deepEqual(answer, { kind: 'DONE', value: RECORDED_STACK })
  const [sent] = of('CreateStack')
  assert.ok(sent !== undefined)
  assert.deepEqual(Object.fromEntries(sent.form), {
    Action: 'CreateStack',
    Version: '2010-05-15',
    StackName: `conexus-lago-${LAKE}`,
    ClientRequestToken: LAKE,
    OnFailure: 'DELETE',
    'Capabilities.member.1': 'CAPABILITY_NAMED_IAM',
    RoleARN: config.aws.serviceRoleArn,
    TemplateURL: `https://${config.aws.templateBucket}.s3.us-east-2.amazonaws.com/lago/${version}.json`,
    'Parameters.member.1.ParameterKey': 'LakeId',
    'Parameters.member.1.ParameterValue': LAKE,
    'Parameters.member.2.ParameterKey': 'CompanyId',
    'Parameters.member.2.ParameterValue': COMPANY,
    'Tags.member.1.Key': 'conexus-empresa',
    'Tags.member.1.Value': COMPANY,
    'Tags.member.2.Key': 'conexus-modelo',
    'Tags.member.2.Value': version,
  })
})

test('aws: os nomes batem com a receita e com o padrão da política do Hub', () => {
  const template = JSON.parse(readFileSync(LAKE_TEMPLATE, 'utf8'))
  const bucket = template.Resources.Bucket.Properties
  assert.deepEqual(bucket.TableBucketName, { 'Fn::Join': ['', [BUCKET_PREFIX, { Ref: 'LakeId' }]] })
  assert.deepEqual(bucket.Tags, [{ Key: TAG_COMPANY, Value: { Ref: 'CompanyId' } }])
  const allowed = new RegExp(template.Parameters.LakeId.AllowedPattern)
  for (const sample of [LAKE, 'k3x9a0b1c2d', 'k3x9a0b1c2d34', 'K3x9a0b1c2d3', 'k3x9-0b1c2d3']) {
    assert.equal(LakeId.safeParse(sample).success, allowed.test(sample), sample)
  }
  assert.equal(bucketName(LAKE), `${BUCKET_PREFIX}${LAKE}`)
  assert.equal(stackName(LAKE), `${STACK_PREFIX}${LAKE}`)
  assert.deepEqual([TAG_COMPANY, TAG_TEMPLATE], ['conexus-empresa', 'conexus-modelo'])
  const bucketOfRecipes = templateBucket(TEST_AWS_ACCOUNT, TEST_AWS_REGION)
  const sent = templateUrl(bucketOfRecipes, TEST_AWS_REGION, version)
  assert.equal(sent, platformTemplateUrl(bucketOfRecipes, TEST_AWS_REGION, version))
  const pattern = templateUrlPattern(bucketOfRecipes, TEST_AWS_REGION)
  const glob = new RegExp(`^${pattern.replaceAll('.', '\\.').replaceAll('*', '.*')}$`)
  assert.match(sent, glob)
  assert.doesNotMatch(
    `https://s3.${TEST_AWS_REGION}.amazonaws.com/${bucketOfRecipes}/lago/${version}.json`,
    glob,
  )
})

test('aws: a sessão leva a etiqueta da empresa, 900 s, e assina a chamada', async (t) => {
  const { stacks, of, config } = await awsAt(
    t,
    recorded({ CreateStack: ['create-stack-mesma-chave'] }),
  )
  await stacks.create(AT, { id: LAKE, template: version })
  const [assumed] = of('AssumeRole')
  assert.ok(assumed !== undefined)
  assert.equal(assumed.form.get('RoleArn'), config.aws.hubRoleArn)
  assert.equal(assumed.form.get('RoleSessionName'), `hub-${COMPANY}`)
  assert.equal(assumed.form.get('Tags.member.1.Key'), 'conexus-empresa')
  assert.equal(assumed.form.get('Tags.member.1.Value'), COMPANY)
  assert.equal(assumed.form.get('Tags.member.2.Key'), null)
  assert.equal(assumed.form.get('DurationSeconds'), '900')
  // The base key signs only the AssumeRole; the session's key signs CloudFormation.
  assert.match(assumed.authorization, /Credential=AKIAINVENTED00000001\//)
  assert.match(of('CreateStack')[0]?.authorization ?? '', /Credential=ASIAINVENTED000000001\//)
})

test('aws: a sessão recusada não chama a pilha', async (t) => {
  const { stacks, of } = await awsAt(t, ({ action }) =>
    action === 'AssumeRole'
      ? awsRecording('assume-role-recusado')
      : awsRecording('create-stack-mesma-chave'),
  )
  const answer = await stacks.create(AT, { id: LAKE, template: version })
  assert.deepEqual(answer, { kind: 'REFUSED', code: 'AccessDenied' })
  assert.equal(of('CreateStack').length, 0)
})

test('aws: a repetição é a do SDK; esgotada, a limitação e o erro 500 viram NO_ANSWER', async (t) => {
  for (const recording of ['create-stack-limitado', 'create-stack-erro-interno']) {
    const { stacks, of } = await awsAt(
      t,
      recorded({ CreateStack: [recording, recording, recording] }),
    )
    assert.deepEqual(await stacks.create(AT, { id: LAKE, template: version }), {
      kind: 'NO_ANSWER',
    })
    assert.equal(of('CreateStack').length, 3, recording)
  }
})

test('aws: a recusa não repete', async (t) => {
  const { stacks, of } = await awsAt(
    t,
    recorded({
      CreateStack: ['create-stack-recusado'],
      DescribeStacks: ['describe-stacks-inexistente'],
    }),
  )
  assert.deepEqual(await stacks.create(AT, { id: LAKE, template: version }), {
    kind: 'REFUSED',
    code: 'AccessDenied',
  })
  assert.deepEqual(await stacks.status(AT, RECORDED_STACK), {
    kind: 'REFUSED',
    code: 'AccessDenied',
  })
  assert.equal(of('CreateStack').length, 1)
  assert.equal(of('DescribeStacks').length, 1)
})

test('aws: a AWS calada responde dentro do prazo da chamada', async (t) => {
  const deadlines = { connectionMs: 200, requestMs: 200, callMs: 500 }
  const { stacks } = await awsAt(
    t,
    ({ action }) => (action === 'AssumeRole' ? session() : 'SILENT'),
    deadlines,
  )
  const started = performance.now()
  assert.deepEqual(await stacks.create(AT, { id: LAKE, template: version }), { kind: 'NO_ANSWER' })
  assert.ok(performance.now() - started < 2_000)
})

test('aws: resposta maior que o teto vira NO_ANSWER', async (t) => {
  const { body } = awsRecording('create-stack-mesma-chave')
  const padded = body.replace('<ResponseMetadata>', `${' '.repeat(1024 * 1024)}<ResponseMetadata>`)
  const { stacks } = await awsAt(t, ({ action }) =>
    action === 'AssumeRole' ? session() : { status: 200, body: padded },
  )
  assert.deepEqual(await stacks.create(AT, { id: LAKE, template: version }), { kind: 'NO_ANSWER' })
})

test('aws: a pilha apagada lida pelo id; ler e apagar mandam o id, nunca o nome', async (t) => {
  const { stacks, of } = await awsAt(
    t,
    recorded({
      DescribeStacks: ['describe-stacks-apagada-pelo-id'],
      DeleteStack: ['delete-stack', 'describe-stacks-nao-existe-admin'],
    }),
  )
  assert.deepEqual(await stacks.status(AT, RECORDED_STACK), {
    kind: 'DONE',
    value: 'DELETE_COMPLETE',
  })
  assert.deepEqual(await stacks.remove(AT, RECORDED_STACK), { kind: 'DONE', value: undefined })
  // The nearest envelope measured (T29): AWS saying the stack does not exist counts as removed.
  assert.deepEqual(await stacks.remove(AT, RECORDED_STACK), { kind: 'DONE', value: undefined })
  for (const sent of [...of('DescribeStacks'), ...of('DeleteStack')]) {
    assert.equal(sent.form.get('StackName'), RECORDED_STACK)
  }
})

test('aws: o primeiro evento de falha, sem a frase', async (t) => {
  const { body } = awsRecording('describe-stack-events-falha')
  // The recorded failure with one cancellation after it, as a stack whose others were still
  // creating would show: the earliest _FAILED is the cause (values changed, T29).
  const reader =
    /<member>(?:(?!<\/member>)[\s\S])*?<ResourceStatus>CREATE_FAILED[\s\S]*?<\/member>/.exec(
      body,
    )?.[0] ?? ''
  const cancelled = reader
    .replaceAll('<LogicalResourceId>Reader<', '<LogicalResourceId>Wg<')
    .replace('AWS::IAM::Role', 'AWS::Athena::WorkGroup')
    .replace(/<Timestamp>[^<]*</, '<Timestamp>2026-11-21T23:03:52.400Z<')
  const later = body.replace('<StackEvents>', `<StackEvents>${cancelled}`)
  const replies = [{ status: 200, body: later }, awsRecording('describe-stack-events-pronta')]
  const { stacks } = await awsAt(t, ({ action }) =>
    action === 'AssumeRole' ? session() : (replies.shift() ?? { status: 500, body: '' }),
  )
  const failed = await stacks.firstFailure(AT, RECORDED_STACK)
  assert.deepEqual(failed, { kind: 'DONE', value: { resource: 'Reader', type: 'AWS::IAM::Role' } })
  assert.ok(!JSON.stringify(failed).includes('permissions error'))
  assert.deepEqual(await stacks.firstFailure(AT, RECORDED_STACK), { kind: 'DONE', value: null })
})

test('aws: o registro do Hub não leva o pedido, a chave nem a frase da AWS', async (t) => {
  const { stacks, lines } = await awsAt(t, recorded({ CreateStack: ['create-stack-recusado'] }))
  await stacks.create(AT, { id: LAKE, template: version })
  assert.deepEqual(lines, [
    {
      fields: { call: 'CreateStack', code: 'AccessDenied', status: 403, attempts: 1 },
      message: 'AWS_CALL_FAILED',
    },
  ])
  const written = JSON.stringify(lines)
  for (const secret of [
    version,
    'lago/',
    'AKIA',
    'ASIA',
    'invented',
    'not authorized',
    TEST_AWS_ACCOUNT,
  ]) {
    assert.ok(!written.includes(secret), secret)
  }
})

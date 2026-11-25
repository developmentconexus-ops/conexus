import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { CompanyId } from '@conexus/hub-api'
import type { WireAnswer } from './test-aws.ts'
import { awsRecording, TEST_AWS_ACCOUNT, TEST_AWS_REGION } from './test-aws.ts'
import type { Received } from './test-aws-wire.ts'
import { awsAt, failedLake, session } from './test-aws-wire.ts'

// Criterion 35: what a failed creation left, decided by the stack's events (founder, 2026-11-22,
// "Opcao d"). The template's one table bucket is this type (aws.test.ts, "os nomes batem").
const BUCKET_TYPE = 'AWS::S3Tables::TableBucket'
const AT = {
  company: CompanyId.parse('EmpresaTesteA0000000000000000001'),
  account: TEST_AWS_ACCOUNT,
  region: TEST_AWS_REGION,
}
const FAILED_LAKE = failedLake()

/** The study's diary of a bucket created and deleted, with the deletion taken out (T29). */
function createdNotDeleted(): WireAnswer {
  const { status, body } = awsRecording('describe-stack-events-falha')
  const member = /<member>(?:(?!<\/member>)[\s\S])*<\/member>\s*/g
  const kept = body.replace(member, (event) =>
    event.includes(`<ResourceType>${BUCKET_TYPE}<`) && event.includes('DELETE_') ? '' : event,
  )
  return { status, body: kept }
}

/** The held name of lab run 45081093044: the bucket CREATE_FAILED, then DELETE_COMPLETE. */
const HELD_NAME = 'describe-stack-events-nome-preso'

/** The session, the stack's diary, then S3 Tables' recorded answers in the order of its calls. */
function leftoverAt(diary: WireAnswer, tables: (string | WireAnswer)[]) {
  return ({ action }: Received) => {
    if (action === 'AssumeRole') return session()
    if (action === 'DescribeStackEvents') return diary
    const next = tables.shift()
    assert.ok(next !== undefined, `no answer for ${action}`)
    return typeof next === 'string' ? awsRecording(next) : next
  }
}

function tablesCalls(received: { action: string }[]) {
  return received
    .map((r) => r.action)
    .filter((action) => !/^(AssumeRole|DescribeStackEvents)$/.test(action))
}

test('aws: o depósito que a pilha criou e apagou, ou que nunca começou, nem é procurado', async (t) => {
  // Created and deleted: the study's P5, and the published template in lab run 45083865870, whose
  // bucket the Hub's session removed before the undoing reached it (the grants after it then failed).
  // Never begun: refused by validation (lab run 45081093044).
  for (const recording of [
    'describe-stack-events-falha',
    'describe-stack-events-criado-e-apagado',
    'describe-stack-events-validacao',
  ]) {
    const none = await awsAt(t, leftoverAt(awsRecording(recording), []))
    assert.deepEqual(await none.stacks.leftover(AT, FAILED_LAKE), { kind: 'DONE', value: 'NONE' })
    assert.deepEqual(tablesCalls(none.received), [], recording)
    assert.equal(none.of('DescribeStackEvents')[0]?.form.get('StackName'), FAILED_LAKE.stack)
  }
})

test('aws: o depósito que sobrou sai; um CREATE_FAILED procura, mesmo com DELETE_COMPLETE depois', async (t) => {
  const arn = encodeURIComponent(
    `arn:aws:s3tables:${TEST_AWS_REGION}:${TEST_AWS_ACCOUNT}:bucket/conexus-${FAILED_LAKE.id}`,
  )
  for (const diary of [awsRecording(HELD_NAME), createdNotDeleted()]) {
    const left = await awsAt(
      t,
      leftoverAt(diary, [
        'get-table-bucket',
        'list-namespaces',
        'delete-namespace',
        'delete-namespace',
        'delete-table-bucket',
      ]),
    )
    assert.deepEqual(await left.stacks.leftover(AT, FAILED_LAKE), {
      kind: 'DONE',
      value: 'DELETED',
    })
    assert.deepEqual(tablesCalls(left.received), [
      `GET /buckets/${arn}`,
      `GET /namespaces/${arn}`,
      `DELETE /namespaces/${arn}/current`,
      `DELETE /namespaces/${arn}/raw`,
      `DELETE /buckets/${arn}`,
    ])
  }
})

/**
 * A namespace another read deleted between the list and the delete: S3 Tables' NotFoundException, on the
 * recorded DeleteNamespace envelope with the class and status changed (T29). The Hub's session gets it
 * only while the tagged bucket exists, so no lab run records it.
 */
function namespaceGone(): WireAnswer {
  const refused = awsRecording('delete-namespace-outra-empresa')
  return {
    ...refused,
    status: 404,
    errorType: 'NotFoundException:http://internal.amazon.com/coral/com.amazon.coral.service/',
    body: '{"Message":"The specified namespace does not exist."}',
  }
}

test('aws: a área que outra leitura já apagou conta como feita, e o depósito sai', async (t) => {
  const { stacks, received } = await awsAt(
    t,
    leftoverAt(awsRecording(HELD_NAME), [
      'get-table-bucket',
      'list-namespaces',
      namespaceGone(),
      'delete-namespace',
      'delete-table-bucket',
    ]),
  )
  assert.deepEqual(await stacks.leftover(AT, FAILED_LAKE), { kind: 'DONE', value: 'DELETED' })
  assert.equal(tablesCalls(received).length, 5)
})

async function refusedBy(t: TestContext, recording: string) {
  const { stacks, received } = await awsAt(t, leftoverAt(awsRecording(HELD_NAME), [recording]))
  assert.deepEqual(await stacks.leftover(AT, FAILED_LAKE), {
    kind: 'REFUSED',
    code: 'AccessDeniedException',
  })
  assert.equal(tablesCalls(received).length, 1, recording)
}

// The held name's own 403: the bucket that was never the stack's is not there, and the Hub is refused.
test('aws: a recusa da AWS, depois que o diário mandou procurar, vira REFUSED com a classe gravada', async (t) => {
  await refusedBy(t, 'get-table-bucket-nome-preso')
})

// A bucket that never existed answers the Hub's session as one it may not read, the same 403.
test('aws: o depósito que nunca existiu, depois que o diário mandou procurar, é recusado', async (t) => {
  await refusedBy(t, 'get-table-bucket-nunca-existiu')
})

test('aws: o depósito sem área sai logo, e a lista de outra empresa é recusada', async (t) => {
  const empty = await awsAt(
    t,
    leftoverAt(awsRecording(HELD_NAME), [
      'get-table-bucket',
      'list-namespaces-vazio',
      'delete-table-bucket',
    ]),
  )
  assert.deepEqual(await empty.stacks.leftover(AT, FAILED_LAKE), { kind: 'DONE', value: 'DELETED' })
  assert.equal(tablesCalls(empty.received).length, 3)
  const other = await awsAt(
    t,
    leftoverAt(awsRecording(HELD_NAME), ['get-table-bucket', 'list-namespaces-outra-empresa']),
  )
  assert.deepEqual(await other.stacks.leftover(AT, FAILED_LAKE), {
    kind: 'REFUSED',
    code: 'AccessDeniedException',
  })
})

test('aws: a recusa de apagar o depósito, depois de lê-lo, vira REFUSED com a classe gravada', async (t) => {
  for (const recording of ['delete-table-bucket-apagado', 'delete-table-bucket-outra-empresa']) {
    const { stacks } = await awsAt(
      t,
      leftoverAt(awsRecording(HELD_NAME), ['get-table-bucket', 'list-namespaces-vazio', recording]),
    )
    assert.deepEqual(await stacks.leftover(AT, FAILED_LAKE), {
      kind: 'REFUSED',
      code: 'AccessDeniedException',
    })
  }
})

test('aws: o depósito de outra empresa recusa o resto, com a classe que a AWS gravou', async (t) => {
  await refusedBy(t, 'get-table-bucket-outra-empresa')
})

// S3 Tables names its error's class only in x-amzn-errortype (restJson1): replayed without it, the
// SDK reads Unknown (finding 2 of the review of PR 1253).
test('aws: o fio leva o tipo e a classe do erro de uma resposta JSON, sem os quais o SDK lê Unknown', async (t) => {
  const { errorType: _class, ...unnamed } = awsRecording('get-table-bucket-apagado')
  const { stacks } = await awsAt(t, ({ action }) => {
    if (action === 'AssumeRole') return session()
    return action === 'DescribeStackEvents' ? awsRecording(HELD_NAME) : unnamed
  })
  assert.deepEqual(await stacks.leftover(AT, FAILED_LAKE), { kind: 'REFUSED', code: 'Unknown' })
})

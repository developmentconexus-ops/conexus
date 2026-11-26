import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, LakeRunId, TreatmentRunId } from '@conexus/hub-api'
import { z } from 'zod'
import { COPY_CLUSTER, COPY_CONTAINER } from '../../../../infra/aws/lib/names.ts'
import { RunParameter, TaskArn } from './aws-copy.ts'
import { awsRecording, TEST_AWS_ACCOUNT, TEST_AWS_REGION } from './test-aws.ts'
import { awsAt, TEST_LAKE_ID as LAKE, recorded, session } from './test-aws-wire.ts'

const AT = {
  company: CompanyId.parse('EmpresaTesteA0000000000000000001'),
  account: TEST_AWS_ACCOUNT,
  region: TEST_AWS_REGION,
}
const RUN = LakeRunId.parse('00000000-0000-4000-8000-0000000000a1')
const PARAMETER = RunParameter.parse(`/conexus/copia/${AT.company}/${RUN}`)
const WRITER = `arn:aws:iam::${TEST_AWS_ACCOUNT}:role/conexus-${LAKE}-escritor`
const TASK = TaskArn.parse(
  z
    .object({ tasks: z.tuple([z.object({ taskArn: z.string() })], z.unknown()) })
    .parse(JSON.parse(awsRecording('run-task').body)).tasks[0].taskArn,
)
const STOPPED_TASK = TaskArn.parse(
  z
    .object({ taskArns: z.tuple([z.string()]) })
    .parse(JSON.parse(awsRecording('list-tasks-parada').body)).taskArns[0],
)
const START = {
  token: `${RUN}-1`,
  startedBy: RUN,
  writer: WRITER,
  parameter: PARAMETER,
  machine: { cpu: 1024, memory: 2048 },
}
const REFUSED = { kind: 'REFUSED', code: 'AccessDeniedException' }

function inOrder(...names: string[]) {
  return ({ action }: { action: string }) => {
    if (action === 'AssumeRole') return session()
    const next = names.shift()
    assert.ok(next !== undefined, `no answer for ${action}`)
    return awsRecording(next)
  }
}

const Sent = z.looseObject({})
function sentBody(body: string) {
  return Sent.parse(JSON.parse(body))
}

test('aws copia: a tarefa e o parâmetro têm a forma da plataforma', () => {
  assert.match(TASK, new RegExp(`^arn:aws:ecs:[a-z0-9-]+:[0-9]{12}:task/${COPY_CLUSTER}/`))
  assert.equal(RunParameter.safeParse('/outro/prefixo/x').success, false)
  assert.equal(TaskArn.safeParse('arn:aws:sqs:x').success, false)
})

test('aws copia: gravar o parâmetro manda o segredo cifrado, sobrescreve e responde pela AWS', async (t) => {
  const { tasks, received } = await awsAt(t, inOrder('put-parameter', 'put-parameter-sobrescreve'))
  assert.deepEqual(await tasks.putRun(AT, { name: PARAMETER, spec: '{"a":1}' }), {
    kind: 'DONE',
    value: undefined,
  })
  assert.deepEqual(await tasks.putRun(AT, { name: PARAMETER, spec: '{"a":2}' }), {
    kind: 'DONE',
    value: undefined,
  })
  const sent = received.filter(({ action }) => action === 'PutParameter')
  assert.deepEqual(sentBody(sent[0]?.body ?? ''), {
    Name: PARAMETER,
    Value: '{"a":1}',
    Type: 'SecureString',
    Tier: 'Intelligent-Tiering',
    Overwrite: true,
  })
  assert.match(sent[0]?.authorization ?? '', /Credential=ASIAINVENTED000000001\//)
})

test('aws copia: apagar o parâmetro; o que a AWS não tem conta como apagado', async (t) => {
  const { tasks, received } = await awsAt(
    t,
    inOrder('delete-parameter', 'delete-parameter-inexistente', 'get-parameter-recusado'),
  )
  const done = { kind: 'DONE', value: undefined }
  assert.deepEqual(await tasks.deleteRun(AT, PARAMETER), done)
  assert.deepEqual(await tasks.deleteRun(AT, PARAMETER), done)
  assert.deepEqual(await tasks.deleteRun(AT, PARAMETER), REFUSED)
  assert.deepEqual(
    sentBody(received.filter((r) => r.action === 'DeleteParameter')[0]?.body ?? ''),
    {
      Name: PARAMETER,
    },
  )
})

test('aws copia: iniciar manda a rodada inteira e lê só o ARN da tarefa', async (t) => {
  const { tasks, received, config } = await awsAt(t, inOrder('run-task'))
  assert.deepEqual(await tasks.start(AT, START), { kind: 'DONE', value: TASK })
  const sent = sentBody(received.find((r) => r.action === 'RunTask')?.body ?? '')
  const { copy } = config.aws
  assert.deepEqual(sent, {
    cluster: copy.clusterArn,
    taskDefinition: copy.taskFamily,
    launchType: 'FARGATE',
    count: 1,
    clientToken: `${RUN}-1`,
    startedBy: RUN,
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets: [...copy.subnets],
        securityGroups: [copy.securityGroup],
        assignPublicIp: 'ENABLED',
      },
    },
    overrides: {
      cpu: '1024',
      memory: '2048',
      taskRoleArn: WRITER,
      containerOverrides: [
        {
          name: COPY_CONTAINER,
          environment: [{ name: 'CONEXUS_RUN_PARAMETER', value: PARAMETER }],
        },
      ],
    },
  })
  assert.ok(!JSON.stringify(received).includes('clientSecret'))
})

test('aws copia: tratar manda o RunTask da cópia com o papel do tratamento e o objeto da especificação no lugar do parâmetro', async (t) => {
  const { tasks, received } = await awsAt(t, inOrder('run-task', 'run-task'))
  const run = TreatmentRunId.parse('00000000-0000-4000-8000-0000000000b2')
  const treater = `arn:aws:iam::${TEST_AWS_ACCOUNT}:role/conexus-${LAKE}-tratador`
  const key = `tratamento/${AT.company}/${run}-1.json`
  assert.deepEqual(
    await tasks.treat(AT, {
      ...{ token: `${run}-1`, startedBy: run, role: treater, object: { key } },
      machine: START.machine,
    }),
    { kind: 'DONE', value: TASK },
  )
  await tasks.start(AT, START)
  const [treated, copied] = received
    .filter((r) => r.action === 'RunTask')
    .map((r) => sentBody(r.body))
  const object = `s3://conexus-estado-${TEST_AWS_ACCOUNT}-${TEST_AWS_REGION}/tratamento/${AT.company}/${run}-1.json`
  assert.deepEqual(treated?.overrides, {
    cpu: '1024',
    memory: '2048',
    taskRoleArn: treater,
    containerOverrides: [
      { name: COPY_CONTAINER, environment: [{ name: 'CONEXUS_TREAT_OBJECT', value: object }] },
    ],
  })
  const apart = { overrides: null, clientToken: null, startedBy: null }
  assert.deepEqual({ ...treated, ...apart }, { ...copied, ...apart })
  assert.deepEqual([treated?.clientToken, treated?.startedBy], [`${run}-1`, run])
})

test('aws copia: a especificação do tratamento vai ao depósito de estado da região, na raiz tratamento/<empresa>/', async (t) => {
  const { tasks, received } = await awsAt(t, inOrder('put-object'))
  const key = `tratamento/${AT.company}/00000000-0000-4000-8000-0000000000b2-1.json`
  assert.deepEqual(await tasks.putTreat(AT, { key, spec: '{"version":1}' }), {
    kind: 'DONE',
    value: undefined,
  })
  const [put] = received.filter((r) => r.action.startsWith('PUT '))
  assert.equal(
    put?.action,
    `PUT /conexus-estado-${TEST_AWS_ACCOUNT}-${TEST_AWS_REGION}/${key}?x-id=PutObject`,
  )
  assert.equal(put?.body, '{"version":1}')
})

test('aws copia: a repetição leva o mesmo clientToken e o mesmo pedido, e a AWS devolve a mesma tarefa', async (t) => {
  const { tasks, received } = await awsAt(t, inOrder('run-task', 'run-task-mesma-chave'))
  const first = await tasks.start(AT, START)
  const again = await tasks.start(AT, START)
  assert.deepEqual(again, first)
  const [one, two] = received.filter((r) => r.action === 'RunTask')
  assert.equal(one?.body, two?.body)
  assert.equal(sentBody(two?.body ?? '').clientToken, `${RUN}-1`)
})

test('aws copia: iniciar recusado, com a classe da AWS; sem resposta, NO_ANSWER', async (t) => {
  for (const [recording, code] of [
    ['run-task-outro-pedido', 'ConflictException'],
    ['run-task-familia-inexistente', 'ClientException'],
  ] as const) {
    const { tasks, lines } = await awsAt(t, inOrder(recording))
    assert.deepEqual(await tasks.start(AT, START), { kind: 'REFUSED', code }, recording)
    assert.deepEqual(
      lines.map(({ message }) => message),
      ['AWS_CALL_FAILED'],
    )
    assert.ok(!JSON.stringify(lines).includes(WRITER))
  }
  const deadlines = { connectionMs: 200, requestMs: 200, callMs: 500 }
  const silent = await awsAt(
    t,
    ({ action }) => (action === 'AssumeRole' ? session() : 'SILENT'),
    deadlines,
  )
  assert.deepEqual(await silent.tasks.start(AT, START), { kind: 'NO_ANSWER' })
})

test('aws copia: um 200 sem tarefa e com a falha do ECS é uma recusa com o motivo', async (t) => {
  const { status, body, contentType } = awsRecording('run-task')
  const refused = { ...JSON.parse(body), tasks: [], failures: [{ reason: 'RESOURCE:FARGATE' }] }
  const { tasks } = await awsAt(t, ({ action }) =>
    action === 'AssumeRole' ? session() : { status, contentType, body: JSON.stringify(refused) },
  )
  assert.deepEqual(await tasks.start(AT, START), { kind: 'REFUSED', code: 'RESOURCE:FARGATE' })
})

test('aws copia: parar; a tarefa que já parou ou que a AWS não tem conta como parada', async (t) => {
  const { tasks, received } = await awsAt(
    t,
    inOrder(
      'stop-task',
      'stop-task-parada',
      'stop-task-inexistente',
      'run-task-familia-inexistente',
    ),
  )
  const done = { kind: 'DONE', value: undefined }
  assert.deepEqual(await tasks.stop(AT, TASK), done)
  assert.deepEqual(await tasks.stop(AT, TASK), done)
  assert.deepEqual(await tasks.stop(AT, TASK), done)
  assert.deepEqual(await tasks.stop(AT, TASK), { kind: 'REFUSED', code: 'ClientException' })
  const [sent] = received.filter((r) => r.action === 'StopTask')
  assert.equal(sentBody(sent?.body ?? '').task, TASK)
})

test('aws copia: o estado da tarefa tem três valores', async (t) => {
  const { tasks, received } = await awsAt(
    t,
    inOrder('describe-tasks-rodando', 'describe-tasks-parada', 'describe-tasks-inexistente'),
  )
  assert.deepEqual(await tasks.state(AT, TASK), { kind: 'DONE', value: { kind: 'RUNNING' } })
  assert.deepEqual(await tasks.state(AT, TASK), {
    kind: 'DONE',
    value: { kind: 'STOPPED', stoppedAt: new Date(1_795_000_000_000) },
  })
  assert.deepEqual(await tasks.state(AT, TASK), { kind: 'DONE', value: { kind: 'MISSING' } })
  assert.deepEqual(sentBody(received.find((r) => r.action === 'DescribeTasks')?.body ?? '').tasks, [
    TASK,
  ])
})

test('aws copia: achar a tarefa pela rodada olha as que rodam e depois as que pararam', async (t) => {
  const { tasks, received } = await awsAt(
    t,
    inOrder(
      'list-tasks-rodando',
      'list-tasks-vazio',
      'list-tasks-parada',
      'list-tasks-vazio',
      'list-tasks-vazio',
    ),
  )
  assert.deepEqual(await tasks.find(AT, RUN), { kind: 'DONE', value: TASK })
  assert.deepEqual(await tasks.find(AT, RUN), { kind: 'DONE', value: STOPPED_TASK })
  assert.deepEqual(await tasks.find(AT, RUN), { kind: 'DONE', value: null })
  const sent = received.filter((r) => r.action === 'ListTasks').map((r) => sentBody(r.body))
  assert.deepEqual(
    sent.map(({ desiredStatus, startedBy }) => [desiredStatus, startedBy]),
    [
      ['RUNNING', RUN],
      ['RUNNING', RUN],
      ['STOPPED', RUN],
      ['RUNNING', RUN],
      ['STOPPED', RUN],
    ],
  )
})

test('aws copia: o registro do Hub leva a chamada e a classe, nunca a frase da AWS', async (t) => {
  const { tasks, lines } = await awsAt(t, recorded({ RunTask: ['run-task-outro-pedido'] }))
  await tasks.start(AT, START)
  assert.deepEqual(lines, [
    {
      fields: { call: 'RunTask', code: 'ConflictException', status: 400, attempts: 1 },
      message: 'AWS_CALL_FAILED',
    },
  ])
})

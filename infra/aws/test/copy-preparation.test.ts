import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  ACCOUNT,
  actionsOf,
  bySid,
  find,
  REGION,
  readable,
  resourcesOf,
  statementsOf,
} from './policies.ts'

const preparation = readable('preparation')
const copyExecution = find(preparation, 'CdkCopyExecution')
const statements = statementsOf(copyExecution)

test('a execução da cópia, numa política só dela', () => {
  assert.equal(copyExecution.Properties.ManagedPolicyName, 'conexus-cdk-execucao-copia')
  assert.deepEqual(
    statements.map((statement) => statement.Sid),
    [
      'TheCopyCluster',
      'TheCopyTaskDefinition',
      'TaskDefinitionsHaveNoResource',
      'TheCopyQueues',
      'TheCopyRule',
      'ReadTheCopyNetwork',
      'CreateTheCopyNetwork',
      'TagTheCopyNetworkOnCreate',
      'TheCopyNetwork',
      'TheCopyLogs',
    ],
  )
  function copy(sid: string) {
    return resourcesOf(bySid(statements, sid))
  }
  function at(service: string, resource: string) {
    return `arn:aws:${service}:*:${ACCOUNT}:${resource}`
  }
  assert.deepEqual(copy('TheCopyCluster'), [at('ecs', 'cluster/conexus-copia')])
  assert.deepEqual(copy('TheCopyTaskDefinition'), [at('ecs', 'task-definition/conexus-copia:*')])
  assert.deepEqual(copy('TheCopyQueues'), [at('sqs', 'conexus-copia-fim*')])
  assert.deepEqual(copy('TheCopyRule'), [at('events', 'rule/conexus-plataforma-*')])
  assert.deepEqual(copy('TheCopyLogs'), [
    at('logs', 'log-group:conexus-plataforma-copia'),
    at('logs', 'log-group:conexus-plataforma-copia:*'),
  ])
  assert.deepEqual(actionsOf(bySid(statements, 'TaskDefinitionsHaveNoResource')), [
    'ecs:DeregisterTaskDefinition',
    'ecs:DescribeTaskDefinition',
  ])
  for (const sid of ['TheCopyCluster', 'TheCopyQueues', 'TheCopyRule']) {
    for (const action of actionsOf(bySid(statements, sid))) assert.doesNotMatch(action, /\*/)
  }
  assert.ok(!statements.flatMap(actionsOf).some((action) => action.startsWith('ecr:')))
})

test('a rede da cópia: lê e cria na região, e só muda e apaga a da plataforma', () => {
  const network = statements.filter((statement) =>
    actionsOf(statement).some((action) => action.startsWith('ec2:')),
  )
  for (const action of network.flatMap(actionsOf)) {
    assert.match(action, /^ec2:/)
    assert.doesNotMatch(action, /\*|Instance(?!s$)|NatGateway|Peering/)
  }
  for (const statement of network) {
    assert.equal(statement.Condition?.StringEquals?.['aws:RequestedRegion'], REGION, statement.Sid)
  }
  const ours = {
    'aws:RequestedRegion': REGION,
    'aws:ResourceTag/aws:cloudformation:stack-name': 'conexus-plataforma',
  }
  const creates = actionsOf(bySid(statements, 'CreateTheCopyNetwork'))
  assert.deepEqual(bySid(statements, 'TheCopyNetwork').Condition, { StringEquals: ours })
  assert.deepEqual(bySid(statements, 'TagTheCopyNetworkOnCreate').Condition, {
    StringEquals: {
      'aws:RequestedRegion': REGION,
      'ec2:CreateAction': creates.map((action) => action.slice('ec2:'.length)),
    },
  })
  for (const action of actionsOf(bySid(statements, 'ReadTheCopyNetwork'))) {
    assert.match(action, /^ec2:Describe/)
  }
  for (const action of creates)
    assert.match(action, /^ec2:Create(Vpc|Subnet|InternetGateway|RouteTable|SecurityGroup)$/)
})

test('cada política da execução do CDK cabe no limite do IAM', () => {
  for (const id of ['CdkExecution', 'CdkCopyExecution']) {
    const size = JSON.stringify(find(preparation, id).Properties.PolicyDocument).length
    assert.ok(size < 6144, `${id}: ${size}`)
  }
})

test('o depósito das imagens da cópia nasce na preparação, e a Release só publica nele', () => {
  assert.deepEqual(find(preparation, 'CopyRepository'), {
    Type: 'AWS::ECR::Repository',
    Properties: { ImageTagMutability: 'IMMUTABLE', RepositoryName: 'conexus-copia' },
    DeletionPolicy: 'Retain',
  })
  assert.deepEqual(statementsOf(find(preparation, 'ReleaseRoleDefaultPolicy')), [
    {
      Action: [
        'ecr:CompleteLayerUpload',
        'ecr:UploadLayerPart',
        'ecr:InitiateLayerUpload',
        'ecr:BatchCheckLayerAvailability',
        'ecr:PutImage',
      ],
      Effect: 'Allow',
      Resource: '<CopyRepository.Arn>',
    },
    { Action: 'ecr:GetAuthorizationToken', Effect: 'Allow', Resource: '*' },
    { Action: 'ecr:DescribeImages', Effect: 'Allow', Resource: '<CopyRepository.Arn>' },
  ])
})

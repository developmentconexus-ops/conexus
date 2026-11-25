import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Template } from 'aws-cdk-lib/assertions'
import { conexusApp } from '../lib/app.ts'
import { TEMPLATE_PREFIX, templateBucket, templateUrl } from '../lib/names.ts'
import type { Statement } from './policies.ts'
import {
  ACCOUNT,
  actionsOf,
  bySid,
  find,
  REGION,
  readable,
  readableOutputs,
  resourcesOf,
  statementsOf,
  trustOf,
} from './policies.ts'

const platform = readable('platform')
const hub = statementsOf(find(platform, 'HubRole'))
const service = statementsOf(find(platform, 'ServiceRole'))
function allowed(statements: Statement[]): string[] {
  return statements.filter((statement) => statement.Effect === 'Allow').flatMap(actionsOf)
}

const LAKE_STACKS = `arn:aws:cloudformation:${REGION}:${ACCOUNT}:stack/conexus-lago-*/*`
const OUR_TEMPLATES = `https://conexus-receitas-${ACCOUNT}-${REGION}.s3.${REGION}.amazonaws.com/lago/*`
const SESSION_COMPANY = ['$', '{aws:PrincipalTag/conexus-empresa}'].join('')

test('o Hub só cria da receita, pelo papel de serviço, na própria empresa', () => {
  assert.deepEqual(bySid(hub, 'CreateFromOurTemplateThroughTheServiceRole'), {
    Sid: 'CreateFromOurTemplateThroughTheServiceRole',
    Effect: 'Allow',
    Action: 'cloudformation:CreateStack',
    Resource: LAKE_STACKS,
    Condition: {
      StringEquals: {
        'cloudformation:RoleArn': '<ServiceRole.Arn>',
        'aws:RequestTag/conexus-empresa': SESSION_COMPANY,
      },
      StringLike: { 'cloudformation:TemplateUrl': OUR_TEMPLATES },
    },
  })
  assert.deepEqual(bySid(hub, 'TagOnlyAtCreation').Condition, {
    StringEquals: {
      'cloudformation:CreateAction': 'CreateStack',
      'aws:RequestTag/conexus-empresa': SESSION_COMPANY,
    },
  })
  assert.deepEqual(bySid(hub, 'NoOtherTemplate'), {
    Sid: 'NoOtherTemplate',
    Effect: 'Deny',
    Action: [
      'cloudformation:CreateStack',
      'cloudformation:UpdateStack',
      'cloudformation:CreateChangeSet',
      'cloudformation:CreateStackSet',
      'cloudformation:UpdateStackSet',
    ],
    Resource: '*',
    Condition: { StringNotLike: { 'cloudformation:TemplateUrl': OUR_TEMPLATES } },
  })
  const tagged = { StringEquals: { 'aws:ResourceTag/conexus-empresa': SESSION_COMPANY } }
  assert.deepEqual(bySid(hub, 'ReadAndDeleteTheSessionCompanyStack').Condition, tagged)
  assert.deepEqual(bySid(hub, 'ClearTheSessionCompanyLeftover').Condition, tagged)
  assert.deepEqual(bySid(hub, 'PassOnlyTheServiceRole'), {
    Sid: 'PassOnlyTheServiceRole',
    Effect: 'Allow',
    Action: 'iam:PassRole',
    Resource: '<ServiceRole.Arn>',
    Condition: { StringEquals: { 'iam:PassedToService': 'cloudformation.amazonaws.com' } },
  })
  assert.deepEqual([...new Set(allowed(hub))].sort(), [
    'cloudformation:CreateStack',
    'cloudformation:DeleteStack',
    'cloudformation:DescribeStackEvents',
    'cloudformation:DescribeStacks',
    'cloudformation:TagResource',
    'ecs:DescribeTasks',
    'ecs:ListTasks',
    'ecs:RunTask',
    'ecs:StopTask',
    'iam:PassRole',
    's3:GetObject',
    's3:PutObject',
    's3tables:DeleteNamespace',
    's3tables:DeleteTable',
    's3tables:DeleteTableBucket',
    's3tables:GetTableBucket',
    's3tables:ListNamespaces',
    's3tables:ListTables',
    'sqs:DeleteMessage',
    'sqs:ReceiveMessage',
    'ssm:DeleteParameter',
    'ssm:PutParameter',
  ])
})

const ECS = `arn:aws:ecs:${REGION}:${ACCOUNT}`
const LAKE_BUCKETS = `arn:aws:s3tables:${REGION}:${ACCOUNT}:bucket/conexus-*`
const WRITERS = `arn:aws:iam::${ACCOUNT}:role/conexus-*-escritor`

test('os poderes do Hub', () => {
  const inTheCluster = { ArnEquals: { 'ecs:cluster': '<CopyCluster.Arn>' } }
  const powers: [string, string | string[], string | string[], object?][] = [
    ['StartOnlyTheCopyTask', 'ecs:RunTask', `${ECS}:task-definition/conexus-copia:*`, inTheCluster],
    [
      'StopAndReadTheCopyTasks',
      ['ecs:StopTask', 'ecs:DescribeTasks', 'ecs:ListTasks'],
      [`${ECS}:task/conexus-copia/*`, `${ECS}:container-instance/conexus-copia/*`],
      inTheCluster,
    ],
    [
      'PassOnlyTheWritersToTheTask',
      'iam:PassRole',
      [WRITERS, '<CopyExecutionRole.Arn>'],
      { StringEquals: { 'iam:PassedToService': 'ecs-tasks.amazonaws.com' } },
    ],
    [
      'WriteAndDeleteTheRunParameters',
      ['ssm:PutParameter', 'ssm:DeleteParameter'],
      `arn:aws:ssm:${REGION}:${ACCOUNT}:parameter/conexus/copia/*`,
    ],
    ['HearTheCopyQueue', ['sqs:ReceiveMessage', 'sqs:DeleteMessage'], '<CopyQueue.Arn>'],
    [
      'ListAndDeleteLakeTables',
      ['s3tables:ListTables', 's3tables:DeleteTable'],
      [LAKE_BUCKETS, `${LAKE_BUCKETS}/table/*`],
    ],
  ]
  for (const [sid, action, resource, condition] of powers) {
    const expected = { Sid: sid, Effect: 'Allow', Action: action, Resource: resource }
    assert.deepEqual(bySid(hub, sid), condition ? { ...expected, Condition: condition } : expected)
  }
})

test('as ações do CloudFormation são só as cinco', () => {
  const cloudformation = allowed(hub).filter((action) => action.startsWith('cloudformation:'))
  assert.deepEqual(cloudformation.sort(), [
    'cloudformation:CreateStack',
    'cloudformation:DeleteStack',
    'cloudformation:DescribeStackEvents',
    'cloudformation:DescribeStacks',
    'cloudformation:TagResource',
  ])
  for (const action of allowed(hub)) assert.doesNotMatch(action, /\*/)
})

test('o Hub entra só pela chave base, do servidor, com uma etiqueta só', () => {
  const trust = trustOf(find(platform, 'HubRole'))
  const key = { AWS: `arn:aws:iam::${ACCOUNT}:user/conexus-hub-chave` }
  const fromTheServer = { 'aws:SourceIp': '{HubSourceIp}' }
  assert.deepEqual(trust, [
    {
      Action: 'sts:AssumeRole',
      Effect: 'Allow',
      Principal: key,
      Condition: { IpAddress: fromTheServer, Null: { 'aws:RequestTag/conexus-empresa': 'false' } },
    },
    {
      Action: 'sts:TagSession',
      Effect: 'Allow',
      Principal: key,
      Condition: {
        IpAddress: fromTheServer,
        'ForAllValues:StringEquals': { 'aws:TagKeys': ['conexus-empresa'] },
        Null: { 'aws:TagKeys': 'false' },
      },
    },
  ])
})

test('o papel de serviço só cuida dos papéis de empresa', () => {
  const companyRoles = [`arn:aws:iam::${ACCOUNT}:role/conexus-*-leitor`, WRITERS]
  assert.deepEqual(bySid(service, 'CreateCompanyRolesOnlyWithTheBoundary'), {
    Sid: 'CreateCompanyRolesOnlyWithTheBoundary',
    Effect: 'Allow',
    Action: 'iam:CreateRole',
    Resource: companyRoles,
    Condition: { StringEquals: { 'iam:PermissionsBoundary': '{Boundary}' } },
  })
  const iamAllowed = service.filter(
    (statement) =>
      statement.Effect === 'Allow' &&
      actionsOf(statement).some((action) => action.startsWith('iam:')),
  )
  for (const statement of iamAllowed) assert.deepEqual(resourcesOf(statement), companyRoles)
  const platformPieces = bySid(service, 'NeverTouchThePlatform')
  assert.equal(platformPieces.Effect, 'Deny')
  assert.deepEqual(actionsOf(platformPieces), ['iam:*'])
  for (const piece of [
    'role/conexus-lf-s3tables',
    'role/conexus-s3tables-catalogo',
    'role/conexus-hub',
    'role/conexus-cfn',
    'role/conexus-release',
    'role/conexus-copia-execucao',
    'role/cdk-*',
    'policy/conexus-*',
  ]) {
    assert.ok(resourcesOf(platformPieces).includes(`arn:aws:iam::${ACCOUNT}:${piece}`), piece)
  }
  assert.deepEqual(bySid(service, 'NeverLiftTheBoundary'), {
    Sid: 'NeverLiftTheBoundary',
    Effect: 'Deny',
    Action: ['iam:DeleteRolePermissionsBoundary', 'iam:PutRolePermissionsBoundary'],
    Resource: '*',
  })
  assert.deepEqual(find(platform, 'ServiceRoleAdministersTheLake').Properties, {
    Admins: [{ DataLakePrincipalIdentifier: '<ServiceRole.Arn>' }],
    MutationType: 'APPEND',
  })
  assert.deepEqual(trustOf(find(platform, 'ServiceRole')), [
    {
      Action: 'sts:AssumeRole',
      Effect: 'Allow',
      Principal: { Service: 'cloudformation.amazonaws.com' },
      Condition: { StringEquals: { 'aws:SourceAccount': ACCOUNT } },
    },
  ])
})

test('o depósito das receitas só recebe versão nova, da Release, por TLS', () => {
  const bucket = find(platform, 'Templates')
  assert.equal(bucket.Properties.BucketName, `conexus-receitas-${ACCOUNT}-${REGION}`)
  assert.deepEqual(bucket.Properties.VersioningConfiguration, { Status: 'Enabled' })
  assert.equal(bucket.DeletionPolicy, 'Retain')
  const policy = statementsOf(find(platform, 'TemplatesPolicy'))
  const writes = policy.filter((statement) => actionsOf(statement).includes('s3:PutObject'))
  assert.deepEqual(writes, [
    {
      Sid: 'ReleaseWritesOnlyNewTemplates',
      Effect: 'Allow',
      Action: 's3:PutObject',
      Principal: { AWS: `arn:aws:iam::${ACCOUNT}:role/conexus-release` },
      Resource: '<Templates.Arn>/lago/*',
      Condition: { Null: { 's3:if-none-match': 'false' } },
    },
  ])
  assert.ok(
    policy.some(
      (statement) =>
        statement.Effect === 'Deny' &&
        statement.Condition?.Bool?.['aws:SecureTransport'] === 'false',
    ),
  )
  assert.ok(!policy.flatMap(actionsOf).includes('s3:DeleteObject'))
})

test('o orçamento lê o valor e o e-mail de parâmetros', () => {
  const email = [{ SubscriptionType: 'EMAIL', Address: '{AlarmEmail}' }]
  assert.partialDeepStrictEqual(find(platform, 'Budget').Properties, {
    Budget: { BudgetLimit: { Amount: '{BudgetUsd}', Unit: 'USD' }, TimeUnit: 'MONTHLY' },
    NotificationsWithSubscribers: [
      {
        Notification: {
          NotificationType: 'ACTUAL',
          ComparisonOperator: 'GREATER_THAN',
          Threshold: 80,
          ThresholdType: 'PERCENTAGE',
        },
        Subscribers: email,
      },
      {
        Notification: {
          NotificationType: 'FORECASTED',
          ComparisonOperator: 'GREATER_THAN',
          Threshold: 100,
          ThresholdType: 'PERCENTAGE',
        },
        Subscribers: email,
      },
    ],
  })
  assert.deepEqual(find(platform, 'AnomalySubscription').Properties.Subscribers, [
    { Type: 'EMAIL', Address: '{AlarmEmail}' },
  ])
  // The copy network's own blocks and the open egress are the template's, not a machine's.
  const raw = JSON.stringify(Template.fromStack(conexusApp().platform).toJSON()).replaceAll(
    /"(10\.0\.0\.0\/16|10\.0\.0\.0\/17|10\.0\.128\.0\/17|0\.0\.0\.0\/0|from 0\.0\.0\.0\/0:443)"/g,
    '""',
  )
  assert.doesNotMatch(raw, /\d{12}|@[a-z]|\d+\.\d+\.\d+\.\d+/)
})

test('trocar o e-mail substitui o orçamento, então ele não tem nome fixo', () => {
  // NotificationsWithSubscribers pede um recurso novo, criado antes de o velho sair.
  assert.equal('BudgetName' in Object(find(platform, 'Budget').Properties.Budget), false)
})

test('o endereço que o Hub manda casa com o padrão, e a forma de caminho não', () => {
  const bucket = `conexus-receitas-${ACCOUNT}-${REGION}`
  const version = 'a'.repeat(64)
  const pattern = new RegExp(`^${OUR_TEMPLATES.replace(/[.]/g, '\\.').replace('*', '.*')}$`)
  assert.match(templateUrl(bucket, REGION, version), pattern)
  assert.doesNotMatch(`https://s3.${REGION}.amazonaws.com/${bucket}/lago/${version}.json`, pattern)
  assert.doesNotMatch(`https://${bucket}.s3.${REGION}.amazonaws.com/outra/${version}.json`, pattern)
})

test('a plataforma diz à Release as receitas e ao Hub a cópia, os nomes de names.ts', () => {
  assert.deepEqual(readableOutputs('platform'), {
    TemplatesBucket: '{Templates}',
    TemplatesPrefix: TEMPLATE_PREFIX,
    CopyClusterArn: '<CopyCluster.Arn>',
    CopyTaskFamily: 'conexus-copia',
    CopyQueueUrl: '{CopyQueue}',
    CopySubnets: '{CopyNetworkpublicaSubnet1Subnet},{CopyNetworkpublicaSubnet2Subnet}',
    CopySecurityGroup: '<CopyOutbound.GroupId>',
  })
  assert.equal(find(platform, 'Templates').Properties.BucketName, templateBucket(ACCOUNT, REGION))
})

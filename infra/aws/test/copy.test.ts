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
  trustOf,
} from './policies.ts'

const platform = readable('platform')
const LAKE_BUCKETS = `arn:aws:s3tables:${REGION}:${ACCOUNT}:bucket/conexus-*`
const WRITERS = `arn:aws:iam::${ACCOUNT}:role/conexus-*-escritor`

test('a plataforma da cópia', () => {
  assert.deepEqual(find(platform, 'CopyTask').Properties, {
    Family: 'conexus-copia',
    RequiresCompatibilities: ['FARGATE'],
    NetworkMode: 'awsvpc',
    Cpu: '1024',
    Memory: '2048',
    RuntimePlatform: { CpuArchitecture: 'X86_64', OperatingSystemFamily: 'LINUX' },
    ExecutionRoleArn: '<CopyExecutionRole.Arn>',
    ContainerDefinitions: [
      {
        Name: 'copia',
        Image: `${ACCOUNT}.dkr.ecr.${REGION}.{AWS::URLSuffix}/conexus-copia@{CopyImageDigest}`,
        Essential: true,
        Environment: [{ Name: 'CONEXUS_STATE_URI', Value: 's3://{StoppingPoints}' }],
        LinuxParameters: { InitProcessEnabled: true },
        LogConfiguration: {
          LogDriver: 'awslogs',
          Options: {
            'awslogs-group': '{CopyLogs}',
            'awslogs-region': REGION,
            'awslogs-stream-prefix': 'copia',
          },
        },
      },
    ],
  })
  assert.equal(find(platform, 'CopyCluster').Properties.ClusterName, 'conexus-copia')
  assert.deepEqual(statementsOf(find(platform, 'CopyExecutionRoleDefaultPolicy'))[0], {
    Action: ['ecr:BatchCheckLayerAvailability', 'ecr:GetDownloadUrlForLayer', 'ecr:BatchGetImage'],
    Effect: 'Allow',
    Resource: `arn:aws:ecr:${REGION}:${ACCOUNT}:repository/conexus-copia`,
  })
  const types = Object.values(platform).map((resource) => resource.Type)
  assert.equal(types.filter((type) => type === 'AWS::ECR::Repository').length, 0)
  assert.equal(types.filter((type) => type === 'AWS::EC2::NatGateway').length, 0)
  assert.equal(types.filter((type) => type === 'AWS::EC2::Subnet').length, 2)
  for (const [, resource] of Object.entries(platform)) {
    if (resource.Type !== 'AWS::EC2::Subnet') continue
    assert.equal(resource.Properties.MapPublicIpOnLaunch, true)
  }
  assert.deepEqual(find(platform, 'CopyOutbound').Properties.SecurityGroupEgress, [
    {
      CidrIp: '0.0.0.0/0',
      Description: 'from 0.0.0.0/0:443',
      FromPort: 443,
      IpProtocol: 'tcp',
      ToPort: 443,
    },
  ])
  assert.deepEqual(trustOf(find(platform, 'CopyExecutionRole')), [
    {
      Action: 'sts:AssumeRole',
      Effect: 'Allow',
      Principal: { Service: 'ecs-tasks.amazonaws.com' },
      Condition: { StringEquals: { 'aws:SourceAccount': ACCOUNT } },
    },
  ])
  const raw = JSON.stringify(find(platform, 'CopyTask'))
  assert.doesNotMatch(raw, /Secrets|TaskRoleArn/)
})

test('o Hub lê e grava só o estado da própria empresa', () => {
  const hub = statementsOf(find(platform, 'HubRole'))
  assert.deepEqual(bySid(hub, 'ReadAndWriteTheCompanyStoppingPoints'), {
    Sid: 'ReadAndWriteTheCompanyStoppingPoints',
    Effect: 'Allow',
    Action: ['s3:GetObject', 's3:PutObject'],
    Resource: `arn:aws:s3:::conexus-estado-${ACCOUNT}-${REGION}/\${aws:PrincipalTag/conexus-empresa}/*`,
  })
})

test('o Hub lista só o prefixo da própria empresa, para que um arquivo ausente seja 404 e não 403', () => {
  const hub = statementsOf(find(platform, 'HubRole'))
  assert.deepEqual(bySid(hub, 'ListTheCompanyStoppingPoints'), {
    Sid: 'ListTheCompanyStoppingPoints',
    Effect: 'Allow',
    Action: 's3:ListBucket',
    Resource: `arn:aws:s3:::conexus-estado-${ACCOUNT}-${REGION}`,
    Condition: { StringLike: { 's3:prefix': `\${aws:PrincipalTag/conexus-empresa}/*` } },
  })
})

test('o depósito do ponto de parada', () => {
  const bucket = find(platform, 'StoppingPoints')
  assert.equal(bucket.Type, 'AWS::S3::Bucket')
  assert.equal(bucket.Properties.BucketName, `conexus-estado-${ACCOUNT}-${REGION}`)
  assert.equal(bucket.DeletionPolicy, 'Retain')
  assert.deepEqual(bucket.Properties.PublicAccessBlockConfiguration, {
    BlockPublicAcls: true,
    BlockPublicPolicy: true,
    IgnorePublicAcls: true,
    RestrictPublicBuckets: true,
  })
  assert.deepEqual(bucket.Properties.VersioningConfiguration, { Status: 'Enabled' })
  assert.deepEqual(bucket.Properties.LifecycleConfiguration, {
    Rules: [{ NoncurrentVersionExpiration: { NoncurrentDays: 30 }, Status: 'Enabled' }],
  })
})

test('o teto deixa o que escreve e nada de IAM', () => {
  const boundary = statementsOf(find(platform, 'Boundary'))
  assert.ok(!boundary.flatMap(actionsOf).some((action) => action.startsWith('iam:')))
  const state = `arn:aws:s3:::conexus-estado-${ACCOUNT}-${REGION}`
  assert.deepEqual(
    [
      'WriteTheLakeTables',
      'ChangeTheTablesOfBothAreas',
      'ReadTheRunParameters',
      'SendTheResult',
      'TheStoppingPoints',
      'ListTheStoppingPoints',
    ].map((sid) => resourcesOf(bySid(boundary, sid))),
    [
      [LAKE_BUCKETS, `${LAKE_BUCKETS}/table/*`],
      [
        `arn:aws:glue:${REGION}:${ACCOUNT}:table/s3tablescatalog/conexus-*/raw/*`,
        `arn:aws:glue:${REGION}:${ACCOUNT}:table/s3tablescatalog/conexus-*/current/*`,
      ],
      [`arn:aws:ssm:${REGION}:${ACCOUNT}:parameter/conexus/copia/*`],
      [`arn:aws:sqs:${REGION}:${ACCOUNT}:conexus-copia-fim`],
      [`${state}/*`],
      [state],
    ],
  )
})

test('a fila da cópia ouve só a regra e os que escrevem, e passa a de mortos na terceira falha', () => {
  assert.partialDeepStrictEqual(find(platform, 'CopyQueue').Properties, {
    QueueName: 'conexus-copia-fim',
    SqsManagedSseEnabled: true,
    RedrivePolicy: { deadLetterTargetArn: '<CopyDeadLetters.Arn>', maxReceiveCount: 3 },
  })
  assert.equal(find(platform, 'CopyDeadLetters').Properties.QueueName, 'conexus-copia-fim-mortos')
  assert.deepEqual(find(platform, 'CopyStopped').Properties, {
    EventPattern: {
      source: ['aws.ecs'],
      'detail-type': ['ECS Task State Change'],
      detail: { clusterArn: ['<CopyCluster.Arn>'], lastStatus: ['STOPPED'] },
    },
    State: 'ENABLED',
    Targets: [
      { Arn: '<CopyQueue.Arn>', DeadLetterConfig: { Arn: '<CopyDeadLetters.Arn>' }, Id: 'Target0' },
    ],
  })
  const queuePolicy = statementsOf(find(platform, 'CopyQueuePolicy'))
  const senders = queuePolicy.filter(
    (statement) => statement.Effect === 'Allow' && actionsOf(statement).includes('sqs:SendMessage'),
  )
  assert.deepEqual(
    senders.map((statement) => [statement.Principal, statement.Condition]),
    [
      [
        { Service: 'events.amazonaws.com' },
        { ArnEquals: { 'aws:SourceArn': '<CopyStopped.Arn>' } },
      ],
      [{ AWS: `arn:aws:iam::${ACCOUNT}:root` }, { ArnLike: { 'aws:PrincipalArn': WRITERS } }],
    ],
  )
  assert.deepEqual(bySid(queuePolicy, 'OnlyTheRuleAndTheWriters'), {
    Sid: 'OnlyTheRuleAndTheWriters',
    Effect: 'Deny',
    Principal: { AWS: '*' },
    Action: 'sqs:SendMessage',
    Resource: '<CopyQueue.Arn>',
    Condition: {
      ArnNotLike: { 'aws:PrincipalArn': WRITERS },
      ArnNotEquals: { 'aws:SourceArn': '<CopyStopped.Arn>' },
    },
  })
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Template } from 'aws-cdk-lib/assertions'
import { conexusApp } from '../lib/app.ts'
import { TEMPLATE_PREFIX, templateBucket } from '../lib/names.ts'
import {
  ACCOUNT,
  actionsOf,
  find,
  REGION,
  readable,
  readableOutputs,
  statementsOf,
} from './policies.ts'

const platform = readable('platform')

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

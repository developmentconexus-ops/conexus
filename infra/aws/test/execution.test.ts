import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { allows } from './iam.ts'
import { ACCOUNT, find, REGION, readable, statementsOf } from './policies.ts'

const preparation = readable('preparation')
const platform = readable('platform')

const execution = ['CdkExecution', 'CdkCopyExecution'].flatMap((id) =>
  statementsOf(find(preparation, id)),
)

function executionMay(action: string, resource: string): boolean {
  return allows(execution, {
    action,
    resource,
    principalArn: `arn:aws:iam::${ACCOUNT}:role/cdk-hnb659fds-cfn-exec-role-${ACCOUNT}-${REGION}`,
    principalTags: {},
    requestTags: {},
  })
}

const BUCKET_HANDLER_ACTIONS = [
  'CreateBucket',
  'DeleteBucket',
  'ListBucket',
  'GetBucketAcl',
  'PutBucketTagging',
  'TagResource',
  'UntagResource',
  'ListTagsForResource',
  'GetAccelerateConfiguration',
  'GetAnalyticsConfiguration',
  'GetBucketAbac',
  'GetBucketCORS',
  'GetBucketLogging',
  'GetBucketMetadataTableConfiguration',
  'GetBucketNotification',
  'GetBucketObjectLockConfiguration',
  'GetBucketOwnershipControls',
  'GetBucketPublicAccessBlock',
  'GetBucketTagging',
  'GetBucketVersioning',
  'GetBucketWebsite',
  'GetEncryptionConfiguration',
  'GetIntelligentTieringConfiguration',
  'GetInventoryConfiguration',
  'GetLifecycleConfiguration',
  'GetMetricsConfiguration',
  'GetReplicationConfiguration',
]

const WRITES_BY_PROPERTY = new Map([
  ['BucketName', []],
  ['BucketEncryption', ['PutEncryptionConfiguration']],
  ['LifecycleConfiguration', ['PutLifecycleConfiguration']],
  ['PublicAccessBlockConfiguration', ['PutBucketPublicAccessBlock']],
  ['VersioningConfiguration', ['PutBucketVersioning']],
])

const BUCKET_POLICY_HANDLER_ACTIONS = ['GetBucketPolicy', 'PutBucketPolicy', 'DeleteBucketPolicy']

function refused(actions: string[], bucket: unknown): string[] {
  const arn = `arn:aws:s3:::${z.string().parse(bucket)}`
  return actions.map((action) => `s3:${action}`).filter((action) => !executionMay(action, arn))
}

function ofType(type: string) {
  const found = Object.values(platform).filter((resource) => resource.Type === type)
  assert.ok(found.length > 0, type)
  return found.map((resource) => resource.Properties)
}

test('a execução do CDK cria, configura e apaga cada depósito S3 da plataforma', () => {
  for (const properties of ofType('AWS::S3::Bucket')) {
    const toSet = Object.keys(properties).flatMap((property) => {
      const actions = WRITES_BY_PROPERTY.get(property)
      assert.ok(actions, `say in WRITES_BY_PROPERTY what the execution needs to set ${property}`)
      return actions
    })
    assert.deepEqual(
      refused([...BUCKET_HANDLER_ACTIONS, ...toSet], properties.BucketName),
      [],
      String(properties.BucketName),
    )
  }
})

test('a execução do CDK escreve a política de cada depósito da plataforma', () => {
  for (const { Bucket } of ofType('AWS::S3::BucketPolicy')) {
    const id = z
      .string()
      .regex(/^\{.+\}$/)
      .parse(Bucket)
      .slice(1, -1)
    const name = find(platform, id).Properties.BucketName
    assert.deepEqual(refused(BUCKET_POLICY_HANDLER_ACTIONS, name), [], String(name))
  }
})

test('a execução do CDK não alcança os pontos de parada, nem outro depósito de estado', () => {
  const state = `arn:aws:s3:::conexus-estado-${ACCOUNT}-${REGION}`
  for (const action of ['s3:GetObject', 's3:PutObject', 's3:DeleteObject']) {
    assert.equal(executionMay(action, `${state}/empresa/conexao/state.json`), false, action)
  }
  for (const other of [
    `${state}-outro`,
    `arn:aws:s3:::conexus-estado-${ACCOUNT}-sa-east-1`,
    `arn:aws:s3:::conexus-estado-999999999999-${REGION}`,
  ]) {
    for (const action of ['s3:CreateBucket', 's3:DeleteBucket', 's3:PutBucketPolicy']) {
      assert.equal(executionMay(action, other), false, `${action} ${other}`)
    }
  }
})

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { Template } from 'aws-cdk-lib/assertions'
import { conexusApp } from '../lib/app.ts'
import { ACCOUNT, find, readableResources, trustOf } from './policies.ts'

const stored = readFileSync(new URL('../lake.template.json', import.meta.url), 'utf8')
const lake = readableResources(JSON.parse(stored))

test('o modelo guardado é o que a síntese escreve', () => {
  const { lake: stack } = conexusApp()
  assert.deepEqual(JSON.parse(stored), Template.fromStack(stack).toJSON())
})

test('o modelo leva só as sete peças da empresa', () => {
  const { app, lake: stack } = conexusApp()
  const template = Template.fromStack(stack).toJSON()
  assert.deepEqual(Object.keys(template), ['Parameters', 'Resources', 'Outputs'])
  assert.deepEqual(Object.keys(template.Parameters), ['LakeId', 'CompanyId'])
  assert.deepEqual(app.synth().getStackByName(stack.stackName).assets, [])
  assert.deepEqual(
    Object.values(lake)
      .map((resource) => resource.Type)
      .sort(),
    [
      'AWS::Athena::WorkGroup',
      'AWS::IAM::Role',
      'AWS::LakeFormation::PrincipalPermissions',
      'AWS::LakeFormation::PrincipalPermissions',
      'AWS::S3Tables::Namespace',
      'AWS::S3Tables::Namespace',
      'AWS::S3Tables::TableBucket',
    ],
  )
  assert.partialDeepStrictEqual(find(lake, 'Bucket').Properties, {
    TableBucketName: 'conexus-{LakeId}',
    Tags: [{ Key: 'conexus-empresa', Value: '{CompanyId}' }],
  })
  assert.equal(find(lake, 'Raw').Properties.Namespace, 'raw')
  assert.equal(find(lake, 'Current').Properties.Namespace, 'current')
  assert.partialDeepStrictEqual(find(lake, 'Reader').Properties, {
    RoleName: 'conexus-{LakeId}-leitor',
    PermissionsBoundary: `arn:aws:iam::${ACCOUNT}:policy/conexus-limite`,
  })
  assert.partialDeepStrictEqual(find(lake, 'WorkGroup').Properties, {
    Name: 'conexus-{LakeId}',
    RecursiveDeleteOption: true,
    WorkGroupConfiguration: {
      ManagedQueryResultsConfiguration: { Enabled: true },
      BytesScannedCutoffPerQuery: 1024 ** 3,
    },
  })
  const reader = { DataLakePrincipalIdentifier: '<Reader.Arn>' }
  const catalogId = `${ACCOUNT}:s3tablescatalog/conexus-{LakeId}`
  assert.deepEqual(find(lake, 'DescribeCatalog').Properties, {
    Permissions: ['DESCRIBE'],
    PermissionsWithGrantOption: [],
    Principal: reader,
    Resource: { Catalog: { Id: catalogId } },
  })
  assert.deepEqual(find(lake, 'DescribeCurrent').Properties, {
    Permissions: ['DESCRIBE'],
    PermissionsWithGrantOption: [],
    Principal: reader,
    Resource: { Database: { CatalogId: catalogId, Name: 'current' } },
  })
})

test('o leitor só confia no Hub com as duas etiquetas', () => {
  const hub = { AWS: `arn:aws:iam::${ACCOUNT}:role/conexus-hub` }
  const thisCompany = { 'aws:RequestTag/conexus-empresa': '{CompanyId}' }
  assert.deepEqual(trustOf(find(lake, 'Reader')), [
    {
      Action: 'sts:AssumeRole',
      Effect: 'Allow',
      Principal: hub,
      Condition: { StringEquals: thisCompany, Null: { 'aws:RequestTag/conexus-leitor': 'false' } },
    },
    {
      Action: 'sts:TagSession',
      Effect: 'Allow',
      Principal: hub,
      Condition: {
        StringEquals: thisCompany,
        'ForAllValues:StringEquals': { 'aws:TagKeys': ['conexus-empresa', 'conexus-leitor'] },
        Null: { 'aws:TagKeys': 'false' },
      },
    },
  ])
})

test('nenhum número de conta no modelo', () => {
  assert.doesNotMatch(stored, /\d{12}/)
})

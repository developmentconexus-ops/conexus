import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { ACCOUNT, find, REGION, readable, statementsOf, trustOf } from './policies.ts'

const platform = readable('platform')
const SdkCall = z
  .string()
  .transform((text) => z.record(z.string(), z.unknown()).parse(JSON.parse(text)))

/** A custom resource's SDK calls, as the function will run them. */
function callsOf(resource: ReturnType<typeof find>) {
  return z.object({ Create: SdkCall, Delete: SdkCall }).parse(resource.Properties)
}

test('as tabelas entram no Lake Formation sem permissão padrão', () => {
  const lakeFormation = { Service: 'lakeformation.amazonaws.com' }
  const thisAccount = { StringEquals: { 'aws:SourceAccount': ACCOUNT } }
  assert.deepEqual(trustOf(find(platform, 'LakeFormationRole')), [
    { Action: 'sts:AssumeRole', Effect: 'Allow', Principal: lakeFormation, Condition: thisAccount },
    {
      Action: ['sts:SetContext', 'sts:SetSourceIdentity'],
      Effect: 'Allow',
      Principal: lakeFormation,
      Condition: thisAccount,
    },
  ])
  const tableBuckets = `arn:aws:s3tables:${REGION}:${ACCOUNT}:bucket/*`
  const registration = find(platform, 'TableBucketsRegistration')
  assert.deepEqual(callsOf(registration), {
    Create: {
      service: 'LakeFormation',
      action: 'RegisterResource',
      parameters: {
        ResourceArn: tableBuckets,
        RoleArn: '<LakeFormationRole.Arn>',
        UseServiceLinkedRole: false,
        WithFederation: true,
        WithPrivilegedAccess: true,
      },
      physicalResourceId: { id: tableBuckets },
    },
    Delete: {
      service: 'LakeFormation',
      action: 'DeregisterResource',
      parameters: { ResourceArn: tableBuckets },
    },
  })
  const catalog = find(platform, 'TablesCatalog')
  assert.deepEqual(callsOf(catalog), {
    Create: {
      service: 'Glue',
      action: 'CreateCatalog',
      parameters: {
        Name: 's3tablescatalog',
        CatalogInput: {
          FederatedCatalog: { Identifier: tableBuckets, ConnectionName: 'aws:s3tables' },
          CreateDatabaseDefaultPermissions: [],
          CreateTableDefaultPermissions: [],
          AllowFullTableExternalDataAccess: 'False',
        },
      },
      physicalResourceId: { id: 's3tablescatalog' },
    },
    Delete: {
      service: 'Glue',
      action: 'DeleteCatalog',
      parameters: { CatalogId: 's3tablescatalog' },
    },
  })
})

test('quem registra as tabelas é quem cria o catálogo, sem ser administrador do lago', () => {
  const registration = find(platform, 'TableBucketsRegistration')
  const catalog = find(platform, 'TablesCatalog')
  assert.equal(catalog.Properties.ServiceToken, registration.Properties.ServiceToken)
  assert.ok(catalog.DependsOn?.some((id) => id.startsWith('TableBucketsRegistration')))
  assert.deepEqual(statementsOf(find(platform, 'TableBucketsRegistrationCustomResourcePolicy')), [
    {
      Effect: 'Allow',
      Action: [
        'lakeformation:RegisterResource',
        'lakeformation:RegisterResourceWithPrivilegedAccess',
        'lakeformation:DeregisterResource',
      ],
      Resource: '*',
    },
    { Effect: 'Allow', Action: 'iam:PassRole', Resource: '<LakeFormationRole.Arn>' },
  ])
  assert.deepEqual(statementsOf(find(platform, 'TablesCatalogCustomResourcePolicy')), [
    {
      Effect: 'Allow',
      Action: [
        'glue:CreateCatalog',
        'glue:DeleteCatalog',
        'glue:PassConnection',
        'lakeformation:CreateCatalog',
      ],
      Resource: '*',
    },
  ])
  const settings = Object.values(platform).filter(
    (resource) => resource.Type === 'AWS::LakeFormation::DataLakeSettings',
  )
  assert.deepEqual(
    settings.map((resource) => resource.Properties.Admins),
    [[{ DataLakePrincipalIdentifier: '<ServiceRole.Arn>' }]],
  )
})

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
  return z
    .object({ Create: SdkCall.optional(), Delete: SdkCall, InstallLatestAwsSdk: z.boolean() })
    .parse(resource.Properties)
}

const TABLE_BUCKETS = `arn:aws:s3tables:${REGION}:${ACCOUNT}:bucket/*`
/** What the handler puts in place of the delete's id: the id the create returned, or its log stream. */
const THE_CREATED_ID = 'PHYSICAL:RESOURCEID:'
const NOT_OURS = '^(EntityNotFoundException|InvalidInputException)$'
const CALLERS = ['TableBucketsRegistration', 'TableBucketsLocationGrant', 'TablesCatalog']

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
  const tableBuckets = TABLE_BUCKETS
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
      parameters: { ResourceArn: THE_CREATED_ID },
      ignoreErrorCodesMatching: NOT_OURS,
    },
    InstallLatestAwsSdk: false,
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
      parameters: { CatalogId: THE_CREATED_ID },
      ignoreErrorCodesMatching: NOT_OURS,
    },
    InstallLatestAwsSdk: false,
  })
})

test('quem registra as tabelas é quem cria o catálogo, sem ser administrador do lago', () => {
  const tokens = CALLERS.map((id) => find(platform, id).Properties.ServiceToken)
  assert.deepEqual(new Set(tokens).size, 1)
  assert.deepEqual(
    find(platform, 'AWS679f53fac002430cb0da5b7982bd2287').Properties.Role,
    '<TablesCatalogRole.Arn>',
  )
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

test('uma criação que falha não apaga o que já estava na região', () => {
  // A failed create's id is the function's log stream: a delete by that id names nothing, and a
  // delete by a fixed name would take away a registration or catalog that was there before.
  for (const id of ['TableBucketsRegistration', 'TablesCatalog']) {
    const { Delete } = callsOf(find(platform, id))
    assert.deepEqual(Object.values(z.record(z.string(), z.string()).parse(Delete.parameters)), [
      THE_CREATED_ID,
    ])
    assert.equal(Delete.ignoreErrorCodesMatching, NOT_OURS)
  }
})

test('o destroy tira a concessão de local da função e os logs dela', () => {
  const grant = find(platform, 'TableBucketsLocationGrant')
  assert.deepEqual(callsOf(grant), {
    Delete: {
      service: 'LakeFormation',
      action: 'RevokePermissions',
      parameters: {
        Principal: { DataLakePrincipalIdentifier: '<TablesCatalogRole.Arn>' },
        Resource: { DataLocation: { ResourceArn: TABLE_BUCKETS } },
        Permissions: ['DATA_LOCATION_ACCESS'],
      },
    },
    InstallLatestAwsSdk: false,
  })
  assert.deepEqual(statementsOf(find(platform, 'TableBucketsLocationGrantCustomResourcePolicy')), [
    { Effect: 'Allow', Action: 'lakeformation:RevokePermissions', Resource: '*' },
  ])
  // Created after the registration and deleted before it, with the catalog gone first.
  assert.ok(grant.DependsOn?.some((id) => id.startsWith('TableBucketsRegistrationE')))
  const catalog = find(platform, 'TablesCatalog')
  assert.ok(catalog.DependsOn?.some((id) => id.startsWith('TableBucketsLocationGrantE')))
  const logs = find(platform, 'TablesCatalogLogs')
  assert.equal(logs.Properties.LogGroupName, 'conexus-plataforma-catalogo')
  assert.equal(logs.DeletionPolicy, 'Delete')
  const fn = find(platform, 'AWS679f53fac002430cb0da5b7982bd2287')
  assert.deepEqual(fn.Properties.LoggingConfig, { LogGroup: '{TablesCatalogLogs}' })
  const role = find(platform, 'TablesCatalogRole')
  assert.equal(role.Properties.RoleName, 'conexus-s3tables-catalogo')
  assert.equal(role.Properties.ManagedPolicyArns, undefined)
  assert.deepEqual(statementsOf(find(platform, 'TablesCatalogRoleDefaultPolicy')), [
    {
      Effect: 'Allow',
      Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
      Resource: '<TablesCatalogLogs.Arn>',
    },
  ])
})

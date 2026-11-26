import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { Template } from 'aws-cdk-lib/assertions'
import { conexusApp } from '../lib/app.ts'
import type { Call } from './iam.ts'
import { mayAssume, refusedUpdateResources } from './iam.ts'
import type { Statement } from './policies.ts'
import {
  ACCOUNT,
  actionsOf,
  find,
  REGION,
  readable,
  readableResources,
  statementsOf,
  trustOf,
} from './policies.ts'

const stored = readFileSync(new URL('../lake.template.json', import.meta.url), 'utf8')
const lake = readableResources(JSON.parse(stored))

test('o modelo guardado é o que a síntese escreve', () => {
  const { lake: stack } = conexusApp()
  assert.deepEqual(JSON.parse(stored), Template.fromStack(stack).toJSON())
})

test('o modelo leva só as peças da empresa', () => {
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
      'AWS::IAM::Role',
      ...Array(6).fill('AWS::LakeFormation::PrincipalPermissions'),
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

const CHANGED_BY_THE_WRITER = [
  'catalog',
  'catalog/s3tablescatalog',
  'catalog/s3tablescatalog/conexus-{LakeId}',
  'database/s3tablescatalog/conexus-{LakeId}/raw',
  'table/s3tablescatalog/conexus-{LakeId}/raw/*',
  'database/s3tablescatalog/conexus-{LakeId}/current',
  'table/s3tablescatalog/conexus-{LakeId}/current/*',
].map((resource) => `arn:aws:glue:${REGION}:${ACCOUNT}:${resource}`)

test('o papel que escreve', () => {
  const writer = find(lake, 'Writer')
  assert.partialDeepStrictEqual(writer.Properties, {
    RoleName: 'conexus-{LakeId}-escritor',
    PermissionsBoundary: `arn:aws:iam::${ACCOUNT}:policy/conexus-limite`,
    Tags: [{ Key: 'conexus-empresa', Value: '{CompanyId}' }],
  })
  assert.deepEqual(trustOf(writer), [
    {
      Action: 'sts:AssumeRole',
      Effect: 'Allow',
      Principal: { Service: 'ecs-tasks.amazonaws.com' },
      Condition: { StringEquals: { 'aws:SourceAccount': ACCOUNT } },
    },
  ])
  const statements = statementsOf(writer)
  const glue = `arn:aws:glue:${REGION}:${ACCOUNT}`
  const state = `arn:aws:s3:::conexus-estado-${ACCOUNT}-${REGION}`
  assert.deepEqual(
    statements.map((statement) => [statement.Sid, statement.Resource, statement.Condition]),
    [
      [
        'WriteTheCompanyTables',
        ['<Bucket.TableBucketARN>', '<Bucket.TableBucketARN>/table/*'],
        undefined,
      ],
      [
        'TheCompanyCatalog',
        [
          `${glue}:catalog`,
          `${glue}:catalog/s3tablescatalog`,
          `${glue}:catalog/s3tablescatalog/conexus-{LakeId}`,
          `${glue}:database/s3tablescatalog/conexus-{LakeId}/*`,
          `${glue}:table/s3tablescatalog/conexus-{LakeId}/*/*`,
        ],
        undefined,
      ],
      ['ChangeTheCompanyTables', CHANGED_BY_THE_WRITER, undefined],
      [undefined, '*', undefined],
      [
        'QueryInTheCompanyWorkGroup',
        `arn:aws:athena:${REGION}:${ACCOUNT}:workgroup/conexus-{LakeId}`,
        undefined,
      ],
      [
        'ReadTheCompanyRunParameters',
        `arn:aws:ssm:${REGION}:${ACCOUNT}:parameter/conexus/copia/{CompanyId}/*`,
        undefined,
      ],
      ['SendTheResult', `arn:aws:sqs:${REGION}:${ACCOUNT}:conexus-copia-fim`, undefined],
      ['TheCompanyStoppingPoints', `${state}/{CompanyId}/*`, undefined],
      ['ListTheCompanyStoppingPoints', state, { StringLike: { 's3:prefix': '{CompanyId}/*' } }],
    ],
  )
  assert.ok(!statements.flatMap(actionsOf).some((action) => /^(iam|sts):/.test(action)))
})

function writerOf(lakeId: string): Statement[] {
  return JSON.parse(
    JSON.stringify(statementsOf(find(lake, 'Writer'))).replaceAll('{LakeId}', lakeId),
  )
}

test('o que escreve muda a tabela das duas áreas do próprio lago, em cada recurso que o Glue pede', () => {
  const writer = writerOf('lagodeaaaaaa')
  for (const area of ['raw', 'current']) {
    assert.deepEqual(refusedUpdateResources(writer, 'conexus-lagodeaaaaaa', area), [], area)
  }
})

test('o que escreve não muda tabela de outro lago nem de uma terceira área', () => {
  const writer = writerOf('lagodeaaaaaa')
  const glue = `arn:aws:glue:${REGION}:${ACCOUNT}`
  const other = 's3tablescatalog/conexus-lagodebbbbbb'
  assert.deepEqual(refusedUpdateResources(writer, 'conexus-lagodebbbbbb', 'current'), [
    `${glue}:catalog/${other}`,
    `${glue}:database/${other}/current`,
    `${glue}:table/${other}/current/notas`,
  ])
  const own = 's3tablescatalog/conexus-lagodeaaaaaa'
  assert.deepEqual(refusedUpdateResources(writer, 'conexus-lagodeaaaaaa', 'outra'), [
    `${glue}:database/${own}/outra`,
    `${glue}:table/${own}/outra/notas`,
  ])
})

test('o que escreve grava nas duas áreas pelo Lake Formation', () => {
  const writerPrincipal = { DataLakePrincipalIdentifier: '<Writer.Arn>' }
  const catalogId = `${ACCOUNT}:s3tablescatalog/conexus-{LakeId}`
  for (const [area, name] of [
    ['Raw', 'raw'],
    ['Current', 'current'],
  ]) {
    assert.deepEqual(find(lake, `WriterWrites${area}`).Properties, {
      Permissions: ['SELECT', 'INSERT', 'DELETE', 'DESCRIBE', 'ALTER'],
      PermissionsWithGrantOption: [],
      Principal: writerPrincipal,
      Resource: { Table: { CatalogId: catalogId, DatabaseName: name, TableWildcard: {} } },
    })
    assert.deepEqual(find(lake, `WriterDescribes${area}`).Properties, {
      Permissions: ['DESCRIBE'],
      PermissionsWithGrantOption: [],
      Principal: writerPrincipal,
      Resource: { Database: { CatalogId: catalogId, Name: name } },
    })
  }
})

const HUB = `arn:aws:iam::${ACCOUNT}:role/conexus-hub`
const A = 'EmpresaTesteA0000000000000000001'
const B = 'EmpresaTesteB0000000000000000002'

test('o leitor só confia no Hub com as duas etiquetas', () => {
  const thisCompany = {
    'aws:PrincipalTag/conexus-empresa': '{CompanyId}',
    'aws:RequestTag/conexus-empresa': '{CompanyId}',
  }
  const common = {
    Effect: 'Allow',
    Principal: { AWS: `arn:aws:iam::${ACCOUNT}:root` },
  }
  assert.deepEqual(trustOf(find(lake, 'Reader')), [
    {
      ...common,
      Action: 'sts:AssumeRole',
      Condition: {
        ArnEquals: { 'aws:PrincipalArn': HUB },
        StringEquals: thisCompany,
        Null: { 'aws:RequestTag/conexus-leitor': 'false' },
      },
    },
    {
      ...common,
      Action: 'sts:TagSession',
      Condition: {
        ArnEquals: { 'aws:PrincipalArn': HUB },
        StringEquals: thisCompany,
        'ForAllValues:StringEquals': { 'aws:TagKeys': ['conexus-empresa', 'conexus-leitor'] },
        Null: { 'aws:TagKeys': 'false' },
      },
    },
  ])
})

/** The reader of one company's lake, as IAM would hold it once the stack exists. */
function readerOf(company: string): Statement[] {
  return JSON.parse(
    JSON.stringify(trustOf(find(lake, 'Reader'))).replaceAll('{CompanyId}', company),
  )
}

function asks(session: string, reader: string, tags: Record<string, string>) {
  return ['sts:AssumeRole', 'sts:TagSession'].map((action) => ({
    action,
    resource: `arn:aws:iam::${ACCOUNT}:role/conexus-${reader}-leitor`,
    principalArn: HUB,
    principalTags: { 'conexus-empresa': session },
    requestTags: tags,
  }))
}

function assumes(identity: Statement[], calls: Call[], trust: Statement[]): boolean {
  return calls.every((call) => mayAssume(trust, identity, call))
}

test('a sessão de A não assume o leitor de B, e o Hub sem sts:AssumeRole não assume nenhum', () => {
  const hub = statementsOf(find(readable('platform'), 'HubRole'))
  const ofA = { 'conexus-empresa': A, 'conexus-leitor': 'r1' }
  const ofB = { 'conexus-empresa': B, 'conexus-leitor': 'r1' }
  assert.equal(assumes(hub, asks(A, 'lagodeaaaaaa', ofA), readerOf(A)), false)
  assert.equal(assumes(hub, asks(A, 'lagodebbbbbb', ofB), readerOf(B)), false)

  // The step that first lets the Hub read (step 3) gives its policy sts:AssumeRole on the readers.
  const step3: Statement[] = [
    {
      Effect: 'Allow',
      Action: ['sts:AssumeRole', 'sts:TagSession'],
      Resource: `arn:aws:iam::${ACCOUNT}:role/conexus-*-leitor`,
    },
  ]
  assert.equal(assumes(step3, asks(A, 'lagodeaaaaaa', ofA), readerOf(A)), true)
  assert.equal(assumes(step3, asks(A, 'lagodebbbbbb', ofB), readerOf(B)), false)
  assert.equal(assumes(step3, asks(A, 'lagodebbbbbb', ofA), readerOf(B)), false)
  assert.equal(
    assumes(step3, asks(A, 'lagodeaaaaaa', { 'conexus-empresa': A }), readerOf(A)),
    false,
  )
  const third = { ...ofA, 'conexus-outra': 'x' }
  assert.equal(assumes(step3, asks(A, 'lagodeaaaaaa', third), readerOf(A)), false)
})

test('nenhum número de conta no modelo', () => {
  assert.doesNotMatch(stored, /\d{12}/)
})

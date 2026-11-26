import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Template } from 'aws-cdk-lib/assertions'
import { conexusApp } from '../lib/app.ts'
import type { Call } from './iam.ts'
import { allows, asked, refusedGlueResources } from './iam.ts'
import { lake, roleOf, stored } from './lake-model.ts'
import { ACCOUNT, actionsOf, find, REGION, statementsOf, trustOf } from './policies.ts'

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
      'AWS::Athena::WorkGroup',
      'AWS::IAM::Role',
      'AWS::IAM::Role',
      'AWS::IAM::Role',
      ...Array(10).fill('AWS::LakeFormation::PrincipalPermissions'),
      ...Array(4).fill('AWS::S3Tables::Namespace'),
      'AWS::S3Tables::TableBucket',
    ],
  )
  assert.partialDeepStrictEqual(find(lake, 'Bucket').Properties, {
    TableBucketName: 'conexus-{LakeId}',
    Tags: [{ Key: 'conexus-empresa', Value: '{CompanyId}' }],
  })
  for (const area of ['Raw', 'Current', 'Tratado', 'Negocio']) {
    assert.equal(find(lake, area).Properties.Namespace, area.toLowerCase())
  }
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
      ['OpenTheCompanyBucket', '<Bucket.TableBucketARN>', undefined],
      [
        'WriteTheCompanyTables',
        ['<Bucket.TableBucketARN>', '<Bucket.TableBucketARN>/table/*'],
        { StringEquals: { 's3tables:namespace': ['raw', 'current'] } },
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

const TABLE_ACTIONS = [
  's3tables:GetNamespace',
  's3tables:ListTables',
  's3tables:GetTable',
  's3tables:CreateTable',
  's3tables:GetTableMetadataLocation',
  's3tables:UpdateTableMetadataLocation',
  's3tables:GetTableData',
  's3tables:PutTableData',
]

function onTheBucket(action: string, namespace?: string): Call {
  const context = namespace ? { 's3tables:namespace': namespace } : undefined
  return { ...asked(action, '<Bucket.TableBucketARN>'), context }
}

test('o que escreve só cria e grava tabela em raw e current, e abre o depósito sem área', () => {
  const writer = statementsOf(find(lake, 'Writer'))
  for (const action of TABLE_ACTIONS) {
    for (const area of ['raw', 'current']) {
      assert.equal(allows(writer, onTheBucket(action, area)), true, `${action} ${area}`)
    }
    for (const area of ['tratado', 'negocio', undefined]) {
      assert.equal(allows(writer, onTheBucket(action, area)), false, `${action} ${area}`)
    }
  }
  for (const action of ['s3tables:GetTableBucket', 's3tables:ListNamespaces']) {
    assert.equal(allows(writer, onTheBucket(action)), true, action)
  }
})

test('o que escreve muda a tabela das duas áreas do próprio lago, em cada recurso que o Glue pede', () => {
  const writer = roleOf('Writer', 'lagodeaaaaaa')
  for (const area of ['raw', 'current']) {
    const of = { action: 'glue:UpdateTable', bucket: 'conexus-lagodeaaaaaa', area }
    assert.deepEqual(refusedGlueResources(writer, of), [], area)
  }
})

test('o que escreve não muda tabela de outro lago nem das áreas do tratamento', () => {
  const writer = roleOf('Writer', 'lagodeaaaaaa')
  const glue = `arn:aws:glue:${REGION}:${ACCOUNT}`
  const other = 's3tablescatalog/conexus-lagodebbbbbb'
  const update = 'glue:UpdateTable'
  const ofB = { action: update, bucket: 'conexus-lagodebbbbbb', area: 'current' }
  assert.deepEqual(refusedGlueResources(writer, ofB), [
    `${glue}:catalog/${other}`,
    `${glue}:database/${other}/current`,
    `${glue}:table/${other}/current/notas`,
  ])
  const own = 's3tablescatalog/conexus-lagodeaaaaaa'
  for (const area of ['tratado', 'negocio']) {
    const of = { action: update, bucket: 'conexus-lagodeaaaaaa', area }
    assert.deepEqual(refusedGlueResources(writer, of), [
      `${glue}:database/${own}/${area}`,
      `${glue}:table/${own}/${area}/notas`,
    ])
    for (const action of ['glue:CreateTable', 'glue:DeleteTable']) {
      assert.equal(refusedGlueResources(writer, { ...of, action }).length, 5, `${action} ${area}`)
    }
  }
})

test('o que escreve não lê, não grava e não apaga a especificação do tratamento', () => {
  const company = 'EmpresaTesteA0000000000000000001'
  const writer = roleOf('Writer', 'lagodeaaaaaa', company)
  const spec = `arn:aws:s3:::conexus-estado-${ACCOUNT}-${REGION}/tratamento/${company}/rodada.json`
  for (const action of ['s3:GetObject', 's3:PutObject', 's3:DeleteObject']) {
    assert.equal(allows(writer, asked(action, spec)), false, action)
  }
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

test('nenhum número de conta no modelo', () => {
  assert.doesNotMatch(stored, /\d{12}/)
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { templateUrl } from '../lib/names.ts'
import { allows, allowsWithin, asked } from './iam.ts'
import type { Statement } from './policies.ts'
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
    's3:ListBucket',
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
const TREATERS = `arn:aws:iam::${ACCOUNT}:role/conexus-*-tratador`

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
      'PassOnlyTheCompanyTaskRoles',
      'iam:PassRole',
      [WRITERS, TREATERS, '<CopyExecutionRole.Arn>'],
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

test('o Hub passa à tarefa só o papel que escreve e o que trata', () => {
  const context = { 'iam:PassedToService': 'ecs-tasks.amazonaws.com' }
  for (const [role, passed] of [
    ['conexus-lagodeaaaaaa-escritor', true],
    ['conexus-lagodeaaaaaa-tratador', true],
    ['conexus-lagodeaaaaaa-leitor', false],
    ['conexus-cfn', false],
  ] as const) {
    const call = asked('iam:PassRole', `arn:aws:iam::${ACCOUNT}:role/${role}`)
    assert.equal(allows(hub, { ...call, context }), passed, role)
  }
})

test('o Hub grava a especificação só na raiz da empresa da sessão, e não a apaga', () => {
  const state = `arn:aws:s3:::conexus-estado-${ACCOUNT}-${REGION}`
  assert.deepEqual(bySid(hub, 'WriteTheCompanyTreatmentSpecs'), {
    Sid: 'WriteTheCompanyTreatmentSpecs',
    Effect: 'Allow',
    Action: 's3:PutObject',
    Resource: `${state}/tratamento/${SESSION_COMPANY}/*`,
  })
  const ofA: Statement[] = JSON.parse(
    JSON.stringify(hub).replaceAll(SESSION_COMPANY, 'EmpresaTesteA0000000000000000001'),
  )
  const a = `${state}/tratamento/EmpresaTesteA0000000000000000001/rodada.json`
  const b = `${state}/tratamento/EmpresaTesteB0000000000000000002/rodada.json`
  assert.equal(allows(ofA, asked('s3:PutObject', a)), true)
  assert.equal(allows(ofA, asked('s3:PutObject', b)), false)
  assert.equal(allows(ofA, asked('s3:DeleteObject', a)), false)
})

test('o teto não dá à plataforma nenhuma forma de o que escreve mudar o tratamento', () => {
  const boundary = statementsOf(find(platform, 'Boundary'))
  const writer: Statement[] = JSON.parse(
    JSON.stringify(statementsOf(find(readable('lake'), 'Writer'))).replaceAll(
      '{LakeId}',
      'lagodeaaaaaa',
    ),
  )
  const bucket = 'conexus-lagodeaaaaaa'
  for (const action of ['glue:CreateTable', 'glue:DeleteTable', 'glue:UpdateTable']) {
    for (const area of ['tratado', 'negocio']) {
      const table = `arn:aws:glue:${REGION}:${ACCOUNT}:table/s3tablescatalog/${bucket}/${area}/notas`
      assert.equal(allowsWithin(writer, boundary, asked(action, table)), false, `${action} ${area}`)
    }
  }
})

test('o teto recusa criar e apagar nas áreas da cópia, e deixa só mudar', () => {
  const boundary = statementsOf(find(platform, 'Boundary'))
  const bucket = 's3tablescatalog/conexus-lagodeaaaaaa'
  for (const area of ['raw', 'current']) {
    for (const resource of [`database/${bucket}/${area}`, `table/${bucket}/${area}/notas`]) {
      const arn = `arn:aws:glue:${REGION}:${ACCOUNT}:${resource}`
      for (const [action, held] of [
        ['glue:CreateTable', false],
        ['glue:DeleteTable', false],
        ['glue:UpdateTable', true],
      ] as const) {
        assert.equal(allows(boundary, asked(action, arn)), held, `${action} ${resource}`)
      }
    }
  }
})

test('o teto cobre cada permissão do papel que trata', () => {
  const boundary = statementsOf(find(platform, 'Boundary'))
  const treater = statementsOf(find(readable('lake'), 'Treater'))
  const refused = treater.flatMap((statement) =>
    actionsOf(statement).flatMap((action) =>
      resourcesOf(statement)
        .map((resource) =>
          resource
            .replaceAll('{LakeId}', 'lagodeaaaaaa')
            .replaceAll('{CompanyId}', 'EmpresaTesteA0000000000000000001')
            .replace(/\*$/, 'notas'),
        )
        .filter((resource) => !allows(boundary, asked(action, resource)))
        .map((resource) => `${action} ${resource}`),
    ),
  )
  assert.deepEqual(refused, [])
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
  const companyRoles = [`arn:aws:iam::${ACCOUNT}:role/conexus-*-leitor`, WRITERS, TREATERS]
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

test('o endereço que o Hub manda casa com o padrão, e a forma de caminho não', () => {
  const bucket = `conexus-receitas-${ACCOUNT}-${REGION}`
  const version = 'a'.repeat(64)
  const pattern = new RegExp(`^${OUR_TEMPLATES.replace(/[.]/g, '\\.').replace('*', '.*')}$`)
  assert.match(templateUrl(bucket, REGION, version), pattern)
  assert.doesNotMatch(`https://s3.${REGION}.amazonaws.com/${bucket}/lago/${version}.json`, pattern)
  assert.doesNotMatch(`https://${bucket}.s3.${REGION}.amazonaws.com/outra/${version}.json`, pattern)
})

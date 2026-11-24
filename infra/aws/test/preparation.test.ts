import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Template } from 'aws-cdk-lib/assertions'
import { z } from 'zod'
import { conexusApp } from '../lib/app.ts'
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

const preparation = readable('preparation')

test('a Release só entra do ambiente production', () => {
  const role = find(preparation, 'ReleaseRole')
  assert.equal(role.Properties.RoleName, 'conexus-release')
  assert.deepEqual(trustOf(role), [
    {
      Action: 'sts:AssumeRoleWithWebIdentity',
      Effect: 'Allow',
      Principal: { Federated: '{GitHub}' },
      Condition: {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          'token.actions.githubusercontent.com:sub':
            'repo:{GitHubRepository}:environment:production',
        },
      },
    },
  ])
  assert.equal(
    find(preparation, 'GitHub').Properties.Url,
    'https://token.actions.githubusercontent.com',
  )
  assert.deepEqual(statementsOf(role), [
    {
      Sid: 'AssumeTheCdkRoles',
      Effect: 'Allow',
      Action: 'sts:AssumeRole',
      Resource: `arn:aws:iam::${ACCOUNT}:role/cdk-*`,
    },
  ])
})

const REPOSITORY = 'octo-org@123456/octo-repo@456789'

/** Whether IAM would let a token with this `sub` and `aud` assume the Release role. */
function releaseAdmits(sub: string): boolean {
  const token: Record<string, string> = {
    'token.actions.githubusercontent.com:sub': sub,
    'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
  }
  const [trust] = trustOf(find(preparation, 'ReleaseRole'))
  return Object.entries(trust?.Condition ?? {}).every(([operator, keys]) =>
    Object.entries(keys).every(([key, expected]) => {
      const value = token[key]
      const patterns = (typeof expected === 'string' ? [expected] : expected).map((pattern) =>
        pattern.replaceAll('{GitHubRepository}', REPOSITORY),
      )
      if (value === undefined) return false
      if (operator === 'StringEquals') return patterns.includes(value)
      if (operator === 'StringLike') return patterns.some((pattern) => glob(pattern).test(value))
      throw new Error(`operator ${operator} not read by this test`)
    }),
  )
}

function glob(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^${escaped.replaceAll('*', '.*').replaceAll('?', '.')}$`)
}

test('a Release só entra com os ids imutáveis do dono e do repositório', () => {
  assert.equal(releaseAdmits('repo:octo-org@123456/octo-repo@456789:environment:production'), true)
  for (const sub of [
    'repo:octo-org/octo-repo:environment:production',
    'repo:octo-org@123456/octo-repo@456789:environment:preview',
    'repo:octo-org@123456/octo-repo@456789:ref:refs/heads/main',
    'repo:octo-org@123456/octo-repo@999999:environment:production',
    'repo:octo-org@999999/octo-repo@456789:environment:production',
    'repo:other@1/r@2:workflow:octo-org@123456/octo-repo@456789:environment:production',
  ]) {
    assert.equal(releaseAdmits(sub), false, sub)
  }
})

test('a preparação só aceita o repositório com os ids do dono e dele', () => {
  const { Parameters } = z
    .object({
      Parameters: z.object({ GitHubRepository: z.object({ AllowedPattern: z.string() }) }),
    })
    .parse(Template.fromStack(conexusApp().preparation).toJSON())
  const accepted = new RegExp(Parameters.GitHubRepository.AllowedPattern)
  assert.match(REPOSITORY, accepted)
  for (const repository of [
    'octo-org/octo-repo',
    'octo-org@123456/octo-repo',
    'octo-org/octo-repo@456789',
    'octo-org@x/octo-repo@456789',
    'octo-org@123456/octo-repo@456789:environment:*',
  ]) {
    assert.doesNotMatch(repository, accepted)
  }
})

test('a execução do CDK não é administradora', () => {
  const policy = find(preparation, 'CdkExecution')
  assert.equal(policy.Properties.ManagedPolicyName, 'conexus-cdk-execucao')
  const statements = statementsOf(policy)
  const allowed = statements.filter((statement) => statement.Effect === 'Allow')
  for (const statement of allowed) {
    for (const action of actionsOf(statement)) assert.notEqual(action, '*')
    const iamActions = actionsOf(statement).filter((action) => action.startsWith('iam:'))
    for (const action of iamActions) assert.doesNotMatch(action, /\*|User|AccessKey/, action)
    if (iamActions.length > 0) {
      assert.deepEqual(resourcesOf(statement), [
        `arn:aws:iam::${ACCOUNT}:role/conexus-*`,
        `arn:aws:iam::${ACCOUNT}:policy/conexus-*`,
      ])
    }
  }
  const preparationItself = bySid(statements, 'NeverThePreparation')
  assert.equal(preparationItself.Effect, 'Deny')
  assert.deepEqual(resourcesOf(preparationItself), [
    `arn:aws:iam::${ACCOUNT}:role/conexus-release`,
    `arn:aws:iam::${ACCOUNT}:policy/conexus-cdk-execucao`,
    `arn:aws:iam::${ACCOUNT}:user/conexus-hub-chave`,
  ])
})

test('a chave base só assume o papel do Hub', () => {
  const user = find(preparation, 'HubKeyUser')
  assert.equal(user.Properties.UserName, 'conexus-hub-chave')
  assert.equal(
    Object.values(preparation).some((resource) => resource.Type === 'AWS::IAM::AccessKey'),
    false,
  )
  assert.deepEqual(statementsOf(find(preparation, 'HubKeyUserDefaultPolicy')), [
    {
      Sid: 'OnlyTheHubRole',
      Effect: 'Allow',
      Action: ['sts:AssumeRole', 'sts:TagSession'],
      Resource: `arn:aws:iam::${ACCOUNT}:role/conexus-hub`,
    },
  ])
})

test('a execução do CDK lê a versão do bootstrap que a plataforma confere', () => {
  const { Parameters } = z
    .object({ Parameters: z.object({ BootstrapVersion: z.object({ Default: z.string() }) }) })
    .parse(Template.fromStack(conexusApp().platform).toJSON())
  assert.deepEqual(bySid(statementsOf(find(preparation, 'CdkExecution')), 'ReadBootstrapVersion'), {
    Sid: 'ReadBootstrapVersion',
    Effect: 'Allow',
    Action: ['ssm:GetParameter', 'ssm:GetParameters'],
    Resource: `arn:aws:ssm:${REGION}:${ACCOUNT}:parameter${Parameters.BootstrapVersion.Default}`,
  })
  assert.equal(Parameters.BootstrapVersion.Default, '/cdk-bootstrap/hnb659fds/version')
})

test('a execução do CDK só cria a função do catálogo, e não registra nem cria o catálogo', () => {
  const statements = statementsOf(find(preparation, 'CdkExecution'))
  const lakeAndCatalog = statements
    .flatMap(actionsOf)
    .filter((action) => action.startsWith('lakeformation:') || action.startsWith('glue:'))
  assert.deepEqual(lakeAndCatalog, [
    'lakeformation:GetDataLakeSettings',
    'lakeformation:PutDataLakeSettings',
  ])
  assert.deepEqual(bySid(statements, 'TheCatalogFunction'), {
    Sid: 'TheCatalogFunction',
    Effect: 'Allow',
    Action: [
      'lambda:CreateFunction',
      'lambda:DeleteFunction',
      'lambda:GetFunction',
      'lambda:GetFunctionCodeSigningConfig',
      'lambda:GetFunctionRecursionConfig',
      'lambda:GetFunctionScalingConfig',
      'lambda:GetRuntimeManagementConfig',
      'lambda:InvokeFunction',
      'lambda:TagResource',
      'lambda:UntagResource',
      'lambda:UpdateFunctionCode',
      'lambda:UpdateFunctionConfiguration',
    ],
    Resource: `arn:aws:lambda:*:${ACCOUNT}:function:conexus-plataforma-*`,
  })
  const group = `arn:aws:logs:*:${ACCOUNT}:log-group:conexus-plataforma-catalogo`
  assert.deepEqual(bySid(statements, 'TheCatalogFunctionLogs'), {
    Sid: 'TheCatalogFunctionLogs',
    Effect: 'Allow',
    Action: [
      'logs:CreateLogGroup',
      'logs:DeleteLogGroup',
      'logs:PutRetentionPolicy',
      'logs:TagResource',
      'logs:UntagResource',
      'logs:ListTagsForResource',
      'logs:GetDataProtectionPolicy',
      'logs:DescribeIndexPolicies',
    ],
    Resource: [group, `${group}:*`],
  })
  assert.deepEqual(bySid(statements, 'DescribeLogGroups'), {
    Sid: 'DescribeLogGroups',
    Effect: 'Allow',
    Action: ['logs:DescribeLogGroups', 'logs:DescribeResourcePolicies'],
    Resource: '*',
  })
  assert.deepEqual(bySid(statements, 'TheCatalogFunctionCode'), {
    Sid: 'TheCatalogFunctionCode',
    Effect: 'Allow',
    Action: ['s3:GetObject', 's3:GetObjectVersion'],
    Resource: `arn:aws:s3:::cdk-hnb659fds-assets-${ACCOUNT}-*/*`,
  })
})

test('a segunda preparação', () => {
  const statements = statementsOf(find(preparation, 'CdkExecution'))
  assert.deepEqual(
    statements.map((statement) => statement.Sid),
    [
      'OurRolesAndPolicies',
      'NeverThePreparation',
      'LakeFormationSettings',
      'TheCatalogFunction',
      'TheCatalogFunctionCode',
      'TheCatalogFunctionLogs',
      'DescribeLogGroups',
      'TheCopyCluster',
      'TheCopyTaskDefinition',
      'TaskDefinitionsHaveNoResource',
      'TheCopyQueues',
      'TheCopyRule',
      'ReadTheCopyNetwork',
      'CreateTheCopyNetwork',
      'TagTheCopyNetworkOnCreate',
      'TheCopyNetwork',
      'TheCopyLogs',
      'TheTemplatesBucket',
      'BudgetAndAnomalies',
      'ThePlatformStack',
      'ReadBootstrapVersion',
    ],
  )
  function copy(sid: string) {
    return resourcesOf(bySid(statements, sid))
  }
  function at(service: string, resource: string) {
    return `arn:aws:${service}:*:${ACCOUNT}:${resource}`
  }
  assert.deepEqual(copy('TheCopyCluster'), [at('ecs', 'cluster/conexus-copia')])
  assert.deepEqual(copy('TheCopyTaskDefinition'), [at('ecs', 'task-definition/conexus-copia:*')])
  assert.deepEqual(copy('TheCopyQueues'), [at('sqs', 'conexus-copia-fim*')])
  assert.deepEqual(copy('TheCopyRule'), [at('events', 'rule/conexus-plataforma-*')])
  assert.deepEqual(copy('TheCopyLogs'), [
    at('logs', 'log-group:conexus-plataforma-copia'),
    at('logs', 'log-group:conexus-plataforma-copia:*'),
  ])
  assert.deepEqual(actionsOf(bySid(statements, 'TaskDefinitionsHaveNoResource')), [
    'ecs:DeregisterTaskDefinition',
    'ecs:DescribeTaskDefinition',
  ])
  const network = statements.filter((statement) =>
    actionsOf(statement).some((action) => action.startsWith('ec2:')),
  )
  for (const action of network.flatMap(actionsOf)) {
    assert.match(action, /^ec2:/)
    assert.doesNotMatch(action, /\*|Instance(?!s$)|NatGateway|Peering/)
  }
  for (const statement of network) {
    assert.equal(statement.Condition?.StringEquals?.['aws:RequestedRegion'], REGION, statement.Sid)
  }
  const ours = {
    'aws:RequestedRegion': REGION,
    'aws:ResourceTag/aws:cloudformation:stack-name': 'conexus-plataforma',
  }
  const creates = actionsOf(bySid(statements, 'CreateTheCopyNetwork'))
  assert.deepEqual(bySid(statements, 'TheCopyNetwork').Condition, { StringEquals: ours })
  assert.deepEqual(bySid(statements, 'TagTheCopyNetworkOnCreate').Condition, {
    StringEquals: {
      'aws:RequestedRegion': REGION,
      'ec2:CreateAction': creates.map((action) => action.slice('ec2:'.length)),
    },
  })
  for (const action of actionsOf(bySid(statements, 'ReadTheCopyNetwork'))) {
    assert.match(action, /^ec2:Describe/)
  }
  for (const action of creates)
    assert.match(action, /^ec2:Create(Vpc|Subnet|InternetGateway|RouteTable|SecurityGroup)$/)
  for (const sid of ['TheCopyCluster', 'TheCopyQueues', 'TheCopyRule']) {
    for (const action of actionsOf(bySid(statements, sid))) assert.doesNotMatch(action, /\*/)
  }
  assert.ok(!statements.flatMap(actionsOf).some((action) => action.startsWith('ecr:')))
})

test('o depósito das imagens da cópia nasce na preparação, e a Release só publica nele', () => {
  assert.deepEqual(find(preparation, 'CopyRepository'), {
    Type: 'AWS::ECR::Repository',
    Properties: { ImageTagMutability: 'IMMUTABLE', RepositoryName: 'conexus-copia' },
    DeletionPolicy: 'Retain',
  })
  assert.deepEqual(statementsOf(find(preparation, 'ReleaseRoleDefaultPolicy')), [
    {
      Action: [
        'ecr:CompleteLayerUpload',
        'ecr:UploadLayerPart',
        'ecr:InitiateLayerUpload',
        'ecr:BatchCheckLayerAvailability',
        'ecr:PutImage',
      ],
      Effect: 'Allow',
      Resource: '<CopyRepository.Arn>',
    },
    { Action: 'ecr:GetAuthorizationToken', Effect: 'Allow', Resource: '*' },
    { Action: 'ecr:DescribeImages', Effect: 'Allow', Resource: '<CopyRepository.Arn>' },
  ])
})

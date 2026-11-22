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

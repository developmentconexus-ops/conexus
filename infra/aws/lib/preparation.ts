import type { StackProps } from 'aws-cdk-lib'
import { CfnParameter, DefaultStackSynthesizer, Duration, aws_iam as iam, Stack } from 'aws-cdk-lib'
import type { Construct } from 'constructs'
import { LOG_GROUP_ACTIONS } from './actions.ts'
import { copyImages, copyPlatformStatements } from './copy-preparation.ts'
import {
  CDK_EXECUTION_POLICY,
  HUB_KEY_USER,
  HUB_ROLE,
  PLATFORM_STACK,
  RELEASE_ROLE,
  TABLES_CATALOG_LOGS,
  templateBucket,
} from './names.ts'

const GITHUB = 'token.actions.githubusercontent.com'

/** The parameter the platform stack's bootstrap rule reads, under the default qualifier. */
const BOOTSTRAP_VERSION_PARAMETER =
  DefaultStackSynthesizer.DEFAULT_BOOTSTRAP_STACK_VERSION_SSM_PARAMETER.replace(
    '${Qualifier}',
    DefaultStackSynthesizer.DEFAULT_QUALIFIER,
  )

/** What CloudFormation may do to our roles and policies while it deploys the platform. */
const OUR_IAM_ACTIONS = [
  'iam:CreateRole',
  'iam:DeleteRole',
  'iam:GetRole',
  'iam:UpdateRole',
  'iam:UpdateAssumeRolePolicy',
  'iam:PutRolePolicy',
  'iam:DeleteRolePolicy',
  'iam:GetRolePolicy',
  'iam:ListRolePolicies',
  'iam:ListAttachedRolePolicies',
  'iam:AttachRolePolicy',
  'iam:DetachRolePolicy',
  'iam:TagRole',
  'iam:UntagRole',
  'iam:PassRole',
  'iam:CreatePolicy',
  'iam:DeletePolicy',
  'iam:GetPolicy',
  'iam:GetPolicyVersion',
  'iam:CreatePolicyVersion',
  'iam:DeletePolicyVersion',
  'iam:ListPolicyVersions',
  'iam:TagPolicy',
  'iam:UntagPolicy',
]

const LAKE_SETTINGS_ACTIONS = [
  'lakeformation:GetDataLakeSettings',
  'lakeformation:PutDataLakeSettings',
]

/**
 * The function that registers the table buckets and creates their catalog: what
 * AWS::Lambda::Function's handlers call for a function without VPC, KMS, image or concurrency,
 * and CloudFormation's invoke of a custom resource.
 */
const CATALOG_FUNCTION_ACTIONS = [
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
]

const SPEND_ACTIONS = [
  'budgets:ModifyBudget',
  'budgets:ViewBudget',
  'budgets:TagResource',
  'budgets:UntagResource',
  'budgets:ListTagsForResource',
  'ce:CreateAnomalyMonitor',
  'ce:UpdateAnomalyMonitor',
  'ce:DeleteAnomalyMonitor',
  'ce:GetAnomalyMonitors',
  'ce:CreateAnomalySubscription',
  'ce:UpdateAnomalySubscription',
  'ce:DeleteAnomalySubscription',
  'ce:GetAnomalySubscriptions',
  'ce:TagResource',
  'ce:UntagResource',
  'ce:ListTagsForResource',
]

/**
 * What only an administrator does, once per account, before `cdk bootstrap`: GitHub's OIDC
 * provider and the Release role, the user of the Hub's base key, the copy task's image repository,
 * and the CDK execution policy the bootstrap attaches in place of `AdministratorAccess`
 * (decision D, card U1; decision E, card U6).
 */
export class PreparationStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)
    const repository = new CfnParameter(this, 'GitHubRepository', {
      type: 'String',
      allowedPattern: '^[A-Za-z0-9-]+@[0-9]+/[A-Za-z0-9_.-]+@[0-9]+$',
    })
    const release = releaseRole(this, repository.valueAsString)
    copyImages(this, release)
    const keyUser = new iam.User(this, 'HubKeyUser', { userName: HUB_KEY_USER })
    keyUser.addToPrincipalPolicy(
      new iam.PolicyStatement({
        sid: 'OnlyTheHubRole',
        actions: ['sts:AssumeRole', 'sts:TagSession'],
        resources: [iamArn(this, `role/${HUB_ROLE}`)],
      }),
    )
    cdkExecutionPolicy(this)
  }
}

/** The bucket `cdk bootstrap` creates for file assets, in every region, under the default qualifier. */
function fileAssetsBucket(account: string): string {
  return DefaultStackSynthesizer.DEFAULT_FILE_ASSETS_BUCKET_NAME.replace(
    '${Qualifier}',
    DefaultStackSynthesizer.DEFAULT_QUALIFIER,
  )
    .replace('${AWS::AccountId}', account)
    .replace('${AWS::Region}', '*')
}

function iamArn(stack: Stack, resource: string): string {
  return `arn:${stack.partition}:iam::${stack.account}:${resource}`
}

/**
 * The Release enters only from this repository's `production` environment, with no stored key.
 * `repository` is `owner@owner-id/name@repository-id`, the immutable form GitHub writes in the
 * `sub`: a repository created again under the same name has another id, and its tokens do not match.
 */
function releaseRole(stack: Stack, repository: string): iam.Role {
  const github = new iam.OidcProviderNative(stack, 'GitHub', {
    url: `https://${GITHUB}`,
    clientIds: ['sts.amazonaws.com'],
  })
  return new iam.Role(stack, 'ReleaseRole', {
    roleName: RELEASE_ROLE,
    maxSessionDuration: Duration.hours(1),
    assumedBy: new iam.WebIdentityPrincipal(github.oidcProviderArn, {
      StringEquals: {
        [`${GITHUB}:aud`]: 'sts.amazonaws.com',
        [`${GITHUB}:sub`]: `repo:${repository}:environment:production`,
      },
    }),
    inlinePolicies: {
      conexus: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'AssumeTheCdkRoles',
            actions: ['sts:AssumeRole'],
            resources: [iamArn(stack, 'role/cdk-*')],
          }),
        ],
      }),
    },
  })
}

/** The function that registers the table buckets and creates their catalog: its code and its logs. */
function catalogFunctionStatements(stack: Stack): iam.PolicyStatement[] {
  return [
    new iam.PolicyStatement({
      sid: 'TheCatalogFunction',
      actions: CATALOG_FUNCTION_ACTIONS,
      resources: [`arn:${stack.partition}:lambda:*:${stack.account}:function:${PLATFORM_STACK}-*`],
    }),
    new iam.PolicyStatement({
      sid: 'TheCatalogFunctionCode',
      actions: ['s3:GetObject', 's3:GetObjectVersion'],
      resources: [`arn:${stack.partition}:s3:::${fileAssetsBucket(stack.account)}/*`],
    }),
    new iam.PolicyStatement({
      sid: 'TheCatalogFunctionLogs',
      actions: LOG_GROUP_ACTIONS,
      resources: [
        `arn:${stack.partition}:logs:*:${stack.account}:log-group:${TABLES_CATALOG_LOGS}`,
        `arn:${stack.partition}:logs:*:${stack.account}:log-group:${TABLES_CATALOG_LOGS}:*`,
      ],
    }),
    new iam.PolicyStatement({
      sid: 'DescribeLogGroups',
      actions: ['logs:DescribeLogGroups', 'logs:DescribeResourcePolicies'],
      resources: ['*'],
    }),
  ]
}

/** In place of `AdministratorAccess`: IAM only on conexus-*, never on the preparation itself. */
function cdkExecutionPolicy(stack: Stack): iam.ManagedPolicy {
  return new iam.ManagedPolicy(stack, 'CdkExecution', {
    managedPolicyName: CDK_EXECUTION_POLICY,
    statements: [
      new iam.PolicyStatement({
        sid: 'OurRolesAndPolicies',
        actions: OUR_IAM_ACTIONS,
        resources: [iamArn(stack, 'role/conexus-*'), iamArn(stack, 'policy/conexus-*')],
      }),
      new iam.PolicyStatement({
        sid: 'NeverThePreparation',
        effect: iam.Effect.DENY,
        actions: ['iam:*'],
        resources: [
          iamArn(stack, `role/${RELEASE_ROLE}`),
          iamArn(stack, `policy/${CDK_EXECUTION_POLICY}`),
          iamArn(stack, `user/${HUB_KEY_USER}`),
        ],
      }),
      new iam.PolicyStatement({
        sid: 'LakeFormationSettings',
        actions: LAKE_SETTINGS_ACTIONS,
        resources: ['*'],
      }),
      ...catalogFunctionStatements(stack),
      ...copyPlatformStatements(stack),
      new iam.PolicyStatement({
        sid: 'TheTemplatesBucket',
        actions: ['s3:*'],
        resources: [`arn:${stack.partition}:s3:::${templateBucket(stack.account, '*')}`],
      }),
      new iam.PolicyStatement({
        sid: 'BudgetAndAnomalies',
        actions: SPEND_ACTIONS,
        resources: ['*'],
      }),
      new iam.PolicyStatement({
        sid: 'ThePlatformStack',
        actions: ['cloudformation:*'],
        resources: [
          `arn:${stack.partition}:cloudformation:*:${stack.account}:stack/${PLATFORM_STACK}/*`,
        ],
      }),
      // As the bootstrap's deploy role reads it: CreateChangeSet resolves the platform's
      // BootstrapVersion parameter with this role, which AdministratorAccess would have covered.
      new iam.PolicyStatement({
        sid: 'ReadBootstrapVersion',
        actions: ['ssm:GetParameter', 'ssm:GetParameters'],
        resources: [
          `arn:${stack.partition}:ssm:${stack.region}:${stack.account}:parameter${BOOTSTRAP_VERSION_PARAMETER}`,
        ],
      }),
    ],
  })
}

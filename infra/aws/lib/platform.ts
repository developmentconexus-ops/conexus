import type { StackProps } from 'aws-cdk-lib'
import {
  aws_budgets as budgets,
  CfnParameter,
  aws_ce as ce,
  aws_glue as glue,
  aws_iam as iam,
  aws_lakeformation as lakeformation,
  RemovalPolicy,
  Stack,
  aws_s3 as s3,
} from 'aws-cdk-lib'
import type { Construct } from 'constructs'
import { hubRole } from './hub.ts'
import { READER_ACTIONS } from './lake.ts'
import {
  BOUNDARY,
  BUCKET_PREFIX,
  HUB_KEY_USER,
  LAKE_FORMATION_ROLE,
  PLATFORM_ROLES,
  READER_SUFFIX,
  RELEASE_ROLE,
  SERVICE_ROLE,
  TEMPLATE_PREFIX,
  templateBucket,
} from './names.ts'
import { Place } from './place.ts'

const TEND_READER_ACTIONS = [
  'iam:DeleteRole',
  'iam:GetRole',
  'iam:UpdateRole',
  'iam:UpdateAssumeRolePolicy',
  'iam:PutRolePolicy',
  'iam:DeleteRolePolicy',
  'iam:GetRolePolicy',
  'iam:ListRolePolicies',
  'iam:ListAttachedRolePolicies',
  'iam:TagRole',
  'iam:UntagRole',
]

const WORKGROUP_ACTIONS = [
  'athena:CreateWorkGroup',
  'athena:DeleteWorkGroup',
  'athena:GetWorkGroup',
  'athena:UpdateWorkGroup',
  'athena:TagResource',
  'athena:UntagResource',
  'athena:ListTagsForResource',
]

/** The Lake Formation role's table access, as the integration page gives it. */
const LAKE_FORMATION_TABLE_ACTIONS = [
  's3tables:CreateTableBucket',
  's3tables:GetTableBucket',
  's3tables:CreateNamespace',
  's3tables:GetNamespace',
  's3tables:ListNamespaces',
  's3tables:DeleteNamespace',
  's3tables:DeleteTableBucket',
  's3tables:CreateTable',
  's3tables:DeleteTable',
  's3tables:GetTable',
  's3tables:ListTables',
  's3tables:RenameTable',
  's3tables:UpdateTableMetadataLocation',
  's3tables:GetTableMetadataLocation',
  's3tables:GetTableData',
  's3tables:PutTableData',
]

/**
 * The account's platform, published by the Release: the Hub's role, CloudFormation's service role
 * and the boundary of a company's roles, the service role as a data lake administrator, the
 * S3 Tables integration in Lake Formation mode, the templates bucket, and the budget with its
 * alarm and the anomaly monitor (decisions 0073, 0075, D, F, H).
 */
export class PlatformStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)
    const budgetUsd = new CfnParameter(this, 'BudgetUsd', { type: 'Number', minValue: 1 })
    const alarmEmail = new CfnParameter(this, 'AlarmEmail', {
      type: 'String',
      allowedPattern: '^[^@\\s]+@[^@\\s]+$',
    })
    const hubSourceIp = new CfnParameter(this, 'HubSourceIp', {
      type: 'String',
      allowedPattern: '^([0-9]{1,3}\\.){3}[0-9]{1,3}/32$',
    })
    const place = new Place(this)
    const templates = templatesBucket(this, place)
    const boundary = boundaryPolicy(this, place)
    const service = serviceRole(this, place, boundary)
    hubRole(this, place, { service, templates, sourceIp: hubSourceIp.valueAsString })
    new lakeformation.CfnDataLakeSettings(this, 'ServiceRoleAdministersTheLake', {
      admins: [{ dataLakePrincipalIdentifier: service.roleArn }],
      mutationType: 'APPEND',
    })
    tablesInLakeFormation(this, place)
    spendAlarms(this, budgetUsd.valueAsNumber, alarmEmail.valueAsString)
  }
}

/** Only the Release writes, only a version that does not exist yet; kept when the stack goes. */
function templatesBucket(stack: Stack, place: Place): s3.Bucket {
  const templates = new s3.Bucket(stack, 'Templates', {
    bucketName: templateBucket(stack.account, stack.region),
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    encryption: s3.BucketEncryption.S3_MANAGED,
    enforceSSL: true,
    versioned: true,
    removalPolicy: RemovalPolicy.RETAIN,
  })
  templates.addToResourcePolicy(
    new iam.PolicyStatement({
      sid: 'ReleaseWritesOnlyNewTemplates',
      principals: [new iam.ArnPrincipal(place.iam(`role/${RELEASE_ROLE}`))],
      actions: ['s3:PutObject'],
      resources: [templates.arnForObjects(`${TEMPLATE_PREFIX}*`)],
      conditions: { Null: { 's3:if-none-match': 'false' } },
    }),
  )
  return templates
}

/** The most a company's role may ever hold. */
function boundaryPolicy(stack: Stack, place: Place): iam.ManagedPolicy {
  return new iam.ManagedPolicy(stack, 'Boundary', {
    managedPolicyName: BOUNDARY,
    statements: [
      new iam.PolicyStatement({ actions: READER_ACTIONS.athena, resources: [place.workGroups] }),
      new iam.PolicyStatement({ actions: READER_ACTIONS.glue, resources: ['*'] }),
      new iam.PolicyStatement({ actions: ['lakeformation:GetDataAccess'], resources: ['*'] }),
    ],
  })
}

/** CloudFormation's role for a company's stack: it tends only conexus-*-leitor roles, boundary held. */
function serviceRole(stack: Stack, place: Place, boundary: iam.ManagedPolicy): iam.Role {
  const readers = place.iam(`role/${BUCKET_PREFIX}*${READER_SUFFIX}`)
  const statements = [
    new iam.PolicyStatement({
      sid: 'LakeTableBuckets',
      actions: ['s3tables:*'],
      resources: [place.lakeTableBuckets, `${place.lakeTableBuckets}/*`],
    }),
    new iam.PolicyStatement({
      sid: 'ListTableBuckets',
      actions: ['s3tables:ListTableBuckets'],
      resources: ['*'],
    }),
    new iam.PolicyStatement({
      sid: 'CreateReadersOnlyWithTheBoundary',
      actions: ['iam:CreateRole'],
      resources: [readers],
      conditions: { StringEquals: { 'iam:PermissionsBoundary': boundary.managedPolicyArn } },
    }),
    new iam.PolicyStatement({
      sid: 'TendReaders',
      actions: TEND_READER_ACTIONS,
      resources: [readers],
    }),
    new iam.PolicyStatement({
      sid: 'NeverTouchThePlatform',
      effect: iam.Effect.DENY,
      actions: ['iam:*'],
      resources: [
        ...PLATFORM_ROLES.map((role) => place.iam(`role/${role}`)),
        place.iam(`role/${LAKE_FORMATION_ROLE}`),
        place.iam('role/cdk-*'),
        place.iam(`user/${HUB_KEY_USER}`),
        place.iam('policy/conexus-*'),
      ],
    }),
    new iam.PolicyStatement({
      sid: 'NeverLiftTheBoundary',
      effect: iam.Effect.DENY,
      actions: ['iam:DeleteRolePermissionsBoundary', 'iam:PutRolePermissionsBoundary'],
      resources: ['*'],
    }),
    new iam.PolicyStatement({
      sid: 'LakeWorkGroups',
      actions: WORKGROUP_ACTIONS,
      resources: [place.workGroups],
    }),
    new iam.PolicyStatement({
      sid: 'GrantInLakeFormation',
      actions: [
        'lakeformation:GrantPermissions',
        'lakeformation:RevokePermissions',
        'lakeformation:ListPermissions',
        'lakeformation:GetDataAccess',
        ...READER_ACTIONS.glue,
      ],
      resources: ['*'],
    }),
  ]
  return new iam.Role(stack, 'ServiceRole', {
    roleName: SERVICE_ROLE,
    assumedBy: new iam.ServicePrincipal('cloudformation.amazonaws.com').withConditions({
      StringEquals: { 'aws:SourceAccount': stack.account },
    }),
    inlinePolicies: { conexus: new iam.PolicyDocument({ statements }) },
  })
}

/** The S3 Tables integration in Lake Formation mode: the role, the registration and the catalog. */
function tablesInLakeFormation(stack: Stack, place: Place): void {
  const lakeFormationService = new iam.ServicePrincipal('lakeformation.amazonaws.com', {
    conditions: { StringEquals: { 'aws:SourceAccount': stack.account } },
  })
  const role = new iam.Role(stack, 'LakeFormationRole', {
    roleName: LAKE_FORMATION_ROLE,
    assumedBy: lakeFormationService,
    inlinePolicies: {
      conexus: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({ actions: ['s3tables:ListTableBuckets'], resources: ['*'] }),
          new iam.PolicyStatement({
            actions: LAKE_FORMATION_TABLE_ACTIONS,
            resources: [place.allTableBuckets],
          }),
        ],
      }),
    },
  })
  role.assumeRolePolicy?.addStatements(
    new iam.PolicyStatement({
      actions: ['sts:SetContext', 'sts:SetSourceIdentity'],
      principals: [lakeFormationService],
    }),
  )
  const registration = new lakeformation.CfnResource(stack, 'TableBucketsRegistration', {
    resourceArn: place.allTableBuckets,
    roleArn: role.roleArn,
    useServiceLinkedRole: false,
    withFederation: true,
  })
  const catalog = new glue.CfnCatalog(stack, 'TablesCatalog', {
    name: 's3tablescatalog',
    federatedCatalog: { identifier: place.allTableBuckets, connectionName: 'aws:s3tables' },
    createDatabaseDefaultPermissions: [],
    createTableDefaultPermissions: [],
    allowFullTableExternalDataAccess: 'False',
  })
  catalog.addResourceDependency(registration)
}

/** The monthly budget, mailed at 80% of the actual and 100% of the forecast, and the anomaly monitor. */
function spendAlarms(stack: Stack, usd: number, address: string): void {
  const email = [{ subscriptionType: 'EMAIL', address }]
  function notice(notificationType: string, threshold: number) {
    return {
      notification: {
        notificationType,
        comparisonOperator: 'GREATER_THAN',
        threshold,
        thresholdType: 'PERCENTAGE',
      },
      subscribers: email,
    }
  }
  new budgets.CfnBudget(stack, 'Budget', {
    budget: {
      budgetName: 'conexus-orcamento-mensal',
      budgetType: 'COST',
      timeUnit: 'MONTHLY',
      budgetLimit: { amount: usd, unit: 'USD' },
    },
    notificationsWithSubscribers: [notice('ACTUAL', 80), notice('FORECASTED', 100)],
  })
  const monitor = new ce.CfnAnomalyMonitor(stack, 'AnomalyMonitor', {
    monitorName: 'conexus-gasto-fora-do-normal',
    monitorType: 'DIMENSIONAL',
    monitorDimension: 'SERVICE',
  })
  new ce.CfnAnomalySubscription(stack, 'AnomalySubscription', {
    subscriptionName: 'conexus-gasto-fora-do-normal',
    frequency: 'DAILY',
    monitorArnList: [monitor.attrMonitorArn],
    subscribers: [{ type: 'EMAIL', address }],
    // Every anomaly the monitor finds is mailed: the threshold filters none (card L.14).
    thresholdExpression: JSON.stringify({
      Dimensions: {
        Key: 'ANOMALY_TOTAL_IMPACT_PERCENTAGE',
        MatchOptions: ['GREATER_THAN_OR_EQUAL'],
        Values: ['0'],
      },
    }),
  })
}

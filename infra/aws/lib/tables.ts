import type { Stack } from 'aws-cdk-lib'
import {
  custom_resources as cr,
  aws_iam as iam,
  aws_logs as logs,
  RemovalPolicy,
} from 'aws-cdk-lib'
import { LAKE_FORMATION_ROLE, TABLES_CATALOG_LOGS, TABLES_CATALOG_ROLE } from './names.ts'
import type { Place } from './place.ts'

const TABLES_CATALOG = 's3tablescatalog'

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
 * A delete whose id is not ours: the id of a create that failed is the function's log stream, so
 * the delete names nothing that exists and is not refused for it.
 */
const NOT_OURS = '^(EntityNotFoundException|InvalidInputException)$'

/** The one function, its role and its logs, that every call below runs in. */
type CatalogFunction = {
  readonly role: iam.Role
  readonly logGroup: logs.LogGroup
}

/**
 * The S3 Tables integration in Lake Formation mode: the role, the registration and the catalog.
 * AWS::LakeFormation::Resource has no WithPrivilegedAccess, the flag that grants the registering
 * principal DATA_LOCATION_ACCESS on the location without making it a data lake administrator;
 * without it, CreateCatalog is refused. So one function makes the calls, as one principal, and
 * revokes that grant before the location leaves, since deregistering keeps it.
 */
export function tablesInLakeFormation(stack: Stack, place: Place): void {
  const lakeFormation = lakeFormationRole(stack, place)
  const fn = catalogFunction(stack)
  const registration = registerTableBuckets(stack, place, fn, lakeFormation)
  const grant = revokeLocationGrantOnDelete(stack, place, fn)
  grant.node.addDependency(registration)
  createTablesCatalog(stack, place, fn).node.addDependency(grant)
}

function lakeFormationRole(stack: Stack, place: Place): iam.Role {
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
  return role
}

function catalogFunction(stack: Stack): CatalogFunction {
  const logGroup = new logs.LogGroup(stack, 'TablesCatalogLogs', {
    logGroupName: TABLES_CATALOG_LOGS,
    removalPolicy: RemovalPolicy.DESTROY,
  })
  const role = new iam.Role(stack, 'TablesCatalogRole', {
    roleName: TABLES_CATALOG_ROLE,
    assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  })
  logGroup.grantWrite(role)
  return { role, logGroup }
}

function callerOf(fn: CatalogFunction, statements: iam.PolicyStatement[]) {
  return {
    installLatestAwsSdk: false,
    role: fn.role,
    logGroup: fn.logGroup,
    policy: cr.AwsCustomResourcePolicy.fromStatements(statements),
  }
}

function registerTableBuckets(
  stack: Stack,
  place: Place,
  fn: CatalogFunction,
  lakeFormation: iam.Role,
): cr.AwsCustomResource {
  return new cr.AwsCustomResource(stack, 'TableBucketsRegistration', {
    ...callerOf(fn, [
      new iam.PolicyStatement({
        actions: [
          'lakeformation:RegisterResource',
          'lakeformation:RegisterResourceWithPrivilegedAccess',
          'lakeformation:DeregisterResource',
        ],
        resources: ['*'],
      }),
      new iam.PolicyStatement({ actions: ['iam:PassRole'], resources: [lakeFormation.roleArn] }),
    ]),
    onCreate: {
      service: 'LakeFormation',
      action: 'RegisterResource',
      parameters: {
        ResourceArn: place.allTableBuckets,
        RoleArn: lakeFormation.roleArn,
        UseServiceLinkedRole: false,
        WithFederation: true,
        WithPrivilegedAccess: true,
      },
      physicalResourceId: cr.PhysicalResourceId.of(place.allTableBuckets),
    },
    onDelete: {
      service: 'LakeFormation',
      action: 'DeregisterResource',
      parameters: { ResourceArn: new cr.PhysicalResourceIdReference() },
      ignoreErrorCodesMatching: NOT_OURS,
    },
  })
}

/** Created only after the registration succeeds, so its delete revokes only the grant it gave. */
function revokeLocationGrantOnDelete(
  stack: Stack,
  place: Place,
  fn: CatalogFunction,
): cr.AwsCustomResource {
  return new cr.AwsCustomResource(stack, 'TableBucketsLocationGrant', {
    ...callerOf(fn, [
      new iam.PolicyStatement({ actions: ['lakeformation:RevokePermissions'], resources: ['*'] }),
    ]),
    onDelete: {
      service: 'LakeFormation',
      action: 'RevokePermissions',
      parameters: {
        Principal: { DataLakePrincipalIdentifier: fn.role.roleArn },
        Resource: { DataLocation: { ResourceArn: place.allTableBuckets } },
        Permissions: ['DATA_LOCATION_ACCESS'],
      },
    },
  })
}

function createTablesCatalog(
  stack: Stack,
  place: Place,
  fn: CatalogFunction,
): cr.AwsCustomResource {
  return new cr.AwsCustomResource(stack, 'TablesCatalog', {
    ...callerOf(fn, [
      new iam.PolicyStatement({
        actions: [
          'glue:CreateCatalog',
          'glue:DeleteCatalog',
          'glue:PassConnection',
          'lakeformation:CreateCatalog',
        ],
        resources: ['*'],
      }),
    ]),
    onCreate: {
      service: 'Glue',
      action: 'CreateCatalog',
      parameters: {
        Name: TABLES_CATALOG,
        CatalogInput: {
          FederatedCatalog: { Identifier: place.allTableBuckets, ConnectionName: 'aws:s3tables' },
          CreateDatabaseDefaultPermissions: [],
          CreateTableDefaultPermissions: [],
          AllowFullTableExternalDataAccess: 'False',
        },
      },
      physicalResourceId: cr.PhysicalResourceId.of(TABLES_CATALOG),
    },
    onDelete: {
      service: 'Glue',
      action: 'DeleteCatalog',
      parameters: { CatalogId: new cr.PhysicalResourceIdReference() },
      ignoreErrorCodesMatching: NOT_OURS,
    },
  })
}

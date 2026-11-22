import type { Stack } from 'aws-cdk-lib'
import { custom_resources as cr, aws_iam as iam } from 'aws-cdk-lib'
import { LAKE_FORMATION_ROLE } from './names.ts'
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
 * The S3 Tables integration in Lake Formation mode: the role, the registration and the catalog.
 * AWS::LakeFormation::Resource has no WithPrivilegedAccess, the flag that grants the registering
 * principal DATA_LOCATION_ACCESS on the location without making it a data lake administrator;
 * without it, CreateCatalog is refused. So one function makes both calls, as one principal.
 */
export function tablesInLakeFormation(stack: Stack, place: Place): void {
  const role = lakeFormationRole(stack, place)
  const registration = registerTableBuckets(stack, place, role)
  createTablesCatalog(stack, place).node.addDependency(registration)
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

function registerTableBuckets(stack: Stack, place: Place, role: iam.Role): cr.AwsCustomResource {
  return new cr.AwsCustomResource(stack, 'TableBucketsRegistration', {
    installLatestAwsSdk: false,
    onCreate: {
      service: 'LakeFormation',
      action: 'RegisterResource',
      parameters: {
        ResourceArn: place.allTableBuckets,
        RoleArn: role.roleArn,
        UseServiceLinkedRole: false,
        WithFederation: true,
        WithPrivilegedAccess: true,
      },
      physicalResourceId: cr.PhysicalResourceId.of(place.allTableBuckets),
    },
    onDelete: {
      service: 'LakeFormation',
      action: 'DeregisterResource',
      parameters: { ResourceArn: place.allTableBuckets },
    },
    policy: cr.AwsCustomResourcePolicy.fromStatements([
      new iam.PolicyStatement({
        actions: [
          'lakeformation:RegisterResource',
          'lakeformation:RegisterResourceWithPrivilegedAccess',
          'lakeformation:DeregisterResource',
        ],
        resources: ['*'],
      }),
      new iam.PolicyStatement({ actions: ['iam:PassRole'], resources: [role.roleArn] }),
    ]),
  })
}

function createTablesCatalog(stack: Stack, place: Place): cr.AwsCustomResource {
  return new cr.AwsCustomResource(stack, 'TablesCatalog', {
    installLatestAwsSdk: false,
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
      parameters: { CatalogId: TABLES_CATALOG },
    },
    policy: cr.AwsCustomResourcePolicy.fromStatements([
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
  })
}

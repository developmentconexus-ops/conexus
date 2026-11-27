import type { StackProps } from 'aws-cdk-lib'
import {
  aws_athena as athena,
  CfnOutput,
  CfnParameter,
  Duration,
  aws_iam as iam,
  aws_lakeformation as lakeformation,
  Stack,
  aws_s3tables as s3tables,
} from 'aws-cdk-lib'
import type { Construct } from 'constructs'
import { READER_ACTIONS } from './actions.ts'
import {
  BOUNDARY,
  BUCKET_PREFIX,
  HUB_ROLE,
  READER_SUFFIX,
  TAG_COMPANY,
  TAG_READER,
} from './names.ts'
import { treaterGrants, treaterRole, treaterWorkGroup } from './treater.ts'
import { writerGrants, writerRole } from './writer.ts'

/** The most a single query may scan, 1 GiB, as the study's P1 and P3 templates measured. */
const QUERY_BYTES_CUTOFF = 1024 ** 3

/**
 * One company's lake, the template the Hub creates through CloudFormation's service role: the
 * table bucket, the `raw`, `current`, `tratado` and `negocio` namespaces, the reader role, the
 * Athena workgroup, the reader's two `DESCRIBE` grants, the copy task's writer with its grants on
 * `raw` and `current`, and the treatment's role, workgroup and grants (decision 0073, cards L.1,
 * L.5, U6, and the treatment card's decision 4.2).
 */
export class LakeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)
    const lakeId = new CfnParameter(this, 'LakeId', {
      type: 'String',
      allowedPattern: '^[a-z0-9]{12}$',
    })
    const companyId = new CfnParameter(this, 'CompanyId', {
      type: 'String',
      allowedPattern: '^[A-Za-z0-9]{32}$',
    })
    const name = `${BUCKET_PREFIX}${lakeId.valueAsString}`
    const company = companyId.valueAsString

    const bucket = new s3tables.CfnTableBucket(this, 'Bucket', {
      tableBucketName: name,
      tags: [{ key: TAG_COMPANY, value: company }],
    })
    const raw = new s3tables.CfnNamespace(this, 'Raw', {
      namespace: 'raw',
      tableBucketArn: bucket.attrTableBucketArn,
    })
    const current = new s3tables.CfnNamespace(this, 'Current', {
      namespace: 'current',
      tableBucketArn: bucket.attrTableBucketArn,
    })
    const tratado = new s3tables.CfnNamespace(this, 'Tratado', {
      namespace: 'tratado',
      tableBucketArn: bucket.attrTableBucketArn,
    })
    const negocio = new s3tables.CfnNamespace(this, 'Negocio', {
      namespace: 'negocio',
      tableBucketArn: bucket.attrTableBucketArn,
    })
    const reader = readerRole(this, name, company)
    const writer = writerRole(this, name, company, bucket.attrTableBucketArn)
    const treater = treaterRole(this, name, company)
    treaterWorkGroup(this, name)
    new athena.CfnWorkGroup(this, 'WorkGroup', {
      name,
      recursiveDeleteOption: true,
      workGroupConfiguration: {
        enforceWorkGroupConfiguration: true,
        publishCloudWatchMetricsEnabled: false,
        bytesScannedCutoffPerQuery: QUERY_BYTES_CUTOFF,
        engineVersion: { selectedEngineVersion: 'AUTO' },
        managedQueryResultsConfiguration: { enabled: true },
      },
    })

    // A grant by tag gives no DESCRIBE on the parent catalog or database, so the reader gets both by name.
    const catalogId = `${this.account}:s3tablescatalog/${name}`
    const principal = { dataLakePrincipalIdentifier: reader.roleArn }
    const grants = [
      new lakeformation.CfnPrincipalPermissions(this, 'DescribeCatalog', {
        principal,
        resource: { catalog: { Id: catalogId } },
        permissions: ['DESCRIBE'],
        permissionsWithGrantOption: [],
      }),
      new lakeformation.CfnPrincipalPermissions(this, 'DescribeCurrent', {
        principal,
        resource: { database: { catalogId, name: 'current' } },
        permissions: ['DESCRIBE'],
        permissionsWithGrantOption: [],
      }),
    ]
    for (const grant of grants) grant.addResourceDependency(current)
    writerGrants(this, writer, catalogId, [raw, current])
    treaterGrants(this, treater, catalogId, { reads: [current], writes: [tratado, negocio] })

    new CfnOutput(this, 'BucketArn', { value: bucket.attrTableBucketArn })
  }
}

/**
 * The reader trusts the account, not the Hub's role by name, so the Hub's own policy must also allow
 * the call (none does before step 3); and only a session of the Hub's role already tagged with this
 * company, asking for this company's tag and a reader's tag, no third.
 */
function readerRole(stack: Stack, name: string, company: string): iam.Role {
  function glue(resource: string): string {
    return `arn:${stack.partition}:glue:${stack.region}:${stack.account}:${resource}`
  }
  const account = new iam.AccountRootPrincipal()
  const theHub = {
    ArnEquals: {
      'aws:PrincipalArn': `arn:${stack.partition}:iam::${stack.account}:role/${HUB_ROLE}`,
    },
  }
  const thisCompany = {
    [`aws:PrincipalTag/${TAG_COMPANY}`]: company,
    [`aws:RequestTag/${TAG_COMPANY}`]: company,
  }
  const reader = new iam.Role(stack, 'Reader', {
    roleName: `${name}${READER_SUFFIX}`,
    maxSessionDuration: Duration.hours(1),
    permissionsBoundary: iam.ManagedPolicy.fromManagedPolicyArn(
      stack,
      'Boundary',
      `arn:${stack.partition}:iam::${stack.account}:policy/${BOUNDARY}`,
    ),
    assumedBy: account.withConditions({
      ...theHub,
      StringEquals: thisCompany,
      Null: { [`aws:RequestTag/${TAG_READER}`]: 'false' },
    }),
    inlinePolicies: {
      conexus: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            actions: READER_ACTIONS.athena,
            resources: [
              `arn:${stack.partition}:athena:${stack.region}:${stack.account}:workgroup/${name}`,
            ],
          }),
          new iam.PolicyStatement({
            actions: READER_ACTIONS.glue,
            resources: [
              glue('catalog'),
              glue('catalog/s3tablescatalog'),
              glue(`catalog/s3tablescatalog/${name}`),
              glue(`database/s3tablescatalog/${name}/*`),
              glue(`table/s3tablescatalog/${name}/*/*`),
            ],
          }),
          new iam.PolicyStatement({ actions: ['lakeformation:GetDataAccess'], resources: ['*'] }),
        ],
      }),
    },
  })
  reader.assumeRolePolicy?.addStatements(
    new iam.PolicyStatement({
      actions: ['sts:TagSession'],
      principals: [account],
      conditions: {
        ...theHub,
        StringEquals: thisCompany,
        'ForAllValues:StringEquals': { 'aws:TagKeys': [TAG_COMPANY, TAG_READER] },
        Null: { 'aws:TagKeys': 'false' },
      },
    }),
  )
  return reader
}

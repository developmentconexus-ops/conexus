import type { Stack, aws_s3tables as s3tables } from 'aws-cdk-lib'
import { aws_iam as iam, aws_lakeformation as lakeformation, Tags } from 'aws-cdk-lib'
import {
  COPY_AREAS,
  changedTableResources,
  READER_ACTIONS,
  WRITER_BUCKET_ACTIONS,
  WRITER_GRANTS,
  WRITER_TABLE_ACTIONS,
} from './actions.ts'
import {
  BOUNDARY,
  COPY_QUEUE,
  RUN_PARAMETER_PREFIX,
  stateBucket,
  TAG_COMPANY,
  WRITER_SUFFIX,
} from './names.ts'

/**
 * The writer the copy task runs as: only ECS tasks of this account assume it, with the boundary.
 * It writes this company's `raw` and `current` tables through S3 Tables and Lake Formation, reads
 * only this company's run parameters, sends only to the copy queue, keeps this company's stopping
 * points and queries in the company's workgroup (card U6, T.1, T.5).
 */
export function writerRole(
  stack: Stack,
  name: string,
  company: string,
  bucketArn: string,
): iam.Role {
  return companyTaskRole(stack, {
    id: 'Writer',
    roleName: `${name}${WRITER_SUFFIX}`,
    company,
    statements: writerStatements(stack, name, company, bucketArn),
  })
}

/**
 * A company's role for a task of the copy cluster, the writer's or the treatment's: only ECS tasks
 * of this account assume it, under the boundary, tagged with the company.
 */
export function companyTaskRole(
  stack: Stack,
  of: Readonly<{
    id: string
    roleName: string
    company: string
    statements: iam.PolicyStatement[]
  }>,
): iam.Role {
  const role = new iam.Role(stack, of.id, {
    roleName: of.roleName,
    permissionsBoundary: iam.ManagedPolicy.fromManagedPolicyArn(
      stack,
      `${of.id}Boundary`,
      `arn:${stack.partition}:iam::${stack.account}:policy/${BOUNDARY}`,
    ),
    assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com').withConditions({
      StringEquals: { 'aws:SourceAccount': stack.account },
    }),
    inlinePolicies: { conexus: new iam.PolicyDocument({ statements: of.statements }) },
  })
  Tags.of(role).add(TAG_COMPANY, of.company)
  return role
}

function writerStatements(
  stack: Stack,
  name: string,
  company: string,
  bucketArn: string,
): iam.PolicyStatement[] {
  function arn(service: string, resource: string): string {
    return `arn:${stack.partition}:${service}:${stack.region}:${stack.account}:${resource}`
  }
  const catalog = `s3tablescatalog/${name}`
  const state = `arn:${stack.partition}:s3:::${stateBucket(stack.account, stack.region)}`
  return [
    new iam.PolicyStatement({
      sid: 'OpenTheCompanyBucket',
      actions: WRITER_BUCKET_ACTIONS,
      resources: [bucketArn],
    }),
    new iam.PolicyStatement({
      sid: 'WriteTheCompanyTables',
      actions: WRITER_TABLE_ACTIONS.filter((action) => !WRITER_BUCKET_ACTIONS.includes(action)),
      resources: [bucketArn, `${bucketArn}/table/*`],
      conditions: { StringEquals: { 's3tables:namespace': [...COPY_AREAS] } },
    }),
    new iam.PolicyStatement({
      sid: 'TheCompanyCatalog',
      actions: READER_ACTIONS.glue,
      resources: [
        arn('glue', 'catalog'),
        arn('glue', 'catalog/s3tablescatalog'),
        arn('glue', `catalog/${catalog}`),
        arn('glue', `database/${catalog}/*`),
        arn('glue', `table/${catalog}/*/*`),
      ],
    }),
    new iam.PolicyStatement({
      sid: 'ChangeTheCompanyTables',
      actions: ['glue:UpdateTable'],
      resources: changedTableResources(name, COPY_AREAS).map((resource) => arn('glue', resource)),
    }),
    new iam.PolicyStatement({ actions: ['lakeformation:GetDataAccess'], resources: ['*'] }),
    new iam.PolicyStatement({
      sid: 'QueryInTheCompanyWorkGroup',
      actions: READER_ACTIONS.athena,
      resources: [arn('athena', `workgroup/${name}`)],
    }),
    new iam.PolicyStatement({
      sid: 'ReadTheCompanyRunParameters',
      actions: ['ssm:GetParameter'],
      resources: [arn('ssm', `parameter${RUN_PARAMETER_PREFIX}${company}/*`)],
    }),
    new iam.PolicyStatement({
      sid: 'SendTheResult',
      actions: ['sqs:SendMessage'],
      resources: [arn('sqs', COPY_QUEUE)],
    }),
    new iam.PolicyStatement({
      sid: 'TheCompanyStoppingPoints',
      actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
      resources: [`${state}/${company}/*`],
    }),
    new iam.PolicyStatement({
      sid: 'ListTheCompanyStoppingPoints',
      actions: ['s3:ListBucket'],
      resources: [state],
      conditions: { StringLike: { 's3:prefix': `${company}/*` } },
    }),
  ]
}

export function writerGrants(
  stack: Stack,
  writer: iam.Role,
  catalogId: string,
  areas: s3tables.CfnNamespace[],
): void {
  const principal = { dataLakePrincipalIdentifier: writer.roleArn }
  for (const area of areas) {
    const id = area.node.id
    const database = area.namespace
    const grants = [
      new lakeformation.CfnPrincipalPermissions(stack, `WriterDescribes${id}`, {
        principal,
        resource: { database: { catalogId, name: database } },
        permissions: ['DESCRIBE'],
        permissionsWithGrantOption: [],
      }),
      new lakeformation.CfnPrincipalPermissions(stack, `WriterWrites${id}`, {
        principal,
        resource: { table: { catalogId, databaseName: database, tableWildcard: {} } },
        permissions: WRITER_GRANTS,
        permissionsWithGrantOption: [],
      }),
    ]
    for (const grant of grants) grant.addResourceDependency(area)
  }
}

import type { Stack, aws_s3tables as s3tables } from 'aws-cdk-lib'
import {
  aws_athena as athena,
  aws_iam as iam,
  aws_lakeformation as lakeformation,
} from 'aws-cdk-lib'
import { catalogChain, TREAT_AREAS, TREAT_CHANGE_ACTIONS, TREAT_READS } from './actions.ts'
import {
  COPY_QUEUE,
  stateBucket,
  TREAT_SPEC_ROOT,
  TREAT_WORKGROUP_SUFFIX,
  TREATER_SUFFIX,
} from './names.ts'
import { companyTaskRole } from './writer.ts'

/**
 * The most a query of the treatment may scan, 10 GiB: a table's `CREATE TABLE AS` reads the whole
 * source table, and the laboratory proof measured about 1.7 KB a row, so the reader's 1 GiB would
 * stop near 600 thousand rows (treatment card, F10).
 */
const TREAT_BYTES_CUTOFF = 10 * 1024 ** 3

/**
 * The treatment task's role, with the list the laboratory proof measured (treatment card,
 * decision 4.2): it reads `current` and changes tables only in `tratado` and `negocio`.
 */
export function treaterRole(stack: Stack, name: string, company: string): iam.Role {
  return companyTaskRole(stack, {
    id: 'Treater',
    roleName: `${name}${TREATER_SUFFIX}`,
    company,
    statements: treaterStatements(stack, name, company),
  })
}

function treaterStatements(stack: Stack, name: string, company: string): iam.PolicyStatement[] {
  function arn(service: string, resource: string): string {
    return `arn:${stack.partition}:${service}:${stack.region}:${stack.account}:${resource}`
  }
  const catalog = `s3tablescatalog/${name}`
  const state = `arn:${stack.partition}:s3:::${stateBucket(stack.account, stack.region)}`
  return [
    new iam.PolicyStatement({
      sid: 'ListTheAccountDatabases',
      actions: ['glue:GetDatabases'],
      resources: [arn('glue', 'catalog')],
    }),
    // Glue asks for each action on the whole chain, so the ancestors carry the change actions too;
    // the database and table resources below keep them inside the treatment's areas.
    new iam.PolicyStatement({
      sid: 'TheCompanyCatalogChain',
      actions: [
        'glue:GetCatalog',
        'glue:GetDatabase',
        'glue:GetTable',
        'glue:GetTables',
        ...TREAT_CHANGE_ACTIONS,
      ],
      resources: catalogChain(name).map((resource) => arn('glue', resource)),
    }),
    new iam.PolicyStatement({
      sid: 'OpenTheTreatedAreas',
      actions: ['glue:GetDatabase', 'glue:GetTable', 'glue:GetTables', ...TREAT_CHANGE_ACTIONS],
      resources: TREAT_AREAS.map((area) => arn('glue', `database/${catalog}/${area}`)),
    }),
    new iam.PolicyStatement({
      sid: 'ChangeTheTreatedTables',
      actions: ['glue:GetTable', 'glue:GetTables', ...TREAT_CHANGE_ACTIONS],
      resources: TREAT_AREAS.map((area) => arn('glue', `table/${catalog}/${area}/*`)),
    }),
    // Without `GetDatabase`, Athena answers a table missing from `current` as access denied.
    new iam.PolicyStatement({
      sid: 'ReadTheCurrentTables',
      actions: ['glue:GetDatabase', 'glue:GetTable'],
      resources: TREAT_READS.flatMap((area) => [
        arn('glue', `database/${catalog}/${area}`),
        arn('glue', `table/${catalog}/${area}/*`),
      ]),
    }),
    new iam.PolicyStatement({ actions: ['lakeformation:GetDataAccess'], resources: ['*'] }),
    new iam.PolicyStatement({
      sid: 'QueryInTheTreatmentWorkGroup',
      actions: ['athena:StartQueryExecution', 'athena:GetQueryExecution', 'athena:GetQueryResults'],
      resources: [arn('athena', `workgroup/${name}${TREAT_WORKGROUP_SUFFIX}`)],
    }),
    new iam.PolicyStatement({
      sid: 'ReadTheCompanyTreatment',
      actions: ['s3:GetObject'],
      resources: [`${state}/${TREAT_SPEC_ROOT}/${company}/*`],
    }),
    new iam.PolicyStatement({
      sid: 'SendTheResult',
      actions: ['sqs:SendMessage'],
      resources: [arn('sqs', COPY_QUEUE)],
    }),
  ]
}

/** The treatment's own workgroup, apart from the reader's and the writer's (treatment card, F10). */
export function treaterWorkGroup(stack: Stack, name: string): void {
  new athena.CfnWorkGroup(stack, 'TreatWorkGroup', {
    name: `${name}${TREAT_WORKGROUP_SUFFIX}`,
    recursiveDeleteOption: true,
    workGroupConfiguration: {
      enforceWorkGroupConfiguration: true,
      publishCloudWatchMetricsEnabled: false,
      bytesScannedCutoffPerQuery: TREAT_BYTES_CUTOFF,
      engineVersion: { selectedEngineVersion: 'AUTO' },
      managedQueryResultsConfiguration: { enabled: true },
    },
  })
}

export function treaterGrants(
  stack: Stack,
  treater: iam.Role,
  catalogId: string,
  areas: Readonly<{ reads: s3tables.CfnNamespace[]; writes: s3tables.CfnNamespace[] }>,
): void {
  const principal = { dataLakePrincipalIdentifier: treater.roleArn }
  function grant(
    id: string,
    area: s3tables.CfnNamespace,
    resource: lakeformation.CfnPrincipalPermissions.ResourceProperty,
    permissions: string[],
  ): void {
    new lakeformation.CfnPrincipalPermissions(stack, id, {
      principal,
      resource,
      permissions,
      permissionsWithGrantOption: [],
    }).addResourceDependency(area)
  }
  for (const area of areas.reads) {
    const [id, name] = [area.node.id, area.namespace]
    grant(`TreaterDescribes${id}`, area, { database: { catalogId, name } }, ['DESCRIBE'])
    const tables = { table: { catalogId, databaseName: name, tableWildcard: {} } }
    grant(`TreaterReads${id}`, area, tables, ['SELECT', 'DESCRIBE'])
  }
  // Whoever creates a table holds `ALL` on it, so the areas it writes grant nothing on tables.
  for (const area of areas.writes) {
    const database = { database: { catalogId, name: area.namespace } }
    grant(`TreaterCreatesIn${area.node.id}`, area, database, ['DESCRIBE', 'CREATE_TABLE'])
  }
}

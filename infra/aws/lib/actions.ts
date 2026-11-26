/** What a company's reader does, and the most the boundary lets a company's role do. */
export const READER_ACTIONS = {
  athena: [
    'athena:StartQueryExecution',
    'athena:GetQueryExecution',
    'athena:GetQueryResults',
    'athena:StopQueryExecution',
    'athena:GetWorkGroup',
  ],
  glue: [
    'glue:GetCatalog',
    'glue:GetCatalogs',
    'glue:GetDatabase',
    'glue:GetDatabases',
    'glue:GetTable',
    'glue:GetTables',
  ],
}

/** What a company's writer does in its own table bucket, through the S3 Tables Iceberg REST endpoint. */
export const WRITER_TABLE_ACTIONS = [
  's3tables:GetTableBucket',
  's3tables:GetNamespace',
  's3tables:ListNamespaces',
  's3tables:ListTables',
  's3tables:GetTable',
  's3tables:CreateTable',
  's3tables:GetTableMetadataLocation',
  's3tables:UpdateTableMetadataLocation',
  's3tables:GetTableData',
  's3tables:PutTableData',
]

export const WRITER_GRANTS = ['SELECT', 'INSERT', 'DELETE', 'DESCRIBE', 'ALTER']

/** The writer's table actions with no `s3tables:namespace` condition key, as the authorization reference lists them. */
export const WRITER_BUCKET_ACTIONS = ['s3tables:GetTableBucket', 's3tables:ListNamespaces']

/**
 * The lake's areas by role. The server's list is `apps/server/src/platform/lake-areas.ts`, and
 * `aws.test.ts` checks the two agree.
 */
export const COPY_AREAS = ['raw', 'current'] as const
export const TREAT_AREAS = ['tratado', 'negocio'] as const
export const TREAT_READS = ['current'] as const

/** What the treatment changes in Glue: dbt drops a table and writes it again with an Athena `CREATE TABLE AS`. */
export const TREAT_CHANGE_ACTIONS = ['glue:CreateTable', 'glue:DeleteTable', 'glue:UpdateTable']

export function catalogChain(bucket: string): string[] {
  return ['catalog', 'catalog/s3tablescatalog', `catalog/s3tablescatalog/${bucket}`]
}

/**
 * What a Glue action that changes a table of these areas names: the table and each of its
 * ancestors, since Glue asks for the action on all of them (AWS Glue guide, "Specifying AWS Glue
 * resource ARNs").
 */
export function changedTableResources(bucket: string, areas: readonly string[]): string[] {
  const child = `s3tablescatalog/${bucket}`
  return [
    ...catalogChain(bucket),
    ...areas.flatMap((area) => [`database/${child}/${area}`, `table/${child}/${area}/*`]),
  ]
}

/** What AWS::Logs::LogGroup's handlers call for one of our groups, with no KMS or delivery. */
export const LOG_GROUP_ACTIONS = [
  'logs:CreateLogGroup',
  'logs:DeleteLogGroup',
  'logs:PutRetentionPolicy',
  'logs:TagResource',
  'logs:UntagResource',
  'logs:ListTagsForResource',
  'logs:GetDataProtectionPolicy',
  'logs:DescribeIndexPolicies',
]

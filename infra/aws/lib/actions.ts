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

export const AREAS = ['raw', 'current'] as const

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

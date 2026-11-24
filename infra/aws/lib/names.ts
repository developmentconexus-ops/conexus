// The platform's one owner of the names the Hub also uses (C26). The server never imports from
// infra/: platform/aws.ts repeats these and its test checks them against lake.template.json.

/** A company's lake stack: conexus-lago-<lakeId>. */
export const STACK_PREFIX = 'conexus-lago-'
/** A company's table bucket and Athena workgroup: conexus-<lakeId>. */
export const BUCKET_PREFIX = 'conexus-'
/** A company's reader role: conexus-<lakeId>-leitor. */
export const READER_SUFFIX = '-leitor'
/** A company's writer role, which the copy task runs as: conexus-<lakeId>-escritor. */
export const WRITER_SUFFIX = '-escritor'
/** The company, on the Hub's session, the stack and the table bucket. */
export const TAG_COMPANY = 'conexus-empresa'
/** Only on a reader's session, from step 3. */
export const TAG_READER = 'conexus-leitor'
/**
 * The template version, on the stack; only the Hub sets it.
 * @public
 */
export const TAG_TEMPLATE = 'conexus-modelo'
/** lago/<sha-256>.json in the templates bucket. */
export const TEMPLATE_PREFIX = 'lago/'

/** The stacks' CloudFormation names. */
export const PREPARATION_STACK = 'conexus-preparacao'
export const PLATFORM_STACK = 'conexus-plataforma'

export const HUB_ROLE = 'conexus-hub'
export const SERVICE_ROLE = 'conexus-cfn'
export const RELEASE_ROLE = 'conexus-release'
export const COPY_EXECUTION_ROLE = 'conexus-copia-execucao'
export const PLATFORM_ROLES = [HUB_ROLE, SERVICE_ROLE, RELEASE_ROLE, COPY_EXECUTION_ROLE] as const
export const BOUNDARY = 'conexus-limite'
export const HUB_KEY_USER = 'conexus-hub-chave'
export const CDK_EXECUTION_POLICY = 'conexus-cdk-execucao'
/** The copy platform's half of the CDK execution, apart because one managed policy holds 6,144 characters. */
export const CDK_COPY_EXECUTION_POLICY = 'conexus-cdk-execucao-copia'
export const LAKE_FORMATION_ROLE = 'conexus-lf-s3tables'
/** The role of the function that registers the table buckets and creates their catalog. */
export const TABLES_CATALOG_ROLE = 'conexus-s3tables-catalogo'
/** That function's log group, which the platform stack owns and deletes. */
export const TABLES_CATALOG_LOGS = `${PLATFORM_STACK}-catalogo`

export const COPY_CLUSTER = 'conexus-copia'
export const COPY_TASK_FAMILY = 'conexus-copia'
export const COPY_REPOSITORY = 'conexus-copia'
export const COPY_QUEUE = 'conexus-copia-fim'
export const COPY_DEAD_LETTERS = 'conexus-copia-fim-mortos'
/** A round's parameter: /conexus/copia/<companyId>/<runId>. */
export const RUN_PARAMETER_PREFIX = '/conexus/copia/'
/** The copy task's log group, which the platform stack owns. */
export const COPY_LOGS = `${PLATFORM_STACK}-copia`

/** The bucket of the copies' stopping points, with one prefix per company (T.1); U10 creates it. */
export function stateBucket(account: string, region: string): string {
  return `conexus-estado-${account}-${region}`
}

/** The templates bucket, one per account and region, in the region of the stacks. */
export function templateBucket(account: string, region: string): string {
  return `conexus-receitas-${account}-${region}`
}

/**
 * The one form of a template's address, with the bucket first as AWS's own example and
 * ParallelCluster build it: the Hub sends `templateUrl` as `TemplateURL`, and the Hub role's policy
 * matches `cloudformation:TemplateUrl` against `templateUrlPattern`. The key compares the request's
 * text, so the path form of the same object is refused.
 */
export function templateUrl(bucket: string, region: string, version: string): string {
  return `${templateFolder(bucket, region)}${version}.json`
}

export function templateUrlPattern(bucket: string, region: string): string {
  return `${templateFolder(bucket, region)}*`
}

function templateFolder(bucket: string, region: string): string {
  return `https://${bucket}.s3.${region}.amazonaws.com/${TEMPLATE_PREFIX}`
}

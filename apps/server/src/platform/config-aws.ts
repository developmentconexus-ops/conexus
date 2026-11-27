import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { z } from 'zod'
import { Failure } from './failure.ts'
import { readSecretFile } from './secret-file.ts'

export const AwsAccount = z
  .string()
  .regex(/^[0-9]{12}$/)
  .brand('AwsAccount')
export type AwsAccount = z.infer<typeof AwsAccount>
export const AwsRegion = z
  .string()
  .regex(/^[a-z]{2}-[a-z]+-[0-9]$/)
  .brand('AwsRegion')
export type AwsRegion = z.infer<typeof AwsRegion>
/** The sha-256 of the lake's template: its name in the templates bucket and the stack's `conexus-modelo`. */
export const TemplateVersion = z
  .string()
  .regex(/^[0-9a-f]{64}$/)
  .brand('TemplateVersion')
export type TemplateVersion = z.infer<typeof TemplateVersion>

const RoleArn = z.string().regex(/^arn:aws:iam::[0-9]{12}:role\/[\w+=,.@-]{1,64}$/)
const BucketName = z.string().regex(/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/)
/** AWS's own address in production; a double only on this machine, for tests and QA (S36, card L.17). */
const AwsEndpoint = z.string().refine((value) => {
  const url = URL.parse(value)
  return url?.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname)
})

const SecurityGroupId = z.string().regex(/^sg-[0-9a-f]{8,17}$/)
const SubnetId = z.string().regex(/^subnet-[0-9a-f]{8,17}$/)
const ClusterArn = z.string().regex(/^arn:aws:ecs:[a-z0-9-]+:[0-9]{12}:cluster\/[\w-]{1,255}$/)
const QueueUrl = z.url().refine((value) => URL.parse(value)?.pathname.split('/').length === 3)

/** The platform stack's outputs the Hub starts a copy with: `CopyClusterArn`, `CopyTaskFamily`, `CopySubnets`, `CopySecurityGroup`, `CopyQueueUrl`. */
type CopyPlatformConfig = Readonly<{
  clusterArn: string
  taskFamily: string
  subnets: readonly [string, ...string[]]
  securityGroup: string
  queueUrl: string
}>

export type AwsConfig = Readonly<{
  account: AwsAccount
  region: AwsRegion
  hubRoleArn: string
  serviceRoleArn: string
  templateBucket: string
  /** The SDK's shared credentials file with the base key: the Hub only checks its mode and that it is not empty, the SDK reads the key (S31). */
  credentialsFile: string
  templateVersion: TemplateVersion
  /** The recipes whose lakes have `tratado` and `negocio`: this image's and `TREATABLE_BEFORE` (card F15). */
  treatable: ReadonlySet<TemplateVersion>
  copy: CopyPlatformConfig
  endpoint?: string
}>

export const AwsEnvironment = z.object({
  HUB_AWS_ACCOUNT: AwsAccount,
  HUB_AWS_REGION: AwsRegion,
  HUB_AWS_HUB_ROLE_ARN: RoleArn,
  HUB_AWS_SERVICE_ROLE_ARN: RoleArn,
  HUB_AWS_TEMPLATE_BUCKET: BucketName,
  HUB_AWS_COPY_CLUSTER_ARN: ClusterArn,
  HUB_AWS_COPY_TASK_FAMILY: z.string().regex(/^[\w-]{1,255}$/),
  HUB_AWS_COPY_SUBNETS: z
    .string()
    .transform((value) => value.split(','))
    .pipe(z.tuple([SubnetId], SubnetId)),
  HUB_AWS_COPY_SECURITY_GROUP: SecurityGroupId,
  HUB_AWS_COPY_QUEUE_URL: QueueUrl,
  AWS_SHARED_CREDENTIALS_FILE: z.string().startsWith('/'),
  HUB_AWS_ENDPOINT: AwsEndpoint.optional(),
})

/** The default chain reads these before the file, so the Hub refuses to start with any of them (S31, L.18). */
const KEY_VARIABLES = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_SESSION_TOKEN',
  'AWS_PROFILE',
] as const

/** The template in the image, beside the server: `infra/aws/lake.template.json` (hub.Dockerfile). */
export const LAKE_TEMPLATE = new URL('../../../../infra/aws/lake.template.json', import.meta.url)

/**
 * The recipes before this image's whose lakes already have `tratado` and `negocio`: whoever changes
 * `lake.template.json` adds the old sha-256 here, so a lake of it still treats (card F15).
 */
const TREATABLE_BEFORE: readonly TemplateVersion[] = [
  'a63dcd7263a23c9444ad0b07de74bf0655cf6c86da2789257b3140e33180393d',
].map((sha) => TemplateVersion.parse(sha))

export function treatableWith(version: TemplateVersion): ReadonlySet<TemplateVersion> {
  return new Set([version, ...TREATABLE_BEFORE])
}

function templateVersionOf(template: URL): TemplateVersion {
  try {
    return TemplateVersion.parse(createHash('sha256').update(readFileSync(template)).digest('hex'))
  } catch (cause) {
    throw new Failure('CONFIG_INVALID', {
      details: { variables: 'infra/aws/lake.template.json' },
      cause,
    })
  }
}

export function awsConfigOf(
  serve: z.output<typeof AwsEnvironment>,
  env: NodeJS.ProcessEnv,
  /** The lake's template; a test names another to see the Hub refuse to start (criterion 38). */
  template = LAKE_TEMPLATE,
): AwsConfig {
  const present = KEY_VARIABLES.filter((name) => env[name] !== undefined)
  if (present.length > 0) {
    throw new Failure('CONFIG_INVALID', {
      details: { variables: present.join(','), reason: 'the AWS key only by file' },
    })
  }
  readSecretFile('AWS_SHARED_CREDENTIALS_FILE', serve.AWS_SHARED_CREDENTIALS_FILE)
  const version = templateVersionOf(template)
  return {
    account: serve.HUB_AWS_ACCOUNT,
    region: serve.HUB_AWS_REGION,
    hubRoleArn: serve.HUB_AWS_HUB_ROLE_ARN,
    serviceRoleArn: serve.HUB_AWS_SERVICE_ROLE_ARN,
    templateBucket: serve.HUB_AWS_TEMPLATE_BUCKET,
    credentialsFile: serve.AWS_SHARED_CREDENTIALS_FILE,
    templateVersion: version,
    treatable: treatableWith(version),
    copy: {
      clusterArn: serve.HUB_AWS_COPY_CLUSTER_ARN,
      taskFamily: serve.HUB_AWS_COPY_TASK_FAMILY,
      subnets: serve.HUB_AWS_COPY_SUBNETS,
      securityGroup: serve.HUB_AWS_COPY_SECURITY_GROUP,
      queueUrl: serve.HUB_AWS_COPY_QUEUE_URL,
    },
    ...(serve.HUB_AWS_ENDPOINT === undefined ? {} : { endpoint: serve.HUB_AWS_ENDPOINT }),
  }
}

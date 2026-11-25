import { z } from 'zod'

export const LakeId = z
  .string()
  .regex(/^[a-z0-9]{12}$/)
  .brand('LakeId')
export type LakeId = z.infer<typeof LakeId>
export const StackId = z.string().startsWith('arn:aws:cloudformation:').brand('StackId')
export type StackId = z.infer<typeof StackId>
/** A stack by its name, which CloudFormation resolves for a stack that still exists (`stackName`). */
export const StackName = z.string().startsWith('conexus-lago-').brand('StackName')
export type StackName = z.infer<typeof StackName>

// The names infra/aws/lib/names.ts owns on the platform's side (C26); aws.test.ts checks them
// against lake.template.json, the Hub role's pattern and names.ts itself.
const STACK_PREFIX = 'conexus-lago-'
const BUCKET_PREFIX = 'conexus-'
const TEMPLATE_PREFIX = 'lago/'
export const TAG_COMPANY = 'conexus-empresa'
export const TAG_TEMPLATE = 'conexus-modelo'
export const BUCKET_TYPE = 'AWS::S3Tables::TableBucket'
/** A round's parameter: /conexus/copia/<companyId>/<runId>. */
export const RUN_PARAMETER_PREFIX = '/conexus/copia/'
/** The container of the copy task definition, which a round's overrides name. */
export const COPY_CONTAINER = 'copia'
/** The variable that carries the round's parameter name to the task (the parameter holds the secret, S31). */
export const RUN_PARAMETER_VARIABLE = 'CONEXUS_RUN_PARAMETER'

const WRITER_SUFFIX = '-escritor'

/** The parameter of one round of a company, which the round's task reads and the end deletes. */
export function runParameterName(company: string, run: string): string {
  return `${RUN_PARAMETER_PREFIX}${company}/${run}`
}

/** The lake's writer role, which the copy task runs as (`infra/aws/lib/names.ts` `WRITER_SUFFIX`). */
export function writerRoleArn(account: string, lake: LakeId): string {
  return `arn:aws:iam::${account}:role/${BUCKET_PREFIX}${lake}${WRITER_SUFFIX}`
}

export function stackName(lake: LakeId): string {
  return `${STACK_PREFIX}${lake}`
}

/** The lake's table bucket, as the template names it and the screen shows it. */
export function bucketName(lake: LakeId): string {
  return `${BUCKET_PREFIX}${lake}`
}

/** The one form of a template's address, the bucket first, as the Hub role's policy matches it. */
export function templateUrl(bucket: string, region: string, version: string): string {
  return `https://${bucket}.s3.${region}.amazonaws.com/${TEMPLATE_PREFIX}${version}.json`
}

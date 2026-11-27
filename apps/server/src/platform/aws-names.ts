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

// The names infra/aws/lib/names.ts owns on the platform's side (C26); aws.test.ts and
// aws-names.test.ts check them against lake.template.json, the Hub role's pattern and names.ts.
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
/** The variable that carries a treatment round's specification object to the task. */
export const TREAT_OBJECT_VARIABLE = 'CONEXUS_TREAT_OBJECT'
/** The root of the treatment rounds' specifications in the state bucket (`infra/aws/lib/names.ts` `TREAT_SPEC_ROOT`). */
const TREAT_SPEC_ROOT = 'tratamento'

const WRITER_SUFFIX = '-escritor'
const TREATER_SUFFIX = '-tratador'
const STATE_BUCKET_PREFIX = 'conexus-estado-'
/** The id Meltano gives the copy's one pipeline: the environment, the tap and the target (`meltano run`). */
const STATE_ID = 'copia:tap-conexus-to-target-conexus'

/** The parameter of one round of a company, which the round's task reads and the end deletes. */
export function runParameterName(company: string, run: string): string {
  return `${RUN_PARAMETER_PREFIX}${company}/${run}`
}

/** The lake's writer role, which the copy task runs as (`infra/aws/lib/names.ts` `WRITER_SUFFIX`). */
export function writerRoleArn(account: string, lake: LakeId): string {
  return `arn:aws:iam::${account}:role/${BUCKET_PREFIX}${lake}${WRITER_SUFFIX}`
}

/** The lake's treatment role, which a treatment round runs as (`infra/aws/lib/names.ts` `TREATER_SUFFIX`). */
export function treaterRoleArn(account: string, lake: LakeId): string {
  return `arn:aws:iam::${account}:role/${BUCKET_PREFIX}${lake}${TREATER_SUFFIX}`
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

/** The bucket of the copies' stopping points, as `infra/aws/lib/names.ts` `stateBucket` names it. */
export function stateBucketName(account: string, region: string): string {
  return `${STATE_BUCKET_PREFIX}${account}-${region}`
}

/** A treatment round's specification, outside the `<company>/` prefix the writer writes and deletes (decision 4.2, fix 4). */
export function treatSpecKey(company: string, run: string, attempt: number): string {
  return `${TREAT_SPEC_ROOT}/${company}/${run}-${attempt}.json`
}

/** The connection's state file, where the task's Meltano keeps it: `<company>/<connection>/<state id>/state.json`. */
export function stateKey(company: string, connection: string): string {
  return `${company}/${connection}/${STATE_ID}/state.json`
}

import { writeFileSync } from 'node:fs'
import { CompanyId, LakeTableName } from '@conexus/hub-api'
import { z } from 'zod'
import { AwsRegion } from '../../platform/config-aws.ts'
import { LakeArea } from '../../platform/lake-areas.ts'
import { taskOutcome } from '../../platform/task-outcome.ts'

const TreatmentRunId = z.uuid().brand('TreatmentRunId')

const ModelName = z
  .string()
  .regex(/^(tratado|negocio)__[a-z][a-z0-9_]{0,59}$/)
  .brand('ModelName')

/** A person's SQL that dbt would not read as a template. A regex, so the JSON Schema carries it and the task refuses it too. */
const NoTemplate = /^(?![\s\S]*\{[{%#])[\s\S]+$/

const TreatModel = z.object({
  name: ModelName,
  layer: LakeArea.extract(['tratado', 'negocio']),
  table: LakeTableName,
  sql: z.string().max(20_000).regex(NoTemplate),
  after: z.array(ModelName),
})

export const TreatTaskSpec = z
  .object({
    version: z.literal(1),
    runId: TreatmentRunId,
    attempt: z.int().min(1),
    companyId: CompanyId,
    lake: z.object({ bucketArn: z.string(), region: AwsRegion }),
    queueUrl: z.url(),
    models: z.array(TreatModel).min(1).max(200),
    select: z.array(ModelName).min(1),
  })
  .superRefine(({ models, select }, context) => {
    const names = new Set(models.map((model) => model.name))
    function refuse(field: 'models' | 'select', message: string) {
      context.addIssue({ code: 'custom', path: [field], message })
    }
    if (names.size < models.length) refuse('models', 'a model name repeats')
    if (models.some((model) => model.after.some((name) => !names.has(name))))
      refuse('models', 'after names a model outside models')
    if (select.some((name) => !names.has(name)))
      refuse('select', 'select names a model outside models')
  })
export type TreatTaskSpec = z.infer<typeof TreatTaskSpec>

/** A code only: Athena's sentence may carry a cell's value, and the result must not. */
const TreatFailureCode = z.string().regex(/^[A-Z][A-Z_]{2,63}$/)

export const TreatTaskResult = z.object({
  type: z.literal('TREAT_RESULT'),
  version: z.literal(1),
  runId: TreatmentRunId,
  attempt: z.int().min(1),
  outcome: taskOutcome({ code: z.enum(['TREAT_SPEC_INVALID', 'TREAT_ENGINE_FAILED']) }),
  models: z.array(
    z.discriminatedUnion('status', [
      z.object({ name: ModelName, status: z.literal('BUILT'), rows: z.int().min(0) }),
      z.object({
        name: ModelName,
        status: z.literal('FAILED'),
        failure: TreatFailureCode,
        /** The line of the person's SQL; null when the error names none inside it. */
        line: z.int().min(1).nullable(),
      }),
      z.object({ name: ModelName, status: z.literal('SKIPPED') }),
    ]),
  ),
})
export type TreatTaskResult = z.infer<typeof TreatTaskResult>

export const TREAT_TASK_SCHEMA = new URL(
  '../../../../extraction/contract/treat-task.schema.json',
  import.meta.url,
)

export function treatTaskSchema() {
  return { spec: z.toJSONSchema(TreatTaskSpec), result: z.toJSONSchema(TreatTaskResult) }
}

if (import.meta.main)
  writeFileSync(TREAT_TASK_SCHEMA, `${JSON.stringify(treatTaskSchema(), null, 2)}\n`)

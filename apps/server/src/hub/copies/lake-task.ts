import { writeFileSync } from 'node:fs'
import {
  CompanyId,
  ConnectionId,
  ConnectorId,
  LakeRunFailureCode,
  LakeRunId,
  LakeRunMachine,
  LakeTableName,
  SourceTableId,
  SystemMessage,
} from '@conexus/hub-api'
import { z } from 'zod'
import { AwsRegion } from '../../platform/config-aws.ts'
import { AccountRef } from '../connectors/public.ts'

export const CopyTaskSpec = z.object({
  version: z.literal(1),
  runId: LakeRunId,
  attempt: z.int().min(1),
  companyId: CompanyId,
  connector: ConnectorId,
  connectionId: ConnectionId,
  account: AccountRef.nullable(),
  startDate: z.iso.date().nullable(),
  credential: z.record(z.string(), z.string()),
  /** `whole`: the Hub asks the table read from the start. */
  tables: z
    .array(z.object({ source: SourceTableId, name: LakeTableName, whole: z.boolean() }))
    .min(1),
  lake: z.object({ bucketArn: z.string(), region: AwsRegion }),
  queueUrl: z.url(),
})
export type CopyTaskSpec = z.infer<typeof CopyTaskSpec>

/** The one message the task sends to the queue at the end of its round; never a row's content. */
export const CopyTaskResult = z.object({
  type: z.literal('RESULT'),
  version: z.literal(1),
  runId: LakeRunId,
  attempt: z.int().min(1),
  outcome: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('COMPLETE') }),
    z.object({
      kind: z.literal('ERROR'),
      code: LakeRunFailureCode,
      table: LakeTableName.nullable(),
      system: SystemMessage.nullable(),
    }),
  ]),
  tables: z.array(
    z.object({
      name: LakeTableName,
      read: z.int().min(0),
      written: z.int().min(0),
      /** The cells written rounded to the column's scale: a value with more places than it declares or than 9 (0083). */
      rounded: z.int().min(0),
      rows: z.int().min(0).nullable(),
      whole: z.boolean(),
    }),
  ),
  machine: LakeRunMachine.nullable().optional(),
})
export type CopyTaskResult = z.infer<typeof CopyTaskResult>

export const COPY_TASK_SCHEMA = new URL(
  '../../../../extraction/contract/copy-task.schema.json',
  import.meta.url,
)

export function copyTaskSchema() {
  return { spec: z.toJSONSchema(CopyTaskSpec), result: z.toJSONSchema(CopyTaskResult) }
}

if (import.meta.main)
  writeFileSync(COPY_TASK_SCHEMA, `${JSON.stringify(copyTaskSchema(), null, 2)}\n`)

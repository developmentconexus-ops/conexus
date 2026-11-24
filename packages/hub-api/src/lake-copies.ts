import { z } from 'zod'

export const LAKE_TABLE_NAME_PATTERN = /^[a-z][a-z0-9_]{0,59}$/
export const SOURCE_TABLE_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,59}$/

export const LakeRunId = z.uuid().brand('LakeRunId')
export type LakeRunId = z.infer<typeof LakeRunId>
export const LakeTableId = z.uuid().brand('LakeTableId')
export type LakeTableId = z.infer<typeof LakeTableId>
export const LakeTableName = z.string().regex(LAKE_TABLE_NAME_PATTERN).brand('LakeTableName')
export type LakeTableName = z.infer<typeof LakeTableName>
export const SourceTableId = z.string().regex(SOURCE_TABLE_ID_PATTERN).brand('SourceTableId')
export type SourceTableId = z.infer<typeof SourceTableId>

export const LAKE_INTERVALS = ['15m', '30m', '1h', '2h', '6h', '24h', 'MANUAL'] as const
export const LakeInterval = z.enum(LAKE_INTERVALS)
export type LakeInterval = z.infer<typeof LakeInterval>
/** Founder, 2026-11-23: "24 h, como a Nekt". */
export const LAKE_INTERVAL_DEFAULT = '24h' satisfies LakeInterval

export const LAKE_RUN_FAILURE_CODES = [
  'COPY_SOURCE_NEEDS_REAUTH',
  'COPY_SOURCE_REFUSED',
  'COPY_SOURCE_UNREACHABLE',
  'COPY_SOURCE_UNREADABLE',
  'COPY_LAKE_UNAVAILABLE',
  'COPY_TASK_LOST',
  'COPY_LAKE_WRITE_FAILED',
] as const
export const LakeRunFailureCode = z.enum(LAKE_RUN_FAILURE_CODES)
export type LakeRunFailureCode = z.infer<typeof LakeRunFailureCode>

export const SYSTEM_CODE_MAX = 64
export const SYSTEM_MESSAGE_MAX = 1000

export const SystemMessage = z.object({
  status: z.int(),
  code: z.string().max(SYSTEM_CODE_MAX).nullable(),
  message: z.string().max(SYSTEM_MESSAGE_MAX).nullable(),
})
export type SystemMessage = z.infer<typeof SystemMessage>

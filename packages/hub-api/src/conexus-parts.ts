import { z } from 'zod'
import type { FailureCode } from './failures.ts'
import { FAILURES } from './failures.ts'

/** The part of a message that says a thinking took `seconds`, by our clock (step 12.1). */
export const THOUGHT_PART = 'data-conexus-thought'

/** A name of a part of ours, which Mastra keeps in the message as a `data-*` part (step 14.0). */
export const CONEXUS_PARTS = [
  'data-conexus-machine',
  'data-conexus-version',
  'data-conexus-failure',
  'data-conexus-notice',
  'data-conexus-thought',
] as const

/**
 * Whether a saved version's app built (card of step 14): its check at the end of the turn passed,
 * failed the last time the turn could try, or could not run on the machine (founder, 2026-10-22,
 * the words of `CHECK_PLATFORM_FAILED`); or the turn ended with `open` tasks still open the last
 * time it could try, the version saved half done (card of step 14.2, criterion 15).
 */
export const VersionCheck = z.discriminatedUnion('state', [
  z.object({ state: z.literal('passed') }),
  z.object({ state: z.literal('unfinished'), open: z.int().positive() }),
  z.object({ state: z.literal('failed'), code: z.literal('APP_CHECK_FAILED') }),
  z.object({ state: z.literal('unchecked'), code: z.literal('CHECK_PLATFORM_FAILED') }),
])
export type VersionCheck = z.infer<typeof VersionCheck>

/** The steps of the machine a turn waits on, each told as a `data-conexus-machine` part. */
export const MachinePhase = z.enum(['starting', 'copying', 'saving'])
export type MachinePhase = z.infer<typeof MachinePhase>

/** What each part of ours carries in its `data`, one schema per name in `CONEXUS_PARTS`. */
export const MachineData = z.object({ phase: MachinePhase })
export type MachineData = z.infer<typeof MachineData>

export const VersionData = z.object({
  number: z.number(),
  files: z.number(),
  changed: z.boolean(),
  changedFiles: z.number(),
  check: VersionCheck.optional(),
})
export type VersionData = z.infer<typeof VersionData>

export const FailureData = z.object({
  code: z.string().refine((code): code is FailureCode => Object.hasOwn(FAILURES, code)),
  /** The person its phrase names, where the row has `{person}` (`RUN_BUSY`). */
  person: z.string().optional(),
})
export type FailureData = z.infer<typeof FailureData>

export const NoticeData = z.object({ text: z.string() })
export type NoticeData = z.infer<typeof NoticeData>

export const ThoughtData = z.object({ id: z.string(), seconds: z.number() })
export type ThoughtData = z.infer<typeof ThoughtData>

/** A part of ours with its payload, one variant per name in `CONEXUS_PARTS` (code C21). */
export const ConexusPart = z.discriminatedUnion('type', [
  z.object({ type: z.literal('data-conexus-machine'), data: MachineData }),
  z.object({ type: z.literal('data-conexus-version'), data: VersionData }),
  z.object({ type: z.literal('data-conexus-failure'), data: FailureData }),
  z.object({ type: z.literal('data-conexus-notice'), data: NoticeData }),
  z.object({ type: z.literal('data-conexus-thought'), data: ThoughtData }),
])
export type ConexusPart = z.infer<typeof ConexusPart>

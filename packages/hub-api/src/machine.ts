import { z } from 'zod'
import type { FailureCode } from './failures.ts'

/** The tools of a conversation's machine that every conversation with one shares, by name (step 24.4, U1). */
export const MACHINE_TOOL = {
  showFile: 'show_file',
  /** The program an agent with its Computador writes over its tools (step 24.4, U5): Mastra's own id. */
  codeMode: 'execute_typescript',
} as const

/** The most a text file shown beside the chat carries in its output: a larger one is a file to download. */
export const SHOWN_TEXT_MAX = 65_536

export const ShowFileInput = z.object({ path: z.string().min(1).max(500) })

/** What `show_file` answers the screen: the text to read, a file to download, or why nothing is shown. */
export const ShownFile = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('TEXT'),
    path: z.string(),
    name: z.string(),
    media: z.enum(['text/markdown', 'text/plain', 'text/csv']),
    content: z.string().max(SHOWN_TEXT_MAX),
  }),
  z.object({
    kind: z.literal('FILE'),
    path: z.string(),
    name: z.string(),
    media: z.string(),
    bytes: z.number().int().nonnegative(),
  }),
  z.object({
    kind: z.literal('SHOW_REFUSED'),
    reason: z.enum(['OUTSIDE', 'NOT_FOUND', 'MACHINE_UNAVAILABLE']),
  }),
])
export type ShownFile = z.infer<typeof ShownFile>

/** The query of a conversation's file route: the file's path on the machine. */
export const MachineFileQuery = z.object({ path: z.string().min(1).max(500) })

/** What a conversation's file route answers when the machine's file cannot be read. */
export const MACHINE_FILE_FAILURES = [
  'FILE_NOT_FOUND',
  'FILE_TOO_LARGE',
  'FILE_GONE',
  'MACHINE_UNAVAILABLE',
] as const satisfies readonly FailureCode[]

import { z } from 'zod'

/** The longest title or query a tool's subject keeps, in characters. */
export const SUBJECT_MAX_LENGTH = 200
export const Subject = z.string().max(SUBJECT_MAX_LENGTH)

/**
 * How much of a tool call a `tool` part's `detail` keeps, each limit with its basis (card of step
 * 14, U6): the command as its subject keeps it; the output's last lines and bytes, the limits of the
 * `shell` part this detail replaced (step 13); the start of a written file and of each side of an
 * edit, as the card sets them.
 */
export const DETAIL_LIMITS = {
  command: SUBJECT_MAX_LENGTH,
  outputLines: 20,
  outputBytes: 4096,
  fileCharacters: 2000,
  editLines: 200,
} as const

const Lines = z.string().refine((text) => text.split('\n').length <= DETAIL_LIMITS.editLines)

/**
 * What a tool row opens on: a command and the end of its output, with its exit
 * code once it ended; the start of a written file; the two sides of an edit, which the screen
 * compares. `cut` says the server kept less than there was, so the screen ends it with "…".
 */
export const ToolDetail = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('command'),
    command: Subject,
    output: z.array(z.string()).max(DETAIL_LIMITS.outputLines),
    exitCode: z.int().nullable(),
    cut: z.boolean(),
  }),
  z.object({
    kind: z.literal('file'),
    path: Subject,
    content: z.string().max(DETAIL_LIMITS.fileCharacters),
    cut: z.boolean(),
  }),
  z.object({
    kind: z.literal('edit'),
    path: Subject,
    before: Lines,
    after: Lines,
    cut: z.boolean(),
  }),
])
export type ToolDetail = z.infer<typeof ToolDetail>

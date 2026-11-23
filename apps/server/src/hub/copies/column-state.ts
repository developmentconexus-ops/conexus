import { z } from 'zod'

export const ColumnState = z.record(
  z.string(),
  z.object({ seenAt: z.iso.datetime(), inactiveSince: z.iso.datetime().nullable() }),
)
export type ColumnState = z.infer<typeof ColumnState>

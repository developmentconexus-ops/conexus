import { z } from 'zod'

/**
 * What a connection read answers the screen, as Mastra stored it: the cut the model read, never the
 * whole answer. `value` is a list in `linhas` or something else; `complete` is false when the cut
 * took rows or text away; `empty` is the provider's own word that nothing matched; `at` is when it came back.
 */
export const ReadCut = z.object({
  kind: z.literal('OK'),
  value: z.unknown().optional(),
  complete: z.boolean().optional(),
  empty: z.boolean().optional(),
  at: z.iso.datetime({ offset: true }).optional(),
})
export type ReadCut = z.infer<typeof ReadCut>

/** The header the browser sends its time zone in, and the key the Hub's guard keeps the valid one under in the run's request context. */
export const READER_ZONE_HEADER = 'x-reader-zone'
export const READER_ZONE = 'readerZone'

type Known = { kind: 'KNOWN' } | { kind: 'UNKNOWN'; cause: unknown }

function known(zone: string): Known {
  try {
    new Intl.DateTimeFormat('en', { timeZone: zone })
    return { kind: 'KNOWN' }
  } catch (cause) {
    return { kind: 'UNKNOWN', cause }
  }
}

/** An IANA zone name the runtime knows ("America/Sao_Paulo"); anything else is no zone. */
export const ReaderZone = z.string().refine((zone) => known(zone).kind === 'KNOWN')

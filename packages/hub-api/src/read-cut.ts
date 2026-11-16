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
  at: z.iso.datetime().optional(),
})
export type ReadCut = z.infer<typeof ReadCut>

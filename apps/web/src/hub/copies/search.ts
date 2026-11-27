import { z } from 'zod'

/** The layer of the Dados page, a value of the address (web W18). */
export const DataLayer = z.enum(['raw', 'treated', 'business', 'apps'])
export type DataLayer = z.infer<typeof DataLayer>

export const DataSearch = z.object({
  layer: DataLayer.optional().catch(undefined),
})

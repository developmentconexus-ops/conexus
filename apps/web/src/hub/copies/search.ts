import { z } from 'zod'

/** The layer of the Dados page, a value of the address (web W18). */
export const DataLayer = z.enum(['raw', 'business', 'apps'])
export type DataLayer = z.infer<typeof DataLayer>

export const DataSearch = z.object({
  layer: DataLayer.optional().catch(undefined),
  q: z.string().optional().catch(undefined),
})

export const TableTab = z.enum(['overview', 'columns', 'sample', 'runs'])
export type TableTab = z.infer<typeof TableTab>

/** The tab of a table's page and the page of its runs, both in the address (web W18). */
export const TableSearch = z.object({
  tab: TableTab.optional().catch(undefined),
  page: z.string().optional().catch(undefined),
  q: z.string().optional().catch(undefined),
})

/** A text as the search compares it: no accent, no case. */
export function folded(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
}

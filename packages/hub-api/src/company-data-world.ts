import type { CompanyData, DataSources } from './company-data.ts'

type Gave<K extends 'live' | 'funnel'> = Awaited<ReturnType<DataSources[K]>>

/** A fake connector behind the data track's sources, what each call reached and what each source answered. */
export type DataWorld = Readonly<{
  sources: DataSources
  /** The contract as the implementation binds it over `sources`, with its record of reads; the laws bind `sources` alone when absent. */
  data?: CompanyData
  /** The rows the record of reads kept, oldest first. */
  reads(): Promise<readonly Readonly<Record<string, unknown>>[]>
  /** The record of reads stops writing, until the world is made again. */
  failRecord(): void | Promise<void>
  reached: Readonly<{
    live: unknown[]
    funnel: unknown[]
    signals: (AbortSignal | undefined)[]
  }>
  gave: Readonly<{
    live: Gave<'live'>[]
    funnel: Gave<'funnel'>[]
  }>
  /**
   * The input the world's systems accept for a read, as their connectors declare it: the live laws
   * read with it, so a refusal of the input never stands in for a live read.
   */
  liveInput: unknown
  /** The Hub's database stops answering, until the world is made again. */
  down(): void
}>

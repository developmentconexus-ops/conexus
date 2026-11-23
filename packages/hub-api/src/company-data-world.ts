import type { CompanyData, DataSources } from './company-data.ts'

type Gave<K extends 'rows' | 'live' | 'funnel' | 'query'> = Awaited<ReturnType<DataSources[K]>>

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
    rows: string[]
    funnel: unknown[]
    query: string[]
    signals: (AbortSignal | undefined)[]
  }>
  gave: Readonly<{
    rows: Gave<'rows'>[]
    live: Gave<'live'>[]
    funnel: Gave<'funnel'>[]
    query: Gave<'query'>[]
  }>
  /** The queries the world knows how to answer, written for the tables of its catalog. */
  queries: Readonly<{
    /** Reads a table of the catalog and brings at least one row. */
    reads: string
    /** Reads a table the source reads and the catalog does not list. */
    outside: string
    /** The database refuses it. */
    refused: string
  }>
  /**
   * Inputs the world's systems accept, as their connectors declare them: the live laws read with
   * these, so a refusal of the input never stands in for a live read.
   */
  inputs: Readonly<{
    /** For the read no copy serves. */
    live: unknown
    /** For the read a copy keeps, each one other than the input the copy fixes. */
    another: readonly unknown[]
  }>
  /** A table the world's sources keep and its catalog does not name, and a query only it answers. */
  hidden: Readonly<{ table: string; query: string }>
  /** The Hub's database or whoever keeps the tables stops answering, until the world is made again. */
  down(part: 'catalog' | 'rows' | 'query'): void
}>

import type { DataSources } from './company-data.ts'

type Gave<K extends 'rows' | 'live' | 'funnel' | 'query'> = Awaited<ReturnType<DataSources[K]>>

/** A fake connector behind the data track's sources, what each call reached and what each source answered. */
export type DataWorld = Readonly<{
  sources: DataSources
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
  /** A table the world's catalog puts in `withheld`, and a query only it answers. */
  withheld: Readonly<{ table: string; query: string }>
  /** The Hub's database or whoever keeps the tables stops answering, until the world is made again. */
  down(part: 'catalog' | 'rows' | 'query'): void
}>

import { readFile, writeFile } from 'node:fs/promises'
import { setTimeout as sleep } from 'node:timers/promises'
import { parseArgs } from 'node:util'
import type { Connector, TableColumn, TableReach, TableReadFailed } from '@conexus/connectors'
import {
  AccountRef,
  connectorOf,
  discoverTables,
  lakeNameOf,
  sourceOf,
  tableFailureOf,
  tablePrefixOf,
} from '@conexus/connectors'
import { z } from 'zod'
import type { TapFailure } from './messages.ts'
import { Catalog, catalogEntry, isSelected, TapState } from './messages.ts'
import type { PassDeps, RunTable } from './pass.ts'
import { readTable, tried } from './pass.ts'
import { senderOf, sessionFor } from './source.ts'

const Config = z.object({
  connector: z.string().min(1),
  account: AccountRef.nullable(),
  secret_path: z.string().min(1),
  result_path: z.string().min(1),
  start_date: z.iso.date().nullable(),
  tables: z
    .array(
      z.object({
        source: z.string().min(1),
        name: z.string().regex(/^[a-z][a-z0-9_]{0,59}$/),
        whole: z.boolean(),
      }),
    )
    .default([]),
})
type Config = z.infer<typeof Config>

const Secret = z.record(z.string(), z.string())

export type TapDeps = PassDeps & Readonly<{ fetch: typeof fetch }>

const ABOUT = {
  name: 'tap-conexus',
  description: 'Reads the tables a Conexus connector declares, through the connector kit.',
  capabilities: ['about', 'catalog', 'discover', 'state'],
  settings: Object.keys(Config.shape),
}

async function jsonFile<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  return schema.parse(JSON.parse(await readFile(path, 'utf8')))
}

async function reachOf(config: Config, deps: TapDeps) {
  const connector = connectorOf(config.connector)
  if (connector?.tables === undefined) throw new Error(`No tables of ${config.connector}`)
  const credential = await jsonFile(config.secret_path, Secret)
  const send = senderOf(connector, { fetch: deps.fetch, credential, now: deps.now })
  const session = sessionFor(connector, { credential, send, now: deps.now })
  const reach: TableReach = {
    connector,
    session,
    send,
    account: { ref: config.account },
    signal: new AbortController().signal,
  }
  return reach
}

async function columnsOf(reach: TableReach, connector: Connector, deps: TapDeps) {
  const signed = await tried(async () => {
    const token = await reach.session.token(reach.signal)
    return typeof token === 'string' ? { kind: 'SIGNED' as const } : tableFailureOf(token)
  }, deps)
  if (signed.kind === 'FAILED') return { kind: 'FAILED' as const, failure: signed }
  const listed = await tried(async () => {
    const found = await discoverTables({ ...reach, connector })
    const away = found.find(({ failed }) => failed?.code === 'COPY_SOURCE_UNREACHABLE')?.failed
    return away ?? { kind: 'FOUND' as const, found }
  }, deps)
  return listed.kind === 'FAILED' ? { kind: 'FAILED' as const, failure: listed } : listed
}

function failureOf(failed: TableReadFailed, table: string): TapFailure {
  return { code: failed.code, system: failed.system, table }
}

async function discover(config: Config, deps: TapDeps): Promise<number> {
  const reach = await reachOf(config, deps)
  const listed = await columnsOf(reach, reach.connector, deps)
  if (listed.kind === 'FAILED') return stopped(config, failureOf(listed.failure, ''))
  const prefix = tablePrefixOf(reach.connector.id)
  const streams = listed.found.map(({ declaration, columns }) =>
    catalogEntry({
      stream: lakeNameOf(prefix, declaration.name),
      table: declaration,
      columns: columns ?? [],
    }),
  )
  await deps.write(JSON.stringify({ streams }))
  return 0
}

async function stopped(config: Config, failure: TapFailure): Promise<number> {
  await writeFile(config.result_path, JSON.stringify(failure))
  return 1
}

function chosen(connector: Connector, catalog: Catalog, config: Config) {
  const declared = connector.tables?.declared ?? []
  return catalog.streams.filter(isSelected).map((entry) => {
    const table = declared.find((each) => sourceOf(each) === entry.table_name)
    if (table === undefined)
      throw new Error(`No table of ${connector.id} reads ${entry.table_name}`)
    const asked = config.tables.find((each) => each.source === entry.table_name)
    return { table, stream: entry.stream, whole: asked?.whole ?? false }
  })
}

async function sync(
  config: Config,
  a: Readonly<{ catalog: Catalog; state: TapState; deps: TapDeps }>,
): Promise<number> {
  const reach = await reachOf(config, a.deps)
  const tables = chosen(reach.connector, a.catalog, config)
  const first = tables[0]?.stream ?? ''
  const only = { ...reach.connector.tables, declared: tables.map(({ table }) => table) }
  const listed = await columnsOf(reach, { ...reach.connector, tables: only }, a.deps)
  if (listed.kind === 'FAILED') return stopped(config, failureOf(listed.failure, first))
  const { bookmarks } = a.state
  for (const chose of tables) {
    const found = listed.found.find(({ declaration }) => declaration === chose.table)
    const columns: readonly TableColumn[] | null = found?.columns ?? null
    if (columns === null)
      return stopped(
        config,
        found?.failed === undefined
          ? { code: 'COPY_SOURCE_UNREADABLE', system: null, table: chose.stream }
          : failureOf(found.failed, chose.stream),
      )
    const run: RunTable = { ...chose, columns }
    const failed = await readTable(reach, run, {
      bookmarks,
      startDate: config.start_date,
      deps: a.deps,
    })
    if (failed !== null) return stopped(config, failureOf(failed, chose.stream))
  }
  await reach.session.close(reach.signal)
  return 0
}

export async function runTap(argv: readonly string[], deps: TapDeps): Promise<number> {
  const { values } = parseArgs({
    args: [...argv],
    options: {
      about: { type: 'boolean' },
      discover: { type: 'boolean' },
      config: { type: 'string' },
      catalog: { type: 'string' },
      state: { type: 'string' },
    },
    strict: true,
  })
  if (values.about === true) {
    await deps.write(JSON.stringify(ABOUT))
    return 0
  }
  if (values.config === undefined) throw new Error('The tap needs --config')
  const config = await jsonFile(values.config, Config)
  if (values.discover === true) return discover(config, deps)
  if (values.catalog === undefined) throw new Error('A run needs --catalog')
  const catalog = await jsonFile(values.catalog, Catalog)
  const state =
    values.state === undefined ? TapState.parse({}) : await jsonFile(values.state, TapState)
  return sync(config, { catalog, state, deps })
}

function writeLine(line: string): Promise<void> {
  return new Promise((done) => {
    if (process.stdout.write(`${line}\n`)) done()
    else process.stdout.once('drain', done)
  })
}

if (import.meta.main)
  process.exitCode = await runTap(process.argv.slice(2), {
    fetch: globalThis.fetch,
    now: Date.now,
    sleep: (ms) => sleep(ms),
    random: Math.random,
    write: writeLine,
  })

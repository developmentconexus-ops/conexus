import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { ConnectionId, CopyId } from '@conexus/hub-api'
import { CopyId as CopyIdSchema } from '@conexus/hub-api'
import pg from 'pg'
import type { CopyRows, CopyTable } from '../../platform/copy-sql.ts'
import { ROLES_LOCK } from '../../platform/copy-sql.ts'
import type { DatabaseUrl } from '../../platform/database.ts'
import { CopyDefinition } from '../connectors/public.ts'
import { PADARIA_SOL_MATRIZ, salesDatabase } from '../connectors/test-sales.ts'
import type { Hub } from '../identity/test-hub.ts'
import { MODELS } from './test-planted-models.ts'

export type PlantedModel = keyof typeof MODELS

export const PLANTED_MODEL_NAMES = [
  'clientes',
  'vendedores',
  'produtos',
  'vendas',
  'itens_venda',
] as const satisfies readonly PlantedModel[]

function isPlanted(model: string): model is PlantedModel {
  return Object.hasOwn(MODELS, model)
}

export function plantedModel(model: string) {
  assert.ok(isPlanted(model), `no planted table named ${model}`)
  const { label, definition } = MODELS[model]
  return { label, definition: CopyDefinition.parse(definition) }
}

const SANKHYA_DATE = /^(\d{2})(\d{2})(\d{4}) (\d{2}:\d{2}:\d{2})$/

function cellOf(type: string, cell: unknown): string | null {
  if (cell === null || cell === undefined) return null
  const [, day, month, year, time] = SANKHYA_DATE.exec(String(cell)) ?? []
  if (year !== undefined && (type === 'date' || type === 'timestamp'))
    return type === 'date' ? `${year}-${month}-${day}` : `${year}-${month}-${day} ${time}`
  return String(cell)
}

export function doubleRows(model: string): (string | null)[][] {
  const { definition } = plantedModel(model)
  if (definition.version !== 1) throw new Error('A planted Sankhya table reads a query.')
  const answered = salesDatabase(PADARIA_SOL_MATRIZ)(definition.source.sql)
  if (answered === undefined) throw new Error(`The double refused the query of ${model}.`)
  return answered.rows.map((row) => definition.columns.map(({ type }, at) => cellOf(type, row[at])))
}

export type PlantOn = Readonly<{
  hub: Hub
  companyId: string
  anaId: string
  owner: DatabaseUrl
}>

export type PlantedRun = Readonly<{
  outcome: 'COMPLETE' | 'PARTIAL' | 'ERROR' | 'INTERRUPTED'
  reason?: string
  whole?: boolean
  system?: Readonly<{ status: number; code: string | null; message: string }>
}>

export async function plantCopy(
  on: PlantOn,
  name: string,
  definition: CopyDefinition,
  from: Readonly<{ connector: string; connection: ConnectionId }>,
  planted: Readonly<{ label?: string; rows?: CopyRows; runs?: readonly PlantedRun[] }> = {},
) {
  const copyId = CopyIdSchema.parse(randomUUID())
  await on.hub.test.asOwner(
    `insert into copies.copy (id, company_id, connector_id, connection_id, name, label, definition,
       created_by, created_at, attempt_key, body_hash)
     values ($1, $2, $8, $3, $4, $9, $5, $6, now(), $7, 'planted')`,
    [
      ...[copyId, on.companyId, from.connection, name, JSON.stringify(definition)],
      ...[on.anaId, randomUUID(), from.connector, planted.label ?? name],
    ],
  )
  await on.hub.test.asOwner(
    `insert into copies.copy_source (company_id, copy_id, connector_id, connection_id, account_ref, created_at)
     select company_id, $1, connector_id, id, account_ref, now() from connectors.connection where id = $2`,
    [copyId, from.connection],
  )
  const postgres = on.hub.postgres.companyPostgres
  assert.equal((await postgres.ensureSync(on.owner)).kind, 'DONE')
  assert.equal((await postgres.ensureReader(on.owner)).kind, 'DONE')
  const host = new URL(on.owner.reveal()).hostname
  await on.hub.test.asOwner(
    'update projects.company_database set host = $1 where company_id = $2',
    [host, on.companyId],
  )
  const sync = await postgres.syncAddress(host)
  const accounts = definition.version === 2
  const instants = definition.version === 2 ? 'OFFSET' : 'LOCAL'
  const table = { name, definition, accounts, instants } as const
  assert.equal((await postgres.ensureCopyTable(sync, table)).kind, 'DONE')
  const rows = planted.rows ?? []
  if (rows.length > 0) await plantRows(on, table, rows)
  await plantRuns(on, copyId, rows.length, planted.runs ?? [])
  return copyId
}

async function plantRows(on: PlantOn, table: CopyTable, rows: CopyRows) {
  const { columns } = table.definition
  const quoted = columns.map((column) => `"${column.name}"`)
  const record = columns.map(
    (column) =>
      `"${column.name}" ${column.type === 'timestamp' && table.instants === 'OFFSET' ? 'timestamptz' : column.type === 'json' ? 'text' : column.type}`,
  )
  const picked = columns.map(
    (column, at) => `r.${quoted[at]}${column.type === 'json' ? '::jsonb' : ''}`,
  )
  const objects = rows.map((row) =>
    Object.fromEntries(columns.map((column, at) => [column.name, row[at] ?? null])),
  )
  const own = table.accounts ? ['_account', '_account_name'] : []
  await asSync(on.owner, async (client) => {
    await client.query(
      `insert into sync."${table.name}" (${[...quoted, ...own, '_pass'].join(', ')})
       select ${[...picked, ...own.map(() => "'planted'")].join(', ')}, 1
       from jsonb_to_recordset($1::jsonb) as r(${record.join(', ')})`,
      [JSON.stringify(objects)],
    )
  })
}

export async function plantRun(
  on: Pick<PlantOn, 'hub' | 'companyId'>,
  copyId: CopyId,
  run: PlantedRun,
  rows = 0,
  startedAt = new Date(),
) {
  const id = randomUUID()
  const { system } = run
  await on.hub.test.asOwner(
    `insert into copies.copy_run (id, company_id, copy_id, started_at, ended_at, outcome, reason, pages,
       read, written, whole, system_status, system_code, system_message)
     values ($1, $2, $3, $4, $5, $6, $7, 1, $8, $8, $9, $10, $11, $12)`,
    [
      ...[id, on.companyId, copyId, startedAt, new Date(startedAt.getTime() + 30_000)],
      ...[run.outcome, run.reason ?? null, rows, run.whole ?? false],
      ...[system?.status ?? null, system?.code ?? null, system?.message ?? null],
    ],
  )
  await on.hub.test.asOwner('update copies.copy set rows = $2, last_run_id = $3 where id = $1', [
    copyId,
    rows,
    id,
  ])
}

async function plantRuns(on: PlantOn, copyId: CopyId, rows: number, runs: readonly PlantedRun[]) {
  const now = Date.now()
  for (const [at, run] of runs.entries()) {
    await plantRun(on, copyId, run, rows, new Date(now - (runs.length - at) * 60_000))
  }
}

export async function asSync<T>(owner: DatabaseUrl, act: (client: pg.Client) => Promise<T>) {
  const client = new pg.Client({ connectionString: owner.reveal() })
  await client.connect()
  try {
    await client.query('begin')
    await client.query(ROLES_LOCK.text)
    await client.query('set local role conexus_sync')
    const done = await act(client)
    await client.query('commit')
    return done
  } finally {
    await client.end()
  }
}

export function syncRows(owner: DatabaseUrl, name: string, key: readonly string[]) {
  const columns = key.map((column) => `"${column}"::text`).join(', ')
  return asSync(owner, async (client) => {
    const result = await client.query({
      text: `select ${columns}, _pass from sync."${name}" order by ${key.map((k) => `"${k}"`).join(', ')}`,
      rowMode: 'array',
    })
    return result.rows.map((row: unknown[]) => row.map(String))
  })
}

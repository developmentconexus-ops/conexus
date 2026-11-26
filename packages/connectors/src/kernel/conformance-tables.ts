import assert from 'node:assert/strict'
import { z } from 'zod'
import type { Fake } from './conformance-session.ts'
import { answeredEach, answerOf, signIn } from './conformance-session.ts'
import type { Connector } from './definition.ts'
import type { ListRead, Operation } from './operation.ts'
import { listInputNames } from './operation.ts'
import { toRequest } from './request.ts'
import { Rows } from './rows.ts'
import type { ProviderSend } from './session.ts'
import { sessionOf } from './session.ts'
import type {
  DeclaredColumn,
  TableColumn,
  TableDeclaration,
  TableFilter,
  TablePosition,
  TableSendFailure,
} from './tables.ts'
import { defineTables } from './tables.ts'
import type { TableReach } from './tables-call.ts'
import { readTablePage } from './tables-read.ts'

/** The double's sender: the kit's request to its `handle`, the answer read as the connector declares its numbers. */
export function sendTo(connector: Connector, fake: Fake): ProviderSend<TableSendFailure> {
  return async (request, { token }) =>
    answerOf(await fake.handle(toRequest(connector, request, token)), connector.numbers)
}

/** A table read's reach into the double, signed in once: the token lives the whole test. */
export async function tableReachOf(
  connector: Connector,
  fake: Fake,
  signal: AbortSignal = AbortSignal.timeout(60_000),
): Promise<TableReach> {
  const signed = await signIn(connector, fake)
  if (signed === null) return assert.fail(`${connector.id} signs in to its double`)
  const session = sessionOf<Readonly<{ kind: 'AUTH_REFUSED' }>>(
    {
      held: { kind: 'TOKEN', token: signed.accessToken, expiresAt: Number.MAX_SAFE_INTEGER },
      open: async () => ({ kind: 'AUTH_REFUSED' }),
      end: async () => undefined,
    },
    Date.now,
  )
  return { connector, session, send: sendTo(connector, fake), account: signed.account, signal }
}

/** Every page of a table, to its end: the rows in page order, or the failure that stopped it. A table that declares no columns takes the ones its discovery read. */
export async function walkTable(
  reach: TableReach,
  table: TableDeclaration,
  filter: TableFilter = { kind: 'ALL' },
  discovered?: readonly TableColumn[],
): Promise<readonly Readonly<Record<string, string | null>>[]> {
  const columns =
    table.columns.kind === 'DECLARED'
      ? table.columns.columns.map(({ name, type, description }) => ({ name, type, description }))
      : (discovered ?? assert.fail(`${table.name} declares its columns for the walk`))
  const rows: Readonly<Record<string, string | null>>[] = []
  let after: TablePosition | null = null
  for (let pages = 0; pages < 1000; pages++) {
    const page = await readTablePage({ ...reach, table, columns, filter, after })
    if (page.kind === 'FAILED') return assert.fail(`${table.name} page ${pages}: ${page.code}`)
    rows.push(...page.rows)
    if (page.next === null) return rows
    after = page.next
  }
  return assert.fail(`${table.name} never ends its pages`)
}

/** The list read as a table of its probe's fixed input, one json column per field of its first row, and the change field as a timestamp. */
function walkDeclaration(
  operation: Operation<unknown, unknown>,
  list: ListRead,
  probe: unknown,
  first: Rows,
): TableDeclaration {
  const names = listInputNames(list)
  const fixed = Object.entries(
    z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).parse(probe),
  )
  const fields: DeclaredColumn[] = Object.keys(first.linhas[0] ?? {}).map((field, at) => ({
    name: `c${at}`,
    type: 'json',
    description: null,
    path: field,
  }))
  const changed: DeclaredColumn[] =
    list.changed === null
      ? []
      : [{ name: 'changed', type: 'timestamp', description: null, path: list.changed.field }]
  const [table] = defineTables({
    declared: [
      {
        name: 'walk',
        label: operation.label,
        description: 'A caminhada da conformidade.',
        group: operation.subject,
        source: {
          kind: 'OPERATION',
          operation: operation.id,
          input: Object.fromEntries(fixed.filter(([name]) => !names.includes(name))),
        },
        key: ['c0'],
        mode:
          list.changed === null
            ? { kind: 'FULL' }
            : { kind: 'CHANGED', column: 'changed', registry: true },
        history: false,
        columns: { kind: 'DECLARED', columns: [...fields, ...changed] },
      },
    ],
  }).declared
  return table ?? assert.fail(`${operation.id} as a table`)
}

function textOfRow(row: Readonly<Record<string, string | null>>): string {
  return JSON.stringify(row)
}

/** Each row of the double once, none missing and none repeated; with `changed`, a walk since an instant brings only the rows changed since. */
async function walkList(
  reach: TableReach,
  a: Readonly<{
    operation: Operation<unknown, unknown>
    list: ListRead
    probe: unknown
    first: Rows
  }>,
): Promise<void> {
  const { operation, list, first } = a
  if (first.linhas.length === 0) {
    assert.equal(first.total ?? 0, 0, `${operation.id} lacks rows the total counts`)
    return
  }
  const table = walkDeclaration(operation, list, a.probe, first)
  const all = await walkTable(reach, table)
  const texts = all.map(textOfRow)
  assert.equal(new Set(texts).size, texts.length, `${operation.id} repeats a row`)
  if (first.total !== undefined)
    assert.equal(texts.length, first.total, `${operation.id} lacks rows the total counts`)
  if (list.changed === null) return
  const instants = all.map((row) => Date.parse(row.changed ?? ''))
  assert.ok(instants.every(Number.isFinite), `${operation.id} rows carry ${list.changed.field}`)
  const since = new Date(Math.max(...instants)).toISOString()
  const later = all.filter((_, at) => (instants[at] ?? 0) >= Date.parse(since)).map(textOfRow)
  const asked = await walkTable(reach, table, { kind: 'SINCE', column: 'changed', after: since })
  assert.deepEqual(asked.map(textOfRow).sort(), later.sort(), `${operation.id} since`)
}

/** Each list read of the connector, every page of its double walked through `readTablePage`: a wrong paging declaration fails here. */
export async function assertListsWalk(connector: Connector, fake: Fake): Promise<void> {
  const reach = await tableReachOf(connector, fake)
  await answeredEach(connector, fake, async ({ operation, input, value }) => {
    if (operation.list !== undefined)
      await walkList(reach, {
        operation,
        list: operation.list,
        probe: input,
        first: Rows.parse(value),
      })
  })
}

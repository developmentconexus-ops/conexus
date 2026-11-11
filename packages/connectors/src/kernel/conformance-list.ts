import assert from 'node:assert/strict'
import { z } from 'zod'
import { SENT_AT } from './conformance-declared.ts'
import type { Fake, Session } from './conformance-session.ts'
import { askOf, signIn } from './conformance-session.ts'
import type { CopyPosition } from './copy.ts'
import { CopyDefinitionV2 } from './copy.ts'
import type { Connector } from './definition.ts'
import { inProbeOrder } from './definition.ts'
import type { ListRead } from './list.ts'
import { listInputOf, listPageOf, valueAt } from './list.ts'
import type { Operation, OperationId } from './operation.ts'
import { listInputNames } from './operation.ts'
import { Rows } from './rows.ts'

/** The listing's reading by the fixed input of a probe: the paging and changed-since names leave it, and the copy takes the rest. */
function walkDefinition(
  operation: Operation<unknown, unknown>,
  list: ListRead,
  input: unknown,
): CopyDefinitionV2 {
  const names = listInputNames(list)
  const fixed = Object.entries(z.record(z.string(), z.unknown()).parse(input)).filter(
    ([name]) => !names.includes(name),
  )
  const changed =
    list.changed === null ? [] : [{ name: 'changed', type: 'timestamp', path: list.changed.field }]
  return CopyDefinitionV2.parse({
    version: 2,
    source: { kind: 'OPERATION', operation: operation.id, input: Object.fromEntries(fixed) },
    description: 'Conformance walk.',
    columns: [{ name: 'key', type: 'text', path: 'key' }, ...changed],
    key: ['key'],
    changedSince: list.changed === null ? null : { column: 'changed' },
  })
}

/** Every page of the double through `listInputOf` and `listPageOf`, to its end: the rows as the double sent them, with the total it reported. */
async function walkPages(
  connector: Connector,
  fake: Fake,
  session: Session,
  a: Readonly<{
    operation: Operation<unknown, unknown>
    list: ListRead
    definition: CopyDefinitionV2
    since: string | null
  }>,
): Promise<Readonly<{ linhas: Record<string, unknown>[]; total: number | undefined }>> {
  const { operation, list, definition, since } = a
  const linhas: Record<string, unknown>[] = []
  let total: number | undefined
  let position: CopyPosition | null = null
  for (let pages = 0; pages < 1000; pages++) {
    const input = listInputOf({ list, definition, position, since })
    const answered = operation.answer(await askOf(connector, fake, session, { operation, input }))
    assert.equal(answered.kind, 'OK', `${operation.id} page ${pages}`)
    if (answered.kind !== 'OK') return { linhas, total }
    const rows = Rows.parse(answered.value)
    const page = listPageOf({ list, definition, position, rows, at: SENT_AT })
    assert.equal(page.kind, 'PAGE', `${operation.id} page ${pages} reads as ${page.kind}`)
    if (page.kind !== 'PAGE') return { linhas, total }
    linhas.push(...rows.linhas)
    total ??= rows.total
    if (!page.more) return { linhas, total }
    position = page.next
  }
  assert.fail(`${operation.id} never ends its pages`)
}

function textOfRow(row: unknown): string {
  return JSON.stringify(row)
}

/** Each row of the double once, none missing and none repeated, and with `changed` a page asked since an instant brings only the rows changed since. */
async function walkList(
  connector: Connector,
  fake: Fake,
  session: Session,
  a: Readonly<{ operation: Operation<unknown, unknown>; list: ListRead; probe: unknown }>,
): Promise<void> {
  const { operation, list } = a
  const definition = walkDefinition(operation, list, a.probe)
  const all = await walkPages(connector, fake, session, {
    operation,
    list,
    definition,
    since: null,
  })
  const texts = all.linhas.map(textOfRow)
  assert.equal(new Set(texts).size, texts.length, `${operation.id} repeats a row`)
  if (all.total !== undefined)
    assert.equal(texts.length, all.total, `${operation.id} lacks rows the total counts`)
  if (list.changed === null) return
  const { field } = list.changed
  const instants = all.linhas.map((row) => Date.parse(String(valueAt(row, field))))
  assert.ok(instants.every(Number.isFinite), `${operation.id} rows carry ${field}`)
  const since = new Date(Math.max(...instants))
  const later = all.linhas.filter((_, at) => (instants[at] ?? 0) >= since.getTime()).map(textOfRow)
  const asked = await walkPages(connector, fake, session, {
    operation,
    list,
    definition,
    since: since.toISOString(),
  })
  assert.deepEqual(asked.linhas.map(textOfRow).sort(), later.sort(), `${operation.id} since`)
}

/** Each list read of the connector, every page of its double walked: a wrong paging declaration fails here. */
export async function assertListsWalk(connector: Connector, fake: Fake): Promise<void> {
  const session = await signIn(connector, fake)
  if (session === null) return
  const earlier = new Map<OperationId, unknown>()
  for (const operation of inProbeOrder(connector)) {
    const probe = operation.probe(earlier)
    assert.notEqual(probe, null, `${operation.id} has a probe the fake can answer`)
    const answered = operation.answer(
      await askOf(connector, fake, session, { operation, input: probe }),
    )
    if (answered.kind !== 'OK') continue
    earlier.set(operation.id, answered.value)
    if (operation.list !== undefined)
      await walkList(connector, fake, session, { operation, list: operation.list, probe })
  }
}

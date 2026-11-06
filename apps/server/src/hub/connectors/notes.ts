import type { ConnectorAnswer } from '@conexus/app-contract'
import type { ConnectionNote } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import { z } from 'zod'
import type { ReadTx } from '../../platform/database.ts'
import { violatedCheck } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { personNameColumn } from '../identity/public.ts'
import { Listed } from './cut.ts'
import type { ReadRequest } from './read.ts'
import { readThrough } from './read.ts'
import type { Deps, OfConnection, Viewer } from './rows.ts'
import { admitted, ofCompany, scopeOf } from './rows.ts'
import { connection } from './tables.ts'

/** What the Builder proved about one concept of a company's system: names and codes, the query that proved it, never a value (founder, J1). */
export const Note = z.strictObject({
  mapping: z.string().min(1).max(500),
  provingQuery: z.string().min(1).max(4000),
  provedAt: z.iso.datetime(),
  provedRows: z.int().nonnegative(),
  writtenBy: z.string(),
})
export type Note = z.infer<typeof Note>

/** What a save answers: the rows the proving query returned, or why nothing was written. */
export type NoteSaved =
  | Readonly<{ kind: 'SAVED'; provedRows: number }>
  | Exclude<ConnectorAnswer, { kind: 'OK' }>
  | Readonly<{ kind: 'NOTE_INVALID' }>
  | Readonly<{ kind: 'CALLS_SPENT' }>

/** The connection's notebook as the database holds it, read by this schema (C27); the key is the concept. */
export const Notes = z.record(z.string().min(1).max(120), Note)
export type Notes = z.infer<typeof Notes>

/** The notebook, newest first, for the page of the connection; the writer is a name, null once they left the company. */
export async function notesOf(tx: ReadTx, input: OfConnection): Promise<ConnectionNote[]> {
  const [row] = await tx
    .select({ notes: connection.notes })
    .from(connection)
    .where(ofCompany(input, input.connectionId))
  const notes = Notes.parse(row?.notes ?? {})
  const writers = [...new Set(Object.values(notes).map((note) => note.writtenBy))]
  const names = new Map<string, string | null>()
  if (writers.length > 0) {
    // One read for every writer, through the identity's own name column.
    const listed = sql.join(
      writers.map((id) => sql`${id}`),
      sql`, `,
    )
    const read = await tx
      .select({ id: sql<string>`writer.id`, name: personNameColumn(sql`writer.id`) })
      .from(sql`unnest(array[${listed}]::text[]) as writer(id)`)
    for (const { id, name } of read) names.set(id, name)
  }
  return Object.entries(notes)
    .sort(([, a], [, b]) => b.provedAt.localeCompare(a.provedAt))
    .map(([concept, note]) => ({
      concept,
      mapping: note.mapping,
      provedAt: note.provedAt,
      provedRows: note.provedRows,
      writtenBy: names.get(note.writtenBy) ?? null,
    }))
}

/**
 * Writes one concept in one instruction (the row's lock): the same concept again is the last
 * writer's, two different both stay. The notebook above 32 KB is the database's refusal (23514). A
 * connection taken off between the admission and this write is `GONE`, never `SAVED`. With
 * `manage`, the writer's `manageConnections` is checked in the same transaction, and a refusal is
 * `NOT_GRANTED` with its reason in the log alone (S8, S10).
 */
async function save(
  deps: Deps,
  input: Viewer & { connectionId: OfConnection['connectionId']; concept: string; note: Note },
  manage: boolean,
): Promise<'SAVED' | 'NOTE_INVALID' | 'GONE' | 'NOT_GRANTED'> {
  const note = Note.parse(input.note)
  try {
    const written = await deps.database.command(scopeOf(input), async (tx) => {
      if (manage) await admitted(deps, tx, input, 'manageConnections')
      return tx
        .update(connection)
        .set({
          notes: sql`${connection.notes} || jsonb_build_object(${input.concept}::text, ${JSON.stringify(note)}::jsonb)`,
        })
        .where(ofCompany(input, input.connectionId))
        .returning({ id: connection.id })
    })
    return written.length === 0 ? 'GONE' : 'SAVED'
  } catch (error) {
    if (violatedCheck(error) === 'connection_notes') return 'NOTE_INVALID'
    if (!(error instanceof Failure) || error.code !== 'NOT_FOUND') throw error
    const { connectionId, companyId } = input
    const reason = String(error.details.reason ?? 'NOT_FOUND')
    deps.log.info(
      { companyId, personId: input.person.id, connectionId, reason },
      'CONNECTION_NOTE_REFUSED',
    )
    return 'NOT_GRANTED'
  }
}

/**
 * The proving query run once by the connector's read door, then the concept written with the rows
 * it returned, never the rows, and who wrote it: the one owner of the notebook's write for the
 * Builder and the Assistant (C26). The Assistant's writer must manage connections.
 */
export async function provedAndSaved(
  deps: Deps,
  a: Readonly<{
    read: Omit<ReadRequest, 'input'>
    connectionId: OfConnection['connectionId']
    concept: string
    mapping: string
    provingQuery: string
  }>,
): Promise<NoteSaved> {
  const answered = await readThrough(deps, { ...a.read, input: { sql: a.provingQuery } })
  if (answered.kind !== 'OK') return answered
  const listed = Listed.safeParse(answered.value)
  if (!listed.success) return { kind: 'NOTE_INVALID' }
  const provedRows = listed.data.linhas.length
  const { viewer, by } = a.read
  const note = Note.safeParse({
    mapping: a.mapping,
    provingQuery: a.provingQuery,
    provedAt: new Date().toISOString(),
    provedRows,
    writtenBy: viewer.person.id,
  })
  if (!note.success) return { kind: 'NOTE_INVALID' }
  const target = { ...viewer, connectionId: a.connectionId, concept: a.concept, note: note.data }
  const saved = await save(deps, target, by === 'assistant')
  if (saved === 'GONE' || saved === 'NOT_GRANTED') return { kind: 'NOT_GRANTED' }
  if (saved === 'NOTE_INVALID') return { kind: 'NOTE_INVALID' }
  deps.log.info({ connectionId: a.connectionId, rows: provedRows, by }, 'CONNECTION_NOTE_SAVED')
  return { kind: 'SAVED', provedRows }
}

/** Erases one concept; erasing one already gone answers the same. */
export function erase(deps: Deps, input: OfConnection & { concept: string }): Promise<void> {
  return deps.database.command(scopeOf(input), async (tx) => {
    await admitted(deps, tx, input, 'manageConnections')
    await tx
      .update(connection)
      .set({ notes: sql`${connection.notes} - ${input.concept}::text` })
      .where(ofCompany(input, input.connectionId))
  })
}
